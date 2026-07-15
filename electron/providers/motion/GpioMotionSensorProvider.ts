import { globalShortcut } from "electron";
import type { MotionListener, MotionSensorProvider } from "./MotionSensorProvider.js";

/**
 * Production implementation for the HC-SR501 PIR motion sensor wired to a
 * Raspberry Pi GPIO pin via the `onoff` npm package.
 *
 * Wiring:
 *   PIR VCC  → Pi Pin 2  (5 V)
 *   PIR GND  → Pi Pin 6  (GND)
 *   PIR OUT  → Pi Pin 11 (GPIO 17, or whichever gpioPin is set in config.json)
 *
 * The keyboard shortcuts are intentionally kept active alongside the GPIO
 * sensor so that engineers can manually trigger the full workflow on the Pi
 * during testing without having to wave in front of the sensor:
 *
 *   Ctrl+M  /  F9  → simulate motion detected
 *   Ctrl+N  /  F10 → simulate motion lost
 */
export class GpioMotionSensorProvider implements MotionSensorProvider {
  private detectedListeners: MotionListener[] = [];
  private lostListeners: MotionListener[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pin: any = null;
  private shortcutsRegistered = false;

  constructor(private readonly gpioPin: number) {}

  async start(): Promise<void> {
    await this.startGpio();
    this.registerKeyboardShortcuts();
  }

  async stop(): Promise<void> {
    // Release GPIO
    if (this.pin) {
      try {
        this.pin.unexport();
      } catch {
        /* ignore if already released */
      }
      this.pin = null;
    }

    // Unregister keyboard shortcuts
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
   * Dynamically require `onoff` so that importing this file on Windows/macOS
   * (where onoff is not installed) does not crash the process. The package
   * must be installed on the Raspberry Pi: `npm install onoff`
   */
  private async startGpio(): Promise<void> {
    try {
      // Dynamic import keeps Windows/dev builds from blowing up at module-load time.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Gpio } = await import("onoff");

      this.pin = new Gpio(this.gpioPin, "in", "both", { debounceTimeout: 50 });

      this.pin.watch((err: Error | null, value: number) => {
        if (err) {
          console.error("[PIR] GPIO watch error:", err);
          return;
        }
        if (value === 1) {
          console.log(`[PIR] Motion DETECTED on GPIO${this.gpioPin}`);
          this.notifyDetected();
        } else {
          console.log(`[PIR] Motion LOST on GPIO${this.gpioPin}`);
          this.notifyLost();
        }
      });

      console.log(
        `[PIR] GpioMotionSensorProvider listening on GPIO${this.gpioPin} (BCM). ` +
          "Ctrl+M / F9 = simulate detected, Ctrl+N / F10 = simulate lost.",
      );
    } catch (err) {
      console.error(
        "[PIR] Failed to initialise GPIO via onoff. " +
          "Run `npm install onoff` on the Raspberry Pi, or set mockHardware=true for development.",
        err,
      );
      throw err;
    }
  }

  /**
   * Register the same keyboard shortcuts as MockMotionSensorProvider so
   * engineers can trigger the workflow manually even on production hardware.
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
  }
}
