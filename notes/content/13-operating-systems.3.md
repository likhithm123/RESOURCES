## File Systems
### Files and directories
- A **file** is a named collection of related data on storage. Attributes: name, type, size, location, owner, permissions, timestamps (created, modified, accessed).
- Operations: create, open, read, write, seek (move the position), close, delete, truncate, rename.
- **Access methods**: sequential (read in order, like a tape), direct / random (jump to any block), indexed (use an index to find records).
| Directory structure | Idea |
|---|---|
| Single-level | one directory for everyone (name clashes) |
| Two-level | one directory per user |
| Tree | folders inside folders (most common) |
| Acyclic graph | shared files / folders via links |
| General graph | links may create cycles (needs garbage collection) |
- **Hard link**: another directory entry pointing to the same inode. **Soft (symbolic) link**: a file containing a path.
### File allocation methods (how a file's blocks are placed on disk)
| Method | How | Pros | Cons |
|---|---|---|---|
| Contiguous | one continuous run of blocks | fast sequential and random access | external fragmentation, hard to grow |
| Linked | each block points to the next | no external fragmentation, easy to grow | slow random access, a broken pointer loses the rest |
| FAT (File Allocation Table) | the "next" pointers kept in a table in memory | faster random access than linked | the table can be large |
| Indexed | an index block lists all the file's blocks | fast random access, no fragmentation | index block overhead |
| Multi-level index / inode | direct pointers + single, double, triple indirect blocks | small files fast, huge files possible | more complex |
@layers Inode: owner, permissions, size, timestamps | 12 direct block pointers -> data blocks | Single indirect -> block of pointers -> data | Double indirect -> pointers -> pointers -> data | Triple indirect :: Unix inode (ext2/ext3 style)
- Example: 4 KB blocks, 4-byte pointers -> one block holds 1024 pointers. Max file = 12 x 4 KB + 1024 x 4 KB + 1024^2 x 4 KB + 1024^3 x 4 KB, about 4 TB.
### Free-space management
| Method | Idea |
|---|---|
| Bit vector (bitmap) | one bit per block: 1 = free, 0 = used; easy to find runs |
| Linked list | free blocks point to each other |
| Grouping | first free block stores addresses of n free blocks |
| Counting | store (start block, number of contiguous free blocks) |
### Common file systems
| File system | Used by | Notes |
|---|---|---|
| FAT32 / exFAT | USB drives, SD cards | simple, compatible; FAT32 max file 4 GB |
| NTFS | Windows | journaling, permissions, compression |
| ext4 | Linux | journaling, extents, up to 1 EB volumes |
| XFS / Btrfs / ZFS | Linux servers / storage | Btrfs and ZFS: snapshots, checksums, copy-on-write |
| APFS | macOS / iOS | copy-on-write, snapshots, encryption |
- **Journaling**: changes are first written to a journal (log); after a crash the file system replays or discards incomplete operations instead of a slow full check (fsck).
- **VFS (Virtual File System)**: one interface in the kernel (open, read, write) for all file systems, so programs do not care whether the file is on ext4, NFS or a USB stick.
- **Mounting**: attaching a file system to a directory in the tree (`mount /dev/sdb1 /mnt/usb`).
## Disk Structure and Disk Scheduling
### How a hard disk works
- Platters spin; a read/write head on an arm moves across **tracks**; tracks are divided into **sectors**; the same track on all platters forms a **cylinder**.
| Time | Meaning |
|---|---|
| Seek time | moving the head to the right track (the biggest part) |
| Rotational latency | waiting for the sector to come under the head (average = half a rotation) |
| Transfer time | actually reading the data |
| Access time | seek + rotational latency + transfer |
- **SSDs** have no moving parts: flash memory, almost no seek time, so disk scheduling matters much less (the OS uses simple queues like none / mq-deadline). SSDs need **TRIM** and wear levelling.
### Disk scheduling algorithms
- Example used for all: request queue (cylinders) **98, 183, 37, 122, 14, 124, 65, 67**, head starts at **53**, disk has cylinders 0-199.
### FCFS
- Serve in arrival order: 53 -> 98 -> 183 -> 37 -> 122 -> 14 -> 124 -> 65 -> 67.
- Movement = 45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = **640 cylinders**. Fair but wild swings.
### SSTF (Shortest Seek Time First)
- Always go to the closest pending request: 53 -> 65 -> 67 -> 37 -> 14 -> 98 -> 122 -> 124 -> 183.
- Movement = 12 + 2 + 30 + 23 + 84 + 24 + 2 + 59 = **236**. Much better, but far requests can starve.
### SCAN (elevator)
- Move in one direction serving requests until the end of the disk, then reverse. Head moving towards 0: 53 -> 37 -> 14 -> 0 -> 65 -> 67 -> 98 -> 122 -> 124 -> 183.
- Movement = (53 - 0) + (183 - 0) = **236**.
### C-SCAN (circular SCAN)
- Serve in one direction only; at the end jump back to the start without serving (more uniform waiting). Moving up: 53 -> 65 -> 67 -> 98 -> 122 -> 124 -> 183 -> 199, jump to 0, -> 14 -> 37.
- Movement = (199 - 53) + (199 - 0) + (37 - 0) = 146 + 199 + 37 = **382** (counting the return jump).
### LOOK and C-LOOK
- Like SCAN / C-SCAN, but the head only goes as far as the last request in each direction (no trip to the disk edge).
- LOOK moving up: 53 -> 65 -> 67 -> 98 -> 122 -> 124 -> 183 -> 37 -> 14 = 130 + 169 = **299**. Moving down: 53 -> 37 -> 14 -> 65 -> ... -> 183 = 39 + 169 = **208**.
- C-LOOK moving up: 53 -> 65 ... 183, jump to 14, -> 37 = 130 + 169 + 23 = **322**.
@cells 0 14 37 53* 65 67 98 122 124 183 199 :: Cylinder positions (head at 53)
```py
def total(path): return sum(abs(b - a) for a, b in zip(path, path[1:]))
reqs, head, max_cyl = [98, 183, 37, 122, 14, 124, 65, 67], 53, 199
def fcfs(): return [head] + reqs
def sstf():
    path, left, cur = [head], reqs[:], head
    while left:
        nxt = min(left, key=lambda r: abs(r - cur)); left.remove(nxt); path.append(nxt); cur = nxt
    return path
def scan_down():
    lower = sorted([r for r in reqs if r < head], reverse=True); upper = sorted(r for r in reqs if r >= head)
    return [head] + lower + [0] + upper
def c_scan_up():
    upper = sorted(r for r in reqs if r >= head); lower = sorted(r for r in reqs if r < head)
    return [head] + upper + [max_cyl, 0] + lower
def look_up():
    return [head] + sorted(r for r in reqs if r >= head) + sorted([r for r in reqs if r < head], reverse=True)
def c_look_up():
    return [head] + sorted(r for r in reqs if r >= head) + sorted(r for r in reqs if r < head)
for name, f in [("FCFS", fcfs), ("SSTF", sstf), ("SCAN", scan_down), ("C-SCAN", c_scan_up), ("LOOK", look_up), ("C-LOOK", c_look_up)]:
    print(name, total(f()))          # 640 236 236 382 299 322
```
| Algorithm | Head movement here | Starvation | Notes |
|---|---|---|---|
| FCFS | 640 | no | simple, slow |
| SSTF | 236 | possible | greedy |
| SCAN | 236 | no | elevator |
| C-SCAN | 382 | no | uniform wait times |
| LOOK | 299 (up) / 208 (down) | no | practical SCAN |
| C-LOOK | 322 | no | practical C-SCAN |
### RAID (Redundant Array of Independent Disks)
| Level | How | Gives |
|---|---|---|
| RAID 0 | striping across disks | speed, no redundancy (one disk fails = all lost) |
| RAID 1 | mirroring | redundancy, read speed, 50% capacity |
| RAID 5 | striping + distributed parity | survives 1 disk failure, good capacity |
| RAID 6 | double parity | survives 2 failures |
| RAID 10 | mirrored pairs, then striped | speed + redundancy (databases) |
## I/O Systems
- Devices connect through **controllers**; the OS talks to them via **device drivers** (code that knows one device type).
| I/O technique | How | Use |
|---|---|---|
| Programmed I/O (polling) | CPU repeatedly checks the device status | simple, wastes CPU |
| Interrupt-driven I/O | the device interrupts the CPU when ready | keyboard, network |
| DMA (Direct Memory Access) | a DMA controller copies whole blocks between device and RAM, then interrupts once | disks, network cards (big transfers) |
@chain Disk controller -> DMA copies 64 KB into RAM -> one interrupt -> CPU handles completion :: DMA: the CPU is free during the transfer
- **Interrupt**: a hardware signal that makes the CPU pause, run an interrupt handler (ISR) and resume. **Trap / exception**: a software-generated interrupt (system call, divide by zero, page fault).
- **Buffering** (hold data in memory to match speeds: double buffering), **caching** (keep copies of frequently used data: the page cache), **spooling** (queue output for a slow device like a printer).
- Blocking vs non-blocking vs asynchronous I/O: blocking waits; non-blocking returns immediately; async notifies later (epoll / io_uring on Linux, IOCP on Windows) - the basis of fast servers like Nginx and Node.js.
## Protection and Security
- **Protection**: controlling which processes / users can access which resources (inside the system). **Security**: defending the system against external and internal attacks.
- **Access control**: access matrix (subjects x objects), implemented as **access control lists** (per file: who can do what) or **capability lists** (per user: what they can access). Unix permissions rwx for owner / group / others (notebook 08).
- Principles: least privilege, separation of privilege, defence in depth, fail-safe defaults.
- Mechanisms: user / kernel mode, memory protection (page permissions, NX bit), **ASLR** (randomised addresses), stack canaries, sandboxing, SELinux / AppArmor (mandatory access control), secure boot, full-disk encryption.
- Threats: malware (virus, worm, trojan, ransomware), buffer overflow, privilege escalation, denial of service (details in notebook 23).
## Virtualization and Containers
- A **virtual machine (VM)** runs a full OS on virtual hardware provided by a **hypervisor**. **Type 1** (bare-metal: VMware ESXi, Hyper-V, Xen, KVM) runs directly on hardware; **Type 2** (hosted: VirtualBox, VMware Workstation) runs on top of an OS.
- A **container** shares the host's kernel and isolates processes using **namespaces** (separate views of PIDs, network, mounts, users, hostnames) and **cgroups** (limits on CPU, memory, I/O). Much lighter than VMs: start in milliseconds.
@layers App A, App B (each with its own libraries) | Guest OS A, Guest OS B | Hypervisor | Hardware :: Virtual machines
@layers App A, App B (container images) | Container runtime (Docker / containerd) | Host OS kernel (namespaces + cgroups) | Hardware :: Containers share one kernel
| Virtual machine | Container |
|---|---|
| full guest OS per VM (GBs) | shares the host kernel (MBs) |
| boots in minutes | starts in milliseconds |
| strong isolation | process-level isolation (weaker) |
| run different OSes | same kernel family |
## Linux Internals Worth Knowing
- Everything is a file (devices in /dev, process info in /proc). Process tree starts at PID 1 (systemd). Signals: SIGINT, SIGTERM, SIGKILL, SIGHUP, SIGCHLD (notebook 08).
- Scheduler: CFS / EEVDF for normal tasks; real-time classes SCHED_FIFO and SCHED_RR. `nice` values -20 (highest priority) to 19.
- Memory: 4 KB pages (huge pages 2 MB / 1 GB), page cache, swap, the **OOM killer** kills a process when memory runs out, overcommit.
- Useful commands: `ps aux`, `top` / `htop`, `vmstat 1` (memory, swap, CPU), `free -h`, `iostat`, `cat /proc/<pid>/status`, `strace -p <pid>` (system calls), `lsof` (open files), `pmap` (memory map), `ulimit -a`.
## Operating Systems Interview Questions
Q: What is the difference between a process and a thread?
A: A process is a running program with its own address space and resources; threads are units of execution inside a process that share its memory and files but have their own stack and registers, so they are cheaper to create and switch but need synchronization.
Q: What happens during a context switch?
A: The OS saves the running process's CPU state (registers, program counter) in its PCB, picks the next process, loads its saved state and memory mappings, and resumes it; it is overhead with no useful work.
Q: Explain the process states.
A: New, ready (waiting for CPU), running, waiting / blocked (for I/O or an event), terminated; plus suspended states when swapped out.
Q: Compare FCFS, SJF, SRTF, priority and Round Robin.
A: FCFS is simple but has the convoy effect; SJF minimises average waiting among non-preemptive algorithms but needs burst times and can starve; SRTF is its preemptive form; priority can starve low priorities (fixed with aging); Round Robin is fair with good response time but more context switches.
Q: What is a race condition and how do you prevent it?
A: When the result depends on the timing of threads accessing shared data; prevent it by protecting critical sections with mutexes, semaphores, monitors or atomic operations.
Q: Mutex vs semaphore?
A: A mutex is an ownership-based lock allowing one thread in a critical section; a semaphore is a counter that can allow N concurrent accesses or signal events, and any thread may signal it.
Q: What are the conditions for deadlock?
A: Mutual exclusion, hold and wait, no preemption and circular wait - all four must hold at the same time.
Q: How does the Banker's algorithm work?
A: Before granting a request it pretends to allocate and checks whether a safe sequence exists in which every process can obtain its maximum need and finish; if not, the request waits.
Q: Paging vs segmentation?
A: Paging uses fixed-size pages (no external fragmentation, invisible to the programmer); segmentation uses variable-size logical segments (matches program structure, has external fragmentation).
Q: What is virtual memory and a page fault?
A: Virtual memory gives each process a large address space backed partly by disk; a page fault occurs when a referenced page is not in RAM, so the OS loads it from disk and restarts the instruction.
Q: What is a TLB?
A: A small cache of recent page-table translations in the CPU that avoids an extra memory access for most address translations.
Q: Explain FIFO, LRU and Optimal page replacement and Belady's anomaly.
A: FIFO evicts the oldest page, LRU the least recently used, Optimal the page used farthest in the future (minimum faults, not implementable). Belady's anomaly is FIFO producing more faults with more frames.
Q: What is thrashing and how do you fix it?
A: Excessive paging where processes lack frames for their working sets, so the CPU idles while the disk is busy; fix by reducing multiprogramming, using working-set or page-fault-frequency control, or adding memory.
Q: Internal vs external fragmentation?
A: Internal: wasted space inside an allocated block (fixed partitions, last page). External: enough total free memory but split into holes too small to use (variable partitions, segmentation).
Q: What is a system call?
A: The controlled interface through which a user program requests a kernel service, switching the CPU from user mode to kernel mode (open, read, fork, mmap).
Q: What are zombie and orphan processes?
A: A zombie has exited but its parent has not collected its exit status; an orphan's parent has exited and it is adopted by init / systemd.
Q: Compare disk scheduling algorithms.
A: FCFS is fair but slow; SSTF minimises seeks but can starve; SCAN / LOOK move like an elevator; C-SCAN / C-LOOK give more uniform waiting by serving one direction only.
Q: What is the difference between a VM and a container?
A: A VM virtualises hardware and runs a full guest OS; a container isolates processes on the shared host kernel using namespaces and cgroups, so it is much lighter and faster to start.
Q: What is the difference between user mode and kernel mode?
A: User mode runs applications with restricted privileges; kernel mode has full access to hardware and memory and is entered only through system calls, interrupts or exceptions.
Q: What is a semaphore's wait and signal?
A: wait decrements the counter and blocks if it becomes negative; signal increments it and wakes a waiting process.
