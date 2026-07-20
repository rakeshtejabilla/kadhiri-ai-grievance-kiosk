import { ipcMain, type BrowserWindow } from "electron";
import { IpcChannels, type KioskConfig } from "../shared/ipc-contract.js";
import type { KioskProviders } from "../providers/factory.js";

/**
 * Owns the end-to-end citizen workflow described in the project brief:
 *
 *   idle -> motion detected -> recording -> motion lost -> stop recording
 *   -> save file -> upload -> success | failed (queued + retried) -> idle
 *
 * This class only talks to provider interfaces and forwards state changes
 * to the renderer over IPC. It has zero knowledge of React/UI concerns.
 */
export class KioskOrchestrator {
  private recordingStartedAt = 0;
  private safetyTimer: NodeJS.Timeout | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private uploadAttempt = 0;
  private isPrompting = false;
  private readonly onPromptDone = () => void this.handlePromptDone();

  constructor(
    private readonly window: BrowserWindow,
    private readonly providers: KioskProviders,
    private readonly config: KioskConfig,
  ) {}

  async start(): Promise<void> {
    ipcMain.on(IpcChannels.PROMPT_DONE, this.onPromptDone);
    this.providers.motion.onMotionDetected(() => void this.handleMotionDetected());
    this.providers.motion.onMotionLost(() => void this.handleMotionLost());
    await this.providers.motion.start();
  }

  async stop(): Promise<void> {
    ipcMain.removeListener(IpcChannels.PROMPT_DONE, this.onPromptDone);
    await this.providers.motion.stop();
    if (this.safetyTimer) clearTimeout(this.safetyTimer);
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  private send(channel: string, payload?: unknown): void {
    if (this.window.isDestroyed()) return;
    this.window.webContents.send(channel, payload);
  }

  private async handleMotionDetected(): Promise<void> {
    if (this.providers.audio.isRecording() || this.isPrompting) return; // already recording or prompting, ignore re-triggers

    this.isPrompting = true;
    this.send(IpcChannels.PLAY_PROMPT);
  }

  private async handlePromptDone(): Promise<void> {
    if (!this.isPrompting) return; // ignoring duplicate or stray events
    this.isPrompting = false;

    this.recordingStartedAt = Date.now();
    await this.providers.audio.start();
    this.send(IpcChannels.RECORDING_STARTED);

    // Safety net: never record forever even if the motion-lost signal is missed.
    this.safetyTimer = setTimeout(() => {
      void this.handleMotionLost();
    }, this.config.maxRecordingDurationMs);
  }

  private async handleMotionLost(): Promise<void> {
    if (!this.providers.audio.isRecording()) return;
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }

    const result = await this.providers.audio.stop();
    this.send(IpcChannels.RECORDING_STOPPED, {
      filePath: result.filePath,
      durationMs: result.durationMs,
    });

    await this.uploadRecording(result.filePath);
  }

  private async uploadRecording(filePath: string): Promise<void> {
    this.uploadAttempt = 1;
    const metadata = {
      machineId: this.config.machineId,
      timestamp: new Date().toISOString(),
      location: this.config.location,
    };

    await this.providers.storage.enqueue({
      filePath,
      machineId: metadata.machineId,
      timestamp: metadata.timestamp,
      location: metadata.location,
      attempts: 0,
    });

    this.send(IpcChannels.UPLOAD_STARTED);

    try {
      const result = await this.providers.uploader.upload(filePath, metadata, (percent) => {
        this.send(IpcChannels.UPLOAD_PROGRESS, { percent });
      });

      await this.providers.storage.dequeue(filePath);
      this.send(IpcChannels.UPLOAD_SUCCEEDED, {
        machineId: metadata.machineId,
        uploadedAt: result.uploadedAt,
      });
    } catch (err) {
      await this.providers.storage.recordAttempt(filePath);
      const message = err instanceof Error ? err.message : "Unknown upload error";

      this.send(IpcChannels.UPLOAD_FAILED, {
        message,
        willRetryInMs: this.config.retryInterval,
        attempt: this.uploadAttempt,
      });

      this.scheduleRetry();
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      void this.retryPendingUploads();
    }, this.config.retryInterval);
  }

  private async retryPendingUploads(): Promise<void> {
    const pending = await this.providers.storage.listPending();
    if (pending.length === 0) return;

    for (const entry of pending) {
      this.uploadAttempt = entry.attempts + 1;
      this.send(IpcChannels.UPLOAD_RETRY_SCHEDULED, { attempt: this.uploadAttempt });

      try {
        const result = await this.providers.uploader.upload(entry.filePath, {
          machineId: entry.machineId,
          timestamp: entry.timestamp,
          location: entry.location,
        });
        await this.providers.storage.dequeue(entry.filePath);
        this.send(IpcChannels.UPLOAD_SUCCEEDED, {
          machineId: entry.machineId,
          uploadedAt: result.uploadedAt,
        });
      } catch (err) {
        await this.providers.storage.recordAttempt(entry.filePath);
        const message = err instanceof Error ? err.message : "Unknown upload error";
        this.send(IpcChannels.UPLOAD_FAILED, {
          message,
          willRetryInMs: this.config.retryInterval,
          attempt: this.uploadAttempt,
        });
        this.scheduleRetry();
      }
    }
  }
}
