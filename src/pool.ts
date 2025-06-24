import { PromiseFunction } from "./types";

/**
 * A pool manager that controls the concurrency of promise execution
 */
export class PromisePool {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private limit: number = Infinity) {}

  async acquire<T>(task: PromiseFunction<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = async () => {
        this.running++;
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.release();
        }
      };

      if (this.running < this.limit) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }

  private release(): void {
    this.running--;
    if (this.queue.length > 0 && this.running < this.limit) {
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }
}
