/**
 * In-process async job queue for guide generation.
 * Extension point: replace with BullMQ + Redis for production scale.
 */

type JobFn = () => Promise<void>;

interface Job {
  id: string;
  fn: JobFn;
}

class SimpleQueue {
  private queue: Job[] = [];
  private running = false;

  enqueue(id: string, fn: JobFn): void {
    this.queue.push({ id, fn });
    this.drain();
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;
      try {
        await job.fn();
      } catch {
        // Errors are handled inside the job (guide status → failed)
      }
    }

    this.running = false;
  }
}

export const guideQueue = new SimpleQueue();
