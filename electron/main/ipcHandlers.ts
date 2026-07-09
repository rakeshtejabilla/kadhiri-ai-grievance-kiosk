import { app, ipcMain } from "electron";
import { IpcChannels, type KioskConfig } from "../shared/ipc-contract.js";

export function registerIpcHandlers(config: KioskConfig): void {
  ipcMain.handle(IpcChannels.GET_CONFIG, (): KioskConfig => config);
  ipcMain.handle(IpcChannels.GET_APP_VERSION, (): string => app.getVersion());
}
