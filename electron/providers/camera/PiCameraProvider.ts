import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { app } from "electron";
import { randomUUID } from "node:crypto";
import type { CameraProvider } from "./CameraProvider.js";
import fs from "node:fs/promises";

const execAsync = promisify(exec);

export class PiCameraProvider implements CameraProvider {
  async captureImage(): Promise<string> {
    const userDataDir = app.getPath("userData");
    const tempDir = path.join(userDataDir, "temp");

    // Ensure temp directory exists
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    const filename = `${randomUUID()}.jpg`;
    const filepath = path.join(tempDir, filename);

    try {
      // The user has a USB camera connected to the Raspberry Pi.
      // Use fswebcam to capture a frame.
      // -r 1920x1080 sets the resolution
      // --no-banner removes the timestamp banner
      // --skip 10 drops the first 10 frames to let the camera warm up (prevents timeout error)
      const { stdout, stderr } = await execAsync(`fswebcam -r 1920x1080 --no-banner --skip 10 "${filepath}"`);
      if (stdout) console.log("[fswebcam stdout]", stdout);
      if (stderr) console.error("[fswebcam stderr]", stderr);

      return filepath;
    } catch (error) {
      console.error("Failed to capture image:", error);
      throw error;
    }
  }
}
