export type SmartPromiseOptions = {
  concurrency?: number;
};

export type PromiseFunction<T> = () => Promise<T>;
