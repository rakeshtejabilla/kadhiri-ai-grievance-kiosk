#!/usr/bin/env python3
"""
Ultrasonic Sensor (HC-SR04) GPIO bridge for the Kadhiri AI Grievance Kiosk.

Uses gpiozero to measure distance.
If distance < threshold (e.g., 0.8 meters), motion is DETECTED (1).
If distance > threshold, motion is LOST (0).

Protocol (stdout):
  READY  - sensor initialized successfully
  1      - presence detected (citizen within range)
  0      - presence lost (citizen walked away)

Usage:
  python3 distance_sensor.py <trigger_pin> <echo_pin> <threshold_meters>
"""

import sys
import signal

def main() -> None:
    trigger_pin = int(sys.argv[1]) if len(sys.argv) > 1 else 17
    echo_pin = int(sys.argv[2]) if len(sys.argv) > 2 else 27
    threshold = float(sys.argv[3]) if len(sys.argv) > 3 else 0.8  # 80cm threshold
    
    try:
        from gpiozero import DistanceSensor  # type: ignore[import]
    except ImportError:
        print("ERROR: gpiozero is not installed. Run: sudo apt install python3-gpiozero", file=sys.stderr, flush=True)
        sys.exit(1)

    try:
        # DistanceSensor triggers when object is closer than threshold_distance
        sensor = DistanceSensor(
            echo=echo_pin,
            trigger=trigger_pin,
            max_distance=4.0,
            threshold_distance=threshold
        )
    except Exception as e:
        print(f"ERROR: Failed to open ultrasonic sensor on pins Trigger:{trigger_pin} Echo:{echo_pin} -> {e}", file=sys.stderr, flush=True)
        sys.exit(1)

    def on_in_range() -> None:
        print("1", flush=True)

    def on_out_of_range() -> None:
        print("0", flush=True)

    sensor.when_in_range = on_in_range
    sensor.when_out_of_range = on_out_of_range

    print("READY", flush=True)

    try:
        signal.pause()
    except KeyboardInterrupt:
        pass
    finally:
        sensor.close()

if __name__ == "__main__":
    main()
