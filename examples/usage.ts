import SmartPromise from "../src/index";

const fetchFromDb = (id: number): Promise<{ id: number; data: string }> => {
  return new Promise((resolve) => {
    // Simulate database fetch with random delay
    console.log("fetching from db", id);
    const delay = Math.random() * 1000 + 500;
    setTimeout(() => {
      resolve({ id, data: `User data for ${id}` });
    }, delay);
  });
};

const fetchBook = (id: number): Promise<{ id: number; title: string }> => {
  return new Promise((resolve, reject) => {
    console.log("fetching book", id);
    const delay = Math.random() * 800 + 200;
    setTimeout(() => {
      // Simulate occasional failures
      if (Math.random() > 0.9) {
        reject(new Error(`Failed to fetch book ${id}`));
      } else {
        resolve({ id, title: `Book Title ${id}` });
      }
    }, delay);
  });
};

async function examples() {
  console.log("=== SmartPromise Examples ===\n");

  // Example 1: Using SmartPromise.all with concurrency limit
  console.log("1. Fetching users with concurrency limit of 3:");
  const userIds = Array.from({ length: 10 }, (_, i) => i + 1);

  const startTime = Date.now();
  const users = await SmartPromise.all(
    userIds.map((id) => () => fetchFromDb(id)),
    { concurrency: 3 }
  );
  const endTime = Date.now();

  console.log(`Fetched ${users.length} users in ${endTime - startTime}ms`);
  console.log("users", users);
  console.log();

  // Example 2: Using SmartPromise.allSettled with error handling
  console.log("2. Fetching books with allSettled (some may fail):");
  const bookIds = Array.from({ length: 8 }, (_, i) => i + 1);

  const bookResults = await SmartPromise.allSettled(
    bookIds.map((id) => () => fetchBook(id)),
    { concurrency: 2 }
  );

  const successfulBooks = bookResults
    .filter(
      (
        result
      ): result is PromiseFulfilledResult<{ id: number; title: string }> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);

  const failedBooks = bookResults.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  ).length;

  console.log(
    `Successfully fetched ${successfulBooks.length} books, ${failedBooks} failed`
  );
  console.log("Successful books:", successfulBooks);
  console.log();

  // Example 3: Sequential execution
  console.log("3. Sequential execution with delay:");
  const sequentialStart = Date.now();
  const sequentialResults = await SmartPromise.sequential(
    Array.from({ length: 5 }, (_, i) => () => fetchFromDb(i + 1)),
    { delay: 100 }
  );
  const sequentialEnd = Date.now();
  console.log(`Sequential execution took ${sequentialEnd - sequentialStart}ms`);
  console.log("sequentialResults", sequentialResults);
}

examples().catch(console.error);
