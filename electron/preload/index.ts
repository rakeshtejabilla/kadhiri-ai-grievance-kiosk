import { contextBridge, ipcRenderer } from "electron";
import type {
  KioskConfig,
  RecordingStoppedPayload,
  UploadFailedPayload,
  UploadProgressPayload,
  UploadSucceededPayload,
} from "../shared/ipc-contract.js";

type Unsubscribe = () => void;

function on<T>(channel: string, listener: (payload: T) => void): Unsubscribe {
  const wrapped = (_event: Electron.IpcRendererEvent, payload: T) => listener(payload);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.removeListener(channel, wrapped);
}

const electronAPI = {
  getConfig: (): Promise<KioskConfig> => ipcRenderer.invoke("kiosk:get-config"),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("kiosk:get-app-version"),

  onRecordingStarted: (cb: () => void): Unsubscribe => on("kiosk:recording-started", cb),
  onRecordingStopped: (cb: (payload: RecordingStoppedPayload) => void): Unsubscribe =>
    on("kiosk:recording-stopped", cb),
  onUploadStarted: (cb: () => void): Unsubscribe => on("kiosk:upload-started", cb),
  onUploadProgress: (cb: (payload: UploadProgressPayload) => void): Unsubscribe =>
    on("kiosk:upload-progress", cb),
  onUploadSucceeded: (cb: (payload: UploadSucceededPayload) => void): Unsubscribe =>
    on("kiosk:upload-succeeded", cb),
  onUploadFailed: (cb: (payload: UploadFailedPayload) => void): Unsubscribe =>
    on("kiosk:upload-failed", cb),
  onUploadRetryScheduled: (cb: (payload: { attempt: number }) => void): Unsubscribe =>
    on("kiosk:upload-retry-scheduled", cb),

  // Renderer-side audio recording (Windows: no arecord/ffmpeg needed)
  onCmdStartRecording: (cb: () => void): Unsubscribe =>
    on("kiosk:cmd-start-recording", cb),
  onCmdStopRecording: (cb: () => void): Unsubscribe =>
    on("kiosk:cmd-stop-recording", cb),
  sendAudioDone: (wavBuffer: ArrayBuffer): void => {
    ipcRenderer.send("kiosk:audio-done", wavBuffer);
  },
};

export type ElectronAPI = typeof electronAPI;

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
