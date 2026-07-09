import type {
  KioskConfig,
  RecordingStoppedPayload,
  UploadFailedPayload,
  UploadProgressPayload,
  UploadSucceededPayload,
} from "@shared/ipc-contract";

type Unsubscribe = () => void;

export interface ElectronAPI {
  getConfig: () => Promise<KioskConfig>;
  getAppVersion: () => Promise<string>;

  onRecordingStarted: (cb: () => void) => Unsubscribe;
  onRecordingStopped: (cb: (payload: RecordingStoppedPayload) => void) => Unsubscribe;
  onUploadStarted: (cb: () => void) => Unsubscribe;
  onUploadProgress: (cb: (payload: UploadProgressPayload) => void) => Unsubscribe;
  onUploadSucceeded: (cb: (payload: UploadSucceededPayload) => void) => Unsubscribe;
  onUploadFailed: (cb: (payload: UploadFailedPayload) => void) => Unsubscribe;
  onUploadRetryScheduled: (cb: (payload: { attempt: number }) => void) => Unsubscribe;

  // Renderer-side audio recording
  onCmdStartRecording?: (cb: () => void) => Unsubscribe;
  onCmdStopRecording?: (cb: () => void) => Unsubscribe;
  sendAudioDone?: (wavBuffer: ArrayBuffer) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
