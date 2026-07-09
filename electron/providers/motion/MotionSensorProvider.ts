export type MotionListener = () => void;

/**
 * Hardware abstraction for whatever detects a citizen standing in front of
 * the kiosk. On production hardware this will be a PIR/ultrasonic sensor
 * wired to a Raspberry Pi GPIO pin; in development it is driven by a
 * keyboard shortcut (see MockMotionSensorProvider).
 *
 * The rest of the application only ever talks to this interface, so the
 * concrete implementation can be swapped by editing a single line in
 * `electron/providers/factory.ts` — no React code needs to change.
 */
export interface MotionSensorProvider {
  /** Begin listening for motion. Must be idempotent. */
  start(): Promise<void>;
  /** Stop listening and release any hardware/OS resources. */
  stop(): Promise<void>;
  /** Fires exactly once when motion transitions from absent -> present. */
  onMotionDetected(listener: MotionListener): void;
  /** Fires exactly once when motion transitions from present -> absent. */
  onMotionLost(listener: MotionListener): void;
}
