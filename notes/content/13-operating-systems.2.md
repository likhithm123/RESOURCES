## Deadlocks
### What is a deadlock
- A **deadlock** is when a set of processes are all waiting for each other forever. Example: P1 holds the printer and wants the scanner; P2 holds the scanner and wants the printer. Neither can continue.
- Real-life analogy: four cars at a four-way junction, each waiting for the car on its right to move first.
@graph P1>Printer Printer>P2 P2>Scanner Scanner>P1 :: Resource allocation graph with a cycle (request edge P->R, assignment edge R->P)
### The four necessary conditions (Coffman conditions) - all four must hold
1. **Mutual exclusion**: a resource can be held by only one process at a time.
2. **Hold and wait**: a process holds some resources while waiting for others.
3. **No preemption**: resources cannot be forcibly taken away.
4. **Circular wait**: a cycle P1 -> P2 -> ... -> Pn -> P1 where each waits for the next.
- With single-instance resources, a **cycle** in the resource allocation graph means deadlock. With multi-instance resources, a cycle means deadlock is **possible** (not certain).
### Handling deadlocks
| Strategy | Idea | Cost |
|---|---|---|
| Prevention | make one of the four conditions impossible | lower resource use |
| Avoidance | grant a request only if the system stays in a safe state (Banker's algorithm) | needs maximum needs in advance |
| Detection and recovery | let deadlocks happen, detect cycles, then recover | detection overhead, lost work |
| Ignore (ostrich algorithm) | assume they are rare; reboot if needed | used by most desktop OSes |
| Prevent by breaking | How |
|---|---|
| Mutual exclusion | make resources sharable (read-only files, spooling a printer) - often impossible |
| Hold and wait | request all resources at once before starting, or release everything before asking again |
| No preemption | if a request fails, release what you hold (or let the OS take resources away) |
| Circular wait | number all resources and always request them in increasing order (most practical) |
### Banker's algorithm (deadlock avoidance)
- Like a bank that lends money only if it can still satisfy every customer's maximum need in some order. The system is **safe** if there is a **safe sequence** in which every process can get its maximum need and finish.
- Data: **Available** (free instances), **Max** (maximum each process may need), **Allocation** (currently held), **Need = Max - Allocation**.
### Worked example (resources A, B, C with total 10, 5, 7)
| Process | Allocation (A B C) | Max (A B C) | Need = Max - Allocation |
|---|---|---|---|
| P0 | 0 1 0 | 7 5 3 | 7 4 3 |
| P1 | 2 0 0 | 3 2 2 | 1 2 2 |
| P2 | 3 0 2 | 9 0 2 | 6 0 0 |
| P3 | 2 1 1 | 2 2 2 | 0 1 1 |
| P4 | 0 0 2 | 4 3 3 | 4 3 1 |
- Allocated total = (7, 2, 5), so **Available = (10, 5, 7) - (7, 2, 5) = (3, 3, 2)**.
1. Work = (3, 3, 2). P1 needs (1, 2, 2) <= Work -> run P1, Work = Work + Alloc(P1) = (5, 3, 2).
2. P3 needs (0, 1, 1) <= (5, 3, 2) -> run P3, Work = (7, 4, 3).
3. P4 needs (4, 3, 1) <= (7, 4, 3) -> run P4, Work = (7, 4, 5).
4. P0 needs (7, 4, 3) <= (7, 4, 5) -> run P0, Work = (7, 5, 5).
5. P2 needs (6, 0, 0) <= (7, 5, 5) -> run P2, Work = (10, 5, 7).
- **Safe sequence: P1, P3, P4, P0, P2** -> the system is safe.
- **Resource request**: when P1 asks for (1, 0, 2): check request <= Need and request <= Available, pretend to grant it, run the safety check; grant only if still safe, otherwise make P1 wait.
```py
def is_safe(available, max_need, alloc):
    n, m = len(alloc), len(available)
    need = [[max_need[i][j] - alloc[i][j] for j in range(m)] for i in range(n)]
    work, finish, order = available[:], [False] * n, []
    while len(order) < n:
        progressed = False
        for i in range(n):
            if not finish[i] and all(need[i][j] <= work[j] for j in range(m)):
                work = [work[j] + alloc[i][j] for j in range(m)]       # P_i finishes and returns its resources
                finish[i] = True; order.append(f"P{i}"); progressed = True
        if not progressed: return False, order                       # nobody can proceed -> unsafe
    return True, order

def request(pid, req, available, max_need, alloc):
    need = [max_need[pid][j] - alloc[pid][j] for j in range(len(req))]
    if any(req[j] > need[j] for j in range(len(req))): raise ValueError("asked for more than declared maximum")
    if any(req[j] > available[j] for j in range(len(req))): return False      # must wait
    avail2 = [available[j] - req[j] for j in range(len(req))]
    alloc2 = [row[:] for row in alloc]; alloc2[pid] = [alloc[pid][j] + req[j] for j in range(len(req))]
    return is_safe(avail2, max_need, alloc2)[0]                          # grant only if still safe

alloc = [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]]
mx = [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]]
print(is_safe([3, 3, 2], mx, alloc))                 # (True, ['P1', 'P3', 'P4', 'P0', 'P2'])
print(request(1, [1, 0, 2], [3, 3, 2], mx, alloc))   # True: safe to grant
```
```cpp
bool isSafe(vector<int> avail, vector<vector<int>>& mx, vector<vector<int>>& alloc, vector<int>& order) {
    int n = alloc.size(), m = avail.size(); vector<bool> done(n, false);
    while ((int)order.size() < n) {
        bool moved = false;
        for (int i = 0; i < n; i++) {
            if (done[i]) continue;
            bool ok = true;
            for (int j = 0; j < m; j++) if (mx[i][j] - alloc[i][j] > avail[j]) { ok = false; break; }
            if (ok) { for (int j = 0; j < m; j++) avail[j] += alloc[i][j]; done[i] = true; order.push_back(i); moved = true; }
        }
        if (!moved) return false;
    }
    return true;
}
```
- Time complexity of the safety check: O(m x n^2).
### Deadlock detection and recovery
- Single instance per resource: build a **wait-for graph** (Pi -> Pj if Pi waits for Pj) and look for a cycle with DFS (notebook 11, "Detect a cycle in a directed graph").
- Multiple instances: a Banker's-like detection algorithm using the current requests instead of maximum needs.
- Recovery: abort all deadlocked processes, or abort one at a time (choose the victim by priority / work done / resources held), or **preempt** resources and roll back to a checkpoint. Avoid always picking the same victim (starvation).
| Deadlock | Starvation | Livelock |
|---|---|---|
| processes wait forever for each other, nobody runs | one process waits indefinitely while others run | processes keep changing state in response to each other but make no progress (two people stepping aside in a corridor) |
## Memory Management
### Basics
- Programs must be in main memory (RAM) to run. The OS decides **where** each process lives, **protects** processes from each other, and lets programs use more memory than physically exists (virtual memory).
- **Logical (virtual) address**: the address the program uses. **Physical address**: the real location in RAM. The **MMU** (Memory Management Unit) translates logical to physical at run time.
@chain CPU generates logical address 346 -> MMU adds base register 14000 -> physical address 14346 -> RAM (limit register checks it is inside the process) :: Address translation with base and limit registers
- **Address binding** can happen at compile time, load time or (most flexible) execution time.
- **Loading**: static (whole program at start) or dynamic (load a routine only when called). **Linking**: static (library copied into the executable) or dynamic (shared libraries: .so / .dll, loaded at run time).
- **Swapping**: move a whole process out to disk to free RAM and bring it back later.
### Contiguous allocation
- Each process gets one continuous block of memory.
| Partitioning | Idea | Problem |
|---|---|---|
| Fixed partitions | memory pre-divided into blocks | **internal fragmentation**: wasted space inside a block |
| Variable (dynamic) partitions | carve exactly what is needed | **external fragmentation**: free memory split into small holes |
| Placement strategy | Rule | Note |
|---|---|---|
| First fit | first hole big enough | fast |
| Best fit | smallest hole big enough | leaves tiny useless holes |
| Worst fit | largest hole | leaves big usable holes, but wastes large blocks |
| Next fit | like first fit, starting where the last search ended | spreads allocations |
- Example: holes 100, 500, 200, 300, 600 KB; requests 212, 417, 112, 426 KB. First fit: 212 -> 500 (left 288), 417 -> 600 (left 183), 112 -> 288, 426 must wait. Best fit: 212 -> 300, 417 -> 500, 112 -> 200, 426 -> 600 (all fit - best here).
- **Compaction**: move processes to merge free holes (expensive). **Buddy system**: split memory into power-of-2 blocks, merge buddies when freed (used for kernel memory in Linux).
### Paging
- Divide **logical memory** into fixed-size **pages** and **physical memory** into frames of the same size (commonly 4 KB). Any page can go into any free frame - **no external fragmentation** (only a little internal fragmentation in the last page).
- Logical address = **page number (p) + offset (d)**. The **page table** maps p -> frame number f. Physical address = f x page size + d.
@chain Logical address (p = 2, d = 100) -> page table[2] = frame 5 -> physical = 5 x 4096 + 100 = 20580 :: Paging address translation
@grid Page Frame / 0 3 / 1 7 / 2 5* / 3 1 :: A page table: page 2 lives in frame 5
- Example: 32-bit logical address, 4 KB pages: offset = 12 bits (2^12 = 4096), page number = 20 bits -> 2^20 = about 1 million page-table entries per process. That is why we need multi-level page tables.
| Paging concept | Meaning |
|---|---|
| Page table entry | frame number + valid bit + protection bits (read / write / execute) + dirty bit + referenced bit |
| TLB (Translation Lookaside Buffer) | small, fast cache of recent page-table entries inside the CPU |
| TLB hit / miss | found in TLB (fast) / must read the page table in memory (slower) |
| Multi-level (hierarchical) page table | page table split into levels so unused parts need no memory (x86-64 uses 4 or 5 levels) |
| Inverted page table | one entry per physical frame instead of per page (saves memory) |
| Hashed page table | hash of the page number -> entry (large address spaces) |
| Shared pages | the same frames mapped into several processes (shared libraries) |
### Effective Access Time (EAT) with a TLB
- EAT = hit ratio x (TLB time + memory time) + (1 - hit ratio) x (TLB time + 2 x memory time).
- Example: TLB 20 ns, memory 100 ns, hit ratio 80%: EAT = 0.8 x 120 + 0.2 x 220 = 96 + 44 = **140 ns** (instead of 200 ns without a TLB).
### Segmentation
- Memory is divided into variable-size **segments** that match the program's logical parts: code, data, stack, heap. Address = (segment number, offset). A **segment table** holds base and limit for each segment.
- Matches how programmers think and allows per-segment protection, but suffers external fragmentation. **Segmented paging** combines both (segments split into pages).
| Paging | Segmentation |
|---|---|
| fixed-size pages | variable-size segments |
| invisible to the programmer | matches logical program structure |
| internal fragmentation (small) | external fragmentation |
| page table | segment table (base + limit) |
## Virtual Memory
- **Virtual memory** lets a process use more memory than physically exists: only the pages being used are in RAM; the rest stay on disk (swap). Programs become larger, more processes fit, start-up is faster.
- **Demand paging**: a page is loaded only when first accessed.
### Page fault handling
@flow (CPU accesses a page whose valid bit = 0) | Trap to the OS: page fault | Check the reference is legal (else: segmentation fault) | Find a free frame (or choose a victim with page replacement; write it to disk if dirty) | Read the page from disk into the frame | Update the page table, set valid = 1 | (Restart the instruction) :: Handling a page fault
- Effective access time with page faults: EAT = (1 - p) x memory access + p x page-fault time. Memory 200 ns, fault 8 ms, p = 1/1000 -> EAT = about 8.2 microseconds (40x slower!). Page faults must be very rare.
- **Copy-on-write**: after fork, parent and child share pages until one writes; only then is the page copied.
### Page replacement algorithms
- When no frame is free, choose a **victim page** to remove. Goal: fewest page faults.
- Reference string used below: **7 0 1 2 0 3 0 4 2 3 0 3 2**, with **3 frames**.
### FIFO (First In First Out)
- Replace the page that has been in memory the longest.
| Ref | 7 | 0 | 1 | 2 | 0 | 3 | 0 | 4 | 2 | 3 | 0 | 3 | 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F1 | 7 | 7 | 7 | 2 | 2 | 2 | 2 | 4 | 4 | 4 | 0 | 0 | 0 |
| F2 | | 0 | 0 | 0 | 0 | 3 | 3 | 3 | 2 | 2 | 2 | 2 | 2 |
| F3 | | | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 3 | 3 | 3 | 3 |
| Fault | F | F | F | F | H | F | F | F | F | F | F | H | H |
- **10 page faults**. **Belady's anomaly**: with FIFO, adding more frames can sometimes cause **more** faults (e.g. reference string 1 2 3 4 1 2 5 1 2 3 4 5: 9 faults with 3 frames, 10 with 4).
### Optimal (OPT / MIN)
- Replace the page that will **not be used for the longest time in the future**. Gives the minimum possible faults, but needs the future, so it is only a benchmark.
| Ref | 7 | 0 | 1 | 2 | 0 | 3 | 0 | 4 | 2 | 3 | 0 | 3 | 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F1 | 7 | 7 | 7 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| F2 | | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 4 | 4 | 0 | 0 | 0 |
| F3 | | | 1 | 1 | 1 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| Fault | F | F | F | F | H | F | H | F | H | H | F | H | H |
- **7 page faults** (the minimum).
### LRU (Least Recently Used)
- Replace the page that was used **least recently** (the past predicts the future). Very good in practice; no Belady's anomaly (it is a "stack algorithm").
| Ref | 7 | 0 | 1 | 2 | 0 | 3 | 0 | 4 | 2 | 3 | 0 | 3 | 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F1 | 7 | 7 | 7 | 2 | 2 | 2 | 2 | 4 | 4 | 4 | 0 | 0 | 0 |
| F2 | | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 3 | 3 | 3 |
| F3 | | | 1 | 1 | 1 | 3 | 3 | 3 | 2 | 2 | 2 | 2 | 2 |
| Fault | F | F | F | F | H | F | H | F | F | F | F | H | H |
- **9 page faults**. Exact LRU needs timestamps or a stack - costly in hardware; real systems approximate it.
### LRU approximations and others
| Algorithm | Idea |
|---|---|
| Second chance (Clock) | FIFO, but if the page's reference bit is 1, clear it and skip it once; a clock hand moves in a circle. Used widely |
| Enhanced second chance | uses (reference, dirty) bits: prefer clean, unused pages |
| LFU | replace the least frequently used page |
| MFU | replace the most frequently used (idea: the least used was just brought in) |
| Page buffering | keep a pool of free frames to make faults faster |
```py
def fifo(refs, frames):
    mem, faults, q = set(), 0, []
    for p in refs:
        if p in mem: continue
        faults += 1
        if len(mem) == frames: mem.remove(q.pop(0))
        mem.add(p); q.append(p)
    return faults
def lru(refs, frames):
    mem, faults = [], 0                      # list ordered from least to most recently used
    for p in refs:
        if p in mem: mem.remove(p)
        else:
            faults += 1
            if len(mem) == frames: mem.pop(0)
        mem.append(p)
    return faults
def optimal(refs, frames):
    mem, faults = [], 0
    for i, p in enumerate(refs):
        if p in mem: continue
        faults += 1
        if len(mem) < frames: mem.append(p); continue
        future = refs[i + 1:]
        victim = max(mem, key=lambda x: future.index(x) if x in future else len(future) + 1)   # used farthest away (or never)
        mem[mem.index(victim)] = p
    return faults
refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2]
print(fifo(refs, 3), optimal(refs, 3), lru(refs, 3))          # 10 7 9
print(fifo([1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], 3), fifo([1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], 4))   # 9 10 -> Belady
```
```cpp
int lruFaults(const vector<int>& refs, int frames) {
    list<int> order; unordered_map<int, list<int>::iterator> where; int faults = 0;   // like an LRU cache
    for (int p : refs) {
        if (where.count(p)) { order.erase(where[p]); }
        else { faults++; if ((int)order.size() == frames) { where.erase(order.front()); order.pop_front(); } }
        order.push_back(p); where[p] = prev(order.end());
    }
    return faults;
}
```
### Thrashing and the working set
- **Thrashing**: the system spends more time swapping pages in and out than doing useful work, because processes do not have enough frames for the pages they actively use. CPU utilisation collapses while the disk is busy.
@chain more processes added -> each gets fewer frames -> page faults rise -> CPU waits on disk -> OS sees low CPU use and adds more processes -> worse :: How thrashing spirals
- **Locality of reference**: programs use a small set of pages at a time (loops, nearby data).
- **Working set model**: the working set = pages used in the last delta references. Give each process enough frames for its working set; if total demand > frames, suspend a process.
- **Page-fault frequency (PFF)**: if a process faults too often give it more frames; too rarely, take some away.
- Fixes: reduce the degree of multiprogramming, add RAM, use better replacement, use local (per-process) replacement.
### Frame allocation
- Equal allocation (same frames for all) or proportional allocation (frames proportional to process size). **Global replacement** (take frames from any process) vs **local replacement** (only from your own).
