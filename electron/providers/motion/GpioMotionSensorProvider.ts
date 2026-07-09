import type { MotionListener, MotionSensorProvider } from "./MotionSensorProvider.js";

/**
 * Production implementation for a PIR/ultrasonic motion sensor wired to a
 * Raspberry Pi 5 GPIO pin.
 *
 * This is intentionally left as a scaffold: wiring up `onoff` or
 * `@iiot2k/pigpio` requires the target hardware to be present to test
 * against, and pulling either dependency into a build that also has to run
 * on a plain Ubuntu Mini PC would break that build. Swap this class in via
 * `electron/providers/factory.ts` once the sensor is wired to a pin.
 *
 * Example wiring once ready:
 *
 * ```ts
 * import { Gpio } from "onoff";
 *
 * export class GpioMotionSensorProvider implements MotionSensorProvider {
 *   private pin = new Gpio(this.gpioPin, "in", "both", { debounceTimeout: 50 });
 *
 *   constructor(private gpioPin: number) {}
 *
 *   async start() {
 *     this.pin.watch((err, value) => {
 *       if (err) return;
 *       if (value === 1) this.detectedListeners.forEach((l) => l());
 *       else this.lostListeners.forEach((l) => l());
 *     });
 *   }
 *   // ...stop()/onMotionDetected()/onMotionLost() as in the interface
 * }
 * ```
 */
export class GpioMotionSensorProvider implements MotionSensorProvider {
  constructor(private readonly gpioPin: number) {}

  async start(): Promise<void> {
    throw new Error(
      `GpioMotionSensorProvider is a scaffold. Wire it to GPIO pin ${this.gpioPin} using 'onoff' or 'pigpio' before enabling it in providers/factory.ts.`,
    );
  }

  async stop(): Promise<void> {
    /* no-op until implemented */
  }

  onMotionDetected(_listener: MotionListener): void {
    /* no-op until implemented */
  }

  onMotionLost(_listener: MotionListener): void {
    /* no-op until implemented */
  }
}
