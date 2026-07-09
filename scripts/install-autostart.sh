#!/usr/bin/env bash
#
# Installs the Kadhiri Grievance Kiosk as a systemd service that starts
# automatically on boot and restarts itself if it ever crashes.
#
# Usage: sudo ./scripts/install-autostart.sh
set -euo pipefail

SERVICE_SRC="$(dirname "$0")/kadhiri-kiosk.service"
SERVICE_DEST="/etc/systemd/system/kadhiri-kiosk.service"

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root: sudo ./scripts/install-autostart.sh" >&2
  exit 1
fi

echo "Installing systemd unit to $SERVICE_DEST"
cp "$SERVICE_SRC" "$SERVICE_DEST"

echo "Reloading systemd and enabling the kiosk service..."
systemctl daemon-reload
systemctl enable kadhiri-kiosk.service
systemctl restart kadhiri-kiosk.service

echo "Done. Check status with: systemctl status kadhiri-kiosk.service"
echo "View logs with:          journalctl -u kadhiri-kiosk.service -f"
