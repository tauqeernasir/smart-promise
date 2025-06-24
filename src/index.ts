import { PromisePool } from "./pool";
import { PromiseFunction, SmartPromiseOptions } from "./types";

/**
 * SmartPromise - A Promise extension with concurrency control
 */
export class SmartPromise<T> {
  private static defaultConcurrency = Infinity;

  /**
   * Set the default concurrency limit for all SmartPromise operations
   */
  static setDefaultConcurrency(limit: number): void {
    SmartPromise.defaultConcurrency = limit;
  }

  /**
   * Execute promises with concurrency control, similar to Promise.all
   */
  static async all<T>(
    promises: (Promise<T> | PromiseFunction<T>)[],
    options: SmartPromiseOptions = {}
  ): Promise<T[]> {
    const tasks = SmartPromise.createPooledTasks(promises, options);

    return Promise.all(tasks);
  }

  /**
   * Execute promises with concurrency control, similar to Promise.allSettled
   */
  static async allSettled<T>(
    promises: (Promise<T> | PromiseFunction<T>)[],
    options: SmartPromiseOptions = {}
  ): Promise<PromiseSettledResult<T>[]> {
    const tasks = SmartPromise.createPooledTasks(promises, options);

    return Promise.allSettled(tasks);
  }

  /**
   * Create a resolved Promise - matches native Promise.resolve signature
   */
  static resolve(): Promise<void>;
  static resolve<T>(value: T): Promise<Awaited<T>>;
  static resolve<T>(value: T | PromiseLike<T>): Promise<Awaited<T>>;
  static resolve<T>(
    value?: T | PromiseLike<T>
  ): Promise<Awaited<T>> | Promise<void> {
    if (arguments.length === 0) {
      return Promise.resolve();
    }
    return Promise.resolve(value as T | PromiseLike<T>);
  }

  /**
   * Create a rejected Promise - matches native Promise.reject signature
   */
  static reject<T = never>(reason?: any): Promise<T> {
    return Promise.reject(reason);
  }

  /**
   * Execute promises sequentially with optional delay between executions
   */
  static async sequential<T>(
    promises: (Promise<T> | PromiseFunction<T>)[],
    options: SmartPromiseOptions & { delay?: number } = {}
  ): Promise<T[]> {
    const results: T[] = [];
    const { delay = 0 } = options;

    for (let i = 0; i < promises.length; i++) {
      const promiseOrFn = promises[i];
      const task =
        typeof promiseOrFn === "function" ? promiseOrFn : () => promiseOrFn;

      const result = await task();
      results.push(result);

      // Add delay between executions if specified
      if (delay > 0 && i < promises.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  private static createPooledTasks<T>(
    promises: (Promise<T> | PromiseFunction<T>)[],
    options: SmartPromiseOptions = {}
  ): Promise<T>[] {
    const concurrency = options.concurrency ?? SmartPromise.defaultConcurrency;
    const pool = new PromisePool(concurrency);

    return promises.map((promiseOrFn) => {
      const task =
        typeof promiseOrFn === "function" ? promiseOrFn : () => promiseOrFn;
      return pool.acquire(task);
    });
  }
}

export default SmartPromise;

export { PromisePool };
export type { PromiseFunction, SmartPromiseOptions };
