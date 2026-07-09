import { globalShortcut } from "electron";
import type { MotionListener, MotionSensorProvider } from "./MotionSensorProvider.js";

/**
 * Development/demo implementation of MotionSensorProvider.
 *
 * Ctrl+M  -> simulate a citizen walking up to the kiosk (motion detected)
 * Ctrl+N  -> simulate the citizen walking away (motion lost)
 *
 * No physical sensor is required, which lets the full workflow be
 * demonstrated on a laptop before any Raspberry Pi hardware is wired up.
 */
export class MockMotionSensorProvider implements MotionSensorProvider {
  private detectedListeners: MotionListener[] = [];
  private lostListeners: MotionListener[] = [];
  private registered = false;

  async start(): Promise<void> {
    if (this.registered) return;

    const notifyDetected = () => this.detectedListeners.forEach((l) => l());
    const notifyLost = () => this.lostListeners.forEach((l) => l());

    globalShortcut.register("CommandOrControl+M", notifyDetected);
    globalShortcut.register("F9", notifyDetected);

    globalShortcut.register("CommandOrControl+N", notifyLost);
    globalShortcut.register("F10", notifyLost);

    this.registered = true;
    // eslint-disable-next-line no-console
    console.log(
      "[MockMotionSensorProvider] Ready. Press Ctrl+M (or F9) for motion detected, Ctrl+N (or F10) for motion lost.",
    );
  }

  async stop(): Promise<void> {
    if (!this.registered) return;
    globalShortcut.unregister("CommandOrControl+M");
    globalShortcut.unregister("F9");
    globalShortcut.unregister("CommandOrControl+N");
    globalShortcut.unregister("F10");
    this.registered = false;
  }

  onMotionDetected(listener: MotionListener): void {
    this.detectedListeners.push(listener);
  }

  onMotionLost(listener: MotionListener): void {
    this.lostListeners.push(listener);
  }
}
