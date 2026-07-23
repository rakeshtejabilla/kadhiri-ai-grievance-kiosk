export interface CameraProvider {
  /**
   * Captures an image and saves it to a temporary file.
   * @returns The absolute path to the captured image file (JPEG).
   */
  captureImage(): Promise<string>;
}
