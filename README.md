# SmartPromise

A Promise extension with built-in concurrency control for JavaScript/TypeScript.

## Installation

```bash
npm install @tnr/smart-promise
# or
yarn add @tnr/smart-promise
```

## Features

- 🚀 **Drop-in replacement** for native Promise
- 🎛️ **Concurrency control** - limit simultaneous promise execution
- 🔄 **Automatic queuing** - pending promises wait for available slots
- 📦 **Multiple execution modes** - concurrent and sequential with delay
- 💪 **TypeScript support** - full type safety included
- 🪶 **Lightweight** - minimal overhead over native Promises

## Quick Start

```typescript
import SmartPromise from "@tnr/smart-promise";

// Limit concurrent database calls to 5
const users = await SmartPromise.all(
  userIds.map((id) => () => fetchUser(id)),
  { concurrency: 5 }
);

// Handle mixed success/failure with concurrency control
const results = await SmartPromise.allSettled(
  urls.map((url) => () => fetch(url)),
  { concurrency: 3 }
);

// Execute promises one by one
const ordered = await SmartPromise.sequential(
  tasks.map((task) => () => processTask(task))
);
```

## API

### SmartPromise.all(promises, options?)

Execute promises with concurrency control, similar to `Promise.all()`.

```typescript
const results = await SmartPromise.all(
  [task1, task2, task3, task4],
  { concurrency: 2 } // Max 2 concurrent
);
```

### SmartPromise.allSettled(promises, options?)

Execute promises with concurrency control, similar to `Promise.allSettled()`.

```typescript
const results = await SmartPromise.allSettled([task1, task2, task3], {
  concurrency: 2,
});
```

### SmartPromise.sequential(promises, options?)

Execute promises one by one in order.

```typescript
const results = await SmartPromise.sequential(
  [task1, task2, task3],
  { delay: 100 } // Optional delay between tasks
);
```

### SmartPromise.setDefaultConcurrency(limit)

Set default concurrency for all operations.

```typescript
SmartPromise.setDefaultConcurrency(5);

// Now all operations use concurrency: 5 by default
await SmartPromise.all(tasks);
```

## Promise Types

SmartPromise accepts both promise instances and promise factory functions:

```typescript
// Promise instances (start immediately)
const promises = [fetch("/api/1"), fetch("/api/2"), fetch("/api/3")];

// Promise factories (start when called)
const factories = [
  () => fetch("/api/1"),
  () => fetch("/api/2"),
  () => fetch("/api/3"),
];

// Both work with concurrency control
await SmartPromise.all(promises, { concurrency: 2 });
await SmartPromise.all(factories, { concurrency: 2 });
```

## Real-world Examples

### Database Operations

```typescript
// Batch process users without overwhelming the database
const users = await SmartPromise.all(
  userIds.map((id) => () => db.users.findById(id)),
  { concurrency: 10 }
);
```

### API Rate Limiting

```typescript
// Respect API rate limits
const responses = await SmartPromise.all(
  urls.map((url) => () => fetch(url)),
  { concurrency: 5 }
);
```

### File Processing

```typescript
// Process files without exhausting system resources
const processed = await SmartPromise.allSettled(
  files.map((file) => () => processFile(file)),
  { concurrency: 3 }
);
```

## License

MIT

## Contributing

Pull requests welcome! Please ensure tests pass with `yarn test`.
