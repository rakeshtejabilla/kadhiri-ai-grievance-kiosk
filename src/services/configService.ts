import type { KioskConfig } from "@shared/ipc-contract";
import { ipcClient } from "./ipcClient";

let cached: KioskConfig | null = null;

export async function getKioskConfig(): Promise<KioskConfig> {
  if (cached) return cached;
  cached = await ipcClient.getConfig();
  return cached;
}
