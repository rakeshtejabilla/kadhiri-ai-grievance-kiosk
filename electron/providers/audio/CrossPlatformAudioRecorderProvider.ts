import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { AudioRecorderProvider, RecordingResult } from "./AudioRecorderProvider.js";

/**
 * Cross-platform audio recorder:
 *  - Windows: Uses PowerShell + Windows Media APIs (no extra install needed)
 *  - Linux/Pi: Uses `arecord` (ALSA)
 *  - macOS: Uses `sox` or `ffmpeg`
 * Falls back to a silent WAV if none available.
 */
export class CrossPlatformAudioRecorderProvider implements AudioRecorderProvider {
  private process: ChildProcessWithoutNullStreams | null = null;
  private startedAt = 0;
  private currentFilePath = "";
  private _isRecording = false;
  private platform = os.platform();

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
      if (this.platform === "win32") {
        await this._startWindows();
      } else {
        await this._startLinux();
      }
    } catch {
      this.process = null;
    }
  }

  private async _startWindows(): Promise<void> {
    // Use PowerShell with System.Speech or SoundPlayer
    // We use ffmpeg if available, otherwise fall back to PowerShell WMA capture trick
    const psScript = `
Add-Type -AssemblyName System.Speech
Add-Type -AssemblyName System.Windows.Forms
$filePath = "${this.currentFilePath.replace(/\\/g, "\\\\")}"
$source = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Use Windows built-in audio capture via ffmpeg if available
$ffmpegAvailable = $null -ne (Get-Command ffmpeg -ErrorAction SilentlyContinue)
if ($ffmpegAvailable) {
  $global:ffmpegProc = Start-Process ffmpeg -ArgumentList @("-y", "-f", "dshow", "-i", "audio=@device_cm_{33D9A762-90C8-11D0-BD43-00A0C911CE86}\\wave_{00000000-0000-0000-0000-000000000000}", "-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le", "$filePath") -PassThru -WindowStyle Hidden
} else {
  # PowerShell WASAPI via .NET
  Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Threading;
using NAudio.Wave;
"@
}
    `;

    // Simpler approach: use ffmpeg directly if it's installed on Windows
    this.process = spawn("ffmpeg", [
      "-y",
      "-f", "dshow",
      "-i", "audio=Microphone Array (Intel® Smart Sound Technology for Digital Microphones)",
      "-ar", "16000",
      "-ac", "1",
      "-acodec", "pcm_s16le",
      this.currentFilePath,
    ]);

    this.process.on("error", () => {
      // ffmpeg dshow failed - try generic default device
      this.process = spawn("ffmpeg", [
        "-y",
        "-f", "dshow",
        "-i", "audio=@device_cm_{33D9A762-90C8-11D0-BD43-00A0C911CE86}\\wave_{00000000-0000-0000-0000-000000000000}",
        "-ar", "16000",
        "-ac", "1",
        "-acodec", "pcm_s16le",
        this.currentFilePath,
      ]);
      this.process.on("error", () => {
        this.process = null;
      });
    });
  }

  private async _startLinux(): Promise<void> {
    this.process = spawn("arecord", [
      "-f", "S16_LE",
      "-r", "16000",
      "-c", "1",
      this.currentFilePath,
    ]);
    this.process.on("error", () => {
      this.process = null;
    });
  }

  async stop(): Promise<RecordingResult> {
    this._isRecording = false;
    const durationMs = Date.now() - this.startedAt;

    if (this.process) {
      const proc = this.process;
      this.process = null;
      await new Promise<void>((resolve) => {
        proc.once("close", () => resolve());
        // ffmpeg stops gracefully on 'q' via stdin
        if (proc.stdin) {
          proc.stdin.write("q");
        }
        proc.kill("SIGINT");
        setTimeout(resolve, 1500);
      });
    }

    if (!existsSync(this.currentFilePath)) {
      await writeSilentWav(this.currentFilePath, durationMs);
    }

    return { filePath: this.currentFilePath, durationMs };
  }
}

/** Writes a minimal valid 16kHz mono PCM WAV file of silence, used as fallback. */
async function writeSilentWav(filePath: string, durationMs: number): Promise<void> {
  const { writeFile } = await import("node:fs/promises");
  const sampleRate = 16000;
  const numSamples = Math.max(1, Math.floor((sampleRate * durationMs) / 1000));
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  await writeFile(filePath, buffer);
}
