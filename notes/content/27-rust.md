# Rust: Systems Programming, Memory Safety & Concurrency
A comprehensive systems engineering notebook on Rust memory management, ownership & borrowing, lifetimes, pattern matching, traits, and fearless concurrency without a garbage collector.

## Why Rust? Memory Safety without Garbage Collection
- **The Dilemma in C/C++:** Ultra-fast performance and direct hardware memory control, but fraught with memory bugs (use-after-free, double-free, buffer overflows, null pointer dereferences, data races). Over 70% of all high-severity security vulnerabilities at Microsoft and Google are memory safety bugs!
- **The Dilemma in Java/Go/Python:** Safe from dangling pointers, but relies on a **Garbage Collector (GC)** that causes unpredictable runtime pauses and consumes 2x–3x more RAM.
- **The Rust Solution:** Memory safety guaranteed at **compile time** using strict mathematical ownership rules with zero runtime overhead and zero garbage collection pauses.

## Ownership and Borrowing: The Core Mental Model
- **Non-Technical Real-Life Analogy (The Strict Public Library):**
  - **Ownership:** You buy a brand-new book. There is only one owner. If you give (move) it to your friend Alice, you no longer possess it. You cannot read it anymore unless Alice gives it back.
  - **Immutable Borrowing (`&T`):** Alice places the book on the library reference table. Any number of students (readers) can sit around and read the book at the same time. Nobody is allowed to write notes in the margins with a pen.
  - **Mutable Borrowing (`&mut T`):** The master book restorer takes the book into the private repair workshop. Exactly ONE restorer can edit the pages at a time. While the restorer is editing, NO ONE else is allowed to read or touch the book!
  - **The Golden Rule:** You can have *any number of immutable references (`&T`)* OR *exactly one mutable reference (`&mut T`)*, but NEVER both simultaneously!

@layers Ownership (Every value has one owner; dropped when out of scope) | Borrowing (&T read-only passes; &mut T exclusive edit pass) | Lifetimes ('a guarantees references never outlive their target) | Concurrency (Send & Sync prevent data races at compile time) :: The Rust Memory Safety Pillars

### Ownership & Borrowing in Action
```rust
fn main() {
    // 1. Move semantics (Heap allocation)
    let s1 = String::from("Distributed Systems");
    let s2 = s1; // Ownership MOVES to s2! s1 is invalidated here.
    // println!("{}", s1); // COMPILE ERROR: borrow of moved value: `s1`
    println!("s2: {}", s2);

    // 2. Immutable borrowing
    let len = calculate_length(&s2);
    println!("Length of '{}' is {}", s2, len);

    // 3. Mutable borrowing
    let mut greeting = String::from("Hello");
    append_world(&mut greeting);
    println!("Modified: {}", greeting);
}

fn calculate_length(s: &String) -> usize {
    s.len() // Borrowed read-only: does not deallocate heap memory when function exits
}

fn append_world(s: &mut String) {
    s.push_str(", World!"); // Exclusive mutable write access
}
```
- **Time Complexity:** $O(1)$ pointer passing.
- **Space Complexity:** $O(1)$ stack allocation; heap memory freed automatically with zero GC pause when owner leaves scope.

## Enums, Pattern Matching & Error Handling
- Rust completely eliminates `null` and `NullPointerException`!
```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}

fn divide(numerator: f64, denominator: f64) -> Result<f64, String> {
    if denominator == 0.0 {
        Err(String::from("Cannot divide by zero."))
    } else {
        Ok(numerator / denominator)
    }
}

fn main() {
    match divide(10.0, 2.0) {
        Ok(val) => println!("Result: {}", val),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

## Fearless Concurrency: Channels and `Arc<Mutex<T>>`
```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Thread-safe reference-counting pointer wrapped around a mutual exclusion lock
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter_clone = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter_clone.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final Counter: {}", *counter.lock().unwrap()); // Exactly 10
}
```
@flow [Arc::clone pointer increment] | [Spawn OS Thread] | [counter.lock() acquires MutexGuard] | [Mutate shared integer] | [Lock released automatically when MutexGuard drops] | (Guaranteed Zero Data Race Concurrency) :: Rust Thread Synchronization
