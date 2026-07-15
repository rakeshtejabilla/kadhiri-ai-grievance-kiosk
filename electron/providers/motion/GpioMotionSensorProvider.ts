import { globalShortcut, app } from "electron";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import type { MotionListener, MotionSensorProvider } from "./MotionSensorProvider.js";

/**
 * Production implementation for the HC-SR501 PIR motion sensor on Raspberry Pi.
 *
 * Instead of using the `onoff` npm package (which relies on the deprecated Linux
 * sysfs GPIO interface that is removed on Pi 5 / newer kernels), this provider
 * spawns a lightweight Python subprocess that uses `gpiozero` — a library that
 * ships pre-installed on Raspberry Pi OS and works on ALL Pi models (Pi 4, Pi 5).
 *
 * Wiring:
 *   PIR VCC  → Pi Pin 2  (5 V)
 *   PIR GND  → Pi Pin 6  (GND)
 *   PIR OUT  → Pi Pin 11 (GPIO 17, configurable via gpioPin in config.json)
 *
 * Keyboard shortcuts are registered BEFORE GPIO initialisation so they are
 * always available, even when the sensor is starting up or if it fails:
 *
 *   Ctrl+M  /  F9  → simulate motion detected
 *   Ctrl+N  /  F10 → simulate motion lost
 */
export class GpioMotionSensorProvider implements MotionSensorProvider {
  private detectedListeners: MotionListener[] = [];
  private lostListeners: MotionListener[] = [];
  private pirProcess: ChildProcess | null = null;
  private shortcutsRegistered = false;

  constructor(private readonly gpioPin: number) {}

  async start(): Promise<void> {
    // Register keyboard shortcuts FIRST so Ctrl+M never falls through to the OS
    this.registerKeyboardShortcuts();
    // Then start the GPIO sensor (errors are logged but do not crash the kiosk)
    await this.startPythonBridge();
  }

  async stop(): Promise<void> {
    if (this.pirProcess) {
      this.pirProcess.kill("SIGTERM");
      this.pirProcess = null;
    }
    if (this.shortcutsRegistered) {
      globalShortcut.unregister("CommandOrControl+M");
      globalShortcut.unregister("F9");
      globalShortcut.unregister("CommandOrControl+N");
      globalShortcut.unregister("F10");
      this.shortcutsRegistered = false;
    }
  }

  onMotionDetected(listener: MotionListener): void {
    this.detectedListeners.push(listener);
  }

  onMotionLost(listener: MotionListener): void {
    this.lostListeners.push(listener);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private notifyDetected(): void {
    this.detectedListeners.forEach((l) => l());
  }

  private notifyLost(): void {
    this.lostListeners.forEach((l) => l());
  }

  /**
   * Spawns pir_sensor.py which uses gpiozero (Pi 4 + Pi 5 compatible).
   * The script prints "READY" once initialised, then "1" / "0" for each
   * motion edge. This process lives for the entire kiosk session.
   */
  private startPythonBridge(): Promise<void> {
    return new Promise<void>((resolve) => {
      // In dev mode app.getAppPath() is the project root (next to package.json).
      // In production it is the resources/app directory inside the AppImage.
      const scriptPath = path.join(app.getAppPath(), "pir_sensor.py");

      this.pirProcess = spawn("python3", [scriptPath, String(this.gpioPin)], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      this.pirProcess.stdout?.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().trim().split("\n");
        for (const line of lines) {
          const token = line.trim();
          if (token === "READY") {
            console.log(`[PIR] Python bridge ready — GPIO${this.gpioPin}. ` +
              "Ctrl+M / F9 = detected, Ctrl+N / F10 = lost.");
            safeResolve();
          } else if (token === "1") {
            console.log(`[PIR] Motion DETECTED (GPIO${this.gpioPin})`);
            this.notifyDetected();
          } else if (token === "0") {
            console.log(`[PIR] Motion LOST (GPIO${this.gpioPin})`);
            this.notifyLost();
          }
        }
      });

      this.pirProcess.stderr?.on("data", (chunk: Buffer) => {
        console.error("[PIR] Python bridge stderr:", chunk.toString().trim());
      });

      this.pirProcess.on("error", (err) => {
        console.error("[PIR] Failed to spawn python3:", err.message);
        console.error("[PIR] Make sure python3 and gpiozero are installed: " +
          "sudo apt install python3-gpiozero");
        safeResolve(); // Kiosk continues; keyboard shortcuts still work
      });

      this.pirProcess.on("exit", (code, signal) => {
        console.warn(`[PIR] Python bridge exited (code=${code ?? "?"} signal=${signal ?? "none"})`);
        this.pirProcess = null;
        safeResolve();
      });

      // Safety: resolve after 5 s even if we never see "READY"
      setTimeout(safeResolve, 5000);
    });
  }

  /**
   * Registers keyboard overrides so engineers can trigger the workflow manually
   * on the kiosk (e.g. for demos or hardware debugging) without the sensor.
   * Registered BEFORE GPIO init so they are always available.
   */
  private registerKeyboardShortcuts(): void {
    if (this.shortcutsRegistered) return;

    globalShortcut.register("CommandOrControl+M", () => {
      console.log("[PIR] Keyboard override: motion DETECTED");
      this.notifyDetected();
    });
    globalShortcut.register("F9", () => {
      console.log("[PIR] Keyboard override: motion DETECTED");
      this.notifyDetected();
    });
    globalShortcut.register("CommandOrControl+N", () => {
      console.log("[PIR] Keyboard override: motion LOST");
      this.notifyLost();
    });
    globalShortcut.register("F10", () => {
      console.log("[PIR] Keyboard override: motion LOST");
      this.notifyLost();
    });

    this.shortcutsRegistered = true;
    console.log("[PIR] Keyboard shortcuts registered: Ctrl+M/F9=detected, Ctrl+N/F10=lost.");
  }
}
