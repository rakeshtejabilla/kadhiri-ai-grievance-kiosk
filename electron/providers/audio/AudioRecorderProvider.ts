export interface RecordingResult {
  /** Absolute path to the finished .wav file on disk */
  filePath: string;
  durationMs: number;
}

/**
 * Hardware abstraction for capturing microphone audio to a .wav file.
 * The kiosk never streams audio anywhere else in-process — it only ever
 * writes a file and hands the path to the UploaderProvider.
 */
export interface AudioRecorderProvider {
  /** Begin capturing microphone audio to a new temp file. */
  start(): Promise<void>;
  /** Stop capturing and resolve with the finished file's path + duration. */
  stop(): Promise<RecordingResult>;
  /** True while actively recording. */
  isRecording(): boolean;
}
