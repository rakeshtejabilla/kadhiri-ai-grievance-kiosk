import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { AudioRecorderProvider, RecordingResult } from "./AudioRecorderProvider.js";

/**
 * Records real microphone input via the `arecord` ALSA utility that ships
 * with virtually every Ubuntu/Raspberry Pi OS image. It is called "Mock" to
 * match the naming convention requested for the four hardware providers
 * (motion / audio / uploader / storage all ship with a Mock* implementation
 * first), but unlike the motion mock, this one produces genuine audio so the
 * upload pipeline can be exercised end-to-end without any Pi hardware.
 *
 * If `arecord` is not on PATH (e.g. developing on macOS/Windows) this falls
 * back to writing a valid, silent WAV file of the elapsed duration so the
 * rest of the workflow (save -> upload -> success/failure) can still be
 * demoed.
 */
export class MockAudioRecorderProvider implements AudioRecorderProvider {
  private process: ChildProcessWithoutNullStreams | null = null;
  private startedAt = 0;
  private currentFilePath = "";
  private _isRecording = false;

  constructor(private readonly recordingsDir: string) {
    if (!existsSync(recordingsDir)) {
      mkdirSync(recordingsDir, { recursive: true });
    }
  }

  isRecording(): boolean {
    return this._isRecording;
  }

  async start(): Promise<void> {
    if (this._isRecording) return;
    this._isRecording = true;

    this.currentFilePath = path.join(
      this.recordingsDir,
      `complaint-${Date.now()}.wav`,
    );
    this.startedAt = Date.now();

    try {
      this.process = spawn("arecord", [
        "-f",
        "S16_LE",
        "-r",
        "16000",
        "-c",
        "1",
        this.currentFilePath,
      ]);
      this.process.on("error", () => {
        // arecord missing/unusable - fall through to silent-WAV fallback on stop()
        this.process = null;
      });
    } catch {
      this.process = null;
    }
  }

  async stop(): Promise<RecordingResult> {
    this._isRecording = false;
    const durationMs = Date.now() - this.startedAt;

    if (this.process) {
      const proc = this.process;
      this.process = null;
      await new Promise<void>((resolve) => {
        proc.once("close", () => resolve());
        proc.kill("SIGINT");
        // Safety timeout in case arecord ignores SIGINT
        setTimeout(resolve, 1500);
      });
    }

    if (!existsSync(this.currentFilePath)) {
      await writeSilentWav(this.currentFilePath, durationMs);
    }

    return { filePath: this.currentFilePath, durationMs };
  }
}

/** Writes a minimal valid 16kHz mono PCM WAV file of silence, used only as a fallback. */
async function writeSilentWav(filePath: string, durationMs: number): Promise<void> {
  const { writeFile } = await import("node:fs/promises");
  const sampleRate = 16000;
  const numSamples = Math.max(1, Math.floor((sampleRate * durationMs) / 1000));
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  // remaining bytes already zero-initialised = silence

  await writeFile(filePath, buffer);
}
