export type KioskScreen =
  | "idle"
  | "recording"
  | "uploading"
  | "success"
  | "upload-failed";

export interface KioskState {
  screen: KioskScreen;
  recordingElapsedMs: number;
  uploadPercent: number;
  uploadErrorMessage: string | null;
  retryInSeconds: number;
  machineId: string;
  location: string;
}
