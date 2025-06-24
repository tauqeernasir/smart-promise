import { beforeEach, describe, expect, it } from "vitest";
import { SmartPromise } from "./index";
import { PromisePool } from "./pool";

describe("SmartPromise", () => {
  beforeEach(() => {
    // Reset default concurrency before each test
    SmartPromise.setDefaultConcurrency(Infinity);
  });

  describe("Static methods", () => {
    it("should resolve with SmartPromise.resolve", async () => {
      const result = await SmartPromise.resolve("test");
      expect(result).toBe("test");
    });

    it("should reject with SmartPromise.reject", async () => {
      await expect(SmartPromise.reject("error")).rejects.toBe("error");
    });

    it("should set default concurrency", () => {
      SmartPromise.setDefaultConcurrency(5);
      expect(SmartPromise["defaultConcurrency"]).toBe(5);
    });
  });

  describe("Concurrency control", () => {
    it("should respect concurrency limit", async () => {
      const executionOrder: number[] = [];
      const runningCount: number[] = [];
      let currentRunning = 0;

      const createTask = (id: number) => async () => {
        currentRunning++;
        runningCount.push(currentRunning);
        executionOrder.push(id);

        // Simulate work
        await new Promise((resolve) => setTimeout(resolve, 50));

        currentRunning--;
        return id;
      };

      const tasks = Array.from({ length: 5 }, (_, i) => createTask(i));

      const startTime = Date.now();
      const results = await SmartPromise.all(tasks, { concurrency: 2 });
      const endTime = Date.now();

      expect(results).toEqual([0, 1, 2, 3, 4]);
      expect(Math.max(...runningCount)).toBe(2); // Max concurrent should be 2
      expect(endTime - startTime).toBeGreaterThan(100); // Should take time due to concurrency limit
    });

    it("should handle promise instances and functions", async () => {
      const promise1 = Promise.resolve("direct");
      const promise2 = () => Promise.resolve("function");

      const results = await SmartPromise.all([promise1, promise2], {
        concurrency: 1,
      });
      expect(results).toEqual(["direct", "function"]);
    });

    it("should work with default concurrency", async () => {
      SmartPromise.setDefaultConcurrency(1);

      const executionOrder: number[] = [];
      const createTask = (id: number) => async () => {
        executionOrder.push(id);
        await new Promise((resolve) => setTimeout(resolve, 10));
        return id;
      };

      const tasks = Array.from({ length: 3 }, (_, i) => createTask(i));
      const results = await SmartPromise.all(tasks);

      expect(results).toEqual([0, 1, 2]);
      expect(executionOrder).toEqual([0, 1, 2]); // Should execute sequentially
    });
  });

  describe("allSettled", () => {
    it("should handle mixed success and failure", async () => {
      const tasks = [
        () => Promise.resolve("success"),
        () => Promise.reject("error"),
        () => Promise.resolve("another success"),
      ];

      const results = await SmartPromise.allSettled(tasks, { concurrency: 2 });

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ status: "fulfilled", value: "success" });
      expect(results[1]).toEqual({ status: "rejected", reason: "error" });
      expect(results[2]).toEqual({
        status: "fulfilled",
        value: "another success",
      });
    });
  });

  describe("sequential", () => {
    it("should execute tasks sequentially", async () => {
      const executionOrder: number[] = [];
      const createTask = (id: number) => async () => {
        executionOrder.push(id);
        await new Promise((resolve) => setTimeout(resolve, 10));
        return id;
      };

      const tasks = Array.from({ length: 3 }, (_, i) => createTask(i));
      const results = await SmartPromise.sequential(tasks);

      expect(results).toEqual([0, 1, 2]);
      expect(executionOrder).toEqual([0, 1, 2]);
    });

    it("should respect delay option", async () => {
      const startTimes: number[] = [];
      const createTask = (id: number) => async () => {
        startTimes.push(Date.now());
        return id;
      };

      const tasks = Array.from({ length: 3 }, (_, i) => createTask(i));
      await SmartPromise.sequential(tasks, { delay: 50 });

      expect(startTimes).toHaveLength(3);
      expect(startTimes[1] - startTimes[0]).toBeGreaterThan(40); // Should have delay
      expect(startTimes[2] - startTimes[1]).toBeGreaterThan(40);
    });
  });

  describe("Error handling", () => {
    it("should propagate errors in all", async () => {
      const tasks = [
        () => Promise.resolve("success"),
        () => Promise.reject("error"),
        () => Promise.resolve("another success"),
      ];

      await expect(SmartPromise.all(tasks, { concurrency: 2 })).rejects.toBe(
        "error"
      );
    });

    it("should handle empty array", async () => {
      const results = await SmartPromise.all([], { concurrency: 5 });
      expect(results).toEqual([]);
    });
  });

  describe("PromisePool", () => {
    it("should manage concurrency correctly", async () => {
      const pool = new PromisePool(2);
      const runningCount: number[] = [];
      let currentRunning = 0;

      const createTask = (id: number) => async () => {
        currentRunning++;
        runningCount.push(currentRunning);
        await new Promise((resolve) => setTimeout(resolve, 50));
        currentRunning--;
        return id;
      };

      const tasks = Array.from({ length: 4 }, (_, i) => createTask(i));
      const promises = tasks.map((task) => pool.acquire(task));

      const results = await Promise.all(promises);

      expect(results).toEqual([0, 1, 2, 3]);
      expect(Math.max(...runningCount)).toBe(2);
    });
  });
});
