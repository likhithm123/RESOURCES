# Operating Systems - Basics to Advanced with Algorithms
This notebook explains how an operating system works in simple words, then goes deep into every topic asked in exams and interviews: processes, threads, CPU scheduling (all algorithms with worked examples and code), synchronization (mutex, semaphores, classic problems), deadlocks (Banker's algorithm), memory management (paging, segmentation, virtual memory, page replacement algorithms), file systems, disk scheduling, I/O, and Linux internals. Every algorithm has a solved example and working code.
## What is an Operating System
- An **operating system (OS)** is the software layer between the user / applications and the hardware. It manages the CPU, memory, storage and devices, and gives programs a simple, safe way to use them.
- Analogy: a hotel manager. Guests (programs) never go into the kitchen or the electrical room themselves; they ask the manager, who shares rooms (memory), staff time (CPU) and facilities (devices) fairly and safely.
@layers User | Applications (browser, games, compilers) | System calls (the OS API) | Kernel: process, memory, file, device, network management | Hardware: CPU, RAM, disk, network card :: Where the OS sits
| Function | What it means |
|---|---|
| Process management | create, schedule and end programs; let them communicate |
| Memory management | give each program memory, protect programs from each other, virtual memory |
| File management | files and folders on disks, permissions |
| Device (I/O) management | drivers, buffering, interrupts |
| Security and protection | users, permissions, isolation |
| Networking | TCP/IP stack, sockets |
| User interface | shell (command line) or GUI |
| Resource allocation and accounting | fair sharing, limits, statistics |
### Types of operating systems
| Type | Idea | Example |
|---|---|---|
| Batch | jobs collected and run one after another without interaction | old mainframes, payroll runs |
| Multiprogramming | several programs in memory; CPU switches when one waits for I/O | keeps the CPU busy |
| Multitasking / time-sharing | CPU time is sliced so many users / programs feel they run at once | Linux, Windows, macOS |
| Multiprocessing | more than one CPU / core | every modern PC and phone |
| Real-time (RTOS) | must respond within strict deadlines (hard / soft) | car airbags, pacemakers, FreeRTOS |
| Distributed | many computers appear as one system | cluster OS, cloud |
| Network OS | shares files and printers over a network | Windows Server |
| Mobile / embedded | power-efficient, touch, small devices | Android, iOS, embedded Linux |
### Kernel, shell and system calls
- **Kernel**: the core that runs in privileged **kernel mode** with full hardware access. **User mode**: normal programs run with restrictions; to do anything privileged they make a **system call**.
- **System call**: a controlled entry into the kernel (open a file, create a process, send data). The CPU switches mode (trap), the kernel does the work, returns the result.
@chain Program calls printf -> C library calls write() -> trap into kernel mode -> kernel writes to the terminal device -> return to user mode :: A system call
| Category | Linux system calls |
|---|---|
| Process | fork, exec, exit, wait, getpid, kill |
| File | open, read, write, close, lseek, stat |
| Memory | mmap, brk, munmap |
| Device | ioctl, read, write |
| Communication | pipe, socket, shmget, msgsnd |
| Information | time, uname, getuid |
| Kernel type | Idea | Example |
|---|---|---|
| Monolithic | all OS services in one big kernel: fast, but a bug can crash everything | Linux (with loadable modules) |
| Microkernel | only the minimum in the kernel; drivers and file systems run as user processes: safer, slower (messages) | Minix, QNX, seL4 |
| Hybrid | mix of both | Windows NT, macOS XNU |
| Exokernel / unikernel | minimal kernel, app links its own OS library | research, specialised cloud |
### Booting a computer
@flow (Power on) | Firmware (BIOS / UEFI) runs power-on self test | Finds the boot device and loads the bootloader (GRUB) | Bootloader loads the kernel into memory | Kernel initialises hardware, memory, drivers, mounts the root file system | (Starts the first process: init / systemd, which starts services and the login screen) :: Boot sequence
## Processes
### Program vs process
- A **program** is a passive file on disk (instructions). A **process** is a program **in execution**: it has its own memory, CPU state, open files. Opening Chrome twice creates two processes from one program.
@layers Stack (local variables, function calls - grows down) | Heap (dynamic memory: malloc / new - grows up) | Data (global and static variables) | Text / code (machine instructions) :: Memory layout of a process
### Process states
@chain New -> Ready -> Running -> Waiting (for I/O) -> Ready -> Running -> Terminated :: Process life cycle
| State | Meaning |
|---|---|
| New | being created |
| Ready | waiting for the CPU |
| Running | instructions executing on a CPU |
| Waiting / blocked | waiting for an event (disk read, keyboard, lock) |
| Terminated | finished; parent collects the exit status |
| Suspended (ready / blocked) | swapped out to disk to free memory |
- Transitions: Ready -> Running (scheduler **dispatch**), Running -> Ready (time slice over / preempted), Running -> Waiting (I/O request), Waiting -> Ready (I/O done), Running -> Terminated (exit).
### Process Control Block (PCB)
- The OS keeps a **PCB** for every process: process id (PID), state, program counter, CPU registers, scheduling info (priority), memory info (page table), open files list, parent / children, accounting (CPU time used).
### Context switch
- Switching the CPU from one process to another: save the running process's registers into its PCB, load the next one's. It is pure overhead (no useful work), typically a few microseconds, and also flushes caches / TLB entries.
@chain Process A running -> interrupt / system call -> save A's state in PCB-A -> scheduler picks B -> load PCB-B -> Process B running :: Context switch
### Schedulers and queues
| Scheduler | Decides | Runs |
|---|---|---|
| Long-term (job) | which jobs enter memory (degree of multiprogramming) | rarely |
| Short-term (CPU) | which ready process gets the CPU next | very often (milliseconds) |
| Medium-term | which processes to swap out / in | occasionally |
- **Dispatcher**: gives the CPU to the chosen process (context switch, switch to user mode, jump). Time taken = **dispatch latency**.
- Queues: job queue, **ready queue**, device (I/O) queues.
### Creating processes: fork and exec
- `fork()` creates a child that is an almost exact copy of the parent (copy-on-write memory). It returns 0 in the child and the child's PID in the parent. `exec()` replaces the current program with a new one. The shell runs a command using fork + exec + wait.
```c
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>
int main() {
    pid_t pid = fork();                       // one process becomes two
    if (pid == 0) {                           // child
        printf("child %d running ls\n", getpid());
        execlp("ls", "ls", "-l", NULL);       // replace the child with the ls program
        perror("exec failed");
    } else {                                  // parent
        int status;
        waitpid(pid, &status, 0);             // wait for the child to finish
        printf("child finished with %d\n", WEXITSTATUS(status));
    }
    return 0;
}
```
Q: How many times is "hi" printed? `fork(); fork(); fork(); printf("hi");`
A: 8. Each fork doubles the processes: 2^3 = 8.
- **Zombie process**: finished, but the parent has not called wait(), so its PCB entry remains. **Orphan process**: the parent died first; init / systemd adopts it.
- **Daemon**: a background service process with no terminal (sshd, cron).
### Inter-Process Communication (IPC)
| Method | How | Notes |
|---|---|---|
| Pipe | one-way byte stream between related processes (ls pipe grep) | simple |
| Named pipe (FIFO) | pipe with a name in the file system | unrelated processes |
| Message queue | kernel keeps a queue of messages | structured messages |
| Shared memory | both processes map the same memory | fastest; needs synchronization |
| Semaphores | counters for coordination | sync, not data |
| Sockets | communication over the network or locally | client-server, different machines |
| Signals | small notifications (SIGINT, SIGKILL) | asynchronous |
| Memory-mapped files | map a file into memory | sharing big data |
@chain Producer process -> write into shared memory region <- Consumer process reads (protected by a semaphore) :: Shared memory IPC
## Threads
- A **thread** is the smallest unit of execution inside a process. Threads of one process **share** its code, data, heap and open files, but each has its own **stack, registers and program counter**.
- Analogy: a process is a house; threads are people living in it - they share the kitchen and rooms (memory) but each has their own to-do list (stack).
@layers Process: code, data, heap, open files (shared) | Thread 1: stack + registers + PC, Thread 2: stack + registers + PC, Thread 3: stack + registers + PC :: Threads inside one process
| Process | Thread |
|---|---|
| heavyweight, own address space | lightweight, shares the process's memory |
| creation and context switch are slow | creation and switch are fast |
| isolated: one crashing does not affect others | one thread crashing can kill the whole process |
| communicate through IPC | communicate through shared variables (need locks) |
- Benefits: responsiveness (UI thread + worker threads), resource sharing, economy, use of multiple cores.
- **User-level threads** are managed by a library (fast, but one blocking call can block all); **kernel-level threads** are scheduled by the OS.
| Multithreading model | Mapping | Note |
|---|---|---|
| Many-to-one | many user threads -> one kernel thread | no parallelism |
| One-to-one | each user thread -> its own kernel thread | Linux, Windows (most common) |
| Many-to-many | many user -> many kernel threads | flexible (Go goroutines, Java virtual threads behave similarly) |
```c
#include <pthread.h>
#include <stdio.h>
void* work(void* arg) { printf("thread %ld\n", (long)arg); return NULL; }
int main() {
    pthread_t t[4];
    for (long i = 0; i < 4; i++) pthread_create(&t[i], NULL, work, (void*)i);
    for (int i = 0; i < 4; i++) pthread_join(t[i], NULL);    // wait for all threads
}
```
- **Concurrency** = several tasks make progress in overlapping time (even on one core, by switching). **Parallelism** = tasks literally run at the same instant on different cores.
## CPU Scheduling
### Terms you must know
| Term | Meaning |
|---|---|
| Arrival time (AT) | when the process enters the ready queue |
| Burst time (BT) | CPU time it needs |
| Completion time (CT) | when it finishes |
| Turnaround time (TAT) | CT - AT (total time in the system) |
| Waiting time (WT) | TAT - BT (time spent waiting in the ready queue) |
| Response time (RT) | first time it gets the CPU - AT |
| Throughput | processes finished per unit time |
| CPU utilisation | % of time the CPU is busy |
| Preemptive | the OS can take the CPU away from a running process |
| Non-preemptive | a process keeps the CPU until it finishes or blocks |
- Goals: maximise CPU utilisation and throughput; minimise turnaround, waiting and response time; be fair; avoid starvation.
### Example data used for all algorithms
| Process | Arrival | Burst | Priority (lower = higher) |
|---|---|---|---|
| P1 | 0 | 5 | 3 |
| P2 | 1 | 3 | 1 |
| P3 | 2 | 8 | 4 |
| P4 | 3 | 6 | 2 |
### 1. First Come First Served (FCFS)
- Non-preemptive. The process that arrives first runs first, like a queue at a ticket counter.
@cells P1:0-5 P2:5-8 P3:8-16 P4:16-22 :: FCFS Gantt chart
| Process | CT | TAT = CT - AT | WT = TAT - BT |
|---|---|---|---|
| P1 | 5 | 5 | 0 |
| P2 | 8 | 7 | 4 |
| P3 | 16 | 14 | 6 |
| P4 | 22 | 19 | 13 |
- Average WT = (0 + 4 + 6 + 13) / 4 = **5.75**. Simple, no starvation, but suffers the **convoy effect**: short jobs wait behind a long one.
### 2. Shortest Job First (SJF, non-preemptive)
- When the CPU is free, pick the ready process with the smallest burst. **Optimal** average waiting time among non-preemptive algorithms, but needs to know burst times and can **starve** long jobs.
- At 0 only P1 -> runs 0-5. At 5 ready: P2 (3), P3 (8), P4 (6) -> P2 5-8, then P4 8-14, then P3 14-22.
@cells P1:0-5 P2:5-8 P4:8-14 P3:14-22 :: SJF Gantt chart
| Process | CT | TAT | WT |
|---|---|---|---|
| P1 | 5 | 5 | 0 |
| P2 | 8 | 7 | 4 |
| P3 | 22 | 20 | 12 |
| P4 | 14 | 11 | 5 |
- Average WT = (0 + 4 + 12 + 5) / 4 = **5.25**.
### 3. Shortest Remaining Time First (SRTF, preemptive SJF)
- Whenever a new process arrives, run the one with the **least remaining** time (may preempt the current one).
- 0: P1 (rem 5). 1: P2 arrives (3) < P1 rem 4 -> preempt, P2 runs 1-4. 4: ready P1 (4), P3 (8), P4 (6) -> P1 4-8. Then P4 8-14, P3 14-22.
@cells P1:0-1 P2:1-4 P1:4-8 P4:8-14 P3:14-22 :: SRTF Gantt chart
| Process | CT | TAT | WT |
|---|---|---|---|
| P1 | 8 | 8 | 3 |
| P2 | 4 | 3 | 0 |
| P3 | 22 | 20 | 12 |
| P4 | 14 | 11 | 5 |
- Average WT = (3 + 0 + 12 + 5) / 4 = **5.0** (best of all here).
### 4. Priority scheduling
- Run the highest-priority process (here lower number = higher priority). Preemptive or non-preemptive.
- Non-preemptive: P1 0-5 (only one at 0). At 5: P2 (1), P4 (2), P3 (4) -> P2 5-8, P4 8-14, P3 14-22.
- Problem: **starvation** of low-priority processes. Solution: **aging** - slowly increase the priority of processes that wait long.
### 5. Round Robin (RR)
- Each process gets a fixed **time quantum** (say 2); if not finished it goes to the back of the ready queue. Preemptive, fair, great **response time**; used in time-sharing systems.
- Quantum = 2. Queue evolves: P1 0-2, P2 2-4, P3 4-6, P1 6-8, P4 8-10, P2 10-11 (done), P3 11-13, P1 13-14 (done), P4 14-16, P3 16-18, P4 18-20 (done), P3 20-22 (done).
@cells P1 P2 P3 P1 P4 P2 P3 P1 P4 P3 P4 P3 :: RR Gantt chart, quantum 2 (time 0, 2, 4, 6, 8, 10, 11, 13, 14, 16, 18, 20, 22)
| Process | CT | TAT | WT |
|---|---|---|---|
| P1 | 14 | 14 | 9 |
| P2 | 11 | 10 | 7 |
| P3 | 22 | 20 | 12 |
| P4 | 20 | 17 | 11 |
- Average WT = (9 + 7 + 12 + 11) / 4 = **9.75**: worse waiting time but every process responds quickly.
- Quantum too large -> becomes FCFS. Too small -> too many context switches. Rule of thumb: 80% of bursts should finish within one quantum.
### 6. Multilevel Queue and Multilevel Feedback Queue (MLFQ)
- **Multilevel queue**: separate queues by type (system, interactive, batch), each with its own algorithm; higher queues have priority.
- **MLFQ**: processes **move between queues**. New processes start at the top (small quantum); if they use the full quantum they drop to a lower queue (bigger quantum); waiting too long promotes them (aging). Interactive jobs stay high, CPU-heavy jobs sink. Used by real OSes.
@layers Queue 0: RR quantum 8 ms (highest priority) | Queue 1: RR quantum 16 ms | Queue 2: FCFS (lowest priority) :: Multilevel feedback queue
### 7. Other algorithms
| Algorithm | Idea |
|---|---|
| Highest Response Ratio Next (HRRN) | pick max (waiting + burst) / burst: favours short jobs but prevents starvation |
| Longest Job First / LRTF | opposite of SJF (rare, for exams) |
| Lottery / stride scheduling | proportional share by tickets |
| Completely Fair Scheduler (Linux CFS) | each task gets a fair share; red-black tree ordered by virtual runtime; picks the leftmost (least run) task. Replaced by EEVDF in Linux 6.6 |
| Real-time: Rate Monotonic, Earliest Deadline First | fixed priority by period / pick the nearest deadline |
### Code: FCFS, SJF and Round Robin calculators
```py
from collections import deque
procs = [("P1", 0, 5), ("P2", 1, 3), ("P3", 2, 8), ("P4", 3, 6)]       # (name, arrival, burst)

def report(done):                                     # done: name -> completion time
    tw = 0
    for n, at, bt in procs:
        tat = done[n] - at; wt = tat - bt; tw += wt
        print(f"{n}: CT={done[n]} TAT={tat} WT={wt}")
    print("average WT =", tw / len(procs))

def fcfs():
    t, done = 0, {}
    for n, at, bt in sorted(procs, key=lambda p: p[1]):
        t = max(t, at) + bt; done[n] = t
    report(done)

def sjf():                                            # non-preemptive
    t, done, left = 0, {}, list(procs)
    while left:
        ready = [p for p in left if p[1] <= t] or [min(left, key=lambda p: p[1])]
        n, at, bt = min(ready, key=lambda p: (p[2], p[1]))
        t = max(t, at) + bt; done[n] = t; left.remove((n, at, bt))
    report(done)

def round_robin(q):
    t, done, rem, i = 0, {}, {n: bt for n, _, bt in procs}, 0
    order = sorted(procs, key=lambda p: p[1]); queue = deque()
    while len(done) < len(procs):
        while i < len(order) and order[i][1] <= t: queue.append(order[i][0]); i += 1
        if not queue: t = order[i][1]; continue
        n = queue.popleft(); run = min(q, rem[n]); t += run; rem[n] -= run
        while i < len(order) and order[i][1] <= t: queue.append(order[i][0]); i += 1   # arrivals during the slice go first
        if rem[n] == 0: done[n] = t
        else: queue.append(n)
    report(done)

fcfs(); sjf(); round_robin(2)
```
```cpp
// SRTF (preemptive SJF), simulated one time unit at a time
#include <bits/stdc++.h>
using namespace std;
int main() {
    vector<string> name = {"P1", "P2", "P3", "P4"};
    vector<int> at = {0, 1, 2, 3}, bt = {5, 3, 8, 6}, rem = bt, ct(4);
    int done = 0, t = 0;
    while (done < 4) {
        int pick = -1;
        for (int i = 0; i < 4; i++) if (at[i] <= t && rem[i] > 0 && (pick == -1 || rem[i] < rem[pick])) pick = i;
        if (pick == -1) { t++; continue; }              // CPU idle
        rem[pick]--; t++;
        if (rem[pick] == 0) { ct[pick] = t; done++; }
    }
    double tw = 0;
    for (int i = 0; i < 4; i++) { int tat = ct[i] - at[i], wt = tat - bt[i]; tw += wt; printf("%s CT=%d TAT=%d WT=%d\n", name[i].c_str(), ct[i], tat, wt); }
    printf("average WT = %.2f\n", tw / 4);
}
```
| Algorithm | Preemptive | Starvation | Best for |
|---|---|---|---|
| FCFS | no | no | batch, simplicity |
| SJF | no | yes | known burst times |
| SRTF | yes | yes | minimum average waiting |
| Priority | both | yes (fix with aging) | importance-based work |
| Round Robin | yes | no | time sharing, interactive |
| MLFQ | yes | prevented by aging | general-purpose OS |
## Process Synchronization
### Race condition and critical section
- When threads share data and the result depends on the **timing** of their execution, it is a **race condition**.
- Example: `count++` is really three steps: load count into a register, add 1, store back. Two threads both load 5, both store 6 - one increment is lost.
@flow (count = 5) | Thread A loads 5 | Thread B loads 5 | A adds 1 and stores 6 | B adds 1 and stores 6 | (count = 6, but should be 7) :: A race condition on count++
- The code that touches shared data is the **critical section**. A solution must ensure:
1. **Mutual exclusion**: only one thread in the critical section at a time.
2. **Progress**: if nobody is inside, a waiting thread must be able to enter (no unnecessary blocking).
3. **Bounded waiting**: a thread cannot wait forever (no starvation).
### Peterson's solution (two processes, software only)
```c
int flag[2] = {0, 0};   // flag[i] = 1: process i wants to enter
int turn;               // whose turn it is
void enter(int i) {
    int j = 1 - i;
    flag[i] = 1;        // I want to enter
    turn = j;           // but you may go first
    while (flag[j] && turn == j) ;     // wait while the other wants in and it is their turn
}
void leave(int i) { flag[i] = 0; }
```
- It satisfies all three conditions in theory; on modern CPUs it needs memory barriers because the CPU may reorder instructions.
### Hardware support
- **Atomic instructions** do read-modify-write as one indivisible step: **Test-and-Set**, **Compare-and-Swap (CAS)**, fetch-and-add. They are the building blocks of locks.
```c
// spinlock using test-and-set (C11 atomics)
#include <stdatomic.h>
atomic_flag lock = ATOMIC_FLAG_INIT;
void acquire() { while (atomic_flag_test_and_set(&lock)) ; }   // spin until we flip it from 0 to 1
void release() { atomic_flag_clear(&lock); }
```
### Mutex locks
- A **mutex** (mutual exclusion lock) has two operations: lock (acquire) and unlock (release). Only the thread that locked it should unlock it.
- **Spinlock**: busy-waits (good for very short sections on multi-core). **Blocking mutex**: sleeps while waiting (good for longer sections).
```cpp
#include <mutex>
#include <thread>
int counter = 0; std::mutex m;
void add() { for (int i = 0; i < 100000; i++) { std::lock_guard<std::mutex> g(m); counter++; } }
int main() { std::thread a(add), b(add); a.join(); b.join(); printf("%d\n", counter); }   // always 200000
```
### Semaphores
- A **semaphore** is an integer S with two atomic operations:
  - **wait(S)** (also P, down): S = S - 1; if S < 0 the caller blocks.
  - **signal(S)** (also V, up): S = S + 1; if someone was blocked, wake one up.
- **Binary semaphore** (values 0 / 1) works like a mutex. **Counting semaphore** controls access to N identical resources (e.g. 5 database connections).
- Analogy: a parking lot with a display of free spaces. A car enters (wait) and the number goes down; when it is 0, new cars wait at the gate; a car leaving (signal) increases it and lets one waiting car in.
| Mutex | Semaphore |
|---|---|
| locking mechanism, one owner | signalling mechanism, no owner |
| only 0 / 1 | any non-negative count |
| the locker must unlock | any thread can signal |
| protects a critical section | counts resources / orders events |
### Monitors and condition variables
- A **monitor** is a language construct: shared data + procedures where only one thread is active inside at a time (Java `synchronized`). **Condition variables** let a thread wait inside it until a condition is true (`wait()` / `notify()`, `pthread_cond_wait` / `pthread_cond_signal`). Always re-check the condition in a while loop (spurious wake-ups).
## Classic Synchronization Problems
### 1. Producer-consumer (bounded buffer)
- Producers put items into a buffer of size N; consumers take them out. Producers must wait when full; consumers wait when empty.
- Semaphores: `empty = N` (free slots), `full = 0` (filled slots), `mutex = 1`.
```txt
Producer:                          Consumer:
  while (true) {                     while (true) {
    item = produce();                  wait(full);     // wait for an item
    wait(empty);    // free slot?      wait(mutex);
    wait(mutex);                       item = remove();
    insert(item);                      signal(mutex);
    signal(mutex);                     signal(empty);  // one more free slot
    signal(full);   // one more item   consume(item);
  }                                  }
```
> Order matters: doing wait(mutex) before wait(empty) can deadlock (the producer holds the mutex while waiting for space that only a consumer holding the mutex could free).
```py
import threading, collections, time, random
N = 5; buf = collections.deque()
empty, full, mutex = threading.Semaphore(N), threading.Semaphore(0), threading.Lock()
def producer():
    for i in range(10):
        empty.acquire()
        with mutex: buf.append(i); print("produced", i)
        full.release(); time.sleep(random.random() / 10)
def consumer():
    for _ in range(10):
        full.acquire()
        with mutex: item = buf.popleft(); print("  consumed", item)
        empty.release(); time.sleep(random.random() / 10)
threading.Thread(target=producer).start(); threading.Thread(target=consumer).start()
```
### 2. Readers-writers
- Many readers may read together, but a writer needs exclusive access.
```txt
semaphore rw = 1, mutex = 1; int readers = 0;
Reader:                                  Writer:
  wait(mutex); readers++;                  wait(rw);
  if (readers == 1) wait(rw);   // first     write();
  signal(mutex);                           signal(rw);
  read();
  wait(mutex); readers--;
  if (readers == 0) signal(rw); // last
  signal(mutex);
```
- This "first readers-writers" solution can starve writers. Fixes: writer-priority version or fair (FIFO) locks. Real-world: read-write locks (`pthread_rwlock`, `ReentrantReadWriteLock`).
### 3. Dining philosophers
- Five philosophers sit at a round table with five forks; each needs both neighbouring forks to eat. If all pick up the left fork at once, nobody can get the right one: **deadlock**.
@graph Ph1-F1 F1-Ph2 Ph2-F2 F2-Ph3 Ph3-F3 F3-Ph4 Ph4-F4 F4-Ph5 Ph5-F5 F5-Ph1 :: Five philosophers (Ph) and five forks (F)
- Solutions: allow at most 4 philosophers at the table (a counting semaphore of 4); pick up both forks only if both are free (inside a monitor); **asymmetric**: odd philosophers pick left first, even pick right first (breaks the circular wait); order resources (always pick the lower-numbered fork first).
```py
import threading, time
forks = [threading.Lock() for _ in range(5)]
def philosopher(i):
    a, b = sorted((i, (i + 1) % 5))            # resource ordering: lower-numbered fork first -> no cycle
    for _ in range(3):
        with forks[a], forks[b]: print(f"philosopher {i} eats"); time.sleep(0.01)
        time.sleep(0.01)                         # think
for i in range(5): threading.Thread(target=philosopher, args=(i,)).start()
```
### 4. Sleeping barber
- One barber, one chair, N waiting chairs. If no customers, the barber sleeps; a customer wakes him or waits, or leaves if the waiting room is full. Semaphores: customers, barber, mutex + a waiting counter.
