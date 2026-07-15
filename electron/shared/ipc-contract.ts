/**
 * Single source of truth for every IPC channel name and payload shape
 * exchanged between the Electron main process and the React renderer.
 *
 * Importing this file from both `electron/` (compiled as CommonJS) and
 * `src/` (compiled as ESM by Vite) keeps the two processes in sync and
 * gives full compile-time safety on both sides of the IPC boundary.
 */

export const IpcChannels = {
  // main -> renderer (kiosk lifecycle events)
  MOTION_DETECTED: "kiosk:motion-detected",
  MOTION_LOST: "kiosk:motion-lost",
  RECORDING_STARTED: "kiosk:recording-started",
  RECORDING_STOPPED: "kiosk:recording-stopped",
  RECORDING_TICK: "kiosk:recording-tick",
  UPLOAD_STARTED: "kiosk:upload-started",
  UPLOAD_PROGRESS: "kiosk:upload-progress",
  UPLOAD_SUCCEEDED: "kiosk:upload-succeeded",
  UPLOAD_FAILED: "kiosk:upload-failed",
  UPLOAD_RETRY_SCHEDULED: "kiosk:upload-retry-scheduled",

  // renderer -> main (invoke/handle)
  GET_CONFIG: "kiosk:get-config",
  GET_APP_VERSION: "kiosk:get-app-version",

  // renderer → main: Web MediaRecorder audio (Windows fallback)
  AUDIO_CHUNK: "kiosk:audio-chunk",        // renderer sends ArrayBuffer chunk
  AUDIO_DONE: "kiosk:audio-done",           // renderer signals recording complete

  // main → renderer: commands to start/stop Web MediaRecorder
  CMD_START_RECORDING: "kiosk:cmd-start-recording",
  CMD_STOP_RECORDING: "kiosk:cmd-stop-recording",

  // main -> renderer (dev-only mock hardware toggles, forwarded for on-screen debug badge)
  MOCK_MODE_STATUS: "kiosk:mock-mode-status",
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];

export interface KioskConfig {
  machineId: string;
  serverUrl: string;
  location: string;
  district: string;
  /** Milliseconds between retry attempts when an upload fails */
  retryInterval: number;
  /** Milliseconds of continued silence/no-motion before recording auto-stops as a safety net */
  maxRecordingDurationMs: number;
  /** true when running with Mock*Provider implementations (no real GPIO/mic hardware) */
  mockHardware: boolean;
  /**
   * BCM GPIO pin number the PIR sensor OUT wire is connected to.
   * Defaults to 17 (physical Pin 11) if omitted.
   * Only used when mockHardware is false.
   */
  gpioPin?: number;
}

export interface RecordingStoppedPayload {
  filePath: string;
  durationMs: number;
}

export interface UploadProgressPayload {
  percent: number;
}

export interface UploadFailedPayload {
  message: string;
  willRetryInMs: number;
  attempt: number;
}

export interface UploadSucceededPayload {
  machineId: string;
  uploadedAt: string;
}
