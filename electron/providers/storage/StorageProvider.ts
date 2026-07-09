export interface QueuedUpload {
  filePath: string;
  machineId: string;
  timestamp: string;
  location: string;
  attempts: number;
}

/**
 * Hardware/OS abstraction for durable local persistence: keeping recorded
 * .wav files around and tracking which ones still need to be uploaded, so
 * that a network outage or power loss never loses a citizen's complaint.
 */
export interface StorageProvider {
  /** Add a recording that failed to upload (or hasn't been attempted yet) to the retry queue. */
  enqueue(entry: QueuedUpload): Promise<void>;
  /** Remove an entry once it has uploaded successfully. */
  dequeue(filePath: string): Promise<void>;
  /** All entries currently awaiting upload, oldest first. */
  listPending(): Promise<QueuedUpload[]>;
  /** Increment the retry counter for an entry after a failed attempt. */
  recordAttempt(filePath: string): Promise<void>;
}
