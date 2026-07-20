import type { ElectronAPI } from "@/types/electron-api";

/**
 * Every renderer access to Electron IPC goes through this single module.
 * Keeping it isolated means components/hooks never touch `window.electronAPI`
 * directly, which makes the whole UI testable outside Electron (e.g. `vite
 * dev` in a plain browser tab) by falling back to inert no-op handlers
 * instead of throwing when the preload bridge isn't present.
 */
function noopUnsubscribe(): void {
  /* no-op */
}

const browserFallback: ElectronAPI = {
  getConfig: async () => ({
    machineId: "DEV-BROWSER",
    serverUrl: "http://localhost",
    location: "Development Preview",
    district: "Kadhiri",
    retryInterval: 60_000,
    maxRecordingDurationMs: 120_000,
    mockHardware: true,
  }),
  getAppVersion: async () => "0.0.0-dev",
  onRecordingStarted: () => noopUnsubscribe,
  onRecordingStopped: () => noopUnsubscribe,
  onUploadStarted: () => noopUnsubscribe,
  onUploadProgress: () => noopUnsubscribe,
  onUploadSucceeded: () => noopUnsubscribe,
  onUploadFailed: () => noopUnsubscribe,
  onUploadRetryScheduled: () => noopUnsubscribe,
  onPlayPrompt: () => noopUnsubscribe,
  sendPromptDone: () => {},
};

function getApi(): ElectronAPI {
  return typeof window !== "undefined" && window.electronAPI ? window.electronAPI : browserFallback;
}

export const ipcClient: ElectronAPI = {
  getConfig: () => getApi().getConfig(),
  getAppVersion: () => getApi().getAppVersion(),
  onRecordingStarted: (cb) => getApi().onRecordingStarted(cb),
  onRecordingStopped: (cb) => getApi().onRecordingStopped(cb),
  onUploadStarted: (cb) => getApi().onUploadStarted(cb),
  onUploadProgress: (cb) => getApi().onUploadProgress(cb),
  onUploadSucceeded: (cb) => getApi().onUploadSucceeded(cb),
  onUploadFailed: (cb) => getApi().onUploadFailed(cb),
  onUploadRetryScheduled: (cb) => getApi().onUploadRetryScheduled(cb),
  onPlayPrompt: (cb) => getApi().onPlayPrompt(cb),
  sendPromptDone: () => getApi().sendPromptDone(),
};
