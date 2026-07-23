import path from "node:path";
import { app, type BrowserWindow } from "electron";
import type { KioskConfig } from "../shared/ipc-contract.js";
import type { MotionSensorProvider } from "./motion/MotionSensorProvider.js";
import { MockMotionSensorProvider } from "./motion/MockMotionSensorProvider.js";
import { GpioMotionSensorProvider } from "./motion/GpioMotionSensorProvider.js";
import type { AudioRecorderProvider } from "./audio/AudioRecorderProvider.js";
import { RendererAudioRecorderProvider } from "./audio/RendererAudioRecorderProvider.js";
import type { UploaderProvider } from "./network/UploaderProvider.js";
import { MockUploaderProvider } from "./network/MockUploaderProvider.js";
import { HttpUploaderProvider } from "./network/HttpUploaderProvider.js";
import type { StorageProvider } from "./storage/StorageProvider.js";
import { LocalStorageProvider } from "./storage/LocalStorageProvider.js";
import type { CameraProvider } from "./camera/CameraProvider.js";
import { MockCameraProvider } from "./camera/MockCameraProvider.js";
import { PiCameraProvider } from "./camera/PiCameraProvider.js";

export interface KioskProviders {
  motion: MotionSensorProvider;
  audio: AudioRecorderProvider;
  uploader: UploaderProvider;
  storage: StorageProvider;
  camera: CameraProvider;
}

/**
 * The ONLY file that should ever need editing to move from a development
 * laptop to Raspberry Pi 5 hardware. Everything above this layer (main
 * process orchestration, IPC, and 100% of the React UI) depends solely on
 * the provider interfaces and never imports a concrete class directly.
 *
 * To go to production on a Pi:
 *   1. Implement GpioMotionSensorProvider (see its file for a worked example).
 *   2. Set config.mockHardware = false in config.json.
 *   3. Swap the `motion` line below to `new GpioMotionSensorProvider(config.gpioPin)`.
 * The audio, uploader, and storage providers already talk to real hardware/
 * network/disk and do not need to change for Pi deployment.
 */
export function createProviders(config: KioskConfig, window: BrowserWindow): KioskProviders {
  const userDataDir = app.getPath("userData");
  const recordingsDir = path.join(userDataDir, "recordings");

  // In production (mockHardware: false) use the real PIR GPIO sensor.
  // In development (mockHardware: true) use keyboard shortcuts (Ctrl+M / F9, Ctrl+N / F10).
  // GpioMotionSensorProvider also registers the keyboard shortcuts so engineers
  // can manually trigger the workflow on the Pi without waving at the sensor.
  const motion: MotionSensorProvider = config.mockHardware
    ? new MockMotionSensorProvider()
    : new GpioMotionSensorProvider(config.gpioTriggerPin ?? 17, config.gpioEchoPin ?? 27);

  // RendererAudioRecorderProvider uses the browser's MediaRecorder API.
  // Works natively on Windows, macOS and Linux without any CLI tools.
  const audio: AudioRecorderProvider = new RendererAudioRecorderProvider(window, recordingsDir);

  const uploader: UploaderProvider = config.mockHardware
    ? new MockUploaderProvider()
    : new HttpUploaderProvider(config.serverUrl);

  const storage: StorageProvider = new LocalStorageProvider(userDataDir);

  const camera: CameraProvider = config.mockHardware
    ? new MockCameraProvider()
    : new PiCameraProvider();

  return { motion, audio, uploader, storage, camera };
}
