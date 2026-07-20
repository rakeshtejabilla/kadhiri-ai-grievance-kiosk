import { writeFile } from "node:fs/promises";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import type { BrowserWindow } from "electron";
import { ipcMain } from "electron";
import { IpcChannels } from "../../shared/ipc-contract.js";
import type { AudioRecorderProvider, RecordingResult } from "./AudioRecorderProvider.js";

/**
 * Delegates audio recording to the renderer process via Web MediaRecorder API.
 * This works on ALL platforms (Windows/macOS/Linux) without requiring
 * any native CLI tools (arecord, ffmpeg, sox, etc.).
 *
 * Flow:
 *   1. start()  → sends CMD_START_RECORDING to renderer
 *   2. Renderer records with navigator.mediaDevices + MediaRecorder
 *   3. stop()   → sends CMD_STOP_RECORDING to renderer
 *   4. Renderer sends AUDIO_DONE with the WAV ArrayBuffer
 *   5. Provider writes the buffer to disk and resolves the Promise
 */
export class RendererAudioRecorderProvider implements AudioRecorderProvider {
  private _isRecording = false;
  private startedAt = 0;
  private currentFilePath = "";
  private resolveStop: ((result: RecordingResult) => void) | null = null;
  private rejectStop: ((err: Error) => void) | null = null;

  constructor(
    private readonly window: BrowserWindow,
    private readonly recordingsDir: string,
  ) {
    if (!existsSync(recordingsDir)) {
      mkdirSync(recordingsDir, { recursive: true });
    }

    // Listen for the finished audio buffer from the renderer
    ipcMain.on(IpcChannels.AUDIO_DONE, (_event, wavBuffer: Buffer) => {
      this._handleAudioDone(wavBuffer);
    });
  }

  isRecording(): boolean {
    return this._isRecording;
  }

  async start(): Promise<void> {
    if (this._isRecording) return;
    this._isRecording = true;
    this.startedAt = Date.now();
    this.currentFilePath = path.join(
      this.recordingsDir,
      `complaint-${this.startedAt}.webm`,
    );
    this.window.webContents.send(IpcChannels.CMD_START_RECORDING);
  }

  async stop(): Promise<RecordingResult> {
    return new Promise<RecordingResult>((resolve, reject) => {
      this.resolveStop = resolve;
      this.rejectStop = reject;
      this.window.webContents.send(IpcChannels.CMD_STOP_RECORDING);

      // Timeout safety: if no audio arrives within 10s, resolve with silence
      setTimeout(() => {
        if (this.resolveStop) {
          this.resolveStop({ filePath: this.currentFilePath, durationMs: Date.now() - this.startedAt });
          this.resolveStop = null;
        }
      }, 10_000);
    });
  }

  private async _handleAudioDone(wavBuffer: ArrayBuffer | Buffer): Promise<void> {
    const durationMs = Date.now() - this.startedAt;
    this._isRecording = false;

    // IPC sends ArrayBuffer — Node's fs.writeFile needs a Buffer
    const nodeBuffer = Buffer.isBuffer(wavBuffer)
      ? wavBuffer
      : Buffer.from(wavBuffer);

    try {
      await writeFile(this.currentFilePath, nodeBuffer);
    } catch (err) {
      if (this.rejectStop) this.rejectStop(err as Error);
      return;
    }

    if (this.resolveStop) {
      this.resolveStop({ filePath: this.currentFilePath, durationMs });
      this.resolveStop = null;
      this.rejectStop = null;
    }
  }
}
