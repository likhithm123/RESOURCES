# JavaScript, Node.js & React 18+: Full-Stack Architecture
An extensive engineering notebook on JavaScript V8 internals, the Event Loop, asynchronous runtime, Node.js libuv threadpool, React 18 Fiber reconciliation, hooks, and modern state management.

## JavaScript V8 Engine & The Event Loop
- **Single-Threaded Execution:** JavaScript has a single Call Stack. It can only execute one line of code at any given moment.
- **How Does Async Work?** Web APIs / Node.js C++ bindings execute heavy I/O operations (timers, network sockets, file reads) in background threads, and push callbacks to task queues.
- **Non-Technical Real-Life Analogy (The Busy Diner Short-Order Cook):**
  - **The Chef (Call Stack):** The chef is in the kitchen chopping onions and flipping burger patties. The chef never leaves the grill.
  - **The Assistant Prep Staff (Web APIs / libuv):** When a customer orders a slow-cooked soup that needs 20 minutes to simmer, the chef doesn't stand still watching the soup boil. The chef tells the prep staff: *"Keep this on the burner for 20 minutes, and when the timer rings, hand me the bowl."*
  - **The Ticket Rail (Macrotask Queue - `setTimeout`):** Once the timer rings, the prep staff places the ticket on the counter.
  - **The VIP Urgent Plate (Microtask Queue - `Promise.then` / `queueMicrotask`):** Microtasks have priority! Before the chef touches any regular ticket on the counter, the chef clears every VIP urgent plate!

@flow [Call Stack (Executes Synchronous JS)] | [Call Stack becomes completely empty] | [Process all Microtasks (Promise.then, MutationObserver)] | [Render Pipeline (DOM Layout & Paint)] | [Process ONE Macrotask (setTimeout, setInterval, I/O)] | (Repeat Loop at 60 FPS) :: The Browser Event Loop Execution Cycle

### Microtask vs Macrotask Execution Order
```javascript
console.log("1. Synchronous Start");

setTimeout(() => {
    console.log("4. Macrotask (setTimeout)");
}, 0);

Promise.resolve().then(() => {
    console.log("2. Microtask (Promise 1)");
}).then(() => {
    console.log("3. Microtask (Promise 2)");
});

console.log("5. Synchronous End");

// Output Order:
// 1. Synchronous Start
// 5. Synchronous End
// 2. Microtask (Promise 1)
// 3. Microtask (Promise 2)
// 4. Macrotask (setTimeout)
```

## Node.js Architecture: libuv & Streams
- **Node.js Internals:** Powered by Google V8 (compiles JS to machine code) + **libuv** (C library providing an asynchronous event loop and a default 4-thread pool for blocking file system operations and cryptographic hashing).
- **Streams:** Always process large files with Streams (`fs.createReadStream`) instead of `fs.readFile` to prevent out-of-memory crashes on large files.

## React 18+: Fiber Reconciler & Concurrent Features
- **Virtual DOM vs Fiber Tree:** React maintains an in-memory tree of Fiber nodes. The Fiber architecture allows React to pause, resume, and prioritize UI render work (e.g., keeping typing inputs responsive while rendering a heavy chart in the background using `useTransition`).

### Custom Hook & Performance Optimization Pattern
```tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Custom Hook for Debounced Search Input
export function useDebounce<T>(value: T, delayMs: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);

        // Cleanup: cancels prior timeout if user types before delay finishes
        return () => clearTimeout(handler);
    }, [value, delayMs]);

    return debouncedValue;
}

// React Component demonstrating memoization
export const SearchDashboard = React.memo(({ items }: { items: string[] }) => {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300);

    // useMemo prevents expensive re-filtering unless debouncedQuery or items change
    const filteredResults = useMemo(() => {
        return items.filter(item => item.toLowerCase().includes(debouncedQuery.toLowerCase()));
    }, [debouncedQuery, items]);

    return (
        <div>
            <input 
                type="text" 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                placeholder="Search catalog..." 
            />
            <p>Matching items: {filteredResults.length}</p>
        </div>
    );
});
```
- **Time Complexity:** Debounce reduces API calls from $O(K)$ per keystroke to $O(1)$ after typing pauses.
- **Space Complexity:** $O(N)$ memory for filtered item arrays.
