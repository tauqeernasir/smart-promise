export type SmartPromiseOptions = {
  concurrency?: number;
};

export type PromiseFunction<T> = () => Promise<T>;

// Helper type to extract the resolved type from Promise<T> or PromiseFunction<T>
export type ExtractPromiseType<T> = T extends PromiseFunction<infer U>
  ? U
  : T extends Promise<infer U>
  ? U
  : never;
