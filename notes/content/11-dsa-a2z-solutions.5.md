## Stack / Queues: Implementation
### Implementation using different DS (theory)
- **Stack** = LIFO (Last In First Out) - like a pile of plates. Operations: push, pop, top/peek, isEmpty - all O(1).
- **Queue** = FIFO (First In First Out) - like a line at a counter. Operations: push (enqueue at rear), pop (dequeue from front), front - all O(1).
- Uses of a stack: function calls, undo, bracket matching, expression evaluation, DFS. Uses of a queue: scheduling, BFS, buffers.
@stack 30 20 10 :: Stack: push and pop happen at the top
@chain front -> 10 -> 20 -> 30 -> rear :: Queue: remove at the front, add at the rear
### Implement Stack using Arrays
```cpp
class ArrayStack {
    vector<int> a; int topIdx = -1;
public:
    ArrayStack(int cap = 1000) : a(cap) {}
    void push(int x) { if (topIdx + 1 == (int)a.size()) a.resize(a.size() * 2); a[++topIdx] = x; }
    int pop() { return topIdx < 0 ? -1 : a[topIdx--]; }
    int top() { return topIdx < 0 ? -1 : a[topIdx]; }
    bool isEmpty() { return topIdx < 0; }
};
```
```py
class ArrayStack:
    def __init__(self): self.a = []
    def push(self, x): self.a.append(x)
    def pop(self): return self.a.pop() if self.a else -1
    def top(self): return self.a[-1] if self.a else -1
    def is_empty(self): return not self.a
```
TC: O(1) per operation. SC: O(n).
### Implement Queue using Arrays (circular)
Idea: keep `front` and `count`; the rear index is (front + count) % capacity, so freed cells at the start are reused.
```cpp
class ArrayQueue {
    vector<int> a; int front = 0, cnt = 0;
public:
    ArrayQueue(int cap = 1000) : a(cap) {}
    bool push(int x) { if (cnt == (int)a.size()) return false; a[(front + cnt++) % a.size()] = x; return true; }
    int pop() { if (!cnt) return -1; int v = a[front]; front = (front + 1) % a.size(); cnt--; return v; }
    int peek() { return cnt ? a[front] : -1; }
    bool isEmpty() { return cnt == 0; }
};
```
```py
class ArrayQueue:
    def __init__(self, cap=1000): self.a = [0] * cap; self.front = 0; self.cnt = 0
    def push(self, x):
        if self.cnt == len(self.a): return False
        self.a[(self.front + self.cnt) % len(self.a)] = x; self.cnt += 1; return True
    def pop(self):
        if not self.cnt: return -1
        v = self.a[self.front]; self.front = (self.front + 1) % len(self.a); self.cnt -= 1; return v
    def peek(self): return self.a[self.front] if self.cnt else -1
    def is_empty(self): return self.cnt == 0
```
TC: O(1) per operation. SC: O(capacity).
### Implement Stack using Queue
Idea: one queue. After pushing x, rotate the previous elements behind it, so the newest is always at the front.
```cpp
class StackUsingQueue {
    queue<int> q;
public:
    void push(int x) { q.push(x); for (int i = 0; i < (int)q.size() - 1; i++) { q.push(q.front()); q.pop(); } }
    int pop() { int v = q.front(); q.pop(); return v; }
    int top() { return q.front(); }
    bool empty() { return q.empty(); }
};
```
```py
from collections import deque
class StackUsingQueue:
    def __init__(self): self.q = deque()
    def push(self, x):
        self.q.append(x)
        for _ in range(len(self.q) - 1): self.q.append(self.q.popleft())
    def pop(self): return self.q.popleft()
    def top(self): return self.q[0]
    def empty(self): return not self.q
```
TC: push O(n), pop/top O(1). SC: O(n).
### Implement Queue using Stack
Idea: two stacks. Push into `in`. For pop/peek, if `out` is empty pour everything from `in` to `out` (this reverses the order). Each element moves at most once: amortised O(1).
```cpp
class QueueUsingStack {
    stack<int> in, out;
    void shift() { if (out.empty()) while (!in.empty()) { out.push(in.top()); in.pop(); } }
public:
    void push(int x) { in.push(x); }
    int pop() { shift(); int v = out.top(); out.pop(); return v; }
    int peek() { shift(); return out.top(); }
    bool empty() { return in.empty() && out.empty(); }
};
```
```py
class QueueUsingStack:
    def __init__(self): self.inp, self.out = [], []
    def _shift(self):
        if not self.out:
            while self.inp: self.out.append(self.inp.pop())
    def push(self, x): self.inp.append(x)
    def pop(self): self._shift(); return self.out.pop()
    def peek(self): self._shift(); return self.out[-1]
    def empty(self): return not self.inp and not self.out
```
TC: amortised O(1). SC: O(n).
### Implement stack using Linkedlist
Idea: push and pop at the **head** of the list.
```cpp
class LinkedStack {
    ListNode* head = nullptr; int sz = 0;
public:
    void push(int x) { head = new ListNode(x, head); sz++; }
    int pop() { if (!head) return -1; int v = head->val; ListNode* t = head; head = head->next; delete t; sz--; return v; }
    int top() { return head ? head->val : -1; }
    bool isEmpty() { return !head; }
};
```
```py
class LinkedStack:
    def __init__(self): self.head = None
    def push(self, x): self.head = ListNode(x, self.head)
    def pop(self):
        if not self.head: return -1
        v = self.head.val; self.head = self.head.next; return v
    def top(self): return self.head.val if self.head else -1
    def is_empty(self): return self.head is None
```
TC: O(1). SC: O(n).
### Implement queue using Linkedlist
Idea: keep `head` (front) and `tail` (rear). Enqueue at the tail, dequeue at the head.
```cpp
class LinkedQueue {
    ListNode *head = nullptr, *tail = nullptr;
public:
    void push(int x) { ListNode* n = new ListNode(x); if (!tail) head = tail = n; else { tail->next = n; tail = n; } }
    int pop() { if (!head) return -1; int v = head->val; ListNode* t = head; head = head->next; if (!head) tail = nullptr; delete t; return v; }
    int peek() { return head ? head->val : -1; }
    bool isEmpty() { return !head; }
};
```
```py
class LinkedQueue:
    def __init__(self): self.head = self.tail = None
    def push(self, x):
        n = ListNode(x)
        if not self.tail: self.head = self.tail = n
        else: self.tail.next = n; self.tail = n
    def pop(self):
        if not self.head: return -1
        v = self.head.val; self.head = self.head.next
        if not self.head: self.tail = None
        return v
    def peek(self): return self.head.val if self.head else -1
    def is_empty(self): return self.head is None
```
TC: O(1). SC: O(n).
### Balanced Paranthesis
Idea: push opening brackets. On a closing bracket the top of the stack must be its matching opener. At the end the stack must be empty.
```cpp
bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') st.push(c);
        else {
            if (st.empty()) return false;
            char o = st.top(); st.pop();
            if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{')) return false;
        }
    }
    return st.empty();
}
```
```py
def is_valid(s):
    st, pair = [], {')': '(', ']': '[', '}': '{'}
    for c in s:
        if c in '([{': st.append(c)
        elif not st or st.pop() != pair[c]: return False
    return not st
```
TC: O(n). SC: O(n).
## Stack / Queues: Prefix, Infix and Postfix Conversions
- **Infix**: operator between operands `a + b` (humans). **Postfix**: operator after `a b +` (machines, no brackets needed). **Prefix**: operator before `+ a b`.
- Priority: ^ (3) > * / (2) > + - (1).
| Infix | Postfix | Prefix |
|---|---|---|
| a + b * c | a b c * + | + a * b c |
| (a + b) * c | a b + c * | * + a b c |
### Infix to Postfix Conversion
Idea: operands go straight to the output. Operators wait on a stack; before pushing an operator, pop those with higher or equal priority. '(' is pushed; ')' pops until '('.
```cpp
int prec(char c) { return c == '^' ? 3 : (c == '*' || c == '/') ? 2 : (c == '+' || c == '-') ? 1 : -1; }
string infixToPostfix(string s) {
    string out; stack<char> st;
    for (char c : s) {
        if (isalnum(c)) out += c;
        else if (c == '(') st.push(c);
        else if (c == ')') { while (st.top() != '(') { out += st.top(); st.pop(); } st.pop(); }
        else {
            while (!st.empty() && prec(st.top()) >= prec(c) && !(c == '^' && st.top() == '^')) { out += st.top(); st.pop(); }
            st.push(c);
        }
    }
    while (!st.empty()) { out += st.top(); st.pop(); }
    return out;
}
```
```py
def infix_to_postfix(s):
    prec = {'^': 3, '*': 2, '/': 2, '+': 1, '-': 1}
    out, st = [], []
    for c in s:
        if c.isalnum(): out.append(c)
        elif c == '(': st.append(c)
        elif c == ')':
            while st[-1] != '(': out.append(st.pop())
            st.pop()
        else:
            while st and st[-1] != '(' and prec[st[-1]] >= prec[c] and not (c == '^' and st[-1] == '^'):
                out.append(st.pop())
            st.append(c)
    while st: out.append(st.pop())
    return "".join(out)
```
TC: O(n). SC: O(n).
### Infix to Prefix Conversion
Idea: reverse the infix (swapping the brackets), convert to postfix (popping only on strictly higher priority), reverse the result.
```cpp
string infixToPrefix(string s) {
    reverse(s.begin(), s.end());
    for (char& c : s) { if (c == '(') c = ')'; else if (c == ')') c = '('; }
    string out; stack<char> st;
    for (char c : s) {
        if (isalnum(c)) out += c;
        else if (c == '(') st.push(c);
        else if (c == ')') { while (st.top() != '(') { out += st.top(); st.pop(); } st.pop(); }
        else {
            while (!st.empty() && (prec(st.top()) > prec(c) || (prec(st.top()) == prec(c) && c == '^'))) { out += st.top(); st.pop(); }
            st.push(c);
        }
    }
    while (!st.empty()) { out += st.top(); st.pop(); }
    reverse(out.begin(), out.end());
    return out;
}
```
```py
def infix_to_prefix(s):
    prec = {'^': 3, '*': 2, '/': 2, '+': 1, '-': 1}
    s = ["(" if c == ")" else ")" if c == "(" else c for c in reversed(s)]
    out, st = [], []
    for c in s:
        if c.isalnum(): out.append(c)
        elif c == '(': st.append(c)
        elif c == ')':
            while st[-1] != '(': out.append(st.pop())
            st.pop()
        else:
            while st and st[-1] != '(' and (prec[st[-1]] > prec[c] or (prec[st[-1]] == prec[c] and c == '^')):
                out.append(st.pop())
            st.append(c)
    while st: out.append(st.pop())
    return "".join(reversed(out))
```
TC: O(n). SC: O(n).
### Prefix to Infix Conversion
Idea: scan from the **right**. Operand: push. Operator: pop two (first popped is the left operand) and push "(a op b)".
```cpp
string prefixToInfix(string s) {
    stack<string> st;
    for (int i = (int)s.size() - 1; i >= 0; i--) {
        if (isalnum(s[i])) st.push(string(1, s[i]));
        else { string a = st.top(); st.pop(); string b = st.top(); st.pop(); st.push("(" + a + s[i] + b + ")"); }
    }
    return st.top();
}
```
```py
def prefix_to_infix(s):
    st = []
    for c in reversed(s):
        if c.isalnum(): st.append(c)
        else: a = st.pop(); b = st.pop(); st.append("(" + a + c + b + ")")
    return st[-1]
```
TC: O(n). SC: O(n).
### Prefix to Postfix Conversion
```cpp
string prefixToPostfix(string s) {
    stack<string> st;
    for (int i = (int)s.size() - 1; i >= 0; i--) {
        if (isalnum(s[i])) st.push(string(1, s[i]));
        else { string a = st.top(); st.pop(); string b = st.top(); st.pop(); st.push(a + b + s[i]); }
    }
    return st.top();
}
```
```py
def prefix_to_postfix(s):
    st = []
    for c in reversed(s):
        if c.isalnum(): st.append(c)
        else: a = st.pop(); b = st.pop(); st.append(a + b + c)
    return st[-1]
```
TC: O(n). SC: O(n).
### Postfix to Infix Conversion
Idea: scan from the left. Operator: pop two (first popped is the **right** operand).
```cpp
string postfixToInfix(string s) {
    stack<string> st;
    for (char c : s) {
        if (isalnum(c)) st.push(string(1, c));
        else { string b = st.top(); st.pop(); string a = st.top(); st.pop(); st.push("(" + a + c + b + ")"); }
    }
    return st.top();
}
```
```py
def postfix_to_infix(s):
    st = []
    for c in s:
        if c.isalnum(): st.append(c)
        else: b = st.pop(); a = st.pop(); st.append("(" + a + c + b + ")")
    return st[-1]
```
TC: O(n). SC: O(n).
### Postfix to Prefix Conversion
```cpp
string postfixToPrefix(string s) {
    stack<string> st;
    for (char c : s) {
        if (isalnum(c)) st.push(string(1, c));
        else { string b = st.top(); st.pop(); string a = st.top(); st.pop(); st.push(c + a + b); }
    }
    return st.top();
}
```
```py
def postfix_to_prefix(s):
    st = []
    for c in s:
        if c.isalnum(): st.append(c)
        else: b = st.pop(); a = st.pop(); st.append(c + a + b)
    return st[-1]
```
TC: O(n). SC: O(n).
## Stack / Queues: Monotonic Stack
Rule: a **monotonic stack** keeps its elements in increasing or decreasing order. Before pushing x, pop everything that breaks the order. It answers "next/previous greater/smaller element" for all positions in O(n) total, because every element is pushed once and popped once.
@array 4 12 5 3 1 2 5 3 :: next greater: 12 -1 -1 5 2 5 -1 -1 (scan from the right, stack holds candidates)
### Next Greater Element
```cpp
vector<int> nextGreater(vector<int>& a) {
    int n = a.size(); vector<int> ans(n, -1); stack<int> st;
    for (int i = n - 1; i >= 0; i--) {
        while (!st.empty() && st.top() <= a[i]) st.pop();
        if (!st.empty()) ans[i] = st.top();
        st.push(a[i]);
    }
    return ans;
}
```
```py
def next_greater(a):
    n = len(a); ans = [-1] * n; st = []
    for i in range(n - 1, -1, -1):
        while st and st[-1] <= a[i]: st.pop()
        if st: ans[i] = st[-1]
        st.append(a[i])
    return ans
```
TC: O(n). SC: O(n).
### Next Greater Element - 2 (circular array)
Idea: pretend the array is doubled: loop i from 2n - 1 down to 0 using index i % n.
```cpp
vector<int> nextGreaterCircular(vector<int>& a) {
    int n = a.size(); vector<int> ans(n, -1); stack<int> st;
    for (int i = 2 * n - 1; i >= 0; i--) {
        while (!st.empty() && st.top() <= a[i % n]) st.pop();
        if (i < n && !st.empty()) ans[i] = st.top();
        st.push(a[i % n]);
    }
    return ans;
}
```
```py
def next_greater_circular(a):
    n = len(a); ans = [-1] * n; st = []
    for i in range(2 * n - 1, -1, -1):
        while st and st[-1] <= a[i % n]: st.pop()
        if i < n and st: ans[i] = st[-1]
        st.append(a[i % n])
    return ans
```
TC: O(n). SC: O(n).
### Asteroid Collision
Idea: the stack holds survivors. A collision happens only when the top moves right (+) and the new one moves left (-). The smaller explodes; equal sizes both explode.
```cpp
vector<int> asteroidCollision(vector<int>& a) {
    vector<int> st;
    for (int x : a) {
        bool alive = true;
        while (alive && x < 0 && !st.empty() && st.back() > 0) {
            if (st.back() < -x) st.pop_back();
            else { if (st.back() == -x) st.pop_back(); alive = false; }
        }
        if (alive) st.push_back(x);
    }
    return st;
}
```
```py
def asteroid_collision(a):
    st = []
    for x in a:
        alive = True
        while alive and x < 0 and st and st[-1] > 0:
            if st[-1] < -x: st.pop()
            else:
                if st[-1] == -x: st.pop()
                alive = False
        if alive: st.append(x)
    return st
```
TC: O(n). SC: O(n).
### Next Smaller Element
```cpp
vector<int> nextSmaller(vector<int>& a) {
    int n = a.size(); vector<int> ans(n, -1); stack<int> st;
    for (int i = n - 1; i >= 0; i--) {
        while (!st.empty() && st.top() >= a[i]) st.pop();
        if (!st.empty()) ans[i] = st.top();
        st.push(a[i]);
    }
    return ans;
}
```
```py
def next_smaller(a):
    n = len(a); ans = [-1] * n; st = []
    for i in range(n - 1, -1, -1):
        while st and st[-1] >= a[i]: st.pop()
        if st: ans[i] = st[-1]
        st.append(a[i])
    return ans
```
TC: O(n). SC: O(n).
### Sum of Subarray Minimums
Idea: **contribution technique**. For each a[i] count the subarrays where it is the minimum: left = distance to the previous smaller element, right = distance to the next smaller-or-equal. Contribution = a[i] x left x right.
```cpp
long long sumSubarrayMins(vector<int>& a) {
    int n = a.size(); const long long MOD = 1e9 + 7;
    vector<int> left(n), right(n); stack<int> st;
    for (int i = 0; i < n; i++) {
        while (!st.empty() && a[st.top()] > a[i]) st.pop();
        left[i] = st.empty() ? i + 1 : i - st.top(); st.push(i);
    }
    st = stack<int>();
    for (int i = n - 1; i >= 0; i--) {
        while (!st.empty() && a[st.top()] >= a[i]) st.pop();
        right[i] = st.empty() ? n - i : st.top() - i; st.push(i);
    }
    long long ans = 0;
    for (int i = 0; i < n; i++) ans = (ans + (long long)a[i] * left[i] % MOD * right[i]) % MOD;
    return ans;
}
```
```py
def sum_subarray_mins(a):
    n = len(a); MOD = 10**9 + 7
    left, right, st = [0] * n, [0] * n, []
    for i in range(n):
        while st and a[st[-1]] > a[i]: st.pop()
        left[i] = i + 1 if not st else i - st[-1]; st.append(i)
    st = []
    for i in range(n - 1, -1, -1):
        while st and a[st[-1]] >= a[i]: st.pop()
        right[i] = n - i if not st else st[-1] - i; st.append(i)
    return sum(a[i] * left[i] * right[i] for i in range(n)) % MOD
```
TC: O(n). SC: O(n).
### Sum of Subarray Ranges
Idea: sum of (max - min) over all subarrays = (sum of subarray maximums) - (sum of subarray minimums). Compute each with the contribution technique.
```cpp
long long contribution(vector<int>& a, bool isMin) {
    int n = a.size(); vector<long long> left(n), right(n); stack<int> st;
    auto worse = [&](int x, int y, bool strict) { return isMin ? (strict ? x > y : x >= y) : (strict ? x < y : x <= y); };
    for (int i = 0; i < n; i++) { while (!st.empty() && worse(a[st.top()], a[i], true)) st.pop(); left[i] = st.empty() ? i + 1 : i - st.top(); st.push(i); }
    st = stack<int>();
    for (int i = n - 1; i >= 0; i--) { while (!st.empty() && worse(a[st.top()], a[i], false)) st.pop(); right[i] = st.empty() ? n - i : st.top() - i; st.push(i); }
    long long s = 0; for (int i = 0; i < n; i++) s += a[i] * left[i] * right[i];
    return s;
}
long long subArrayRanges(vector<int>& a) { return contribution(a, false) - contribution(a, true); }
```
```py
def sub_array_ranges(a):
    def contribution(is_min):
        n = len(a); left, right, st = [0] * n, [0] * n, []
        for i in range(n):
            while st and (a[st[-1]] > a[i] if is_min else a[st[-1]] < a[i]): st.pop()
            left[i] = i + 1 if not st else i - st[-1]; st.append(i)
        st = []
        for i in range(n - 1, -1, -1):
            while st and (a[st[-1]] >= a[i] if is_min else a[st[-1]] <= a[i]): st.pop()
            right[i] = n - i if not st else st[-1] - i; st.append(i)
        return sum(a[i] * left[i] * right[i] for i in range(n))
    return contribution(False) - contribution(True)
```
TC: O(n). SC: O(n).
### Remove K Digits
Idea: to make the number smallest, a bigger digit before a smaller digit should go. Keep an increasing stack: pop while top > current and k > 0. Strip leading zeros.
```cpp
string removeKdigits(string num, int k) {
    string st;
    for (char c : num) {
        while (k > 0 && !st.empty() && st.back() > c) { st.pop_back(); k--; }
        st.push_back(c);
    }
    while (k-- > 0 && !st.empty()) st.pop_back();
    int i = 0; while (i < (int)st.size() - 1 && st[i] == '0') i++;
    st = st.substr(i);
    return st.empty() ? "0" : st;
}
```
```py
def remove_k_digits(num, k):
    st = []
    for c in num:
        while k > 0 and st and st[-1] > c: st.pop(); k -= 1
        st.append(c)
    if k > 0: st = st[:-k]
    return "".join(st).lstrip('0') or "0"
```
TC: O(n). SC: O(n).
## Stack / Queues: FAQs
### Implement Min Stack
Idea: store pairs (value, minimum so far). The top pair always knows the current minimum.
```cpp
class MinStack {
    stack<pair<int,int>> st;
public:
    void push(int x) { st.push({x, st.empty() ? x : min(x, st.top().second)}); }
    void pop() { st.pop(); }
    int top() { return st.top().first; }
    int getMin() { return st.top().second; }
};
```
```py
class MinStack:
    def __init__(self): self.st = []
    def push(self, x): self.st.append((x, min(x, self.st[-1][1]) if self.st else x))
    def pop(self): self.st.pop()
    def top(self): return self.st[-1][0]
    def get_min(self): return self.st[-1][1]
```
TC: O(1) all operations. SC: O(n).
### Sliding Window Maximum
Idea: a **monotonic deque** of indices with decreasing values. The front is the window maximum. Pop from the back anything smaller than the new element (it can never be a max again); pop the front when it leaves the window.
```cpp
vector<int> maxSlidingWindow(vector<int>& a, int k) {
    deque<int> dq; vector<int> ans;
    for (int i = 0; i < (int)a.size(); i++) {
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();
        dq.push_back(i);
        if (i >= k - 1) ans.push_back(a[dq.front()]);
    }
    return ans;
}
```
```py
def max_sliding_window(a, k):
    dq, ans = deque(), []
    for i, x in enumerate(a):
        if dq and dq[0] <= i - k: dq.popleft()
        while dq and a[dq[-1]] <= x: dq.pop()
        dq.append(i)
        if i >= k - 1: ans.append(a[dq[0]])
    return ans
```
TC: O(n). SC: O(k).
### Trapping Rainwater
Idea: water above bar i = min(max on left, max on right) - height[i]. Two pointers: process the side with the smaller height, because that side's max decides the water level.
@array 0 1 0 2 1 0 1 3 2 1 2 1 :: heights; trapped water = 6
```cpp
int trap(vector<int>& h) {
    int l = 0, r = (int)h.size() - 1, lmax = 0, rmax = 0, water = 0;
    while (l < r) {
        if (h[l] <= h[r]) { lmax = max(lmax, h[l]); water += lmax - h[l]; l++; }
        else { rmax = max(rmax, h[r]); water += rmax - h[r]; r--; }
    }
    return water;
}
```
```py
def trap(h):
    l, r, lmax, rmax, water = 0, len(h) - 1, 0, 0, 0
    while l < r:
        if h[l] <= h[r]:
            lmax = max(lmax, h[l]); water += lmax - h[l]; l += 1
        else:
            rmax = max(rmax, h[r]); water += rmax - h[r]; r -= 1
    return water
```
TC: O(n). SC: O(1).
### Largest rectangle in a histogram
Idea: for each bar, the widest rectangle of its height spans from its previous smaller bar to its next smaller bar. An increasing stack gives both: when bar i pops bar j, i is j's next smaller and the new top is j's previous smaller.
```cpp
int largestRectangleArea(vector<int>& h) {
    stack<int> st; int best = 0, n = h.size();
    for (int i = 0; i <= n; i++) {
        int cur = (i == n) ? 0 : h[i];
        while (!st.empty() && h[st.top()] >= cur) {
            int height = h[st.top()]; st.pop();
            int width = st.empty() ? i : i - st.top() - 1;
            best = max(best, height * width);
        }
        st.push(i);
    }
    return best;
}
```
```py
def largest_rectangle_area(h):
    st, best, n = [], 0, len(h)
    for i in range(n + 1):
        cur = 0 if i == n else h[i]
        while st and h[st[-1]] >= cur:
            height = h[st.pop()]
            width = i if not st else i - st[-1] - 1
            best = max(best, height * width)
        st.append(i)
    return best
```
TC: O(n). SC: O(n).
### Maximum Rectangles (maximal rectangle of 1s in a binary matrix)
Idea: treat each row as the base of a histogram: height[j] = number of consecutive 1s ending at this row. Apply the histogram solution on every row.
```cpp
int maximalRectangle(vector<vector<char>>& m) {
    if (m.empty()) return 0;
    vector<int> h(m[0].size(), 0); int best = 0;
    for (auto& row : m) {
        for (int j = 0; j < (int)row.size(); j++) h[j] = (row[j] == '1') ? h[j] + 1 : 0;
        best = max(best, largestRectangleArea(h));
    }
    return best;
}
```
```py
def maximal_rectangle(m):
    if not m: return 0
    h, best = [0] * len(m[0]), 0
    for row in m:
        for j, c in enumerate(row): h[j] = h[j] + 1 if c == '1' else 0
        best = max(best, largest_rectangle_area(h))
    return best
```
TC: O(n x m). SC: O(m).
### Stock span problem
Idea: span = days since the previous strictly greater price. A decreasing stack of (price, index).
```cpp
class StockSpanner {
    stack<pair<int,int>> st; int idx = -1;
public:
    int next(int price) {
        idx++;
        while (!st.empty() && st.top().first <= price) st.pop();
        int span = st.empty() ? idx + 1 : idx - st.top().second;
        st.push({price, idx});
        return span;
    }
};
```
```py
class StockSpanner:
    def __init__(self): self.st = []; self.idx = -1
    def next(self, price):
        self.idx += 1
        while self.st and self.st[-1][0] <= price: self.st.pop()
        span = self.idx + 1 if not self.st else self.idx - self.st[-1][1]
        self.st.append((price, self.idx))
        return span
```
TC: amortised O(1) per call. SC: O(n).
### Celebrity Problem
Idea: the celebrity knows nobody and everybody knows them. Two pointers: if a knows b, a is not the celebrity (a++); else b is not (b--). Verify the survivor.
```cpp
int celebrity(vector<vector<int>>& M) {
    int n = M.size(), a = 0, b = n - 1;
    while (a < b) { if (M[a][b]) a++; else b--; }
    for (int i = 0; i < n; i++) if (i != a && (M[a][i] || !M[i][a])) return -1;
    return a;
}
```
```py
def celebrity(M):
    n = len(M); a, b = 0, n - 1
    while a < b:
        if M[a][b]: a += 1
        else: b -= 1
    for i in range(n):
        if i != a and (M[a][i] or not M[i][a]): return -1
    return a
```
TC: O(n). SC: O(1).
### LRU Cache
Idea: **hash map + doubly linked list**. The map finds a node in O(1). The list keeps usage order: most recent at the front, least recent at the back. get/put move the node to the front; when full, remove the back node.
@chain head <-> most recent <-> ... <-> least recent <-> tail :: map: key -> node. Evict the node before tail
```cpp
class LRUCache {
    int cap; list<pair<int,int>> dll;                       // {key, value}, front = most recent
    unordered_map<int, list<pair<int,int>>::iterator> mp;
public:
    LRUCache(int capacity) : cap(capacity) {}
    int get(int key) {
        auto it = mp.find(key);
        if (it == mp.end()) return -1;
        dll.splice(dll.begin(), dll, it->second);           // move to front
        return it->second->second;
    }
    void put(int key, int value) {
        auto it = mp.find(key);
        if (it != mp.end()) { it->second->second = value; dll.splice(dll.begin(), dll, it->second); return; }
        if ((int)dll.size() == cap) { mp.erase(dll.back().first); dll.pop_back(); }
        dll.push_front({key, value}); mp[key] = dll.begin();
    }
};
```
```py
from collections import OrderedDict
class LRUCache:
    def __init__(self, capacity): self.cap = capacity; self.d = OrderedDict()
    def get(self, key):
        if key not in self.d: return -1
        self.d.move_to_end(key)
        return self.d[key]
    def put(self, key, value):
        if key in self.d: self.d.move_to_end(key)
        self.d[key] = value
        if len(self.d) > self.cap: self.d.popitem(last=False)
```
TC: O(1) for get and put. SC: O(capacity).
### LFU Cache
Idea: evict the **least frequently** used key (ties: least recently used). Maps: key -> (value, freq); freq -> ordered list of keys; plus `minFreq`.
```cpp
class LFUCache {
    int cap, minFreq = 0;
    unordered_map<int, pair<int,int>> kv;                   // key -> {value, freq}
    unordered_map<int, list<int>> buckets;                  // freq -> keys (front = most recent)
    unordered_map<int, list<int>::iterator> pos;
    void touch(int key) {
        int f = kv[key].second++;
        buckets[f].erase(pos[key]);
        if (buckets[f].empty()) { buckets.erase(f); if (minFreq == f) minFreq++; }
        buckets[f + 1].push_front(key); pos[key] = buckets[f + 1].begin();
    }
public:
    LFUCache(int capacity) : cap(capacity) {}
    int get(int key) { if (!kv.count(key)) return -1; touch(key); return kv[key].first; }
    void put(int key, int value) {
        if (cap == 0) return;
        if (kv.count(key)) { kv[key].first = value; touch(key); return; }
        if ((int)kv.size() == cap) { int old = buckets[minFreq].back(); buckets[minFreq].pop_back(); kv.erase(old); pos.erase(old); }
        kv[key] = {value, 1}; buckets[1].push_front(key); pos[key] = buckets[1].begin(); minFreq = 1;
    }
};
```
```py
from collections import defaultdict, OrderedDict
class LFUCache:
    def __init__(self, capacity):
        self.cap, self.min_freq = capacity, 0
        self.kv = {}                                   # key -> [value, freq]
        self.buckets = defaultdict(OrderedDict)        # freq -> keys in recency order
    def _touch(self, key):
        f = self.kv[key][1]; self.kv[key][1] += 1
        del self.buckets[f][key]
        if not self.buckets[f]:
            del self.buckets[f]
            if self.min_freq == f: self.min_freq += 1
        self.buckets[f + 1][key] = None
    def get(self, key):
        if key not in self.kv: return -1
        self._touch(key); return self.kv[key][0]
    def put(self, key, value):
        if self.cap == 0: return
        if key in self.kv: self.kv[key][0] = value; self._touch(key); return
        if len(self.kv) == self.cap:
            old, _ = self.buckets[self.min_freq].popitem(last=False); del self.kv[old]
        self.kv[key] = [value, 1]; self.buckets[1][key] = None; self.min_freq = 1
```
TC: O(1) for get and put. SC: O(capacity).
### Number of Greater Elements to the Right
Idea: for each query index, count the elements after it that are greater.
```cpp
vector<int> countGreaterRight(vector<int>& a, vector<int>& queries) {
    vector<int> ans;
    for (int q : queries) { int c = 0; for (int j = q + 1; j < (int)a.size(); j++) if (a[j] > a[q]) c++; ans.push_back(c); }
    return ans;
}
```
```py
def count_greater_right(a, queries):
    return [sum(1 for j in range(q + 1, len(a)) if a[j] > a[q]) for q in queries]
```
TC: O(q x n). SC: O(1) extra.
## Binary Trees: Theory / Traversals
### Introduction
- A **tree** is a hierarchy of nodes: one **root**, each node has children; a node with no child is a **leaf**. A **binary tree** allows at most 2 children (left, right).
- Height = longest path from root to a leaf. A tree with n nodes has n - 1 edges.
- Types: **full** (0 or 2 children), **complete** (all levels full except the last, filled from the left), **perfect** (all leaves at the same level), **balanced** (height O(log n)), **degenerate/skewed** (like a linked list, height n).
@tree 1(2(4,5),3(6,7)) :: Inorder 4 2 5 1 6 3 7 | Preorder 1 2 4 5 3 6 7 | Postorder 4 5 2 6 7 3 1 | Level 1 2 3 4 5 6 7
| Traversal | Order | Use |
|---|---|---|
| Inorder | Left, Root, Right | sorted order in a BST |
| Preorder | Root, Left, Right | copy / serialise a tree |
| Postorder | Left, Right, Root | delete a tree, evaluate expressions |
| Level order | level by level (BFS) | shortest path, views |
### Inorder Traversal
```cpp
void inorder(TreeNode* root, vector<int>& out) {
    if (!root) return;
    inorder(root->left, out); out.push_back(root->val); inorder(root->right, out);
}
vector<int> inorderIterative(TreeNode* root) {
    vector<int> out; stack<TreeNode*> st; TreeNode* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }
        cur = st.top(); st.pop(); out.push_back(cur->val);
        cur = cur->right;
    }
    return out;
}
```
```py
def inorder(root):
    out, st, cur = [], [], root
    while cur or st:
        while cur: st.append(cur); cur = cur.left
        cur = st.pop(); out.append(cur.val)
        cur = cur.right
    return out
```
TC: O(n) - each node visited once. SC: O(h) stack, h = height.
### Preorder Traversal
```cpp
vector<int> preorder(TreeNode* root) {
    vector<int> out; if (!root) return out;
    stack<TreeNode*> st; st.push(root);
    while (!st.empty()) {
        TreeNode* n = st.top(); st.pop(); out.push_back(n->val);
        if (n->right) st.push(n->right);      // right first so left is processed first
        if (n->left) st.push(n->left);
    }
    return out;
}
```
```py
def preorder(root):
    if not root: return []
    out, st = [], [root]
    while st:
        n = st.pop(); out.append(n.val)
        if n.right: st.append(n.right)
        if n.left: st.append(n.left)
    return out
```
TC: O(n). SC: O(h).
### Postorder Traversal
Idea: postorder (L R Root) is the reverse of (Root R L), which is a preorder with the children swapped.
```cpp
vector<int> postorder(TreeNode* root) {
    vector<int> out; if (!root) return out;
    stack<TreeNode*> st; st.push(root);
    while (!st.empty()) {
        TreeNode* n = st.top(); st.pop(); out.push_back(n->val);
        if (n->left) st.push(n->left);
        if (n->right) st.push(n->right);
    }
    reverse(out.begin(), out.end());
    return out;
}
```
```py
def postorder(root):
    if not root: return []
    out, st = [], [root]
    while st:
        n = st.pop(); out.append(n.val)
        if n.left: st.append(n.left)
        if n.right: st.append(n.right)
    return out[::-1]
```
TC: O(n). SC: O(n).
### Level Order Traversal
Idea: BFS with a queue. The queue size at the start of each round is the number of nodes on that level.
```cpp
vector<vector<int>> levelOrder(TreeNode* root) {
    vector<vector<int>> ans; if (!root) return ans;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        int sz = q.size(); vector<int> level;
        while (sz--) {
            TreeNode* n = q.front(); q.pop(); level.push_back(n->val);
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
        ans.push_back(level);
    }
    return ans;
}
```
```py
def level_order(root):
    if not root: return []
    ans, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            n = q.popleft(); level.append(n.val)
            if n.left: q.append(n.left)
            if n.right: q.append(n.right)
        ans.append(level)
    return ans
```
TC: O(n). SC: O(n) - the last level can hold n/2 nodes.
### Pre, Post, Inorder in one traversal
Idea: stack of (node, state). State 1: add to preorder, push left. State 2: add to inorder, push right. State 3: add to postorder, pop.
```cpp
vector<vector<int>> allTraversals(TreeNode* root) {
    vector<int> pre, in, post; if (!root) return {in, pre, post};
    stack<pair<TreeNode*,int>> st; st.push({root, 1});
    while (!st.empty()) {
        auto& [n, state] = st.top();
        if (state == 1) { pre.push_back(n->val); state = 2; if (n->left) st.push({n->left, 1}); }
        else if (state == 2) { in.push_back(n->val); state = 3; if (n->right) st.push({n->right, 1}); }
        else { post.push_back(n->val); st.pop(); }
    }
    return {in, pre, post};
}
```
```py
def all_traversals(root):
    pre, ino, post = [], [], []
    if not root: return ino, pre, post
    st = [[root, 1]]
    while st:
        n, state = st[-1]
        if state == 1:
            pre.append(n.val); st[-1][1] = 2
            if n.left: st.append([n.left, 1])
        elif state == 2:
            ino.append(n.val); st[-1][1] = 3
            if n.right: st.append([n.right, 1])
        else:
            post.append(n.val); st.pop()
    return ino, pre, post
```
TC: O(3n) = O(n). SC: O(n).
## Binary Trees: Medium Problems
Rule: most tree problems are a **postorder DFS**: ask the left subtree, ask the right subtree, combine the two answers at the node.
### Maximum Depth in BT
```cpp
int maxDepth(TreeNode* root) { return root ? 1 + max(maxDepth(root->left), maxDepth(root->right)) : 0; }
```
```py
def max_depth(root):
    return 1 + max(max_depth(root.left), max_depth(root.right)) if root else 0
```
TC: O(n). SC: O(h).
### Check if two trees are identical or not
```cpp
bool isSameTree(TreeNode* p, TreeNode* q) {
    if (!p || !q) return p == q;
    return p->val == q->val && isSameTree(p->left, q->left) && isSameTree(p->right, q->right);
}
```
```py
def is_same_tree(p, q):
    if not p or not q: return p is q
    return p.val == q.val and is_same_tree(p.left, q.left) and is_same_tree(p.right, q.right)
```
TC: O(n). SC: O(h).
### Check for balanced binary tree
Idea: compute height bottom-up and return -1 as soon as any subtree is unbalanced (height difference > 1). One pass instead of O(n^2).
```cpp
int balancedHeight(TreeNode* root) {
    if (!root) return 0;
    int l = balancedHeight(root->left); if (l == -1) return -1;
    int r = balancedHeight(root->right); if (r == -1) return -1;
    if (abs(l - r) > 1) return -1;
    return 1 + max(l, r);
}
bool isBalanced(TreeNode* root) { return balancedHeight(root) != -1; }
```
```py
def is_balanced(root):
    def height(n):
        if not n: return 0
        l = height(n.left)
        if l == -1: return -1
        r = height(n.right)
        if r == -1 or abs(l - r) > 1: return -1
        return 1 + max(l, r)
    return height(root) != -1
```
TC: O(n). SC: O(h).
### Diameter of Binary Tree
Idea: the longest path through a node = left height + right height. Compute heights and update the best at each node.
```cpp
int diameterHeight(TreeNode* root, int& best) {
    if (!root) return 0;
    int l = diameterHeight(root->left, best), r = diameterHeight(root->right, best);
    best = max(best, l + r);
    return 1 + max(l, r);
}
int diameterOfBinaryTree(TreeNode* root) { int best = 0; diameterHeight(root, best); return best; }
```
```py
def diameter_of_binary_tree(root):
    best = 0
    def height(n):
        nonlocal best
        if not n: return 0
        l, r = height(n.left), height(n.right)
        best = max(best, l + r)
        return 1 + max(l, r)
    height(root)
    return best
```
TC: O(n). SC: O(h).
### Maximum path sum
Idea: at each node the best path **through** it = node + max(0, left gain) + max(0, right gain). But it can return only ONE side to its parent.
```cpp
int pathGain(TreeNode* root, int& best) {
    if (!root) return 0;
    int l = max(0, pathGain(root->left, best)), r = max(0, pathGain(root->right, best));
    best = max(best, root->val + l + r);
    return root->val + max(l, r);
}
int maxPathSum(TreeNode* root) { int best = INT_MIN; pathGain(root, best); return best; }
```
```py
def max_path_sum(root):
    best = float('-inf')
    def gain(n):
        nonlocal best
        if not n: return 0
        l, r = max(0, gain(n.left)), max(0, gain(n.right))
        best = max(best, n.val + l + r)
        return n.val + max(l, r)
    gain(root)
    return best
```
TC: O(n). SC: O(h).
### Check for symmetrical BTs
Idea: the left subtree must be a mirror of the right: compare left.left with right.right and left.right with right.left.
```cpp
bool isMirror(TreeNode* a, TreeNode* b) {
    if (!a || !b) return a == b;
    return a->val == b->val && isMirror(a->left, b->right) && isMirror(a->right, b->left);
}
bool isSymmetric(TreeNode* root) { return !root || isMirror(root->left, root->right); }
```
```py
def is_symmetric(root):
    def mirror(a, b):
        if not a or not b: return a is b
        return a.val == b.val and mirror(a.left, b.right) and mirror(a.right, b.left)
    return not root or mirror(root.left, root.right)
```
TC: O(n). SC: O(h).
### Children Sum Property in Binary Tree
Idea: check that every non-leaf node equals the sum of its children.
```cpp
bool checkChildrenSum(TreeNode* root) {
    if (!root || (!root->left && !root->right)) return true;
    int sum = (root->left ? root->left->val : 0) + (root->right ? root->right->val : 0);
    return root->val == sum && checkChildrenSum(root->left) && checkChildrenSum(root->right);
}
```
```py
def check_children_sum(root):
    if not root or (not root.left and not root.right): return True
    s = (root.left.val if root.left else 0) + (root.right.val if root.right else 0)
    return root.val == s and check_children_sum(root.left) and check_children_sum(root.right)
```
TC: O(n). SC: O(h).
## Binary Trees: FAQs
### Zig Zag or Spiral Traversal
Idea: level order; reverse every second level.
```cpp
vector<vector<int>> zigzagLevelOrder(TreeNode* root) {
    vector<vector<int>> ans = levelOrder(root);
    for (int i = 1; i < (int)ans.size(); i += 2) reverse(ans[i].begin(), ans[i].end());
    return ans;
}
```
```py
def zigzag_level_order(root):
    ans = level_order(root)
    for i in range(1, len(ans), 2): ans[i].reverse()
    return ans
```
TC: O(n). SC: O(n).
### Boundary Traversal (anti-clockwise)
Idea: root + left boundary (no leaves) + all leaves (left to right) + right boundary (no leaves) reversed.
```cpp
bool isLeaf(TreeNode* n) { return !n->left && !n->right; }
void addLeaves(TreeNode* n, vector<int>& res) {
    if (!n) return;
    if (isLeaf(n)) { res.push_back(n->val); return; }
    addLeaves(n->left, res); addLeaves(n->right, res);
}
vector<int> boundary(TreeNode* root) {
    vector<int> res; if (!root) return res;
    if (!isLeaf(root)) res.push_back(root->val);
    for (TreeNode* c = root->left; c; c = c->left ? c->left : c->right) if (!isLeaf(c)) res.push_back(c->val);
    addLeaves(root, res);
    vector<int> tmp;
    for (TreeNode* c = root->right; c; c = c->right ? c->right : c->left) if (!isLeaf(c)) tmp.push_back(c->val);
    res.insert(res.end(), tmp.rbegin(), tmp.rend());
    return res;
}
```
```py
def boundary(root):
    if not root: return []
    is_leaf = lambda n: not n.left and not n.right
    res = [] if is_leaf(root) else [root.val]
    c = root.left
    while c:
        if not is_leaf(c): res.append(c.val)
        c = c.left if c.left else c.right
    def leaves(n):
        if not n: return
        if is_leaf(n): res.append(n.val); return
        leaves(n.left); leaves(n.right)
    leaves(root)
    tmp, c = [], root.right
    while c:
        if not is_leaf(c): tmp.append(c.val)
        c = c.right if c.right else c.left
    return res + tmp[::-1]
```
TC: O(n). SC: O(h).
### Vertical Order Traversal
Idea: give every node coordinates (column, row): left child = column - 1, right = column + 1. Collect (col, row, val), sort, and group by column.
```cpp
vector<vector<int>> verticalTraversal(TreeNode* root) {
    vector<array<int,3>> nodes;                       // {col, row, val}
    function<void(TreeNode*, int, int)> dfs = [&](TreeNode* n, int r, int c) {
        if (!n) return;
        nodes.push_back({c, r, n->val});
        dfs(n->left, r + 1, c - 1); dfs(n->right, r + 1, c + 1);
    };
    dfs(root, 0, 0);
    sort(nodes.begin(), nodes.end());
    vector<vector<int>> ans;
    for (int i = 0; i < (int)nodes.size(); i++) {
        if (i == 0 || nodes[i][0] != nodes[i - 1][0]) ans.push_back({});
        ans.back().push_back(nodes[i][2]);
    }
    return ans;
}
```
```py
def vertical_traversal(root):
    nodes = []
    def dfs(n, r, c):
        if not n: return
        nodes.append((c, r, n.val))
        dfs(n.left, r + 1, c - 1); dfs(n.right, r + 1, c + 1)
    dfs(root, 0, 0)
    nodes.sort(); ans = []
    for i, (c, r, v) in enumerate(nodes):
        if i == 0 or c != nodes[i - 1][0]: ans.append([])
        ans[-1].append(v)
    return ans
```
TC: O(n log n). SC: O(n).
### Top View of BT
Idea: BFS with a column number; the **first** node seen in each column is visible from the top.
```cpp
vector<int> topView(TreeNode* root) {
    vector<int> ans; if (!root) return ans;
    map<int,int> first; queue<pair<TreeNode*,int>> q; q.push({root, 0});
    while (!q.empty()) {
        auto [n, c] = q.front(); q.pop();
        if (!first.count(c)) first[c] = n->val;
        if (n->left) q.push({n->left, c - 1});
        if (n->right) q.push({n->right, c + 1});
    }
    for (auto& [c, v] : first) ans.push_back(v);
    return ans;
}
```
```py
def top_view(root):
    if not root: return []
    first, q = {}, deque([(root, 0)])
    while q:
        n, c = q.popleft()
        if c not in first: first[c] = n.val
        if n.left: q.append((n.left, c - 1))
        if n.right: q.append((n.right, c + 1))
    return [first[c] for c in sorted(first)]
```
TC: O(n log n). SC: O(n).
### Bottom view of BT
Idea: same BFS, but **overwrite** the column each time - the last node seen stays.
```cpp
vector<int> bottomView(TreeNode* root) {
    vector<int> ans; if (!root) return ans;
    map<int,int> last; queue<pair<TreeNode*,int>> q; q.push({root, 0});
    while (!q.empty()) {
        auto [n, c] = q.front(); q.pop();
        last[c] = n->val;
        if (n->left) q.push({n->left, c - 1});
        if (n->right) q.push({n->right, c + 1});
    }
    for (auto& [c, v] : last) ans.push_back(v);
    return ans;
}
```
```py
def bottom_view(root):
    if not root: return []
    last, q = {}, deque([(root, 0)])
    while q:
        n, c = q.popleft()
        last[c] = n.val
        if n.left: q.append((n.left, c - 1))
        if n.right: q.append((n.right, c + 1))
    return [last[c] for c in sorted(last)]
```
TC: O(n log n). SC: O(n).
### Right/Left View of BT
Idea: DFS visiting the right child first; the first node reached at each new depth is the right view (visit left first for the left view).
```cpp
void rightViewDfs(TreeNode* n, int depth, vector<int>& ans) {
    if (!n) return;
    if (depth == (int)ans.size()) ans.push_back(n->val);
    rightViewDfs(n->right, depth + 1, ans); rightViewDfs(n->left, depth + 1, ans);
}
vector<int> rightSideView(TreeNode* root) { vector<int> ans; rightViewDfs(root, 0, ans); return ans; }
```
```py
def right_side_view(root):
    ans = []
    def dfs(n, depth):
        if not n: return
        if depth == len(ans): ans.append(n.val)
        dfs(n.right, depth + 1); dfs(n.left, depth + 1)
    dfs(root, 0)
    return ans
```
TC: O(n). SC: O(h).
### Print root to leaf path in BT
```cpp
void pathsDfs(TreeNode* n, vector<int>& cur, vector<vector<int>>& ans) {
    if (!n) return;
    cur.push_back(n->val);
    if (!n->left && !n->right) ans.push_back(cur);
    pathsDfs(n->left, cur, ans); pathsDfs(n->right, cur, ans);
    cur.pop_back();
}
```
```py
def all_root_to_leaf(root):
    ans, cur = [], []
    def dfs(n):
        if not n: return
        cur.append(n.val)
        if not n.left and not n.right: ans.append(cur[:])
        dfs(n.left); dfs(n.right)
        cur.pop()
    dfs(root)
    return ans
```
TC: O(n). SC: O(h).
### Lowest Common Ancestor in BT
Idea: return the node if it is p or q. If both subtrees return non-null, this node is the LCA; otherwise pass up the non-null one.
@tree 3(5*(6,2),1(0,8*)) :: LCA(5, 8) = 3: one target found on each side
```cpp
TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (!root || root == p || root == q) return root;
    TreeNode* l = lowestCommonAncestor(root->left, p, q);
    TreeNode* r = lowestCommonAncestor(root->right, p, q);
    if (l && r) return root;
    return l ? l : r;
}
```
```py
def lowest_common_ancestor(root, p, q):
    if not root or root is p or root is q: return root
    l = lowest_common_ancestor(root.left, p, q)
    r = lowest_common_ancestor(root.right, p, q)
    if l and r: return root
    return l or r
```
TC: O(n). SC: O(h).
### Maximum Width of BT
Idea: number nodes like a heap: left = 2i + 1, right = 2i + 2. Width of a level = last index - first index + 1. Subtract the level's first index to avoid overflow.
```cpp
int widthOfBinaryTree(TreeNode* root) {
    if (!root) return 0;
    long long best = 0; queue<pair<TreeNode*, unsigned long long>> q; q.push({root, 0});
    while (!q.empty()) {
        int sz = q.size(); unsigned long long first = q.front().second, last = first;
        while (sz--) {
            auto [n, idx] = q.front(); q.pop(); idx -= first; last = idx;
            if (n->left) q.push({n->left, 2 * idx + 1});
            if (n->right) q.push({n->right, 2 * idx + 2});
        }
        best = max(best, (long long)last + 1);
    }
    return best;
}
```
```py
def width_of_binary_tree(root):
    if not root: return 0
    best, q = 0, deque([(root, 0)])
    while q:
        first = q[0][1]; last = first
        for _ in range(len(q)):
            n, idx = q.popleft(); last = idx
            if n.left: q.append((n.left, 2 * idx + 1))
            if n.right: q.append((n.right, 2 * idx + 2))
        best = max(best, last - first + 1)
    return best
```
TC: O(n). SC: O(n).
### Print all nodes at a distance of K in BT
Idea: a tree has no parent pointers, so first record each node's parent. Then BFS from the target in 3 directions (left, right, parent) for k steps.
```cpp
vector<int> distanceK(TreeNode* root, TreeNode* target, int k) {
    unordered_map<TreeNode*, TreeNode*> parent; queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        TreeNode* n = q.front(); q.pop();
        if (n->left) { parent[n->left] = n; q.push(n->left); }
        if (n->right) { parent[n->right] = n; q.push(n->right); }
    }
    unordered_set<TreeNode*> seen{target}; q.push(target);
    while (!q.empty() && k--) {
        int sz = q.size();
        while (sz--) {
            TreeNode* n = q.front(); q.pop();
            for (TreeNode* nb : {n->left, n->right, parent.count(n) ? parent[n] : nullptr})
                if (nb && !seen.count(nb)) { seen.insert(nb); q.push(nb); }
        }
    }
    vector<int> ans; while (!q.empty()) { ans.push_back(q.front()->val); q.pop(); }
    return ans;
}
```
```py
def distance_k(root, target, k):
    parent, q = {}, deque([root])
    while q:
        n = q.popleft()
        for c in (n.left, n.right):
            if c: parent[c] = n; q.append(c)
    seen, q = {target}, deque([target])
    for _ in range(k):
        for _ in range(len(q)):
            n = q.popleft()
            for nb in (n.left, n.right, parent.get(n)):
                if nb and nb not in seen: seen.add(nb); q.append(nb)
    return [n.val for n in q]
```
TC: O(n). SC: O(n).
### Minimum time taken to burn the BT from a given Node
Idea: identical BFS as distance K - fire spreads to left, right and parent each second. The answer is the number of BFS levels - 1.
```cpp
int timeToBurn(TreeNode* root, int start) {
    unordered_map<TreeNode*, TreeNode*> parent; queue<TreeNode*> q; q.push(root); TreeNode* src = nullptr;
    while (!q.empty()) {
        TreeNode* n = q.front(); q.pop();
        if (n->val == start) src = n;
        if (n->left) { parent[n->left] = n; q.push(n->left); }
        if (n->right) { parent[n->right] = n; q.push(n->right); }
    }
    unordered_set<TreeNode*> seen{src}; q.push(src); int t = -1;
    while (!q.empty()) {
        int sz = q.size(); t++;
        while (sz--) {
            TreeNode* n = q.front(); q.pop();
            for (TreeNode* nb : {n->left, n->right, parent.count(n) ? parent[n] : nullptr})
                if (nb && !seen.count(nb)) { seen.insert(nb); q.push(nb); }
        }
    }
    return t;
}
```
```py
def time_to_burn(root, start):
    parent, q, src = {}, deque([root]), None
    while q:
        n = q.popleft()
        if n.val == start: src = n
        for c in (n.left, n.right):
            if c: parent[c] = n; q.append(c)
    seen, q, t = {src}, deque([src]), -1
    while q:
        t += 1
        for _ in range(len(q)):
            n = q.popleft()
            for nb in (n.left, n.right, parent.get(n)):
                if nb and nb not in seen: seen.add(nb); q.append(nb)
    return t
```
TC: O(n). SC: O(n).
### Count total nodes in a complete BT
Idea: if the leftmost height equals the rightmost height the subtree is perfect: 2^h - 1 nodes, no need to visit. Otherwise recurse. Only one side is imperfect at each level.
```cpp
int countNodes(TreeNode* root) {
    if (!root) return 0;
    int lh = 0, rh = 0;
    for (TreeNode* n = root; n; n = n->left) lh++;
    for (TreeNode* n = root; n; n = n->right) rh++;
    if (lh == rh) return (1 << lh) - 1;
    return 1 + countNodes(root->left) + countNodes(root->right);
}
```
```py
def count_nodes(root):
    if not root: return 0
    lh = rh = 0; n = root
    while n: lh += 1; n = n.left
    n = root
    while n: rh += 1; n = n.right
    if lh == rh: return (1 << lh) - 1
    return 1 + count_nodes(root.left) + count_nodes(root.right)
```
TC: O(log^2 n). SC: O(log n).
### Flatten Binary Tree to Linked List (preorder, in place)
Idea: for each node with a left child, find the rightmost node of the left subtree, hang the right subtree there, then move the left subtree to the right.
```cpp
void flattenTree(TreeNode* root) {
    for (TreeNode* cur = root; cur; cur = cur->right) {
        if (!cur->left) continue;
        TreeNode* pre = cur->left;
        while (pre->right) pre = pre->right;
        pre->right = cur->right;
        cur->right = cur->left; cur->left = nullptr;
    }
}
```
```py
def flatten_tree(root):
    cur = root
    while cur:
        if cur.left:
            pre = cur.left
            while pre.right: pre = pre.right
            pre.right = cur.right
            cur.right, cur.left = cur.left, None
        cur = cur.right
```
TC: O(n). SC: O(1).
## Binary Trees: Construction Problems
### Requirements needed to construct a unique BT
- **Inorder + Preorder** or **Inorder + Postorder** give a unique tree. Preorder + Postorder do NOT (unless the tree is full), because we cannot tell whether a single child is left or right.
- Preorder/postorder tell us the **root**; inorder tells us what lies to its **left and right**.
### Construct a BT from Preorder and Inorder
Idea: the first preorder element is the root. Find it in inorder (hash map): everything to its left is the left subtree. Recurse.
```cpp
TreeNode* buildPreIn(vector<int>& pre, int& idx, int lo, int hi, unordered_map<int,int>& pos) {
    if (lo > hi) return nullptr;
    TreeNode* root = new TreeNode(pre[idx++]);
    int mid = pos[root->val];
    root->left = buildPreIn(pre, idx, lo, mid - 1, pos);
    root->right = buildPreIn(pre, idx, mid + 1, hi, pos);
    return root;
}
TreeNode* buildTree(vector<int>& pre, vector<int>& in) {
    unordered_map<int,int> pos; for (int i = 0; i < (int)in.size(); i++) pos[in[i]] = i;
    int idx = 0; return buildPreIn(pre, idx, 0, in.size() - 1, pos);
}
```
```py
def build_tree(pre, ino):
    pos = {v: i for i, v in enumerate(ino)}; idx = 0
    def build(lo, hi):
        nonlocal idx
        if lo > hi: return None
        root = TreeNode(pre[idx]); idx += 1
        mid = pos[root.val]
        root.left = build(lo, mid - 1); root.right = build(mid + 1, hi)
        return root
    return build(0, len(ino) - 1)
```
TC: O(n). SC: O(n).
### Construct a BT from Postorder and Inorder
Idea: the **last** postorder element is the root; build the **right** subtree first (reading postorder backwards).
```cpp
TreeNode* buildPostIn(vector<int>& post, int& idx, int lo, int hi, unordered_map<int,int>& pos) {
    if (lo > hi) return nullptr;
    TreeNode* root = new TreeNode(post[idx--]);
    int mid = pos[root->val];
    root->right = buildPostIn(post, idx, mid + 1, hi, pos);
    root->left = buildPostIn(post, idx, lo, mid - 1, pos);
    return root;
}
```
```py
def build_tree_post(ino, post):
    pos = {v: i for i, v in enumerate(ino)}; idx = len(post) - 1
    def build(lo, hi):
        nonlocal idx
        if lo > hi: return None
        root = TreeNode(post[idx]); idx -= 1
        mid = pos[root.val]
        root.right = build(mid + 1, hi); root.left = build(lo, mid - 1)
        return root
    return build(0, len(ino) - 1)
```
TC: O(n). SC: O(n).
### Serialize and De-serialize BT
Idea: preorder with a marker "#" for null children. The markers make the string decode uniquely.
```cpp
void serializeRec(TreeNode* n, string& s) {
    if (!n) { s += "#,"; return; }
    s += to_string(n->val) + ",";
    serializeRec(n->left, s); serializeRec(n->right, s);
}
TreeNode* deserializeRec(stringstream& ss) {
    string tok; getline(ss, tok, ',');
    if (tok == "#") return nullptr;
    TreeNode* n = new TreeNode(stoi(tok));
    n->left = deserializeRec(ss); n->right = deserializeRec(ss);
    return n;
}
string serialize(TreeNode* root) { string s; serializeRec(root, s); return s; }
TreeNode* deserialize(string data) { stringstream ss(data); return deserializeRec(ss); }
```
```py
def serialize(root):
    out = []
    def dfs(n):
        if not n: out.append("#"); return
        out.append(str(n.val)); dfs(n.left); dfs(n.right)
    dfs(root)
    return ",".join(out)
def deserialize(data):
    it = iter(data.split(","))
    def build():
        tok = next(it)
        if tok == "#": return None
        n = TreeNode(int(tok)); n.left = build(); n.right = build()
        return n
    return build()
```
TC: O(n). SC: O(n).
## Binary Trees: Traversal in Constant Space
### Morris Inorder Traversal
Idea: no stack, no recursion. Before going left, make a temporary **thread** from the inorder predecessor (rightmost node of the left subtree) back to the current node. When we arrive again through the thread, remove it and go right.
```cpp
vector<int> morrisInorder(TreeNode* root) {
    vector<int> out; TreeNode* cur = root;
    while (cur) {
        if (!cur->left) { out.push_back(cur->val); cur = cur->right; continue; }
        TreeNode* pre = cur->left;
        while (pre->right && pre->right != cur) pre = pre->right;
        if (!pre->right) { pre->right = cur; cur = cur->left; }            // make thread
        else { pre->right = nullptr; out.push_back(cur->val); cur = cur->right; }   // remove thread
    }
    return out;
}
```
```py
def morris_inorder(root):
    out, cur = [], root
    while cur:
        if not cur.left: out.append(cur.val); cur = cur.right; continue
        pre = cur.left
        while pre.right and pre.right is not cur: pre = pre.right
        if not pre.right: pre.right = cur; cur = cur.left
        else: pre.right = None; out.append(cur.val); cur = cur.right
    return out
```
TC: O(n) - every edge is walked at most twice. SC: O(1).
### Morris Preorder Traversal
Idea: same threads; record the node when the thread is **created** (first visit) instead of when it is removed.
```cpp
vector<int> morrisPreorder(TreeNode* root) {
    vector<int> out; TreeNode* cur = root;
    while (cur) {
        if (!cur->left) { out.push_back(cur->val); cur = cur->right; continue; }
        TreeNode* pre = cur->left;
        while (pre->right && pre->right != cur) pre = pre->right;
        if (!pre->right) { out.push_back(cur->val); pre->right = cur; cur = cur->left; }
        else { pre->right = nullptr; cur = cur->right; }
    }
    return out;
}
```
```py
def morris_preorder(root):
    out, cur = [], root
    while cur:
        if not cur.left: out.append(cur.val); cur = cur.right; continue
        pre = cur.left
        while pre.right and pre.right is not cur: pre = pre.right
        if not pre.right: out.append(cur.val); pre.right = cur; cur = cur.left
        else: pre.right = None; cur = cur.right
    return out
```
TC: O(n). SC: O(1).
## Binary Search Trees: Theory and Basics
### Introduction to BST
- A BST is a binary tree where for **every** node: all values in the left subtree < node < all values in the right subtree.
- So search works like binary search: go left or right at each node. Cost = height: O(log n) if balanced, O(n) if skewed. **Inorder traversal of a BST is sorted.**
@tree 8(3(1,6(4,7)),10(,14(13,))) :: BST: inorder gives 1 3 4 6 7 8 10 13 14
### Search in BST
```cpp
TreeNode* searchBST(TreeNode* root, int x) {
    while (root && root->val != x) root = x < root->val ? root->left : root->right;
    return root;
}
```
```py
def search_bst(root, x):
    while root and root.val != x:
        root = root.left if x < root.val else root.right
    return root
```
TC: O(h). SC: O(1).
### Floor and Ceil in a BST
```cpp
pair<int,int> floorCeilBST(TreeNode* root, int x) {
    int fl = -1, ce = -1;
    while (root) {
        if (root->val == x) return {x, x};
        if (root->val < x) { fl = root->val; root = root->right; }
        else { ce = root->val; root = root->left; }
    }
    return {fl, ce};
}
```
```py
def floor_ceil_bst(root, x):
    fl = ce = -1
    while root:
        if root.val == x: return x, x
        if root.val < x: fl = root.val; root = root.right
        else: ce = root.val; root = root.left
    return fl, ce
```
TC: O(h). SC: O(1).
### Minimum and Maximum in BST
Idea: the minimum is the leftmost node; the maximum is the rightmost node.
```cpp
int minBST(TreeNode* root) { while (root->left) root = root->left; return root->val; }
int maxBST(TreeNode* root) { while (root->right) root = root->right; return root->val; }
```
```py
def min_bst(root):
    while root.left: root = root.left
    return root.val
def max_bst(root):
    while root.right: root = root.right
    return root.val
```
TC: O(h). SC: O(1).
## Binary Search Trees: Medium
### Insert a given node in BST
Idea: walk down like a search; attach the new node where we fall off the tree.
```cpp
TreeNode* insertIntoBST(TreeNode* root, int x) {
    if (!root) return new TreeNode(x);
    if (x < root->val) root->left = insertIntoBST(root->left, x);
    else root->right = insertIntoBST(root->right, x);
    return root;
}
```
```py
def insert_into_bst(root, x):
    if not root: return TreeNode(x)
    if x < root.val: root.left = insert_into_bst(root.left, x)
    else: root.right = insert_into_bst(root.right, x)
    return root
```
TC: O(h). SC: O(h) recursion.
### Delete a node in BST
Idea: 3 cases. Leaf: remove. One child: replace by the child. Two children: copy the **inorder successor** (smallest of the right subtree) into the node, then delete that successor.
```cpp
TreeNode* deleteNode(TreeNode* root, int key) {
    if (!root) return nullptr;
    if (key < root->val) root->left = deleteNode(root->left, key);
    else if (key > root->val) root->right = deleteNode(root->right, key);
    else {
        if (!root->left) { TreeNode* r = root->right; delete root; return r; }
        if (!root->right) { TreeNode* l = root->left; delete root; return l; }
        TreeNode* succ = root->right;
        while (succ->left) succ = succ->left;
        root->val = succ->val;
        root->right = deleteNode(root->right, succ->val);
    }
    return root;
}
```
```py
def delete_node(root, key):
    if not root: return None
    if key < root.val: root.left = delete_node(root.left, key)
    elif key > root.val: root.right = delete_node(root.right, key)
    else:
        if not root.left: return root.right
        if not root.right: return root.left
        succ = root.right
        while succ.left: succ = succ.left
        root.val = succ.val
        root.right = delete_node(root.right, succ.val)
    return root
```
TC: O(h). SC: O(h).
### Kth Smallest and Largest element in BST
Idea: inorder is sorted, so the k-th visited node is the k-th smallest. k-th largest = (n - k + 1)-th smallest, or reverse inorder.
```cpp
int kthSmallest(TreeNode* root, int k) {
    stack<TreeNode*> st; TreeNode* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }
        cur = st.top(); st.pop();
        if (--k == 0) return cur->val;
        cur = cur->right;
    }
    return -1;
}
int kthLargest(TreeNode* root, int k) {
    stack<TreeNode*> st; TreeNode* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->right; }
        cur = st.top(); st.pop();
        if (--k == 0) return cur->val;
        cur = cur->left;
    }
    return -1;
}
```
```py
def kth_smallest(root, k, largest=False):
    st, cur = [], root
    while cur or st:
        while cur: st.append(cur); cur = cur.right if largest else cur.left
        cur = st.pop(); k -= 1
        if k == 0: return cur.val
        cur = cur.left if largest else cur.right
    return -1
```
TC: O(h + k). SC: O(h).
### Check if a tree is a BST or not
Idea: every node must lie inside a (low, high) range inherited from its ancestors. Going left tightens the upper bound, going right the lower bound.
```cpp
bool validBST(TreeNode* n, long long lo, long long hi) {
    if (!n) return true;
    if (n->val <= lo || n->val >= hi) return false;
    return validBST(n->left, lo, n->val) && validBST(n->right, n->val, hi);
}
bool isValidBST(TreeNode* root) { return validBST(root, LLONG_MIN, LLONG_MAX); }
```
```py
def is_valid_bst(root, lo=float('-inf'), hi=float('inf')):
    if not root: return True
    if not (lo < root.val < hi): return False
    return is_valid_bst(root.left, lo, root.val) and is_valid_bst(root.right, root.val, hi)
```
TC: O(n). SC: O(h).
### LCA in BST
Idea: if both targets are smaller go left, if both bigger go right; the first node where they **split** is the LCA.
```cpp
TreeNode* lcaBST(TreeNode* root, TreeNode* p, TreeNode* q) {
    while (root) {
        if (p->val < root->val && q->val < root->val) root = root->left;
        else if (p->val > root->val && q->val > root->val) root = root->right;
        else return root;
    }
    return nullptr;
}
```
```py
def lca_bst(root, p, q):
    while root:
        if p.val < root.val and q.val < root.val: root = root.left
        elif p.val > root.val and q.val > root.val: root = root.right
        else: return root
```
TC: O(h). SC: O(1).
### Construct a BST from a preorder traversal
Idea: pass an **upper bound**. The next preorder value belongs in the current subtree only if it is smaller than the bound.
```cpp
TreeNode* bstFromPre(vector<int>& pre, int& i, int bound) {
    if (i == (int)pre.size() || pre[i] > bound) return nullptr;
    TreeNode* root = new TreeNode(pre[i++]);
    root->left = bstFromPre(pre, i, root->val);
    root->right = bstFromPre(pre, i, bound);
    return root;
}
TreeNode* bstFromPreorder(vector<int>& pre) { int i = 0; return bstFromPre(pre, i, INT_MAX); }
```
```py
def bst_from_preorder(pre):
    i = 0
    def build(bound):
        nonlocal i
        if i == len(pre) or pre[i] > bound: return None
        root = TreeNode(pre[i]); i += 1
        root.left = build(root.val); root.right = build(bound)
        return root
    return build(float('inf'))
```
TC: O(n). SC: O(h).
### Inorder successor and predecessor in BST
Idea: successor = smallest value greater than key: whenever we go left, the current node is a candidate. Predecessor is the mirror.
```cpp
pair<int,int> predSucc(TreeNode* root, int key) {
    int pred = -1, succ = -1;
    for (TreeNode* n = root; n;) { if (n->val > key) { succ = n->val; n = n->left; } else n = n->right; }
    for (TreeNode* n = root; n;) { if (n->val < key) { pred = n->val; n = n->right; } else n = n->left; }
    return {pred, succ};
}
```
```py
def pred_succ(root, key):
    pred = succ = -1; n = root
    while n:
        if n.val > key: succ = n.val; n = n.left
        else: n = n.right
    n = root
    while n:
        if n.val < key: pred = n.val; n = n.right
        else: n = n.left
    return pred, succ
```
TC: O(h). SC: O(1).
## Binary Search Trees: FAQs
### BST iterator
Idea: a controlled inorder. Keep a stack with the left spine. `next()` pops a node and pushes the left spine of its right child.
```cpp
class BSTIterator {
    stack<TreeNode*> st;
    void pushLeft(TreeNode* n) { while (n) { st.push(n); n = n->left; } }
public:
    BSTIterator(TreeNode* root) { pushLeft(root); }
    int next() { TreeNode* n = st.top(); st.pop(); pushLeft(n->right); return n->val; }
    bool hasNext() { return !st.empty(); }
};
```
```py
class BSTIterator:
    def __init__(self, root): self.st = []; self._push(root)
    def _push(self, n):
        while n: self.st.append(n); n = n.left
    def next(self):
        n = self.st.pop(); self._push(n.right); return n.val
    def has_next(self): return bool(self.st)
```
TC: amortised O(1) per call. SC: O(h).
### Two sum in BST
```cpp
bool findTarget(TreeNode* root, int k) {
    unordered_set<int> seen; stack<TreeNode*> st; st.push(root);
    while (!st.empty()) {
        TreeNode* n = st.top(); st.pop();
        if (!n) continue;
        if (seen.count(k - n->val)) return true;
        seen.insert(n->val); st.push(n->left); st.push(n->right);
    }
    return false;
}
```
```py
def find_target(root, k):
    seen, st = set(), [root]
    while st:
        n = st.pop()
        if not n: continue
        if k - n.val in seen: return True
        seen.add(n.val); st.extend((n.left, n.right))
    return False
```
TC: O(n). SC: O(n). (O(h) space is possible with a forward and a backward BST iterator as two pointers.)
### Correct BST with two nodes swapped
Idea: inorder should be increasing. Find the places where prev > current: the first violation's prev and the last violation's current are the swapped nodes.
```cpp
void recoverTree(TreeNode* root) {
    TreeNode *first = nullptr, *second = nullptr, *prev = nullptr, *cur = root; stack<TreeNode*> st;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }
        cur = st.top(); st.pop();
        if (prev && prev->val > cur->val) { if (!first) first = prev; second = cur; }
        prev = cur; cur = cur->right;
    }
    if (first && second) swap(first->val, second->val);
}
```
```py
def recover_tree(root):
    first = second = prev = None; st, cur = [], root
    while cur or st:
        while cur: st.append(cur); cur = cur.left
        cur = st.pop()
        if prev and prev.val > cur.val:
            if not first: first = prev
            second = cur
        prev, cur = cur, cur.right
    if first and second: first.val, second.val = second.val, first.val
```
TC: O(n). SC: O(h).
### Largest BST in Binary Tree
Idea: postorder. Each subtree reports (size, min, max). A node forms a BST if left.max < node < right.min; otherwise report an "invalid" range so ancestors fail too.
```cpp
array<int,3> largestBSTRec(TreeNode* n) {                 // {size, min, max}
    if (!n) return {0, INT_MAX, INT_MIN};
    auto l = largestBSTRec(n->left), r = largestBSTRec(n->right);
    if (l[2] < n->val && n->val < r[1]) return {l[0] + r[0] + 1, min(n->val, l[1]), max(n->val, r[2])};
    return {max(l[0], r[0]), INT_MIN, INT_MAX};
}
int largestBST(TreeNode* root) { return largestBSTRec(root)[0]; }
```
```py
def largest_bst(root):
    INF = float('inf')
    def rec(n):                                   # (size, min, max)
        if not n: return 0, INF, -INF
        ls, lmin, lmax = rec(n.left); rs, rmin, rmax = rec(n.right)
        if lmax < n.val < rmin: return ls + rs + 1, min(n.val, lmin), max(n.val, rmax)
        return max(ls, rs), -INF, INF
    return rec(root)[0]
```
TC: O(n). SC: O(h).
## Heaps: Theory and Implementation
### Heaps (Theory)
- A **heap** is a **complete binary tree** stored in an array. **Min heap**: every parent <= its children (root = minimum). **Max heap**: every parent >= its children (root = maximum).
- Array mapping (0-based): parent(i) = (i - 1) / 2, left(i) = 2i + 1, right(i) = 2i + 2.
- Insert: add at the end and **sift up**. Extract root: move the last element to the root and **sift down**. Both O(log n) = height. Peek O(1).
- A **priority queue** is the abstract type; a heap is how it is implemented. Use it for "k largest / smallest", "always take the best next", merging sorted streams, Dijkstra.
@tree 1(3(7,8),5(9,)) :: Min heap as a tree; array = [1, 3, 5, 7, 8, 9]
@array 1 3 5 7 8 9 :: children of index i are at 2i+1 and 2i+2
### Heapify Algorithm
Idea: after changing the value at index i, restore the heap: if the value became smaller (min heap) sift it up, else sift it down.
```cpp
void siftDown(vector<int>& h, int i, int n) {           // min heap
    while (true) {
        int s = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && h[l] < h[s]) s = l;
        if (r < n && h[r] < h[s]) s = r;
        if (s == i) return;
        swap(h[i], h[s]); i = s;
    }
}
void siftUp(vector<int>& h, int i) {
    while (i > 0 && h[(i - 1) / 2] > h[i]) { swap(h[i], h[(i - 1) / 2]); i = (i - 1) / 2; }
}
void heapify(vector<int>& h, int i, int val) {
    int old = h[i]; h[i] = val;
    if (val < old) siftUp(h, i); else siftDown(h, i, h.size());
}
```
```py
def sift_down(h, i, n):
    while True:
        s, l, r = i, 2 * i + 1, 2 * i + 2
        if l < n and h[l] < h[s]: s = l
        if r < n and h[r] < h[s]: s = r
        if s == i: return
        h[i], h[s] = h[s], h[i]; i = s
def sift_up(h, i):
    while i > 0 and h[(i - 1) // 2] > h[i]:
        h[i], h[(i - 1) // 2] = h[(i - 1) // 2], h[i]; i = (i - 1) // 2
def heapify(h, i, val):
    old, h[i] = h[i], val
    if val < old: sift_up(h, i)
    else: sift_down(h, i, len(h))
```
TC: O(log n). SC: O(1).
### Build heap from a given Array
Idea: leaves are already heaps. Sift down every internal node from the last one (n/2 - 1) to the root.
Why: O(n), not O(n log n): most nodes are near the bottom and sift only a short distance (sum of heights = n).
```cpp
void buildMinHeap(vector<int>& a) {
    for (int i = (int)a.size() / 2 - 1; i >= 0; i--) siftDown(a, i, a.size());
}
```
```py
def build_min_heap(a):
    for i in range(len(a) // 2 - 1, -1, -1): sift_down(a, i, len(a))
```
TC: O(n). SC: O(1).
### Implement Min Heap
```cpp
class MinHeap {
    vector<int> h;
public:
    void insert(int x) { h.push_back(x); siftUp(h, h.size() - 1); }
    int getMin() { return h[0]; }
    void extractMin() { h[0] = h.back(); h.pop_back(); if (!h.empty()) siftDown(h, 0, h.size()); }
    int size() { return h.size(); }
    bool isEmpty() { return h.empty(); }
    void changeKey(int i, int val) { heapify(h, i, val); }
};
```
```py
class MinHeap:
    def __init__(self): self.h = []
    def insert(self, x): self.h.append(x); sift_up(self.h, len(self.h) - 1)
    def get_min(self): return self.h[0]
    def extract_min(self):
        self.h[0] = self.h[-1]; self.h.pop()
        if self.h: sift_down(self.h, 0, len(self.h))
    def size(self): return len(self.h)
    def change_key(self, i, val): heapify(self.h, i, val)
```
TC: insert / extract / changeKey O(log n), getMin O(1). SC: O(n).
### Implement Max Heap
Idea: same code with the comparisons flipped.
```cpp
class MaxHeap {
    vector<int> h;
    void down(int i) { int n = h.size(); while (true) { int b = i, l = 2 * i + 1, r = 2 * i + 2; if (l < n && h[l] > h[b]) b = l; if (r < n && h[r] > h[b]) b = r; if (b == i) return; swap(h[i], h[b]); i = b; } }
    void up(int i) { while (i > 0 && h[(i - 1) / 2] < h[i]) { swap(h[i], h[(i - 1) / 2]); i = (i - 1) / 2; } }
public:
    void insert(int x) { h.push_back(x); up(h.size() - 1); }
    int getMax() { return h[0]; }
    void extractMax() { h[0] = h.back(); h.pop_back(); if (!h.empty()) down(0); }
    int size() { return h.size(); }
};
```
```py
class MaxHeap:                       # store negatives inside a min heap
    def __init__(self): self.h = []
    def insert(self, x): heapq.heappush(self.h, -x)
    def get_max(self): return -self.h[0]
    def extract_max(self): heapq.heappop(self.h)
    def size(self): return len(self.h)
```
TC: O(log n) insert / extract. SC: O(n).
### Check if an array represents a min heap
```cpp
bool isMinHeap(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n / 2; i++) {
        if (a[2 * i + 1] < a[i]) return false;
        if (2 * i + 2 < n && a[2 * i + 2] < a[i]) return false;
    }
    return true;
}
```
```py
def is_min_heap(a):
    n = len(a)
    return all(a[i] <= a[c] for i in range(n // 2) for c in (2 * i + 1, 2 * i + 2) if c < n)
```
TC: O(n). SC: O(1).
### Convert Min Heap to Max Heap
Idea: ignore the old order; just build a max heap from the array (sift down from the last internal node).
```cpp
void minToMaxHeap(vector<int>& a) {
    int n = a.size();
    for (int s = n / 2 - 1; s >= 0; s--) {
        int i = s;
        while (true) {
            int b = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && a[l] > a[b]) b = l;
            if (r < n && a[r] > a[b]) b = r;
            if (b == i) break;
            swap(a[i], a[b]); i = b;
        }
    }
}
```
```py
def min_to_max_heap(a):
    n = len(a)
    for s in range(n // 2 - 1, -1, -1):
        i = s
        while True:
            b, l, r = i, 2 * i + 1, 2 * i + 2
            if l < n and a[l] > a[b]: b = l
            if r < n and a[r] > a[b]: b = r
            if b == i: break
            a[i], a[b] = a[b], a[i]; i = b
```
TC: O(n). SC: O(1).
### Heap Sort
Idea: build a max heap. Repeatedly swap the root (maximum) with the last element, shrink the heap by one and sift the new root down.
```cpp
void heapSort(vector<int>& a) {
    int n = a.size();
    auto down = [&](int i, int size) {
        while (true) {
            int b = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < size && a[l] > a[b]) b = l;
            if (r < size && a[r] > a[b]) b = r;
            if (b == i) return;
            swap(a[i], a[b]); i = b;
        }
    };
    for (int i = n / 2 - 1; i >= 0; i--) down(i, n);
    for (int end = n - 1; end > 0; end--) { swap(a[0], a[end]); down(0, end); }
}
```
```py
def heap_sort(a):
    n = len(a)
    def down(i, size):
        while True:
            b, l, r = i, 2 * i + 1, 2 * i + 2
            if l < size and a[l] > a[b]: b = l
            if r < size and a[r] > a[b]: b = r
            if b == i: return
            a[i], a[b] = a[b], a[i]; i = b
    for i in range(n // 2 - 1, -1, -1): down(i, n)
    for end in range(n - 1, 0, -1):
        a[0], a[end] = a[end], a[0]; down(0, end)
```
TC: O(n log n) in all cases. SC: O(1). Not stable.
### K-th Largest element in an array
Idea: keep a **min heap of size k**. It always holds the k largest seen so far; its top is the k-th largest.
```cpp
int findKthLargest(vector<int>& a, int k) {
    priority_queue<int, vector<int>, greater<int>> pq;
    for (int x : a) { pq.push(x); if ((int)pq.size() > k) pq.pop(); }
    return pq.top();
}
```
```py
import heapq
def find_kth_largest(a, k):
    h = []
    for x in a:
        heapq.heappush(h, x)
        if len(h) > k: heapq.heappop(h)
    return h[0]
```
TC: O(n log k). SC: O(k). (Quickselect gives O(n) average.)
## Heaps: FAQs
### Kth largest element in a stream of running integers
```cpp
class KthLargest {
    priority_queue<int, vector<int>, greater<int>> pq; int k;
public:
    KthLargest(int k, vector<int>& nums) : k(k) { for (int x : nums) add(x); }
    int add(int val) { pq.push(val); if ((int)pq.size() > k) pq.pop(); return pq.top(); }
};
```
```py
class KthLargest:
    def __init__(self, k, nums):
        self.k, self.h = k, []
        for x in nums: self.add(x)
    def add(self, val):
        heapq.heappush(self.h, val)
        if len(self.h) > self.k: heapq.heappop(self.h)
        return self.h[0]
```
TC: O(log k) per add. SC: O(k).
### Sort a K-Sorted Array (each element at most k away from its place)
Idea: the smallest of the first k + 1 elements must be the first output. Slide a min heap of size k + 1.
```cpp
vector<int> sortKSorted(vector<int>& a, int k) {
    priority_queue<int, vector<int>, greater<int>> pq; vector<int> out;
    for (int x : a) { pq.push(x); if ((int)pq.size() > k) { out.push_back(pq.top()); pq.pop(); } }
    while (!pq.empty()) { out.push_back(pq.top()); pq.pop(); }
    return out;
}
```
```py
def sort_k_sorted(a, k):
    h, out = [], []
    for x in a:
        heapq.heappush(h, x)
        if len(h) > k: out.append(heapq.heappop(h))
    while h: out.append(heapq.heappop(h))
    return out
```
TC: O(n log k). SC: O(k).
### Merge K sorted Lists
Idea: a min heap holds the current head of every list. Pop the smallest, append it, push its next node.
```cpp
ListNode* mergeKLists(vector<ListNode*>& lists) {
    auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };
    priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);
    for (ListNode* l : lists) if (l) pq.push(l);
    ListNode dummy(0); ListNode* tail = &dummy;
    while (!pq.empty()) {
        ListNode* n = pq.top(); pq.pop();
        tail->next = n; tail = n;
        if (n->next) pq.push(n->next);
    }
    return dummy.next;
}
```
```py
def merge_k_lists(lists):
    h = [(l.val, i, l) for i, l in enumerate(lists) if l]
    heapq.heapify(h)
    dummy = tail = ListNode()
    while h:
        _, i, n = heapq.heappop(h)
        tail.next = n; tail = n
        if n.next: heapq.heappush(h, (n.next.val, i, n.next))
    return dummy.next
```
TC: O(N log k), N = total nodes. SC: O(k).
### Replace Elements by Their Rank
Idea: sort a copy of the distinct values; rank = position (1-based) in that order.
```cpp
vector<int> arrayRankTransform(vector<int>& a) {
    vector<int> s(a); sort(s.begin(), s.end()); s.erase(unique(s.begin(), s.end()), s.end());
    vector<int> ans;
    for (int x : a) ans.push_back(lower_bound(s.begin(), s.end(), x) - s.begin() + 1);
    return ans;
}
```
```py
def array_rank_transform(a):
    rank = {v: i + 1 for i, v in enumerate(sorted(set(a)))}
    return [rank[x] for x in a]
```
TC: O(n log n). SC: O(n).
### Task Scheduler
Idea: the most frequent task (count f) creates f - 1 gaps of size n + 1, plus one slot for every task sharing the max frequency. Answer = max(total tasks, (f - 1)(n + 1) + countOfMax).
```cpp
int leastInterval(vector<char>& tasks, int n) {
    int f[26] = {0}, mx = 0, cntMx = 0;
    for (char c : tasks) mx = max(mx, ++f[c - 'A']);
    for (int x : f) if (x == mx) cntMx++;
    return max((int)tasks.size(), (mx - 1) * (n + 1) + cntMx);
}
```
```py
def least_interval(tasks, n):
    f = Counter(tasks); mx = max(f.values())
    cnt_mx = sum(1 for v in f.values() if v == mx)
    return max(len(tasks), (mx - 1) * (n + 1) + cnt_mx)
```
TC: O(n). SC: O(26).
### Hand of Straights
Idea: always start a group from the smallest remaining card; it needs the next groupSize - 1 consecutive cards.
```cpp
bool isNStraightHand(vector<int>& hand, int groupSize) {
    if (hand.size() % groupSize) return false;
    map<int,int> cnt; for (int x : hand) cnt[x]++;
    while (!cnt.empty()) {
        int start = cnt.begin()->first;
        for (int v = start; v < start + groupSize; v++) {
            auto it = cnt.find(v);
            if (it == cnt.end()) return false;
            if (--it->second == 0) cnt.erase(it);
        }
    }
    return true;
}
```
```py
def is_n_straight_hand(hand, group_size):
    if len(hand) % group_size: return False
    cnt = Counter(hand)
    for start in sorted(cnt):
        need = cnt[start]
        if need == 0: continue
        for v in range(start, start + group_size):
            if cnt[v] < need: return False
            cnt[v] -= need
    return True
```
TC: O(n log n). SC: O(n).
### Design Twitter
Idea: each user has a list of (time, tweetId) and a follow set. The news feed merges the most recent tweets of the user and the followees with a max heap and takes 10.
```cpp
class Twitter {
    int timer = 0;
    unordered_map<int, vector<pair<int,int>>> tweets;       // user -> {time, id}
    unordered_map<int, unordered_set<int>> following;
public:
    void postTweet(int user, int id) { tweets[user].push_back({timer++, id}); }
    vector<int> getNewsFeed(int user) {
        priority_queue<array<int,4>> pq;                    // {time, id, owner, index}
        following[user].insert(user);
        for (int f : following[user]) { auto& t = tweets[f]; if (!t.empty()) pq.push({t.back().first, t.back().second, f, (int)t.size() - 1}); }
        vector<int> feed;
        while (!pq.empty() && feed.size() < 10) {
            auto [time, id, owner, idx] = pq.top(); pq.pop(); feed.push_back(id);
            if (idx > 0) { auto& t = tweets[owner]; pq.push({t[idx - 1].first, t[idx - 1].second, owner, idx - 1}); }
        }
        return feed;
    }
    void follow(int a, int b) { following[a].insert(b); }
    void unfollow(int a, int b) { if (a != b) following[a].erase(b); }
};
```
```py
class Twitter:
    def __init__(self):
        self.timer = 0; self.tweets = defaultdict(list); self.following = defaultdict(set)
    def post_tweet(self, user, tid):
        self.tweets[user].append((self.timer, tid)); self.timer += 1
    def get_news_feed(self, user):
        h = []
        for f in self.following[user] | {user}:
            t = self.tweets[f]
            if t: heapq.heappush(h, (-t[-1][0], t[-1][1], f, len(t) - 1))
        feed = []
        while h and len(feed) < 10:
            _, tid, owner, idx = heapq.heappop(h); feed.append(tid)
            if idx > 0:
                t = self.tweets[owner]; heapq.heappush(h, (-t[idx - 1][0], t[idx - 1][1], owner, idx - 1))
        return feed
    def follow(self, a, b): self.following[a].add(b)
    def unfollow(self, a, b): self.following[a].discard(b)
```
TC: feed O(f + 10 log f), f = followees. SC: O(tweets + follows).
### Minimum Cost to Connect Sticks
Idea: always join the two **shortest** sticks first (their cost is counted again in later joins) - like Huffman coding.
```cpp
long long connectSticks(vector<int>& sticks) {
    priority_queue<long long, vector<long long>, greater<long long>> pq(sticks.begin(), sticks.end());
    long long cost = 0;
    while (pq.size() > 1) {
        long long a = pq.top(); pq.pop(); long long b = pq.top(); pq.pop();
        cost += a + b; pq.push(a + b);
    }
    return cost;
}
```
```py
def connect_sticks(sticks):
    heapq.heapify(sticks); cost = 0
    while len(sticks) > 1:
        a, b = heapq.heappop(sticks), heapq.heappop(sticks)
        cost += a + b; heapq.heappush(sticks, a + b)
    return cost
```
TC: O(n log n). SC: O(n).
### Maximum Sum Combination (k largest sums A[i] + B[j])
Idea: sort both descending. The largest sum is (0, 0). From (i, j) the next candidates are (i + 1, j) and (i, j + 1). Use a max heap and a visited set.
```cpp
vector<int> maxSumCombinations(vector<int>& A, vector<int>& B, int k) {
    sort(A.rbegin(), A.rend()); sort(B.rbegin(), B.rend());
    priority_queue<array<int,3>> pq; set<pair<int,int>> seen; vector<int> ans; int n = A.size();
    pq.push({A[0] + B[0], 0, 0}); seen.insert({0, 0});
    while (k-- && !pq.empty()) {
        auto [s, i, j] = pq.top(); pq.pop(); ans.push_back(s);
        if (i + 1 < n && seen.insert({i + 1, j}).second) pq.push({A[i + 1] + B[j], i + 1, j});
        if (j + 1 < n && seen.insert({i, j + 1}).second) pq.push({A[i] + B[j + 1], i, j + 1});
    }
    return ans;
}
```
```py
def max_sum_combinations(A, B, k):
    A.sort(reverse=True); B.sort(reverse=True); n = len(A)
    h, seen, ans = [(-(A[0] + B[0]), 0, 0)], {(0, 0)}, []
    while k and h:
        s, i, j = heapq.heappop(h); ans.append(-s); k -= 1
        for ni, nj in ((i + 1, j), (i, j + 1)):
            if ni < n and nj < n and (ni, nj) not in seen:
                seen.add((ni, nj)); heapq.heappush(h, (-(A[ni] + B[nj]), ni, nj))
    return ans
```
TC: O(n log n + k log k). SC: O(k).
### Find Median from Data Stream
Idea: two heaps. A **max heap** holds the smaller half, a **min heap** holds the larger half. Keep sizes equal (or the max heap one bigger). The median is at the tops.
@chain small half (max heap) top = 5 -> median -> large half (min heap) top = 8 :: sizes differ by at most 1
```cpp
class MedianFinder {
    priority_queue<int> lo;                                   // max heap: smaller half
    priority_queue<int, vector<int>, greater<int>> hi;        // min heap: larger half
public:
    void addNum(int x) {
        lo.push(x); hi.push(lo.top()); lo.pop();
        if (hi.size() > lo.size()) { lo.push(hi.top()); hi.pop(); }
    }
    double findMedian() { return lo.size() > hi.size() ? lo.top() : (lo.top() + hi.top()) / 2.0; }
};
```
```py
class MedianFinder:
    def __init__(self): self.lo, self.hi = [], []       # lo stores negatives (max heap)
    def add_num(self, x):
        heapq.heappush(self.lo, -x)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        if len(self.hi) > len(self.lo): heapq.heappush(self.lo, -heapq.heappop(self.hi))
    def find_median(self):
        return -self.lo[0] if len(self.lo) > len(self.hi) else (-self.lo[0] + self.hi[0]) / 2
```
TC: add O(log n), median O(1). SC: O(n).
### Top K Frequent Elements
Idea: count frequencies, then **bucket sort**: bucket[f] = values with frequency f. Read buckets from high to low.
```cpp
vector<int> topKFrequent(vector<int>& a, int k) {
    unordered_map<int,int> f; for (int x : a) f[x]++;
    vector<vector<int>> bucket(a.size() + 1);
    for (auto& [v, c] : f) bucket[c].push_back(v);
    vector<int> ans;
    for (int c = a.size(); c >= 1 && (int)ans.size() < k; c--)
        for (int v : bucket[c]) { ans.push_back(v); if ((int)ans.size() == k) break; }
    return ans;
}
```
```py
def top_k_frequent(a, k):
    f = Counter(a); bucket = [[] for _ in range(len(a) + 1)]
    for v, c in f.items(): bucket[c].append(v)
    ans = []
    for c in range(len(a), 0, -1):
        for v in bucket[c]:
            ans.append(v)
            if len(ans) == k: return ans
    return ans
```
TC: O(n). SC: O(n).
