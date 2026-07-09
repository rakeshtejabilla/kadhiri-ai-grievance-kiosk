import type {
  UploadMetadata,
  UploaderProvider,
  UploadProgressListener,
  UploadResult,
} from "./UploaderProvider.js";

/**
 * Simulated network uploader for demoing the full workflow without a
 * reachable backend. Progress is faked over ~1.5s and the outcome can be
 * forced to fail (e.g. to demo the "Unable to Upload" screen) by setting
 * the KIOSK_FORCE_UPLOAD_FAILURE=1 environment variable.
 */
export class MockUploaderProvider implements UploaderProvider {
  async upload(
    _filePath: string,
    _metadata: UploadMetadata,
    onProgress?: UploadProgressListener,
  ): Promise<UploadResult> {
    const steps = [10, 25, 45, 65, 80, 100];
    for (const percent of steps) {
      await delay(200);
      onProgress?.(percent);
    }

    if (process.env.KIOSK_FORCE_UPLOAD_FAILURE === "1") {
      throw new Error("Simulated network failure (KIOSK_FORCE_UPLOAD_FAILURE=1)");
    }

    return { uploadedAt: new Date().toISOString() };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
