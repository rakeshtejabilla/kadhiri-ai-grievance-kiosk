import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { QueuedUpload, StorageProvider } from "./StorageProvider.js";

/**
 * Persists the pending-upload queue as a JSON file next to the recordings
 * themselves. Simple, dependency-free, and human-inspectable — appropriate
 * for a single-purpose kiosk that only ever has a handful of queued items.
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly queueFilePath: string;

  constructor(private readonly dataDir: string) {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    this.queueFilePath = path.join(dataDir, "upload-queue.json");
  }

  async enqueue(entry: QueuedUpload): Promise<void> {
    const queue = await this.readQueue();
    if (queue.some((q) => q.filePath === entry.filePath)) return;
    queue.push(entry);
    await this.writeQueue(queue);
  }

  async dequeue(filePath: string): Promise<void> {
    const queue = await this.readQueue();
    await this.writeQueue(queue.filter((q) => q.filePath !== filePath));
  }

  async listPending(): Promise<QueuedUpload[]> {
    return this.readQueue();
  }

  async recordAttempt(filePath: string): Promise<void> {
    const queue = await this.readQueue();
    const entry = queue.find((q) => q.filePath === filePath);
    if (entry) {
      entry.attempts += 1;
      await this.writeQueue(queue);
    }
  }

  private async readQueue(): Promise<QueuedUpload[]> {
    if (!existsSync(this.queueFilePath)) return [];
    try {
      const raw = await readFile(this.queueFilePath, "utf-8");
      return JSON.parse(raw) as QueuedUpload[];
    } catch {
      return [];
    }
  }

  private async writeQueue(queue: QueuedUpload[]): Promise<void> {
    await writeFile(this.queueFilePath, JSON.stringify(queue, null, 2), "utf-8");
  }
}
