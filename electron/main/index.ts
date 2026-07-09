import { app, BrowserWindow } from "electron";
import { loadConfig } from "./configLoader.js";
import { registerIpcHandlers } from "./ipcHandlers.js";
import { createKioskWindow, registerKioskSafetyGuards } from "./windowManager.js";
import { createProviders } from "../providers/factory.js";
import { KioskOrchestrator } from "./kioskOrchestrator.js";

let orchestrator: KioskOrchestrator | null = null;

async function bootstrap(): Promise<void> {
  const config = loadConfig();

  registerKioskSafetyGuards();
  registerIpcHandlers(config);

  const window = createKioskWindow();
  const providers = createProviders(config, window);

  orchestrator = new KioskOrchestrator(window, providers, config);
  await orchestrator.start();

  window.on("closed", () => {
    void orchestrator?.stop();
  });
}

app.whenReady().then(() => {
  void bootstrap();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void bootstrap();
    }
  });
});

app.on("window-all-closed", () => {
  void orchestrator?.stop();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

process.on("uncaughtException", (err) => {
  // A public kiosk must never show a crash dialog to a citizen; log and keep running.
  // eslint-disable-next-line no-console
  console.error("[uncaughtException]", err);
});
