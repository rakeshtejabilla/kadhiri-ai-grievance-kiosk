#!/usr/bin/env python3
"""
PIR Sensor GPIO bridge for the Kadhiri AI Grievance Kiosk.

Uses gpiozero which is pre-installed on Raspberry Pi OS and works on
all Pi models including Pi 5 (RP1 GPIO controller) and Pi 4 (BCM2711).

Protocol (stdout):
  READY  - sensor initialized successfully, Node.js may proceed
  1      - motion detected (PIR OUT went HIGH)
  0      - motion lost    (PIR OUT went LOW)

Usage:
  python3 pir_sensor.py <gpio_pin>
  python3 pir_sensor.py 17
"""

import sys
import signal


def main() -> None:
    pin = int(sys.argv[1]) if len(sys.argv) > 1 else 17

    try:
        from gpiozero import MotionSensor  # type: ignore[import]
    except ImportError:
        print("ERROR: gpiozero is not installed. Run: sudo apt install python3-gpiozero",
              file=sys.stderr, flush=True)
        sys.exit(1)

    try:
        pir = MotionSensor(pin)
    except Exception as e:
        print(f"ERROR: Failed to open GPIO{pin}: {e}", file=sys.stderr, flush=True)
        sys.exit(1)

    def on_motion() -> None:
        print("1", flush=True)

    def on_no_motion() -> None:
        print("0", flush=True)

    pir.when_motion = on_motion
    pir.when_no_motion = on_no_motion

    # Signal Node.js that the sensor is ready
    print("READY", flush=True)

    # Block forever, waiting for GPIO events
    try:
        signal.pause()
    except KeyboardInterrupt:
        pass
    finally:
        pir.close()


if __name__ == "__main__":
    main()
