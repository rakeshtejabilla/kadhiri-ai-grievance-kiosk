export interface UploadMetadata {
  machineId: string;
  timestamp: string;
  location: string;
}

export interface UploadResult {
  uploadedAt: string;
}

export type UploadProgressListener = (percent: number) => void;

/**
 * Hardware/network abstraction for delivering a recorded complaint to the
 * grievance backend. Concrete implementations decide *how* the bytes get
 * there (HTTP multipart today, could be an offline queue/relay later) but
 * the caller only ever sees this interface.
 */
export interface UploaderProvider {
  upload(
    filePath: string,
    metadata: UploadMetadata,
    onProgress?: UploadProgressListener,
  ): Promise<UploadResult>;
}
