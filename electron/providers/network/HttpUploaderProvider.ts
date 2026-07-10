import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type {
  UploadMetadata,
  UploaderProvider,
  UploadProgressListener,
  UploadResult,
} from "./UploaderProvider.js";

/**
 * Real network implementation. Posts multipart/form-data to
 * `${serverUrl}/api/v1/audio/upload` with fields:
 *   machine_id, timestamp, location, audio (the .wav file)
 */
export class HttpUploaderProvider implements UploaderProvider {
  constructor(private readonly serverUrl: string, private readonly timeoutMs = 120_000) {}

  async upload(
    filePath: string,
    metadata: UploadMetadata,
    onProgress?: UploadProgressListener,
  ): Promise<UploadResult> {
    const form = new FormData();
    form.append("machine_id", metadata.machineId);
    form.append("timestamp", metadata.timestamp);
    form.append("location", metadata.location);

    const { size } = await stat(filePath);
    const ext = path.extname(filePath) || ".webm";
    const isWav = ext === ".wav";
    form.append("audio", createReadStream(filePath), {
      filename: `audio${ext}`,
      contentType: isWav ? "audio/wav" : "audio/webm",
      knownLength: size,
    });

    const url = `${this.serverUrl.replace(/\/$/, "")}/api/v1/audio/upload`;

    await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: this.timeoutMs,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });

    return { uploadedAt: new Date().toISOString() };
  }
}
