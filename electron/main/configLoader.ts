import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { KioskConfig } from "../shared/ipc-contract.js";

const DEFAULT_CONFIG: KioskConfig = {
  machineId: "KADHIRI-KIOSK-001",
  serverUrl: "https://grievance-api.kadhiri.gov.in",
  location: "Kadhiri Mandal Office, Main Entrance",
  district: "Kadhiri",
  retryInterval: 60_000,
  maxRecordingDurationMs: 120_000,
  mockHardware: true,
};

/**
 * Config resolution order:
 *   1. `config.json` next to the packaged app (installed kiosks edit this).
 *   2. `config.json` in the Electron userData directory (first-run copy).
 *   3. Built-in defaults above, which also get written out as a starting
 *      point so the file always exists for an installer/technician to edit.
 */
export function loadConfig(): KioskConfig {
  const packagedConfigPath = path.join(app.getAppPath(), "config.json");
  const userDataConfigPath = path.join(app.getPath("userData"), "config.json");

  const sourcePath = existsSync(packagedConfigPath)
    ? packagedConfigPath
    : existsSync(userDataConfigPath)
      ? userDataConfigPath
      : null;

  if (!sourcePath) {
    writeFileSync(userDataConfigPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
    return DEFAULT_CONFIG;
  }

  try {
    const raw = readFileSync(sourcePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<KioskConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to parse config at ${sourcePath}, falling back to defaults`, err);
    return DEFAULT_CONFIG;
  }
}
