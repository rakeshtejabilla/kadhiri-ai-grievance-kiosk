import path from "node:path";
import { app } from "electron";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import type { CameraProvider } from "./CameraProvider.js";

export class MockCameraProvider implements CameraProvider {
  async captureImage(): Promise<string> {
    const userDataDir = app.getPath("userData");
    const tempDir = path.join(userDataDir, "temp");
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    const filename = `${randomUUID()}.jpg`;
    const filepath = path.join(tempDir, filename);

    // Create a dummy JPEG file (just a text string for testing, real JPG would have header)
    // We'll write an empty file just so it exists for the uploader to read
    await fs.writeFile(filepath, Buffer.from([]));
    
    console.log(`[MockCamera] Captured dummy image to ${filepath}`);
    return filepath;
  }
}
