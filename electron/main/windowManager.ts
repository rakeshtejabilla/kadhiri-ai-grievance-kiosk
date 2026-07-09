import path from "node:path";
import { BrowserWindow, app } from "electron";

// Compiled to CommonJS (see electron/tsconfig.json), so __dirname is provided natively by Node.
const isDev = process.env.NODE_ENV === "development";

export function createKioskWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !isDev,
    kiosk: !isDev,
    autoHideMenuBar: true,
    frame: isDev,
    backgroundColor: "#0B2E59",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev,
    },
  });

  win.setMenuBarVisibility(false);

  // Citizens must never be able to right-click, zoom, or navigate away.
  win.webContents.on("context-menu", (event) => event.preventDefault());
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  if (isDev) {
    void win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    void win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  return win;
}

export function registerKioskSafetyGuards(): void {
  // Prevent Alt+F4 / Cmd+Q style exits — a public kiosk should only ever be
  // stopped by the technician-facing systemd service, never by a citizen.
  app.on("before-quit", (event) => {
    if (process.env.NODE_ENV !== "development" && process.env.ALLOW_QUIT !== "1") {
      event.preventDefault();
    }
  });
}
