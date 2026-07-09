import { create } from "zustand";
import type { KioskScreen, KioskState } from "@/types/kiosk";

interface KioskStore extends KioskState {
  goToIdle: () => void;
  startRecording: () => void;
  setRecordingElapsedMs: (ms: number) => void;
  stopRecordingAndUpload: () => void;
  setUploadPercent: (percent: number) => void;
  uploadSucceeded: () => void;
  uploadFailed: (message: string, retryInSeconds: number) => void;
  setRetryCountdown: (seconds: number) => void;
  setMachineInfo: (machineId: string, location: string) => void;
  setScreen: (screen: KioskScreen) => void;
}

export const useKioskStore = create<KioskStore>((set) => ({
  screen: "idle",
  recordingElapsedMs: 0,
  uploadPercent: 0,
  uploadErrorMessage: null,
  retryInSeconds: 0,
  machineId: "",
  location: "",

  goToIdle: () =>
    set({
      screen: "idle",
      recordingElapsedMs: 0,
      uploadPercent: 0,
      uploadErrorMessage: null,
    }),

  startRecording: () => set({ screen: "recording", recordingElapsedMs: 0 }),

  setRecordingElapsedMs: (ms) => set({ recordingElapsedMs: ms }),

  stopRecordingAndUpload: () => set({ screen: "uploading", uploadPercent: 0 }),

  setUploadPercent: (percent) => set({ uploadPercent: percent }),

  uploadSucceeded: () => set({ screen: "success" }),

  uploadFailed: (message, retryInSeconds) =>
    set({ screen: "upload-failed", uploadErrorMessage: message, retryInSeconds }),

  setRetryCountdown: (seconds) => set({ retryInSeconds: seconds }),

  setMachineInfo: (machineId, location) => set({ machineId, location }),

  setScreen: (screen) => set({ screen }),
}));
