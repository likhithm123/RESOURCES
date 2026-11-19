# DSA Basics - Every Data Structure Explained (C++ and Python)
This notebook teaches every important data structure from zero: what it is, how it sits in memory, every operation with a diagram, full C++ and Python implementations, and the time / space cost of each operation with the reason. The problem-by-problem solutions of the A2Z sheet are in notebook 11.
## What is DSA and why companies test it
- A **data structure** is a way of arranging data in memory so that the operations you need are fast. An **algorithm** is a finite list of steps that solves a problem.
- Same problem, different structure = very different speed. Searching 1 crore (10^7) items: linear scan ~10^7 steps, binary search on a sorted array ~24 steps, hash table ~1 step.
- Interviews test DSA because it shows how you think: break the problem, choose the right tool, reason about cost, handle edge cases.
@chain Problem -> Choose data structure -> Design algorithm -> Analyse time and space -> Code + test :: Engineering loop
## Complexity Analysis (Big-O)
### Counting steps
- We count how the number of basic operations grows with the input size n, and ignore machine speed.
- **Big-O** O(f(n)): upper bound - the algorithm never grows faster than f(n). **Omega**: lower bound. **Theta**: exact growth.
- Drop constants and lower terms: 3n^2 + 10n + 7 is O(n^2).
| Growth | Name | n = 10^6 steps (approx) | Example |
|---|---|---|---|
| O(1) | constant | 1 | array index, hash lookup |
| O(log n) | logarithmic | 20 | binary search, heap push |
| O(n) | linear | 10^6 | one loop |
| O(n log n) | linearithmic | 2 x 10^7 | merge sort |
| O(n^2) | quadratic | 10^12 (too slow) | nested loops |
| O(2^n) | exponential | impossible | all subsets |
### Rules to find complexity
- Sequential blocks add: O(n) + O(n^2) = O(n^2). Nested loops multiply.
- A loop where i doubles (i = i x 2) or halves runs log2(n) times.
- Recursion: time = number of calls x work per call. T(n) = 2T(n/2) + O(n) gives O(n log n) (Master theorem). T(n) = T(n - 1) + O(1) gives O(n). T(n) = 2T(n - 1) + O(1) gives O(2^n).
- **Amortised** cost: average per operation over a long sequence. A dynamic array push is O(1) amortised even though an occasional resize costs O(n).
- **Space** complexity counts extra memory: arrays you create + recursion stack depth.
```cpp
int sumPairs(vector<int>& a) {          // O(n^2) time, O(1) space
    int s = 0;
    for (int i = 0; i < (int)a.size(); i++)
        for (int j = i + 1; j < (int)a.size(); j++) s += a[i] * a[j];
    return s;
}
```
```py
def sum_pairs(a):                        # O(n^2) time, O(1) space
    s = 0
    for i in range(len(a)):
        for j in range(i + 1, len(a)): s += a[i] * a[j]
    return s
```
## Memory Basics
- RAM is a long row of bytes, each with an address. An `int` takes 4 bytes, `long long` 8, `char` 1, a pointer 8 (64-bit).
- **Stack memory**: local variables and function calls, freed automatically, small (about 1-8 MB). **Heap memory**: created with `new` / `malloc` (or any Python object), large, freed by `delete` or the garbage collector.
- **Cache**: the CPU loads neighbouring bytes together, so contiguous data (arrays) is much faster to scan than scattered data (linked nodes).
@layers Program code | Global / static data | Heap (grows up), Stack (grows down) :: Process memory layout
## Arrays and Dynamic Arrays
### Static array
- Fixed size, contiguous. Address of a[i] = base + i x size of element, so access is O(1).
- Insert / delete in the middle shifts elements: O(n).
@array 10 20 30 40 50 :: int a[5] at addresses 1000, 1004, 1008, 1012, 1016
### Dynamic array (vector / ArrayList / Python list)
- Keeps a capacity. When full, allocate **double** the capacity and copy. Copies happen at sizes 1, 2, 4, 8, ... total copies < 2n, so push_back is **O(1) amortised**.
```cpp
class DynArray {
    int* data; int sz = 0, cap = 1;
public:
    DynArray() { data = new int[cap]; }
    ~DynArray() { delete[] data; }
    void push_back(int x) {
        if (sz == cap) {
            cap *= 2; int* nd = new int[cap];
            for (int i = 0; i < sz; i++) nd[i] = data[i];
            delete[] data; data = nd;
        }
        data[sz++] = x;
    }
    void insertAt(int idx, int x) {          // O(n): shift right
        push_back(0);
        for (int i = sz - 1; i > idx; i--) data[i] = data[i - 1];
        data[idx] = x;
    }
    void eraseAt(int idx) { for (int i = idx; i < sz - 1; i++) data[i] = data[i + 1]; sz--; }
    int& operator[](int i) { return data[i]; }
    int size() const { return sz; }
};
```
```py
class DynArray:
    def __init__(self): self.cap, self.sz, self.data = 1, 0, [None]
    def push_back(self, x):
        if self.sz == self.cap:
            self.cap *= 2
            nd = [None] * self.cap
            for i in range(self.sz): nd[i] = self.data[i]
            self.data = nd
        self.data[self.sz] = x; self.sz += 1
    def insert_at(self, idx, x):
        self.push_back(None)
        for i in range(self.sz - 1, idx, -1): self.data[i] = self.data[i - 1]
        self.data[idx] = x
    def erase_at(self, idx):
        for i in range(idx, self.sz - 1): self.data[i] = self.data[i + 1]
        self.sz -= 1
    def __getitem__(self, i): return self.data[i]
```
| Operation | Cost | Why |
|---|---|---|
| access a[i] | O(1) | address arithmetic |
| push_back | O(1) amortised | doubling |
| insert / erase middle | O(n) | shifting |
| search unsorted | O(n) | scan |
| search sorted | O(log n) | binary search |
### 2D arrays (matrices)
- Stored **row-major** in C/C++: a[i][j] is at base + (i x cols + j) x size. Loop rows outside, columns inside for cache speed.
@grid 1 2 3 / 4 5 6 / 7 8 9 :: 3 x 3 matrix, a[1][2] = 6
### Prefix sums
- pre[i] = a[0] + ... + a[i-1]. Any range sum a[l..r] = pre[r+1] - pre[l] in O(1) after O(n) building.
```cpp
vector<long long> prefix(vector<int>& a) { vector<long long> p(a.size() + 1, 0); for (int i = 0; i < (int)a.size(); i++) p[i + 1] = p[i] + a[i]; return p; }
```
```py
from itertools import accumulate
def prefix(a): return [0] + list(accumulate(a))
```
## Strings
- A string is an array of characters. ASCII: 'A' = 65, 'a' = 97, '0' = 48. Unicode/UTF-8 uses 1-4 bytes per character.
- C++ `std::string` is mutable. Python and Java strings are **immutable** - every change creates a new string, so build with a list / StringBuilder and join.
- Common operations: length O(1), substring O(k), compare O(n), find naive O(n x m), KMP O(n + m).
```cpp
string s = "hello";  s += " world";  s.substr(0, 5);  s.find("wor");  reverse(s.begin(), s.end());
```
```py
s = "hello"; s = s + " world"; s[0:5]; s.find("wor"); s[::-1]; "".join(["a", "b"])
```
## Linked Lists
### Singly linked list
- Nodes scattered in memory, each storing a value and a pointer to the next node.
@chain head -> 5 -> 8 -> 12 -> NULL :: Singly linked list
### Doubly and circular linked lists
- Doubly: each node also has `prev`, so we can move backwards and delete a known node in O(1). Circular: the last node points back to the head (round-robin scheduling, playlists).
@chain NULL <-> 5 <-> 8 <-> 12 <-> NULL :: Doubly linked list
```cpp
struct Node { int val; Node* next; Node(int v) : val(v), next(nullptr) {} };
class LinkedList {
    Node* head = nullptr; int sz = 0;
public:
    void pushFront(int x) { Node* n = new Node(x); n->next = head; head = n; sz++; }        // O(1)
    void pushBack(int x) {                                                                   // O(n)
        Node* n = new Node(x);
        if (!head) { head = n; sz++; return; }
        Node* c = head; while (c->next) c = c->next; c->next = n; sz++;
    }
    bool remove(int x) {                                                                     // O(n)
        Node dummy(0); dummy.next = head; Node* c = &dummy;
        while (c->next && c->next->val != x) c = c->next;
        if (!c->next) return false;
        Node* del = c->next; c->next = del->next; delete del; head = dummy.next; sz--; return true;
    }
    void reverse() {                                                                         // O(n)
        Node *prev = nullptr, *cur = head;
        while (cur) { Node* nx = cur->next; cur->next = prev; prev = cur; cur = nx; }
        head = prev;
    }
    void print() { for (Node* c = head; c; c = c->next) cout << c->val << " -> "; cout << "NULL\n"; }
};
```
```py
class Node:
    def __init__(self, val): self.val, self.next = val, None
class LinkedList:
    def __init__(self): self.head, self.sz = None, 0
    def push_front(self, x):
        n = Node(x); n.next = self.head; self.head = n; self.sz += 1
    def push_back(self, x):
        n = Node(x)
        if not self.head: self.head = n
        else:
            c = self.head
            while c.next: c = c.next
            c.next = n
        self.sz += 1
    def remove(self, x):
        dummy = Node(0); dummy.next = self.head; c = dummy
        while c.next and c.next.val != x: c = c.next
        if not c.next: return False
        c.next = c.next.next; self.head = dummy.next; self.sz -= 1; return True
    def reverse(self):
        prev, cur = None, self.head
        while cur: cur.next, prev, cur = prev, cur, cur.next
        self.head = prev
    def __iter__(self):
        c = self.head
        while c: yield c.val; c = c.next
```
| Operation | Singly | Doubly |
|---|---|---|
| insert at head | O(1) | O(1) |
| insert at tail | O(n), O(1) with tail pointer | O(1) with tail |
| delete given node | O(n) (need previous) | O(1) |
| search | O(n) | O(n) |
## Stack (LIFO)
- Last In, First Out. Operations push, pop, top - all O(1). Implemented with a dynamic array or a linked list.
- Uses: function call stack, undo/redo, browser back button, balanced brackets, expression evaluation, DFS, monotonic stack problems.
@stack 40 30 20 10 :: push adds on top, pop removes from top
```cpp
template <typename T> class Stack {
    vector<T> a;
public:
    void push(const T& x) { a.push_back(x); }
    void pop() { if (a.empty()) throw runtime_error("underflow"); a.pop_back(); }
    T& top() { if (a.empty()) throw runtime_error("empty"); return a.back(); }
    bool empty() const { return a.empty(); }
    size_t size() const { return a.size(); }
};
// evaluate a postfix expression "23*5+" = 11
int evalPostfix(const string& s) {
    stack<int> st;
    for (char c : s) {
        if (isdigit(c)) { st.push(c - '0'); continue; }
        int b = st.top(); st.pop(); int a = st.top(); st.pop();
        st.push(c == '+' ? a + b : c == '-' ? a - b : c == '*' ? a * b : a / b);
    }
    return st.top();
}
```
```py
class Stack:
    def __init__(self): self.a = []
    def push(self, x): self.a.append(x)
    def pop(self):
        if not self.a: raise IndexError("underflow")
        return self.a.pop()
    def top(self): return self.a[-1]
    def empty(self): return not self.a
def eval_postfix(s):
    st = []
    for c in s:
        if c.isdigit(): st.append(int(c)); continue
        b, a = st.pop(), st.pop()
        st.append({'+': a + b, '-': a - b, '*': a * b, '/': a // b}[c])
    return st[-1]
```
## Queue (FIFO), Circular Queue and Deque
- First In, First Out: enqueue at the rear, dequeue at the front, both O(1).
- **Circular queue**: an array where rear and front wrap around with modulo, so freed slots are reused.
- **Deque** (double-ended queue): push and pop at both ends in O(1). Used for sliding window maximum and 0-1 BFS.
- **Priority queue**: the element with the highest priority leaves first - implemented with a heap (below).
@chain front -> 7 -> 3 -> 9 -> rear :: Queue: dequeue at front, enqueue at rear
@cells 9 _ _ 7^front 3^rear :: Circular queue: indices wrap around with (i + 1) % capacity
```cpp
class CircularQueue {
    vector<int> a; int front = 0, cnt = 0;
public:
    CircularQueue(int cap) : a(cap) {}
    bool enqueue(int x) { if (cnt == (int)a.size()) return false; a[(front + cnt) % a.size()] = x; cnt++; return true; }
    bool dequeue() { if (!cnt) return false; front = (front + 1) % a.size(); cnt--; return true; }
    int peek() { return cnt ? a[front] : -1; }
    bool empty() { return cnt == 0; }
};
// STL: queue<int> q; deque<int> dq; dq.push_front(1); dq.push_back(2); dq.pop_front();
```
```py
class CircularQueue:
    def __init__(self, cap): self.a, self.front, self.cnt = [0] * cap, 0, 0
    def enqueue(self, x):
        if self.cnt == len(self.a): return False
        self.a[(self.front + self.cnt) % len(self.a)] = x; self.cnt += 1; return True
    def dequeue(self):
        if not self.cnt: return False
        self.front = (self.front + 1) % len(self.a); self.cnt -= 1; return True
    def peek(self): return self.a[self.front] if self.cnt else -1
from collections import deque
dq = deque(); dq.append(1); dq.appendleft(0); dq.popleft(); dq.pop()
```
## Hashing and Hash Tables
### How a hash table works
- A **hash function** turns a key into an index: index = hash(key) % capacity. Insert, find and delete are O(1) on average.
- **Collision** = two keys map to the same bucket. Handled by **chaining** (each bucket holds a small list) or **open addressing** (probe the next free slot: linear, quadratic, double hashing).
- **Load factor** = items / buckets. When it passes ~0.75 the table doubles and **rehashes** everything (amortised O(1)).
- Worst case O(n) when all keys collide. Ordered maps (balanced BST) guarantee O(log n) and keep keys sorted.
@chain key "cat" -> hash("cat") = 7 -> 7 % 8 = bucket 7 -> value :: Hash table lookup
@grid 0: _ / 1: apple / 2: _ / 3: cat, dog* :: Chaining: cat and dog collide in bucket 3
```cpp
class HashMap {                                   // separate chaining
    vector<list<pair<string,int>>> buckets; int sz = 0;
    size_t idx(const string& k) const { return hash<string>{}(k) % buckets.size(); }
    void rehash() {
        auto old = buckets; buckets.assign(old.size() * 2, {}); sz = 0;
        for (auto& b : old) for (auto& [k, v] : b) put(k, v);
    }
public:
    HashMap() : buckets(8) {}
    void put(const string& k, int v) {
        for (auto& p : buckets[idx(k)]) if (p.first == k) { p.second = v; return; }
        buckets[idx(k)].push_back({k, v}); sz++;
        if (sz > (int)buckets.size() * 3 / 4) rehash();
    }
    bool get(const string& k, int& out) const {
        for (auto& p : buckets[idx(k)]) if (p.first == k) { out = p.second; return true; }
        return false;
    }
    void erase(const string& k) { auto& b = buckets[idx(k)]; for (auto it = b.begin(); it != b.end(); ++it) if (it->first == k) { b.erase(it); sz--; return; } }
};
```
```py
class HashMap:
    def __init__(self): self.buckets, self.sz = [[] for _ in range(8)], 0
    def _idx(self, k): return hash(k) % len(self.buckets)
    def put(self, k, v):
        b = self.buckets[self._idx(k)]
        for p in b:
            if p[0] == k: p[1] = v; return
        b.append([k, v]); self.sz += 1
        if self.sz > len(self.buckets) * 3 // 4:
            old = [p for b in self.buckets for p in b]
            self.buckets, self.sz = [[] for _ in range(len(self.buckets) * 2)], 0
            for k2, v2 in old: self.put(k2, v2)
    def get(self, k, default=None):
        for p in self.buckets[self._idx(k)]:
            if p[0] == k: return p[1]
        return default
    def erase(self, k):
        b = self.buckets[self._idx(k)]
        for i, p in enumerate(b):
            if p[0] == k: b.pop(i); self.sz -= 1; return
```
| Structure | C++ | Java | Python |
|---|---|---|---|
| hash map | unordered_map | HashMap | dict |
| hash set | unordered_set | HashSet | set |
| sorted map | map | TreeMap | sortedcontainers.SortedDict |
## Trees and Binary Trees
### Terminology
- **Root** (top), **parent / child**, **leaf** (no children), **sibling**, **ancestor / descendant**, **subtree**.
- **Depth** of a node = edges from the root. **Height** of a tree = longest root-to-leaf path. A tree with n nodes has n - 1 edges.
- Binary tree: at most 2 children. Max nodes at level k = 2^k; a perfect tree of height h has 2^(h+1) - 1 nodes.
@tree 1(2(4,5),3(6,7)) :: Perfect binary tree of height 2
### Traversals (DFS: pre / in / post, BFS: level)
| Traversal | Order | Result on the tree above |
|---|---|---|
| Preorder | Root L R | 1 2 4 5 3 6 7 |
| Inorder | L Root R | 4 2 5 1 6 3 7 |
| Postorder | L R Root | 4 5 2 6 7 3 1 |
| Level order | by levels | 1 2 3 4 5 6 7 |
```cpp
struct TreeNode { int val; TreeNode *left = nullptr, *right = nullptr; TreeNode(int v) : val(v) {} };
void preorder(TreeNode* r)  { if (!r) return; cout << r->val << " "; preorder(r->left); preorder(r->right); }
void inorder(TreeNode* r)   { if (!r) return; inorder(r->left); cout << r->val << " "; inorder(r->right); }
void postorder(TreeNode* r) { if (!r) return; postorder(r->left); postorder(r->right); cout << r->val << " "; }
void levelOrder(TreeNode* r) {
    if (!r) return; queue<TreeNode*> q; q.push(r);
    while (!q.empty()) { TreeNode* n = q.front(); q.pop(); cout << n->val << " "; if (n->left) q.push(n->left); if (n->right) q.push(n->right); }
}
int height(TreeNode* r) { return r ? 1 + max(height(r->left), height(r->right)) : 0; }
```
```py
class TreeNode:
    def __init__(self, val, left=None, right=None): self.val, self.left, self.right = val, left, right
def preorder(r):  return [r.val] + preorder(r.left) + preorder(r.right) if r else []
def inorder(r):   return inorder(r.left) + [r.val] + inorder(r.right) if r else []
def postorder(r): return postorder(r.left) + postorder(r.right) + [r.val] if r else []
def level_order(r):
    from collections import deque
    out, q = [], deque([r] if r else [])
    while q:
        n = q.popleft(); out.append(n.val)
        if n.left: q.append(n.left)
        if n.right: q.append(n.right)
    return out
def height(r): return 1 + max(height(r.left), height(r.right)) if r else 0
```
TC: O(n) for every traversal. SC: O(h) for DFS, O(width) for BFS.
## Binary Search Tree (BST)
- For every node: left subtree values < node < right subtree values. Inorder traversal gives sorted order.
- Search / insert / delete take O(h): O(log n) when balanced, O(n) when skewed (inserting sorted data creates a "linked list").
@tree 50(30(20,40),70(60,80)) :: BST: search 60 -> 50 -> 70 -> 60

### BST Node Deletion Cases
- **Case 1 (Leaf Node - 0 children):** Simply remove the node and set parent link to null.
@tree 50(30(20*,40),70) :: Case 1: Delete leaf 20 -> unlink directly from parent 30
@tree 50(30(,40),70) :: Result: node 20 removed, 30 now has only right child 40

- **Case 2 (Single Child - 1 child):** Bypass the deleted node by linking parent directly to its only child.
@tree 50(30*(,40),70) :: Case 2: Delete node 30 (has only right child 40)
@tree 50(40*,70) :: Result: parent 50 adopts child 40 directly

- **Case 3 (Two Children):** Replace the node's key with its **inorder successor** (smallest in right subtree) or **inorder predecessor** (largest in left subtree), then recursively delete that successor.
@tree 50*(30(20,40),70(60*,80)) :: Case 3: Delete node 50 with 2 children -> find inorder successor 60
@tree 60*(30(20,40),70(,80)) :: Result: copy 60 to root, delete original node 60 from right subtree
```cpp
class BST {
    TreeNode* root = nullptr;
    TreeNode* ins(TreeNode* n, int x) { if (!n) return new TreeNode(x); if (x < n->val) n->left = ins(n->left, x); else if (x > n->val) n->right = ins(n->right, x); return n; }
    TreeNode* del(TreeNode* n, int x) {
        if (!n) return nullptr;
        if (x < n->val) n->left = del(n->left, x);
        else if (x > n->val) n->right = del(n->right, x);
        else {
            if (!n->left) { TreeNode* r = n->right; delete n; return r; }
            if (!n->right) { TreeNode* l = n->left; delete n; return l; }
            TreeNode* s = n->right; while (s->left) s = s->left;           // inorder successor
            n->val = s->val; n->right = del(n->right, s->val);
        }
        return n;
    }
public:
    void insert(int x) { root = ins(root, x); }
    void erase(int x) { root = del(root, x); }
    bool contains(int x) { TreeNode* n = root; while (n) { if (x == n->val) return true; n = x < n->val ? n->left : n->right; } return false; }
};
```
```py
class BST:
    def __init__(self): self.root = None
    def insert(self, x):
        def ins(n):
            if not n: return TreeNode(x)
            if x < n.val: n.left = ins(n.left)
            elif x > n.val: n.right = ins(n.right)
            return n
        self.root = ins(self.root)
    def contains(self, x):
        n = self.root
        while n:
            if x == n.val: return True
            n = n.left if x < n.val else n.right
        return False
    def erase(self, x):
        def dele(n, x):
            if not n: return None
            if x < n.val: n.left = dele(n.left, x)
            elif x > n.val: n.right = dele(n.right, x)
            else:
                if not n.left: return n.right
                if not n.right: return n.left
                s = n.right
                while s.left: s = s.left
                n.val = s.val; n.right = dele(n.right, s.val)
            return n
        self.root = dele(self.root, x)
```
## Balanced Trees: AVL, Red-Black, B-Tree, B+ Tree
### AVL tree
- A self-balancing BST: for every node `|height(left) - height(right)| <= 1` (the **balance factor**, BF). After insert/delete, fix with **rotations**. Height stays at most ~1.44 log n, so all operations remain strictly **O(log n)**.
- **4 Rotation Cases:**

**Case 1: Left-Left (LL) Imbalance -> Single Right Rotation**
- Inserted into left subtree of left child. BF(30) = +2, BF(20) = +1. Fix: `rotRight(30)`.
@tree 30*(20(10*,),) :: Case 1 (LL): BF(30) = +2, left heavy at 30 and 20
@tree 20(10,30) :: After rotRight(30): 20 becomes new root, 30 becomes right child

**Case 2: Right-Right (RR) Imbalance -> Single Left Rotation**
- Inserted into right subtree of right child. BF(10) = -2, BF(20) = -1. Fix: `rotLeft(10)`.
@tree 10*(,20(,30*)) :: Case 2 (RR): BF(10) = -2, right heavy at 10 and 20
@tree 20(10,30) :: After rotLeft(10): 20 becomes new root, 10 becomes left child

**Case 3: Left-Right (LR) Imbalance -> Left Rotate Child, Then Right Rotate Root**
- Inserted into right subtree of left child. BF(30) = +2, BF(10) = -1 (zigzag).
- Step 1: `rotLeft(10)` converts LR to LL. Step 2: `rotRight(30)` restores balance.
@tree 30*(10(,20*),) :: Case 3 (LR): BF(30) = +2, BF(10) = -1 (zigzag)
@tree 30*(20(10,),) :: Step 1: rotLeft(10) transforms LR into LL
@tree 20(10,30) :: Step 2: rotRight(30) balances the tree

**Case 4: Right-Left (RL) Imbalance -> Right Rotate Child, Then Left Rotate Root**
- Inserted into left subtree of right child. BF(10) = -2, BF(30) = +1 (zigzag).
- Step 1: `rotRight(30)` converts RL to RR. Step 2: `rotLeft(10)` restores balance.
@tree 10*(,30(20*,)) :: Case 4 (RL): BF(10) = -2, BF(30) = +1 (zigzag)
@tree 10*(,20(,30)) :: Step 1: rotRight(30) transforms RL into RR
@tree 20(10,30) :: Step 2: rotLeft(10) balances the tree
```cpp
struct AVLNode { int key, h = 1; AVLNode *l = nullptr, *r = nullptr; AVLNode(int k) : key(k) {} };
int ht(AVLNode* n) { return n ? n->h : 0; }
void upd(AVLNode* n) { n->h = 1 + max(ht(n->l), ht(n->r)); }
AVLNode* rotRight(AVLNode* y) { AVLNode* x = y->l; y->l = x->r; x->r = y; upd(y); upd(x); return x; }
AVLNode* rotLeft(AVLNode* x) { AVLNode* y = x->r; x->r = y->l; y->l = x; upd(x); upd(y); return y; }
AVLNode* avlInsert(AVLNode* n, int k) {
    if (!n) return new AVLNode(k);
    if (k < n->key) n->l = avlInsert(n->l, k); else if (k > n->key) n->r = avlInsert(n->r, k); else return n;
    upd(n); int bf = ht(n->l) - ht(n->r);
    if (bf > 1 && k < n->l->key) return rotRight(n);                         // LL
    if (bf < -1 && k > n->r->key) return rotLeft(n);                         // RR
    if (bf > 1 && k > n->l->key) { n->l = rotLeft(n->l); return rotRight(n); }   // LR
    if (bf < -1 && k < n->r->key) { n->r = rotRight(n->r); return rotLeft(n); }  // RL
    return n;
}
```
```py
class AVLNode:
    def __init__(self, key): self.key, self.h, self.l, self.r = key, 1, None, None
def ht(n): return n.h if n else 0
def upd(n): n.h = 1 + max(ht(n.l), ht(n.r))
def rot_right(y):
    x = y.l; y.l = x.r; x.r = y; upd(y); upd(x); return x
def rot_left(x):
    y = x.r; x.r = y.l; y.l = x; upd(x); upd(y); return y
def avl_insert(n, k):
    if not n: return AVLNode(k)
    if k < n.key: n.l = avl_insert(n.l, k)
    elif k > n.key: n.r = avl_insert(n.r, k)
    else: return n
    upd(n); bf = ht(n.l) - ht(n.r)
    if bf > 1 and k < n.l.key: return rot_right(n)
    if bf < -1 and k > n.r.key: return rot_left(n)
    if bf > 1: n.l = rot_left(n.l); return rot_right(n)
    if bf < -1: n.r = rot_right(n.r); return rot_left(n)
    return n
```
TC: O(log n) insert / delete / search. SC: O(n).
### Red-Black tree
- Each node is red or black. Rules: root is black; a red node has no red child; every path from a node to its NULL leaves has the same number of black nodes. Result: height <= 2 log(n + 1).
- Fewer rotations than AVL on insert/delete, slightly slower lookups. Used by C++ `std::map/set`, Java `TreeMap`, Linux CFS scheduler.
### B-Tree
- A **multi-way** search tree designed for **disks / databases**: each node holds up to 2t - 1 sorted keys and up to 2t children (t = minimum degree). One node = one disk page (e.g. 4-16 KB), so a lookup reads only a few pages.
- All leaves are at the same depth. Height is O(log_t n): with t = 100, a billion keys need only ~4 levels.
- Insert: go to the leaf; if a node is full, **split** it and push the middle key up. Delete: borrow from a sibling or **merge** nodes.
@tree [30 60]([10 20],[40 50],[70 80 90]) :: B-tree of order 4: keys inside nodes, 3 children
### B+ Tree (what databases really use)
- All values/row pointers live only in the **leaves**; internal nodes store just keys for routing. Leaves are linked left-to-right, so **range scans** (WHERE age BETWEEN 20 AND 30) walk the leaf chain.
- MySQL InnoDB, PostgreSQL indexes, file systems (NTFS, ext4 htree, XFS) use B+ trees.
@chain [10 20] <-> [30 40] <-> [50 60] <-> [70 80] :: B+ tree leaf level linked for range scans
```cpp
// B-tree search (minimum degree t)
struct BTreeNode { vector<int> keys; vector<BTreeNode*> child; bool leaf = true; };
BTreeNode* btreeSearch(BTreeNode* n, int k) {
    int i = 0;
    while (i < (int)n->keys.size() && k > n->keys[i]) i++;
    if (i < (int)n->keys.size() && n->keys[i] == k) return n;
    return n->leaf ? nullptr : btreeSearch(n->child[i], k);
}
```
```py
class BTreeNode:
    def __init__(self, leaf=True): self.keys, self.child, self.leaf = [], [], leaf
def btree_search(n, k):
    i = 0
    while i < len(n.keys) and k > n.keys[i]: i += 1
    if i < len(n.keys) and n.keys[i] == k: return n
    return None if n.leaf else btree_search(n.child[i], k)
```
TC: O(t log_t n) comparisons, O(log_t n) disk reads.
## Heaps (Min Heap and Max Heap)
- A **complete binary tree** stored in an array with the heap property. Min heap: parent <= children, root = minimum. Max heap: parent >= children, root = maximum.
- Index math (0-based): parent = (i - 1) / 2, left = 2i + 1, right = 2i + 2. No pointers needed.
@tree 90(70(40,50),60(30,)) :: Max heap - array [90, 70, 60, 40, 50, 30]
### Insert (sift up)
@flow (append x at the end) | <parent < x ? (max heap) ~ (stop)> | ^swap x with parent :: Insert into max heap
### Extract max (sift down)
@flow (move last element to root) | <a child is bigger? ~ (stop)> | ^swap with bigger child :: Extract from max heap
```cpp
class MaxHeap {
    vector<int> h;
    void up(int i) { while (i && h[(i - 1) / 2] < h[i]) { swap(h[i], h[(i - 1) / 2]); i = (i - 1) / 2; } }
    void down(int i) {
        int n = h.size();
        while (true) {
            int b = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && h[l] > h[b]) b = l;
            if (r < n && h[r] > h[b]) b = r;
            if (b == i) return;
            swap(h[i], h[b]); i = b;
        }
    }
public:
    MaxHeap() {}
    MaxHeap(vector<int> a) : h(a) { for (int i = (int)h.size() / 2 - 1; i >= 0; i--) down(i); }   // build O(n)
    void push(int x) { h.push_back(x); up(h.size() - 1); }
    int top() { return h[0]; }
    void pop() { h[0] = h.back(); h.pop_back(); if (!h.empty()) down(0); }
    bool empty() { return h.empty(); }
};
class MinHeap {                                    // same idea, comparisons flipped
    priority_queue<int, vector<int>, greater<int>> pq;
public:
    void push(int x) { pq.push(x); } int top() { return pq.top(); } void pop() { pq.pop(); }
};
```
```py
class MaxHeap:
    def __init__(self, a=None):
        self.h = list(a or [])
        for i in range(len(self.h) // 2 - 1, -1, -1): self._down(i)
    def _up(self, i):
        while i and self.h[(i - 1) // 2] < self.h[i]:
            p = (i - 1) // 2; self.h[i], self.h[p] = self.h[p], self.h[i]; i = p
    def _down(self, i):
        n = len(self.h)
        while True:
            b, l, r = i, 2 * i + 1, 2 * i + 2
            if l < n and self.h[l] > self.h[b]: b = l
            if r < n and self.h[r] > self.h[b]: b = r
            if b == i: return
            self.h[i], self.h[b] = self.h[b], self.h[i]; i = b
    def push(self, x): self.h.append(x); self._up(len(self.h) - 1)
    def top(self): return self.h[0]
    def pop(self):
        self.h[0] = self.h[-1]; self.h.pop()
        if self.h: self._down(0)
import heapq                                         # Python's heapq is a MIN heap
h = []; heapq.heappush(h, 5); heapq.heappush(h, 1); heapq.heappop(h)   # -> 1
```
| Operation | Cost | Why |
|---|---|---|
| top | O(1) | root |
| push / pop | O(log n) | one path of height log n |
| build from array | O(n) | most nodes are near the bottom |
| heap sort | O(n log n) | n pops |
- Uses: priority queues, Dijkstra, Prim, k largest/smallest, merge k sorted lists, median of a stream, task schedulers.
## Trie (Prefix Tree)
- Stores strings character by character; common prefixes share nodes. Insert / search / startsWith in O(L) for a word of length L.
- Uses: autocomplete, spell check, IP routing (longest prefix match), word games, max XOR.
@tree root(c(a(t*,r*)),d(o(g*))) :: Trie with cat, car, dog
```cpp
struct Trie {
    Trie* ch[26] = {}; bool end = false;
    void insert(const string& w) { Trie* n = this; for (char c : w) { if (!n->ch[c - 'a']) n->ch[c - 'a'] = new Trie(); n = n->ch[c - 'a']; } n->end = true; }
    Trie* find(const string& w) { Trie* n = this; for (char c : w) { n = n->ch[c - 'a']; if (!n) return nullptr; } return n; }
    bool search(const string& w) { Trie* n = find(w); return n && n->end; }
    bool startsWith(const string& p) { return find(p) != nullptr; }
};
```
```py
class Trie:
    def __init__(self): self.ch, self.end = {}, False
    def insert(self, w):
        n = self
        for c in w: n = n.ch.setdefault(c, Trie())
        n.end = True
    def _find(self, w):
        n = self
        for c in w:
            n = n.ch.get(c)
            if not n: return None
        return n
    def search(self, w): n = self._find(w); return bool(n and n.end)
    def starts_with(self, p): return self._find(p) is not None
```
## Graphs
### Terminology and types
- Vertices + edges. Directed / undirected, weighted / unweighted, cyclic / acyclic (DAG), connected / disconnected, dense / sparse.
- A tree is a connected acyclic graph. A bipartite graph splits into two groups with edges only across.
@graph A-B:4 A-C:2 B-C:1 B-D:5 C-D:8 C-E:10 D-E:2 :: Weighted undirected graph
@graph 1>2 1>3 2>4 3>4 4>5 :: Directed acyclic graph (DAG)
### Representations
```cpp
int n = 5;
vector<vector<int>> mat(n, vector<int>(n, 0));        // adjacency matrix: O(V^2) space
vector<vector<pair<int,int>>> adj(n);                 // adjacency list: O(V + E) space
void addEdge(int u, int v, int w) { mat[u][v] = mat[v][u] = w; adj[u].push_back({v, w}); adj[v].push_back({u, w}); }
```
```py
n = 5
mat = [[0] * n for _ in range(n)]
adj = [[] for _ in range(n)]
def add_edge(u, v, w):
    mat[u][v] = mat[v][u] = w
    adj[u].append((v, w)); adj[v].append((u, w))
```
### BFS (Breadth First Search)
- Explores neighbours level by level with a **queue**. Finds the shortest path (fewest edges) in an unweighted graph.
@graph 0-1 0-2 1-3 2-3 3-4 :: BFS from 0 visits 0 | 1 2 | 3 | 4 (levels)
@flow (enqueue start, mark visited) | <queue empty? ~ (all reachable nodes visited)> | u = dequeue, process u | ^enqueue every unvisited neighbour, mark it :: BFS algorithm
```cpp
vector<int> bfsDist(int src, vector<vector<int>>& g) {
    vector<int> dist(g.size(), -1); queue<int> q; q.push(src); dist[src] = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : g[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    return dist;
}
```
```py
from collections import deque
def bfs_dist(src, g):
    dist = [-1] * len(g); dist[src] = 0; q = deque([src])
    while q:
        u = q.popleft()
        for v in g[u]:
            if dist[v] == -1: dist[v] = dist[u] + 1; q.append(v)
    return dist
```
### DFS (Depth First Search)
- Goes deep along one path, backtracks when stuck - recursion or an explicit **stack**. Used for components, cycle detection, topological sort, path finding, bridges, SCC.
@graph 0-1 0-2 1-3 2-3 3-4 :: DFS from 0 (recursive): 0 1 3 2 4
```cpp
void dfsRec(int u, vector<vector<int>>& g, vector<bool>& vis, vector<int>& out) {
    vis[u] = true; out.push_back(u);
    for (int v : g[u]) if (!vis[v]) dfsRec(v, g, vis, out);
}
vector<int> dfsIter(int src, vector<vector<int>>& g) {
    vector<bool> vis(g.size(), false); vector<int> out; stack<int> st; st.push(src);
    while (!st.empty()) {
        int u = st.top(); st.pop();
        if (vis[u]) continue;
        vis[u] = true; out.push_back(u);
        for (int i = (int)g[u].size() - 1; i >= 0; i--) if (!vis[g[u][i]]) st.push(g[u][i]);
    }
    return out;
}
```
```py
def dfs_rec(u, g, vis, out):
    vis[u] = True; out.append(u)
    for v in g[u]:
        if not vis[v]: dfs_rec(v, g, vis, out)
def dfs_iter(src, g):
    vis, out, st = [False] * len(g), [], [src]
    while st:
        u = st.pop()
        if vis[u]: continue
        vis[u] = True; out.append(u)
        for v in reversed(g[u]):
            if not vis[v]: st.append(v)
    return out
```
| | BFS | DFS |
|---|---|---|
| structure | queue | stack / recursion |
| shortest path (unweighted) | yes | no |
| memory | O(width) | O(depth) |
| typical uses | levels, nearest, multi-source | cycles, topo sort, components, backtracking |
### All graph algorithms at a glance
| Algorithm | Problem | Time |
|---|---|---|
| BFS / DFS | traversal, components | O(V + E) |
| Topological sort (Kahn / DFS) | ordering in a DAG | O(V + E) |
| Dijkstra | single-source shortest path, w >= 0 | O(E log V) |
| Bellman-Ford | negative edges, detect negative cycles | O(V E) |
| Floyd-Warshall | all-pairs shortest paths | O(V^3) |
| 0-1 BFS | weights 0 or 1 | O(V + E) |
| A* | shortest path with a heuristic (maps, games) | depends on heuristic |
| Prim / Kruskal | minimum spanning tree | O(E log V) |
| Union-Find (DSU) | dynamic connectivity | ~O(1) per op |
| Kosaraju / Tarjan | strongly connected components | O(V + E) |
| Tarjan bridges / articulation points | critical edges / nodes | O(V + E) |
| Bipartite check | 2-colouring | O(V + E) |
| Ford-Fulkerson / Edmonds-Karp | maximum flow | O(V E^2) |
All of these are implemented step by step in notebook 11 (Graphs section).
### Dijkstra in short
```cpp
vector<long long> dijkstra(int src, vector<vector<pair<int,int>>>& adj) {
    vector<long long> d(adj.size(), LLONG_MAX); d[src] = 0;
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq; pq.push({0, src});
    while (!pq.empty()) {
        auto [du, u] = pq.top(); pq.pop();
        if (du > d[u]) continue;
        for (auto [v, w] : adj[u]) if (du + w < d[v]) { d[v] = du + w; pq.push({d[v], v}); }
    }
    return d;
}
```
```py
import heapq
def dijkstra(src, adj):
    d = [float('inf')] * len(adj); d[src] = 0; pq = [(0, src)]
    while pq:
        du, u = heapq.heappop(pq)
        if du > d[u]: continue
        for v, w in adj[u]:
            if du + w < d[v]: d[v] = du + w; heapq.heappush(pq, (d[v], v))
    return d
```
## Disjoint Set Union (Union-Find)
- Keeps a collection of disjoint sets. `find(x)` gives the set leader, `union(a, b)` merges sets. With **path compression + union by rank/size** each operation is almost O(1) (inverse Ackermann).
- Uses: Kruskal's MST, detecting cycles in undirected graphs, connected components online, account merging, image segmentation.
@tree 1(2,3(4,5)) :: One set: leader 1. find(5) compresses 5 to point directly at 1
```cpp
struct DSU {
    vector<int> p, r;
    DSU(int n) : p(n), r(n, 0) { iota(p.begin(), p.end(), 0); }
    int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }
    bool unite(int a, int b) {
        a = find(a); b = find(b); if (a == b) return false;
        if (r[a] < r[b]) swap(a, b); p[b] = a; if (r[a] == r[b]) r[a]++; return true;
    }
};
```
```py
class DSU:
    def __init__(self, n): self.p, self.r = list(range(n)), [0] * n
    def find(self, x):
        while self.p[x] != x: self.p[x] = self.p[self.p[x]]; x = self.p[x]
        return x
    def unite(self, a, b):
        a, b = self.find(a), self.find(b)
        if a == b: return False
        if self.r[a] < self.r[b]: a, b = b, a
        self.p[b] = a; self.r[a] += self.r[a] == self.r[b]; return True
```
## Segment Tree and Fenwick Tree (range queries)
- Problem: many queries "sum/min of a[l..r]" mixed with updates "a[i] = x". Prefix sums need O(n) per update; a **segment tree** does both in O(log n).
- Each node stores the answer for a segment; children split it in half. Built in O(n), 4n array size.
- **Fenwick tree (Binary Indexed Tree)**: simpler, for prefix sums with point updates, uses i & -i to jump.
@tree 0..3 = 10(0..1 = 3(a0 = 1,a1 = 2),2..3 = 7(a2 = 3,a3 = 4)) :: Segment tree for sums of [1, 2, 3, 4]
```cpp
class SegTree {
    int n; vector<long long> t;
    void build(vector<int>& a, int node, int l, int r) {
        if (l == r) { t[node] = a[l]; return; }
        int m = (l + r) / 2; build(a, 2 * node, l, m); build(a, 2 * node + 1, m + 1, r);
        t[node] = t[2 * node] + t[2 * node + 1];
    }
    void update(int node, int l, int r, int i, int v) {
        if (l == r) { t[node] = v; return; }
        int m = (l + r) / 2;
        if (i <= m) update(2 * node, l, m, i, v); else update(2 * node + 1, m + 1, r, i, v);
        t[node] = t[2 * node] + t[2 * node + 1];
    }
    long long query(int node, int l, int r, int ql, int qr) {
        if (qr < l || r < ql) return 0;
        if (ql <= l && r <= qr) return t[node];
        int m = (l + r) / 2;
        return query(2 * node, l, m, ql, qr) + query(2 * node + 1, m + 1, r, ql, qr);
    }
public:
    SegTree(vector<int>& a) : n(a.size()), t(4 * a.size()) { build(a, 1, 0, n - 1); }
    void update(int i, int v) { update(1, 0, n - 1, i, v); }
    long long query(int l, int r) { return query(1, 0, n - 1, l, r); }
};
struct Fenwick {
    vector<long long> f; Fenwick(int n) : f(n + 1, 0) {}
    void add(int i, long long v) { for (i++; i < (int)f.size(); i += i & -i) f[i] += v; }
    long long prefix(int i) { long long s = 0; for (i++; i > 0; i -= i & -i) s += f[i]; return s; }   // sum a[0..i]
};
```
```py
class SegTree:
    def __init__(self, a):
        self.n = len(a); self.t = [0] * (2 * self.n)
        self.t[self.n:] = a
        for i in range(self.n - 1, 0, -1): self.t[i] = self.t[2 * i] + self.t[2 * i + 1]
    def update(self, i, v):
        i += self.n; self.t[i] = v
        while i > 1: i //= 2; self.t[i] = self.t[2 * i] + self.t[2 * i + 1]
    def query(self, l, r):                   # inclusive l..r
        s, l, r = 0, l + self.n, r + self.n + 1
        while l < r:
            if l & 1: s += self.t[l]; l += 1
            if r & 1: r -= 1; s += self.t[r]
            l //= 2; r //= 2
        return s
class Fenwick:
    def __init__(self, n): self.f = [0] * (n + 1)
    def add(self, i, v):
        i += 1
        while i < len(self.f): self.f[i] += v; i += i & -i
    def prefix(self, i):
        i += 1; s = 0
        while i > 0: s += self.f[i]; i -= i & -i
        return s
```
TC: build O(n), update O(log n), query O(log n). SC: O(n).
## Other structures worth knowing
- **Skip list**: sorted linked list with express lanes; O(log n) expected search (used in Redis sorted sets).
- **Bloom filter**: bit array + k hash functions; answers "definitely not present" or "maybe present" with tiny memory (used by databases and caches to skip disk reads).
- **LRU cache**: hash map + doubly linked list, O(1) get/put (notebook 11).
- **Sparse table**: O(1) range-min queries on a static array after O(n log n) preprocessing.
- **Suffix array / suffix tree**: fast substring search over large texts.
- **Graph databases** store adjacency directly (notebook 06).
## Searching and Sorting Algorithms
### Searching
| Algorithm | Needs | Time |
|---|---|---|
| Linear search | nothing | O(n) |
| Binary search | sorted data | O(log n) |
| Hash lookup | hash table | O(1) average |
| BST / B-tree lookup | balanced tree | O(log n) |
### Sorting
| Algorithm | Best | Average | Worst | Space | Stable | Note |
|---|---|---|---|---|---|---|
| Bubble | n | n^2 | n^2 | 1 | yes | teaching only |
| Selection | n^2 | n^2 | n^2 | 1 | no | fewest swaps |
| Insertion | n | n^2 | n^2 | 1 | yes | small / nearly sorted |
| Merge | n log n | n log n | n log n | n | yes | linked lists, external sort |
| Quick | n log n | n log n | n^2 | log n | no | fastest in practice |
| Heap | n log n | n log n | n log n | 1 | no | guaranteed, in place |
| Counting | n + k | n + k | n + k | k | yes | small integer range |
| Radix | d(n + b) | d(n + b) | d(n + b) | n + b | yes | fixed-length keys |
- **Stable** = equal elements keep their original order (matters when sorting records by a second key).
- Library sorts: C++ `std::sort` = introsort (quick + heap + insertion), Python `sorted` and Java objects = **Timsort** (merge + insertion, O(n) on sorted input).
```cpp
void countingSort(vector<int>& a, int maxVal) {
    vector<int> cnt(maxVal + 1, 0);
    for (int x : a) cnt[x]++;
    int i = 0; for (int v = 0; v <= maxVal; v++) while (cnt[v]--) a[i++] = v;
}
```
```py
def counting_sort(a, max_val):
    cnt = [0] * (max_val + 1)
    for x in a: cnt[x] += 1
    return [v for v in range(max_val + 1) for _ in range(cnt[v])]
```
## Algorithm Design Paradigms
| Paradigm | Idea | Examples |
|---|---|---|
| Brute force | try everything | all pairs, all subsets |
| Divide and conquer | split, solve parts, combine | merge sort, quick sort, binary search |
| Greedy | best local choice | activity selection, Huffman, Dijkstra, Kruskal |
| Dynamic programming | remember overlapping sub-problems | knapsack, LCS, edit distance |
| Backtracking | build, check, undo | N queens, sudoku, permutations |
| Two pointers / sliding window | move boundaries smartly | pair sum, longest substring |
| Graph search | BFS / DFS over states | islands, word ladder |
| Bit manipulation | use binary tricks | single number, subsets via masks |
## Choosing the right data structure
| Need | Use |
|---|---|
| fast index access | array / vector |
| fast insert/delete at ends | deque, linked list |
| LIFO / undo / matching brackets | stack |
| FIFO / BFS / buffering | queue |
| O(1) lookup by key | hash map |
| sorted data with insert/delete | balanced BST (map/set), skip list |
| always get min or max fast | heap / priority queue |
| prefix search | trie |
| range sum/min with updates | segment tree / Fenwick |
| relationships / networks | graph |
| on-disk index | B+ tree |
| dynamic connectivity | union-find |
## Interview Questions on Data Structures
Q: Array vs linked list - when do you choose which?
A: Array for random access and cache-friendly scanning; linked list when you insert/delete at known positions very often and never need index access.
Q: Why is hash map lookup O(1) only on average?
A: Collisions put several keys in one bucket; with a bad hash or adversarial keys all keys collide and lookup becomes O(n). Good hashing + resizing keeps buckets tiny.
Q: Why do databases use B+ trees instead of binary search trees?
A: A B+ tree node holds hundreds of keys = one disk page, so the tree is only 3-4 levels deep (few disk reads), and linked leaves make range queries fast.
Q: How do you build a heap in O(n)?
A: Sift down from the last internal node to the root; nodes at height h do O(h) work and there are n / 2^(h+1) of them, which sums to O(n).
Q: Stack using queues and queue using stacks?
A: Solved in notebook 11 (Stack / Queue implementation section) with amortised analysis.
Q: Difference between BFS and DFS, and when BFS fails for shortest path?
A: BFS gives shortest paths only when all edges cost the same; with weights use Dijkstra (non-negative) or Bellman-Ford (negative).
Q: What is the time complexity of inserting into std::map vs unordered_map?
A: map (red-black tree) O(log n) always; unordered_map O(1) average, O(n) worst.
Q: How does an LRU cache achieve O(1)?
A: Hash map from key to a node in a doubly linked list; moving a node to the front and removing the tail are O(1) pointer changes.
