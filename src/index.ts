import { PromisePool } from "./pool";
import {
  PromiseFunction,
  SmartPromiseOptions,
  ExtractPromiseType,
} from "./types";

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
   * Follows native Promise.all() typing pattern
   */
  static async all<T extends readonly unknown[] | []>(
    values: T,
    options: SmartPromiseOptions = {}
  ): Promise<{ -readonly [P in keyof T]: Awaited<ExtractPromiseType<T[P]>> }> {
    const tasks = SmartPromise.createPooledTasks(values, options);
    return Promise.all(tasks) as any;
  }

  /**
   * Execute promises with concurrency control, similar to Promise.allSettled
   * Follows native Promise.allSettled() typing pattern
   */
  static async allSettled<T extends readonly unknown[] | []>(
    values: T,
    options: SmartPromiseOptions = {}
  ): Promise<{
    -readonly [P in keyof T]: PromiseSettledResult<
      Awaited<ExtractPromiseType<T[P]>>
    >;
  }> {
    const tasks = SmartPromise.createPooledTasks(values, options);
    return Promise.allSettled(tasks) as any;
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
   * Follows the same typing pattern as all() for heterogeneous support
   */
  static async sequential<T extends readonly unknown[] | []>(
    values: T,
    options: SmartPromiseOptions & { delay?: number } = {}
  ): Promise<{ -readonly [P in keyof T]: Awaited<ExtractPromiseType<T[P]>> }> {
    const results: any[] = [];
    const { delay = 0 } = options;

    for (let i = 0; i < values.length; i++) {
      const promiseOrFn = (values as any[])[i];
      const task =
        typeof promiseOrFn === "function" ? promiseOrFn : () => promiseOrFn;

      const result = await task();
      results.push(result);

      // Add delay between executions if specified
      if (delay > 0 && i < values.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return results as any;
  }

  private static createPooledTasks<T extends readonly unknown[] | []>(
    values: T,
    options: SmartPromiseOptions = {}
  ): Promise<unknown>[] {
    const concurrency = options.concurrency ?? SmartPromise.defaultConcurrency;
    const pool = new PromisePool(concurrency);

    return (values as any[]).map((promiseOrFn: any) => {
      const task =
        typeof promiseOrFn === "function" ? promiseOrFn : () => promiseOrFn;
      return pool.acquire(task);
    });
  }
}

export default SmartPromise;

export { PromisePool };
export type { PromiseFunction, SmartPromiseOptions };
