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
      // Use rpicam-jpeg to capture a frame (for newer Bookworm OS). 
      // Fallback to libcamera-jpeg (for Bullseye).
      // --immediate captures as quickly as possible without warmup.
      try {
        await execAsync(`rpicam-jpeg --immediate -o "${filepath}" --width 1920 --height 1080`);
      } catch (e) {
        await execAsync(`libcamera-jpeg --immediate -o "${filepath}" --width 1920 --height 1080`);
      }
      return filepath;
    } catch (error) {
      console.error("Failed to capture image:", error);
      throw error;
    }
  }
}
