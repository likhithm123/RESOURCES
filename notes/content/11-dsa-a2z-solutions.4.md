## Linked List: Fundamentals (Singly LL)
### Introduction to Singly LinkedList
- A linked list is a chain of **nodes**. Each node stores `data` and a pointer `next` to the following node. The first node is the `head`; the last node points to NULL.
- Nodes live anywhere in heap memory (not contiguous). So: insertion/deletion at the head is O(1), but reaching the k-th node is O(k) (no index access).
@chain head -> 10 -> 20 -> 30 -> NULL :: Singly linked list
| Operation | Array | Linked list |
|---|---|---|
| Access k-th | O(1) | O(n) |
| Insert/delete at front | O(n) | O(1) |
| Insert/delete at end | O(1) amortised | O(n) (O(1) with tail) |
| Memory | contiguous, fixed | scattered, extra pointer |
```cpp
ListNode* arrayToLL(vector<int>& a) {
    if (a.empty()) return nullptr;
    ListNode* head = new ListNode(a[0]); ListNode* cur = head;
    for (int i = 1; i < (int)a.size(); i++) { cur->next = new ListNode(a[i]); cur = cur->next; }
    return head;
}
```
```py
def array_to_ll(a):
    if not a: return None
    head = cur = ListNode(a[0])
    for x in a[1:]:
        cur.next = ListNode(x); cur = cur.next
    return head
```
TC: O(n). SC: O(n) for the nodes.
### Traversal in Linked List
```cpp
vector<int> traverse(ListNode* head) {
    vector<int> out;
    for (ListNode* cur = head; cur; cur = cur->next) out.push_back(cur->val);
    return out;
}
```
```py
def traverse(head):
    out, cur = [], head
    while cur:
        out.append(cur.val); cur = cur.next
    return out
```
TC: O(n). SC: O(1) extra.
### Deletion in Linked List (theory)
Rule: to delete a node you must stand on the node **before** it and re-wire: `prev.next = prev.next.next`. Special case: deleting the head just moves head forward. In C++ free the removed node with `delete`.
@chain 10 -> 20* -> 30 -> NULL :: delete 20: make 10.next point to 30
### Insertion in Linked List (theory)
Rule: create the new node, first point **new.next** to the following node, then point **prev.next** to the new node (this order never loses the rest of the list).
### Deletion of the head of LL
```cpp
ListNode* deleteHead(ListNode* head) {
    if (!head) return nullptr;
    ListNode* nxt = head->next; delete head;
    return nxt;
}
```
```py
def delete_head(head):
    return head.next if head else None
```
TC: O(1). SC: O(1).
### Deletion of the tail of Linked List
Idea: stop at the second last node (the one whose next.next is NULL).
```cpp
ListNode* deleteTail(ListNode* head) {
    if (!head || !head->next) { delete head; return nullptr; }
    ListNode* cur = head;
    while (cur->next->next) cur = cur->next;
    delete cur->next; cur->next = nullptr;
    return head;
}
```
```py
def delete_tail(head):
    if not head or not head.next: return None
    cur = head
    while cur.next.next: cur = cur.next
    cur.next = None
    return head
```
TC: O(n). SC: O(1).
### Deletion of the Kth element of Linked List (1-based)
```cpp
ListNode* deleteKth(ListNode* head, int k) {
    if (!head) return nullptr;
    if (k == 1) { ListNode* n = head->next; delete head; return n; }
    ListNode* cur = head;
    for (int i = 1; i < k - 1 && cur; i++) cur = cur->next;
    if (cur && cur->next) { ListNode* del = cur->next; cur->next = del->next; delete del; }
    return head;
}
```
```py
def delete_kth(head, k):
    if not head: return None
    if k == 1: return head.next
    cur = head
    for _ in range(k - 2):
        if not cur: break
        cur = cur.next
    if cur and cur.next: cur.next = cur.next.next
    return head
```
TC: O(k). SC: O(1).
### Delete the element with value X
```cpp
ListNode* deleteValue(ListNode* head, int x) {
    if (!head) return nullptr;
    if (head->val == x) { ListNode* n = head->next; delete head; return n; }
    ListNode* cur = head;
    while (cur->next && cur->next->val != x) cur = cur->next;
    if (cur->next) { ListNode* del = cur->next; cur->next = del->next; delete del; }
    return head;
}
```
```py
def delete_value(head, x):
    if not head: return None
    if head.val == x: return head.next
    cur = head
    while cur.next and cur.next.val != x: cur = cur.next
    if cur.next: cur.next = cur.next.next
    return head
```
TC: O(n). SC: O(1).
### Insertion at the head of Linked List
```cpp
ListNode* insertHead(ListNode* head, int x) { return new ListNode(x, head); }
```
```py
def insert_head(head, x): return ListNode(x, head)
```
TC: O(1). SC: O(1).
### Insertion at the tail of Linked List
```cpp
ListNode* insertTail(ListNode* head, int x) {
    ListNode* node = new ListNode(x);
    if (!head) return node;
    ListNode* cur = head;
    while (cur->next) cur = cur->next;
    cur->next = node;
    return head;
}
```
```py
def insert_tail(head, x):
    node = ListNode(x)
    if not head: return node
    cur = head
    while cur.next: cur = cur.next
    cur.next = node
    return head
```
TC: O(n). SC: O(1).
### Insertion at the Kth position of Linked List (1-based)
```cpp
ListNode* insertKth(ListNode* head, int x, int k) {
    if (k == 1) return new ListNode(x, head);
    ListNode* cur = head;
    for (int i = 1; i < k - 1 && cur; i++) cur = cur->next;
    if (cur) cur->next = new ListNode(x, cur->next);
    return head;
}
```
```py
def insert_kth(head, x, k):
    if k == 1: return ListNode(x, head)
    cur = head
    for _ in range(k - 2):
        if not cur: break
        cur = cur.next
    if cur: cur.next = ListNode(x, cur.next)
    return head
```
TC: O(k). SC: O(1).
### Insertion before the value X in Linked List
```cpp
ListNode* insertBeforeValue(ListNode* head, int x, int val) {
    if (!head) return nullptr;
    if (head->val == x) return new ListNode(val, head);
    ListNode* cur = head;
    while (cur->next && cur->next->val != x) cur = cur->next;
    if (cur->next) cur->next = new ListNode(val, cur->next);
    return head;
}
```
```py
def insert_before_value(head, x, val):
    if not head: return None
    if head.val == x: return ListNode(val, head)
    cur = head
    while cur.next and cur.next.val != x: cur = cur.next
    if cur.next: cur.next = ListNode(val, cur.next)
    return head
```
TC: O(n). SC: O(1).
### Find the length of the Linked List
```cpp
int lengthLL(ListNode* head) { int n = 0; while (head) { n++; head = head->next; } return n; }
```
```py
def length_ll(head):
    n = 0
    while head: n += 1; head = head.next
    return n
```
TC: O(n). SC: O(1).
### Search in Linked List
```cpp
bool searchLL(ListNode* head, int x) { while (head) { if (head->val == x) return true; head = head->next; } return false; }
```
```py
def search_ll(head, x):
    while head:
        if head.val == x: return True
        head = head.next
    return False
```
TC: O(n). SC: O(1).
## Linked List: Fundamentals (Doubly LL)
### Introduction to Doubly LL
- Each node has **two** pointers: `prev` and `next`. We can walk both directions and delete a node in O(1) if we hold its pointer. Cost: one more pointer per node.
@chain NULL <-> 10 <-> 20 <-> 30 <-> NULL :: Doubly linked list
### Deletion in Doubly LL / Insertion in DLL (theory)
Rule: every change must fix **four** links at most: the neighbours' next/prev and the node's own next/prev. Always check that a neighbour exists before touching it.
### Convert Array to Doubly Linked List
```cpp
DNode* arrayToDLL(vector<int>& a) {
    if (a.empty()) return nullptr;
    DNode* head = new DNode(a[0]); DNode* cur = head;
    for (int i = 1; i < (int)a.size(); i++) {
        DNode* node = new DNode(a[i]);
        cur->next = node; node->prev = cur; cur = node;
    }
    return head;
}
```
```py
def array_to_dll(a):
    if not a: return None
    head = cur = DNode(a[0])
    for x in a[1:]:
        node = DNode(x); cur.next = node; node.prev = cur; cur = node
    return head
```
TC: O(n). SC: O(n).
### Delete head of Doubly Linked List
```cpp
DNode* dllDeleteHead(DNode* head) {
    if (!head) return nullptr;
    DNode* nxt = head->next;
    if (nxt) nxt->prev = nullptr;
    delete head;
    return nxt;
}
```
```py
def dll_delete_head(head):
    if not head: return None
    nxt = head.next
    if nxt: nxt.prev = None
    return nxt
```
TC: O(1). SC: O(1).
### Delete Tail of Doubly Linked List
```cpp
DNode* dllDeleteTail(DNode* head) {
    if (!head || !head->next) { delete head; return nullptr; }
    DNode* tail = head;
    while (tail->next) tail = tail->next;
    tail->prev->next = nullptr; delete tail;
    return head;
}
```
```py
def dll_delete_tail(head):
    if not head or not head.next: return None
    tail = head
    while tail.next: tail = tail.next
    tail.prev.next = None
    return head
```
TC: O(n). SC: O(1).
### Removing given node in Doubly Linked List
Idea: we hold the node itself, so link its neighbours to each other.
```cpp
void dllDeleteNode(DNode* node) {            // node is not the head
    DNode *p = node->prev, *n = node->next;
    if (p) p->next = n;
    if (n) n->prev = p;
    delete node;
}
```
```py
def dll_delete_node(node):
    p, n = node.prev, node.next
    if p: p.next = n
    if n: n.prev = p
```
TC: O(1). SC: O(1).
### Delete Kth Element of Doubly Linked List
```cpp
DNode* dllDeleteKth(DNode* head, int k) {
    DNode* cur = head;
    for (int i = 1; i < k && cur; i++) cur = cur->next;
    if (!cur) return head;
    if (cur == head) return dllDeleteHead(head);
    dllDeleteNode(cur);
    return head;
}
```
```py
def dll_delete_kth(head, k):
    cur = head
    for _ in range(k - 1):
        if not cur: break
        cur = cur.next
    if not cur: return head
    if cur is head: return dll_delete_head(head)
    dll_delete_node(cur)
    return head
```
TC: O(k). SC: O(1).
### Insert node before head in Doubly Linked List
```cpp
DNode* dllInsertBeforeHead(DNode* head, int x) {
    DNode* node = new DNode(x);
    node->next = head;
    if (head) head->prev = node;
    return node;
}
```
```py
def dll_insert_before_head(head, x):
    node = DNode(x); node.next = head
    if head: head.prev = node
    return node
```
TC: O(1). SC: O(1).
### Insert before given node in Doubly Linked List
```cpp
void dllInsertBeforeNode(DNode* node, int x) {      // node is not the head
    DNode* nw = new DNode(x); DNode* p = node->prev;
    nw->next = node; nw->prev = p;
    if (p) p->next = nw;
    node->prev = nw;
}
```
```py
def dll_insert_before_node(node, x):
    nw, p = DNode(x), node.prev
    nw.next, nw.prev = node, p
    if p: p.next = nw
    node.prev = nw
```
TC: O(1). SC: O(1).
### Insert node before tail in Doubly Linked List
```cpp
DNode* dllInsertBeforeTail(DNode* head, int x) {
    if (!head->next) return dllInsertBeforeHead(head, x);
    DNode* tail = head;
    while (tail->next) tail = tail->next;
    dllInsertBeforeNode(tail, x);
    return head;
}
```
```py
def dll_insert_before_tail(head, x):
    if not head.next: return dll_insert_before_head(head, x)
    tail = head
    while tail.next: tail = tail.next
    dll_insert_before_node(tail, x)
    return head
```
TC: O(n). SC: O(1).
### Insert node before (kth node) in Doubly Linked List
```cpp
DNode* dllInsertBeforeKth(DNode* head, int x, int k) {
    if (k == 1) return dllInsertBeforeHead(head, x);
    DNode* cur = head;
    for (int i = 1; i < k && cur; i++) cur = cur->next;
    if (cur) dllInsertBeforeNode(cur, x);
    return head;
}
```
```py
def dll_insert_before_kth(head, x, k):
    if k == 1: return dll_insert_before_head(head, x)
    cur = head
    for _ in range(k - 1):
        if not cur: break
        cur = cur.next
    if cur: dll_insert_before_node(cur, x)
    return head
```
TC: O(k). SC: O(1).
### Reverse a Doubly Linked List
Idea: swap prev and next of every node; the last node visited becomes the new head.
```cpp
DNode* reverseDLL(DNode* head) {
    DNode* cur = head; DNode* last = nullptr;
    while (cur) {
        swap(cur->prev, cur->next);
        last = cur;
        cur = cur->prev;          // prev is the old next
    }
    return last;
}
```
```py
def reverse_dll(head):
    cur, last = head, None
    while cur:
        cur.prev, cur.next = cur.next, cur.prev
        last = cur
        cur = cur.prev
    return last
```
TC: O(n). SC: O(1).
## Linked List: Logic Building
### Add two numbers in Linked List (digits stored in reverse)
Idea: school addition with a carry. A **dummy node** avoids special handling of the head.
```cpp
ListNode* addTwoNumbers(ListNode* a, ListNode* b) {
    ListNode dummy(0); ListNode* cur = &dummy; int carry = 0;
    while (a || b || carry) {
        int s = carry + (a ? a->val : 0) + (b ? b->val : 0);
        carry = s / 10;
        cur->next = new ListNode(s % 10); cur = cur->next;
        if (a) a = a->next; if (b) b = b->next;
    }
    return dummy.next;
}
```
```py
def add_two_numbers(a, b):
    dummy = cur = ListNode(0); carry = 0
    while a or b or carry:
        s = carry + (a.val if a else 0) + (b.val if b else 0)
        carry, digit = divmod(s, 10)
        cur.next = ListNode(digit); cur = cur.next
        a = a.next if a else None; b = b.next if b else None
    return dummy.next
```
TC: O(max(n, m)). SC: O(max(n, m)) for the answer.
### Segregate odd and even nodes in Linked List (by position)
Idea: build two chains (odd positions and even positions) by re-linking, then attach even chain after the odd chain.
```cpp
ListNode* oddEvenList(ListNode* head) {
    if (!head) return head;
    ListNode *odd = head, *even = head->next, *evenHead = even;
    while (even && even->next) {
        odd->next = even->next; odd = odd->next;
        even->next = odd->next; even = even->next;
    }
    odd->next = evenHead;
    return head;
}
```
```py
def odd_even_list(head):
    if not head: return head
    odd, even = head, head.next; even_head = even
    while even and even.next:
        odd.next = even.next; odd = odd.next
        even.next = odd.next; even = even.next
    odd.next = even_head
    return head
```
TC: O(n). SC: O(1).
### Sort a Linked List of 0's 1's and 2's
Idea: three dummy lists (zeros, ones, twos); append each node to its list; join them.
```cpp
ListNode* sortList012(ListNode* head) {
    ListNode d0(0), d1(0), d2(0); ListNode *t0 = &d0, *t1 = &d1, *t2 = &d2;
    for (ListNode* c = head; c; c = c->next) {
        if (c->val == 0) { t0->next = c; t0 = c; }
        else if (c->val == 1) { t1->next = c; t1 = c; }
        else { t2->next = c; t2 = c; }
    }
    t2->next = nullptr;
    t1->next = d2.next;
    t0->next = d1.next ? d1.next : d2.next;
    return d0.next;
}
```
```py
def sort_list_012(head):
    d0, d1, d2 = ListNode(), ListNode(), ListNode(); t0, t1, t2 = d0, d1, d2
    c = head
    while c:
        if c.val == 0: t0.next = c; t0 = c
        elif c.val == 1: t1.next = c; t1 = c
        else: t2.next = c; t2 = c
        c = c.next
    t2.next = None
    t1.next = d2.next
    t0.next = d1.next if d1.next else d2.next
    return d0.next
```
TC: O(n). SC: O(1).
### Remove Nth node from the back of the LL
Idea: move `fast` n steps ahead, then move both. When fast reaches the end, `slow` is just before the node to delete. A dummy node handles deleting the head.
@chain dummy^slow -> 1 -> 2 -> 3^fast -> 4 -> 5 -> NULL :: gap of n between slow and fast
```cpp
ListNode* removeNthFromEnd(ListNode* head, int n) {
    ListNode dummy(0, head); ListNode *fast = &dummy, *slow = &dummy;
    for (int i = 0; i < n; i++) fast = fast->next;
    while (fast->next) { fast = fast->next; slow = slow->next; }
    ListNode* del = slow->next; slow->next = del->next; delete del;
    return dummy.next;
}
```
```py
def remove_nth_from_end(head, n):
    dummy = ListNode(0, head); fast = slow = dummy
    for _ in range(n): fast = fast.next
    while fast.next: fast = fast.next; slow = slow.next
    slow.next = slow.next.next
    return dummy.next
```
TC: O(n) one pass. SC: O(1).
### Reverse a LL
Idea: three pointers. For each node: save next, point the node backwards, advance.
@chain NULL^prev -> 1^cur -> 2^next -> 3 -> NULL :: cur.next = prev; prev = cur; cur = next
```cpp
ListNode* reverseList(ListNode* head) {
    ListNode *prev = nullptr, *cur = head;
    while (cur) {
        ListNode* nxt = cur->next;
        cur->next = prev;
        prev = cur; cur = nxt;
    }
    return prev;
}
```
```py
def reverse_list(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev, cur = cur, nxt
    return prev
```
TC: O(n). SC: O(1). (Recursive version uses O(n) stack.)
## Linked List: FAQs (Medium)
### Add one to a number represented by LL
Idea: recursion reaches the last digit first, adds 1 and returns the carry backwards.
```cpp
int addOneRec(ListNode* node) {
    if (!node) return 1;
    int s = node->val + addOneRec(node->next);
    node->val = s % 10;
    return s / 10;
}
ListNode* addOne(ListNode* head) {
    if (addOneRec(head)) return new ListNode(1, head);
    return head;
}
```
```py
def add_one(head):
    def rec(node):
        if not node: return 1
        s = node.val + rec(node.next)
        node.val = s % 10
        return s // 10
    return ListNode(1, head) if rec(head) else head
```
TC: O(n). SC: O(n) recursion.
### Find Middle of Linked List
Idea: **tortoise and hare**. slow moves 1 step, fast moves 2. When fast finishes, slow is in the middle.
```cpp
ListNode* middleNode(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    return slow;
}
```
```py
def middle_node(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next; fast = fast.next.next
    return slow
```
TC: O(n/2) = O(n). SC: O(1).
### Delete the middle node in LL
Idea: start fast two steps ahead so slow stops one node **before** the middle.
```cpp
ListNode* deleteMiddle(ListNode* head) {
    if (!head || !head->next) return nullptr;
    ListNode *slow = head, *fast = head->next->next;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    ListNode* del = slow->next; slow->next = del->next; delete del;
    return head;
}
```
```py
def delete_middle(head):
    if not head or not head.next: return None
    slow, fast = head, head.next.next
    while fast and fast.next:
        slow = slow.next; fast = fast.next.next
    slow.next = slow.next.next
    return head
```
TC: O(n). SC: O(1).
### Check if LL is palindrome or not
Idea: find the middle, reverse the second half, compare both halves.
```cpp
bool isPalindromeLL(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    ListNode* second = reverseList(slow);
    for (ListNode* a = head; second; a = a->next, second = second->next)
        if (a->val != second->val) return false;
    return true;
}
```
```py
def is_palindrome_ll(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next; fast = fast.next.next
    second, a = reverse_list(slow), head
    while second:
        if a.val != second.val: return False
        a, second = a.next, second.next
    return True
```
TC: O(n). SC: O(1).
### Find the intersection point of Y LL
Idea: walk two pointers; when one reaches the end, jump it to the **other** list's head. Both travel lenA + lenB, so they meet at the intersection (or both at NULL).
```cpp
ListNode* getIntersectionNode(ListNode* a, ListNode* b) {
    ListNode *p = a, *q = b;
    while (p != q) { p = p ? p->next : b; q = q ? q->next : a; }
    return p;
}
```
```py
def get_intersection_node(a, b):
    p, q = a, b
    while p is not q:
        p = p.next if p else b
        q = q.next if q else a
    return p
```
TC: O(n + m). SC: O(1).
### Detect a loop in LL
Idea: **Floyd's cycle detection**. If there is a loop, fast (2 steps) gains 1 step per move on slow and must catch it.
```cpp
bool hasCycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next; fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}
```
```py
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next; fast = fast.next.next
        if slow is fast: return True
    return False
```
TC: O(n). SC: O(1).
### Find the starting point in LL (start of the loop)
Why: let L = distance head -> loop start, x = loop start -> meeting point, C = loop length. slow went L + x, fast went 2(L + x) = L + x + kC, so L = kC - x. Hence a pointer from head and one from the meeting point, both 1 step, meet at the loop start.
```cpp
ListNode* detectCycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next; fast = fast->next->next;
        if (slow == fast) {
            slow = head;
            while (slow != fast) { slow = slow->next; fast = fast->next; }
            return slow;
        }
    }
    return nullptr;
}
```
```py
def detect_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next; fast = fast.next.next
        if slow is fast:
            slow = head
            while slow is not fast: slow = slow.next; fast = fast.next
            return slow
    return None
```
TC: O(n). SC: O(1).
### Length of loop in LL
```cpp
int loopLength(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next; fast = fast->next->next;
        if (slow == fast) {
            int len = 1;
            for (ListNode* p = slow->next; p != slow; p = p->next) len++;
            return len;
        }
    }
    return 0;
}
```
```py
def loop_length(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next; fast = fast.next.next
        if slow is fast:
            length, p = 1, slow.next
            while p is not slow: length += 1; p = p.next
            return length
    return 0
```
TC: O(n). SC: O(1).
## Linked List: FAQs (Hard)
### Reverse LL in group of given size K
Idea: check that k nodes exist; reverse exactly k nodes; the old head of the group becomes its tail and connects to the recursively processed remainder.
```cpp
ListNode* reverseKGroup(ListNode* head, int k) {
    ListNode* node = head;
    for (int i = 0; i < k; i++) { if (!node) return head; node = node->next; }
    ListNode *prev = reverseKGroup(node, k), *cur = head;
    for (int i = 0; i < k; i++) { ListNode* nxt = cur->next; cur->next = prev; prev = cur; cur = nxt; }
    return prev;
}
```
```py
def reverse_k_group(head, k):
    node = head
    for _ in range(k):
        if not node: return head
        node = node.next
    prev, cur = reverse_k_group(node, k), head
    for _ in range(k):
        nxt = cur.next; cur.next = prev; prev, cur = cur, nxt
    return prev
```
TC: O(n). SC: O(n / k) recursion.
### Rotate a LL (right by k)
Idea: make the list circular (tail -> head), then break it after the (len - k % len)-th node.
```cpp
ListNode* rotateRight(ListNode* head, int k) {
    if (!head || !head->next) return head;
    int len = 1; ListNode* tail = head;
    while (tail->next) { tail = tail->next; len++; }
    tail->next = head;
    int steps = len - k % len;
    while (steps--) tail = tail->next;
    head = tail->next; tail->next = nullptr;
    return head;
}
```
```py
def rotate_right(head, k):
    if not head or not head.next: return head
    length, tail = 1, head
    while tail.next: tail = tail.next; length += 1
    tail.next = head
    for _ in range(length - k % length): tail = tail.next
    head = tail.next; tail.next = None
    return head
```
TC: O(n). SC: O(1).
### Merge two Sorted Lists
```cpp
ListNode* mergeTwoLists(ListNode* a, ListNode* b) {
    ListNode dummy(0); ListNode* cur = &dummy;
    while (a && b) {
        if (a->val <= b->val) { cur->next = a; a = a->next; }
        else { cur->next = b; b = b->next; }
        cur = cur->next;
    }
    cur->next = a ? a : b;
    return dummy.next;
}
```
```py
def merge_two_lists(a, b):
    dummy = cur = ListNode()
    while a and b:
        if a.val <= b.val: cur.next = a; a = a.next
        else: cur.next = b; b = b.next
        cur = cur.next
    cur.next = a or b
    return dummy.next
```
TC: O(n + m). SC: O(1).
### Flattening of LL
Idea: each node has `next` (to the right) and `child` (a sorted list going down). Flatten the rest recursively, then merge the current column with it using child pointers.
```cpp
struct FNode { int val; FNode *next, *child; FNode(int v) : val(v), next(nullptr), child(nullptr) {} };
FNode* mergeDown(FNode* a, FNode* b) {
    FNode dummy(0); FNode* cur = &dummy;
    while (a && b) {
        if (a->val <= b->val) { cur->child = a; a = a->child; } else { cur->child = b; b = b->child; }
        cur = cur->child; cur->next = nullptr;
    }
    cur->child = a ? a : b;
    return dummy.child;
}
FNode* flatten(FNode* head) {
    if (!head || !head->next) return head;
    return mergeDown(head, flatten(head->next));
}
```
```py
def flatten(head):               # nodes have .val, .next, .child
    if not head or not head.next: return head
    def merge_down(a, b):
        dummy = cur = type(head)(0)
        while a and b:
            if a.val <= b.val: cur.child = a; a = a.child
            else: cur.child = b; b = b.child
            cur = cur.child; cur.next = None
        cur.child = a or b
        return dummy.child
    return merge_down(head, flatten(head.next))
```
TC: O(total nodes x number of columns). SC: O(columns) recursion.
### Sort LL
Idea: merge sort on a list: split at the middle (slow/fast), sort both halves, merge.
```cpp
ListNode* sortList(ListNode* head) {
    if (!head || !head->next) return head;
    ListNode *slow = head, *fast = head->next;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    ListNode* right = slow->next; slow->next = nullptr;
    return mergeTwoLists(sortList(head), sortList(right));
}
```
```py
def sort_list(head):
    if not head or not head.next: return head
    slow, fast = head, head.next
    while fast and fast.next:
        slow = slow.next; fast = fast.next.next
    right, slow.next = slow.next, None
    return merge_two_lists(sort_list(head), sort_list(right))
```
TC: O(n log n). SC: O(log n) recursion.
### Clone a LL with random and next pointer
Idea: 3 passes without a map. (1) insert a copy after every node: A -> A' -> B -> B'. (2) copy.random = original.random.next. (3) separate the two lists.
```cpp
struct RNode { int val; RNode *next, *random; RNode(int v) : val(v), next(nullptr), random(nullptr) {} };
RNode* copyRandomList(RNode* head) {
    for (RNode* c = head; c; c = c->next->next) { RNode* cp = new RNode(c->val); cp->next = c->next; c->next = cp; }
    for (RNode* c = head; c; c = c->next->next) if (c->random) c->next->random = c->random->next;
    RNode dummy(0); RNode* tail = &dummy;
    for (RNode* c = head; c; c = c->next) { tail->next = c->next; tail = tail->next; c->next = tail->next; }
    return dummy.next;
}
```
```py
def copy_random_list(head):          # nodes have .val, .next, .random
    if not head: return None
    Node = type(head)
    c = head
    while c:
        cp = Node(c.val); cp.next = c.next; c.next = cp; c = cp.next
    c = head
    while c:
        if c.random: c.next.random = c.random.next
        c = c.next.next
    new_head = head.next; c = head
    while c:
        cp = c.next; c.next = cp.next
        cp.next = cp.next.next if cp.next else None
        c = c.next
    return new_head
```
TC: O(n). SC: O(1) extra.
## Linked List: FAQs (DLL)
### Delete all occurrences of a key in DLL
```cpp
DNode* deleteAllOccurrences(DNode* head, int key) {
    DNode* cur = head;
    while (cur) {
        DNode* nxt = cur->next;
        if (cur->val == key) {
            if (cur == head) head = nxt;
            if (cur->prev) cur->prev->next = nxt;
            if (nxt) nxt->prev = cur->prev;
            delete cur;
        }
        cur = nxt;
    }
    return head;
}
```
```py
def delete_all_occurrences(head, key):
    cur = head
    while cur:
        nxt = cur.next
        if cur.val == key:
            if cur is head: head = nxt
            if cur.prev: cur.prev.next = nxt
            if nxt: nxt.prev = cur.prev
        cur = nxt
    return head
```
TC: O(n). SC: O(1).
### Remove duplicates from sorted DLL
```cpp
DNode* removeDuplicatesDLL(DNode* head) {
    DNode* cur = head;
    while (cur && cur->next) {
        if (cur->next->val == cur->val) {
            DNode* dup = cur->next; cur->next = dup->next;
            if (dup->next) dup->next->prev = cur;
            delete dup;
        } else cur = cur->next;
    }
    return head;
}
```
```py
def remove_duplicates_dll(head):
    cur = head
    while cur and cur.next:
        if cur.next.val == cur.val:
            dup = cur.next; cur.next = dup.next
            if dup.next: dup.next.prev = cur
        else: cur = cur.next
    return head
```
TC: O(n). SC: O(1).
### Find Pairs with Given Sum in Doubly Linked List (sorted)
Idea: two pointers - left at the head, right at the tail; move inward like in a sorted array.
```cpp
vector<pair<int,int>> pairsWithSum(DNode* head, int target) {
    vector<pair<int,int>> ans; if (!head) return ans;
    DNode *l = head, *r = head;
    while (r->next) r = r->next;
    while (l != r && r->next != l) {
        int s = l->val + r->val;
        if (s == target) { ans.push_back({l->val, r->val}); l = l->next; r = r->prev; }
        else if (s < target) l = l->next; else r = r->prev;
    }
    return ans;
}
```
```py
def pairs_with_sum(head, target):
    ans = []
    if not head: return ans
    l = r = head
    while r.next: r = r.next
    while l is not r and r.next is not l:
        s = l.val + r.val
        if s == target: ans.append((l.val, r.val)); l = l.next; r = r.prev
        elif s < target: l = l.next
        else: r = r.prev
    return ans
```
TC: O(n). SC: O(1).
## Bit Manipulation
### Introduction to Bits and Tricks
- Numbers are stored in binary. 13 = 1101 = 8 + 4 + 0 + 1. Negative numbers use **2's complement** (flip bits, add 1).
| Operator | Meaning | Example (5 = 101, 3 = 011) |
|---|---|---|
| a & b | AND: 1 if both 1 | 001 = 1 |
| a OR b | OR: 1 if any 1 | 111 = 7 |
| a ^ b | XOR: 1 if different | 110 = 6 |
| ~a | NOT: flip all bits | -6 |
| a << k | shift left = a x 2^k | 5 << 1 = 10 |
| a >> k | shift right = a / 2^k | 5 >> 1 = 2 |
- XOR facts: x ^ x = 0, x ^ 0 = x, order does not matter.
- Tricks: check i-th bit `n & (1 << i)`; set `n | (1 << i)`; clear `n & ~(1 << i)`; toggle `n ^ (1 << i)`; remove lowest set bit `n & (n - 1)`; isolate lowest set bit `n & -n`.
@cells 1 1 0 1 :: 13 in binary: bit 3, bit 2, bit 1, bit 0
### Check if the i-th bit is Set or Not
```cpp
bool isBitSet(int n, int i) { return (n >> i) & 1; }
```
```py
def is_bit_set(n, i): return (n >> i) & 1 == 1
```
TC: O(1). SC: O(1).
### Check if a Number is Odd or Not
Idea: the last bit of an odd number is 1.
```cpp
bool isOdd(int n) { return n & 1; }
```
```py
def is_odd(n): return n & 1 == 1
```
TC: O(1). SC: O(1).
### Check if a Number is Power of 2 or Not
Idea: a power of 2 has exactly one set bit; n & (n - 1) removes it leaving 0.
```cpp
bool isPowerOfTwo(long long n) { return n > 0 && (n & (n - 1)) == 0; }
```
```py
def is_power_of_two(n): return n > 0 and n & (n - 1) == 0
```
TC: O(1). SC: O(1).
### Count the Number of Set Bits
Idea: **Brian Kernighan** - each `n &= n - 1` deletes one set bit, so the loop runs once per set bit.
```cpp
int countSetBits(int n) { int c = 0; while (n) { n &= n - 1; c++; } return c; }
```
```py
def count_set_bits(n):
    c = 0
    while n: n &= n - 1; c += 1
    return c
```
TC: O(number of set bits) <= O(log n). SC: O(1).
### Set the Rightmost Unset Bit
Idea: n + 1 turns the rightmost 0 into 1 (and the 1s after it into 0s); OR with n restores those 1s.
```cpp
int setRightmostUnsetBit(int n) { return n | (n + 1); }
```
```py
def set_rightmost_unset_bit(n): return n | (n + 1)
```
TC: O(1). SC: O(1).
### Swap Two Numbers
```cpp
void swapXor(int& a, int& b) { a ^= b; b ^= a; a ^= b; }
```
```py
def swap_xor(a, b):
    a ^= b; b ^= a; a ^= b
    return a, b
```
TC: O(1). SC: O(1).
### Minimum Bit Flips to Convert Number
Idea: the bits that differ are exactly the set bits of start ^ goal.
```cpp
int minBitFlips(int start, int goal) { return __builtin_popcount(start ^ goal); }
```
```py
def min_bit_flips(start, goal): return bin(start ^ goal).count('1')
```
TC: O(log n). SC: O(1).
### Single Number - I (every other element appears twice)
Idea: XOR everything; pairs cancel.
```cpp
int singleNumber(vector<int>& a) { int x = 0; for (int v : a) x ^= v; return x; }
```
```py
def single_number(a):
    x = 0
    for v in a: x ^= v
    return x
```
TC: O(n). SC: O(1).
### Single Number - II (others appear three times)
Idea: count each bit position over all numbers; the single number owns the bits whose count is not divisible by 3. Compact form with two masks `ones` and `twos`.
```cpp
int singleNumberII(vector<int>& a) {
    int ones = 0, twos = 0;
    for (int v : a) { ones = (ones ^ v) & ~twos; twos = (twos ^ v) & ~ones; }
    return ones;
}
```
```py
def single_number_ii(a):
    ans = 0
    for bit in range(32):
        if sum((v >> bit) & 1 for v in a) % 3: ans |= 1 << bit
    return ans - (1 << 32) if ans >= 1 << 31 else ans
```
TC: O(n) (O(32 n) for the counting version). SC: O(1).
### Single Number - III (two elements appear once)
Idea: XOR of all = a ^ b. Any set bit of it is a bit where a and b differ; split the numbers by that bit into two groups and XOR each group.
```cpp
vector<int> singleNumberIII(vector<int>& a) {
    long long x = 0; for (int v : a) x ^= v;
    long long low = x & -x; int g1 = 0, g2 = 0;
    for (int v : a) { if (v & low) g1 ^= v; else g2 ^= v; }
    return {g1, g2};
}
```
```py
def single_number_iii(a):
    x = 0
    for v in a: x ^= v
    low = x & -x; g1 = g2 = 0
    for v in a:
        if v & low: g1 ^= v
        else: g2 ^= v
    return [g1, g2]
```
TC: O(n). SC: O(1).
### Divide two numbers without multiplication and division
Idea: subtract the largest (divisor x 2^k) that fits, add 2^k to the answer, repeat. Shifts do the doubling.
```cpp
int divide(int dividend, int divisor) {
    if (dividend == INT_MIN && divisor == -1) return INT_MAX;
    bool neg = (dividend < 0) != (divisor < 0);
    long long n = llabs((long long)dividend), d = llabs((long long)divisor), q = 0;
    while (n >= d) {
        int k = 0;
        while (n >= (d << (k + 1))) k++;
        q += 1LL << k; n -= d << k;
    }
    return neg ? -q : q;
}
```
```py
def divide(dividend, divisor):
    if dividend == -2**31 and divisor == -1: return 2**31 - 1
    neg = (dividend < 0) != (divisor < 0)
    n, d, q = abs(dividend), abs(divisor), 0
    while n >= d:
        k = 0
        while n >= (d << (k + 1)): k += 1
        q += 1 << k; n -= d << k
    return -q if neg else q
```
TC: O(log^2 n). SC: O(1).
### Power Set Bit Manipulation
Idea: each number mask from 0 to 2^n - 1 is one subset: bit i set means "take a[i]".
```cpp
vector<vector<int>> powerSetBits(vector<int>& a) {
    int n = a.size(); vector<vector<int>> ans;
    for (int mask = 0; mask < (1 << n); mask++) {
        vector<int> sub;
        for (int i = 0; i < n; i++) if (mask & (1 << i)) sub.push_back(a[i]);
        ans.push_back(sub);
    }
    return ans;
}
```
```py
def power_set_bits(a):
    n = len(a)
    return [[a[i] for i in range(n) if mask & (1 << i)] for mask in range(1 << n)]
```
TC: O(2^n x n). SC: O(1) extra.
### XOR of numbers in a given range
Idea: XOR of 1..n repeats every 4: n%4 = 0 -> n, 1 -> 1, 2 -> n+1, 3 -> 0. Range [L, R] = f(R) ^ f(L - 1).
```cpp
int xorUpto(int n) { switch (n % 4) { case 0: return n; case 1: return 1; case 2: return n + 1; default: return 0; } }
int xorRange(int l, int r) { return xorUpto(r) ^ xorUpto(l - 1); }
```
```py
def xor_upto(n): return [n, 1, n + 1, 0][n % 4]
def xor_range(l, r): return xor_upto(r) ^ xor_upto(l - 1)
```
TC: O(1). SC: O(1).
## Greedy Algorithms
Rule: a greedy algorithm makes the **locally best choice** at every step and never reconsiders. It is correct only when a local best leads to a global best - usually proved by an "exchange argument". Most greedy solutions start with **sorting**.
### Assign Cookies
Idea: sort both. Give the smallest cookie that satisfies the least greedy child.
```cpp
int findContentChildren(vector<int>& g, vector<int>& s) {
    sort(g.begin(), g.end()); sort(s.begin(), s.end());
    int i = 0;
    for (int j = 0; j < (int)s.size() && i < (int)g.size(); j++) if (s[j] >= g[i]) i++;
    return i;
}
```
```py
def find_content_children(g, s):
    g.sort(); s.sort(); i = 0
    for cookie in s:
        if i < len(g) and cookie >= g[i]: i += 1
    return i
```
TC: O(n log n + m log m). SC: O(1).
### Lemonade Change
Idea: keep counts of 5 and 10 notes. For a 20, prefer giving 10 + 5 (keeps flexible 5s).
```cpp
bool lemonadeChange(vector<int>& bills) {
    int five = 0, ten = 0;
    for (int b : bills) {
        if (b == 5) five++;
        else if (b == 10) { if (!five) return false; five--; ten++; }
        else { if (ten && five) { ten--; five--; } else if (five >= 3) five -= 3; else return false; }
    }
    return true;
}
```
```py
def lemonade_change(bills):
    five = ten = 0
    for b in bills:
        if b == 5: five += 1
        elif b == 10:
            if not five: return False
            five -= 1; ten += 1
        else:
            if ten and five: ten -= 1; five -= 1
            elif five >= 3: five -= 3
            else: return False
    return True
```
TC: O(n). SC: O(1).
### Fractional Knapsack
Idea: take items in decreasing order of value / weight; take a fraction of the last one.
```cpp
double fractionalKnapsack(vector<int>& val, vector<int>& wt, int cap) {
    int n = val.size(); vector<int> idx(n); iota(idx.begin(), idx.end(), 0);
    sort(idx.begin(), idx.end(), [&](int a, int b) { return (double)val[a] / wt[a] > (double)val[b] / wt[b]; });
    double total = 0;
    for (int i : idx) {
        if (wt[i] <= cap) { total += val[i]; cap -= wt[i]; }
        else { total += (double)val[i] / wt[i] * cap; break; }
    }
    return total;
}
```
```py
def fractional_knapsack(val, wt, cap):
    total = 0.0
    for v, w in sorted(zip(val, wt), key=lambda p: p[0] / p[1], reverse=True):
        if w <= cap: total += v; cap -= w
        else: total += v / w * cap; break
    return total
```
TC: O(n log n). SC: O(n).
### Jump Game - I
Idea: track the farthest index reachable. If we stand on an index beyond it, we are stuck.
```cpp
bool canJump(vector<int>& a) {
    int far = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        if (i > far) return false;
        far = max(far, i + a[i]);
    }
    return true;
}
```
```py
def can_jump(a):
    far = 0
    for i, x in enumerate(a):
        if i > far: return False
        far = max(far, i + x)
    return True
```
TC: O(n). SC: O(1).
### Shortest Job First
Idea: run the shortest job first so fewer jobs wait behind long ones. Sort burst times; waiting time of a job = sum of the earlier ones.
```cpp
long long sjfAverageWait(vector<int>& bt) {
    sort(bt.begin(), bt.end());
    long long wait = 0, t = 0;
    for (int b : bt) { wait += t; t += b; }
    return wait / (long long)bt.size();
}
```
```py
def sjf_average_wait(bt):
    bt.sort(); wait = t = 0
    for b in bt: wait += t; t += b
    return wait // len(bt)
```
TC: O(n log n). SC: O(1).
### Job sequencing Problem
Idea: sort jobs by profit (high first). Put each job in the **latest free slot** on or before its deadline.
```cpp
pair<int,int> jobSequencing(vector<array<int,3>>& jobs) {   // {id, deadline, profit}
    sort(jobs.begin(), jobs.end(), [](auto& a, auto& b) { return a[2] > b[2]; });
    int maxD = 0; for (auto& j : jobs) maxD = max(maxD, j[1]);
    vector<int> slot(maxD + 1, -1); int cnt = 0, profit = 0;
    for (auto& j : jobs)
        for (int d = j[1]; d >= 1; d--) if (slot[d] == -1) { slot[d] = j[0]; cnt++; profit += j[2]; break; }
    return {cnt, profit};
}
```
```py
def job_sequencing(jobs):                 # (id, deadline, profit)
    jobs.sort(key=lambda j: -j[2])
    slot = [-1] * (max(j[1] for j in jobs) + 1); cnt = profit = 0
    for jid, d, p in jobs:
        while d >= 1:
            if slot[d] == -1: slot[d] = jid; cnt += 1; profit += p; break
            d -= 1
    return cnt, profit
```
TC: O(n log n + n x maxDeadline). SC: O(maxDeadline).
### N meetings in one room
Idea: always pick the meeting that **ends earliest** - it leaves the most room for the rest.
```cpp
int maxMeetings(vector<int>& start, vector<int>& end) {
    int n = start.size(); vector<pair<int,int>> m;
    for (int i = 0; i < n; i++) m.push_back({end[i], start[i]});
    sort(m.begin(), m.end());
    int cnt = 0, lastEnd = -1;
    for (auto& [e, s] : m) if (s > lastEnd) { cnt++; lastEnd = e; }
    return cnt;
}
```
```py
def max_meetings(start, end):
    cnt, last_end = 0, -1
    for e, s in sorted(zip(end, start)):
        if s > last_end: cnt += 1; last_end = e
    return cnt
```
TC: O(n log n). SC: O(n).
### Non-overlapping Intervals
Idea: same as meetings: keep the maximum set of non-overlapping intervals (sorted by end); removals = n - kept.
```cpp
int eraseOverlapIntervals(vector<vector<int>>& iv) {
    sort(iv.begin(), iv.end(), [](auto& a, auto& b) { return a[1] < b[1]; });
    int kept = 0, lastEnd = INT_MIN;
    for (auto& x : iv) if (x[0] >= lastEnd) { kept++; lastEnd = x[1]; }
    return (int)iv.size() - kept;
}
```
```py
def erase_overlap_intervals(iv):
    iv.sort(key=lambda x: x[1]); kept, last_end = 0, float('-inf')
    for s, e in iv:
        if s >= last_end: kept += 1; last_end = e
    return len(iv) - kept
```
TC: O(n log n). SC: O(1).
### Insert Interval
Idea: three phases: copy intervals ending before the new one; merge all that overlap; copy the rest.
```cpp
vector<vector<int>> insertInterval(vector<vector<int>>& iv, vector<int> nw) {
    vector<vector<int>> ans; int i = 0, n = iv.size();
    while (i < n && iv[i][1] < nw[0]) ans.push_back(iv[i++]);
    while (i < n && iv[i][0] <= nw[1]) { nw[0] = min(nw[0], iv[i][0]); nw[1] = max(nw[1], iv[i][1]); i++; }
    ans.push_back(nw);
    while (i < n) ans.push_back(iv[i++]);
    return ans;
}
```
```py
def insert_interval(iv, nw):
    ans, i, n = [], 0, len(iv)
    while i < n and iv[i][1] < nw[0]: ans.append(iv[i]); i += 1
    while i < n and iv[i][0] <= nw[1]:
        nw = [min(nw[0], iv[i][0]), max(nw[1], iv[i][1])]; i += 1
    ans.append(nw)
    return ans + iv[i:]
```
TC: O(n). SC: O(n).
### Merge Intervals
Idea: sort by start. If the current interval starts before the last merged one ends, extend it; otherwise start a new one.
@cells [1,3] [2,6] [8,10] [15,18] :: [1,3] and [2,6] overlap -> [1,6]
```cpp
vector<vector<int>> mergeIntervals(vector<vector<int>>& iv) {
    sort(iv.begin(), iv.end());
    vector<vector<int>> ans;
    for (auto& x : iv) {
        if (ans.empty() || x[0] > ans.back()[1]) ans.push_back(x);
        else ans.back()[1] = max(ans.back()[1], x[1]);
    }
    return ans;
}
```
```py
def merge_intervals(iv):
    iv.sort(); ans = []
    for s, e in iv:
        if not ans or s > ans[-1][1]: ans.append([s, e])
        else: ans[-1][1] = max(ans[-1][1], e)
    return ans
```
TC: O(n log n). SC: O(n).
### Minimum number of platforms required for a railway
Idea: sort arrivals and departures separately. Walk in time order: an arrival needs a platform (+1), a departure frees one (-1). The peak is the answer.
```cpp
int minPlatforms(vector<int>& arr, vector<int>& dep) {
    sort(arr.begin(), arr.end()); sort(dep.begin(), dep.end());
    int i = 0, j = 0, cur = 0, best = 0, n = arr.size();
    while (i < n) {
        if (arr[i] <= dep[j]) { cur++; i++; best = max(best, cur); }
        else { cur--; j++; }
    }
    return best;
}
```
```py
def min_platforms(arr, dep):
    arr.sort(); dep.sort(); i = j = cur = best = 0
    while i < len(arr):
        if arr[i] <= dep[j]: cur += 1; i += 1; best = max(best, cur)
        else: cur -= 1; j += 1
    return best
```
TC: O(n log n). SC: O(1).
### Valid Parenthesis Checker (string with '(' , ')' and '*')
Idea: '*' can be '(', ')' or empty. Track the **range** [lo, hi] of possible open counts. hi < 0 means too many ')'. Valid at the end if lo == 0.
```cpp
bool checkValidString(string s) {
    int lo = 0, hi = 0;
    for (char c : s) {
        if (c == '(') { lo++; hi++; }
        else if (c == ')') { lo--; hi--; }
        else { lo--; hi++; }
        if (hi < 0) return false;
        lo = max(lo, 0);
    }
    return lo == 0;
}
```
```py
def check_valid_string(s):
    lo = hi = 0
    for c in s:
        if c == '(': lo += 1; hi += 1
        elif c == ')': lo -= 1; hi -= 1
        else: lo -= 1; hi += 1
        if hi < 0: return False
        lo = max(lo, 0)
    return lo == 0
```
TC: O(n). SC: O(1).
### Candy
Idea: two passes. Left to right: a child with a higher rating than the left neighbour gets left + 1. Right to left: do the same against the right neighbour, keeping the max.
```cpp
int candy(vector<int>& r) {
    int n = r.size(); vector<int> c(n, 1);
    for (int i = 1; i < n; i++) if (r[i] > r[i - 1]) c[i] = c[i - 1] + 1;
    for (int i = n - 2; i >= 0; i--) if (r[i] > r[i + 1]) c[i] = max(c[i], c[i + 1] + 1);
    return accumulate(c.begin(), c.end(), 0);
}
```
```py
def candy(r):
    n = len(r); c = [1] * n
    for i in range(1, n):
        if r[i] > r[i - 1]: c[i] = c[i - 1] + 1
    for i in range(n - 2, -1, -1):
        if r[i] > r[i + 1]: c[i] = max(c[i], c[i + 1] + 1)
    return sum(c)
```
TC: O(n). SC: O(n).
### Jump Game II (minimum jumps)
Idea: BFS by levels without a queue. [.., end] is the range reachable with the current number of jumps; `far` is the farthest reachable with one more jump. When i reaches `end`, we must jump.
```cpp
int jump(vector<int>& a) {
    int jumps = 0, end = 0, far = 0;
    for (int i = 0; i < (int)a.size() - 1; i++) {
        far = max(far, i + a[i]);
        if (i == end) { jumps++; end = far; }
    }
    return jumps;
}
```
```py
def jump(a):
    jumps = end = far = 0
    for i in range(len(a) - 1):
        far = max(far, i + a[i])
        if i == end: jumps += 1; end = far
    return jumps
```
TC: O(n). SC: O(1).
## Sliding Window / 2 Pointer
### Theory - Pattern and Template
- A **window** is a contiguous range [l, r]. Instead of recomputing each subarray from scratch (O(n^2)), we **slide**: add the element entering at r and remove the element leaving at l.
- Type 1 - fixed size k. Type 2 - longest window satisfying a condition (expand r, shrink l while invalid). Type 3 - count subarrays: use `atMost(k) - atMost(k - 1)`. Type 4 - shortest window (shrink while valid).
@array 2 1^l 5 1 3^r 2 :: window [l..r]; r expands, l shrinks when the window becomes invalid
```cpp
// longest valid window template
int l = 0, best = 0;
for (int r = 0; r < n; r++) {
    // add a[r] to the window state
    while (/* window invalid */ false) { /* remove a[l] */ l++; }
    best = max(best, r - l + 1);
}
```
```py
# longest valid window template
# l = best = 0
# for r in range(n):
#     add a[r]
#     while window_invalid: remove a[l]; l += 1
#     best = max(best, r - l + 1)
```
TC: O(n) - l and r each move at most n times in total (amortised).
### Maximum Points You Can Obtain from Cards
Idea: we take k cards from the two ends. Start with the first k from the left; then trade one left card for one right card, k times.
```cpp
int maxScore(vector<int>& c, int k) {
    int n = c.size(), sum = 0;
    for (int i = 0; i < k; i++) sum += c[i];
    int best = sum;
    for (int i = 1; i <= k; i++) { sum += c[n - i] - c[k - i]; best = max(best, sum); }
    return best;
}
```
```py
def max_score(c, k):
    n = len(c); s = sum(c[:k]); best = s
    for i in range(1, k + 1):
        s += c[n - i] - c[k - i]
        best = max(best, s)
    return best
```
TC: O(k). SC: O(1).
### Longest Substring Without Repeating Characters
Idea: remember the last index of each char. If the new char was seen inside the window, jump l just past its previous position.
```cpp
int lengthOfLongestSubstring(string s) {
    vector<int> last(256, -1); int l = 0, best = 0;
    for (int r = 0; r < (int)s.size(); r++) {
        unsigned char c = s[r];
        if (last[c] >= l) l = last[c] + 1;
        last[c] = r;
        best = max(best, r - l + 1);
    }
    return best;
}
```
```py
def length_of_longest_substring(s):
    last, l, best = {}, 0, 0
    for r, c in enumerate(s):
        if c in last and last[c] >= l: l = last[c] + 1
        last[c] = r
        best = max(best, r - l + 1)
    return best
```
TC: O(n). SC: O(256).
### Max Consecutive Ones III (flip at most k zeros)
Idea: longest window containing at most k zeros.
```cpp
int longestOnes(vector<int>& a, int k) {
    int l = 0, zeros = 0, best = 0;
    for (int r = 0; r < (int)a.size(); r++) {
        if (a[r] == 0) zeros++;
        while (zeros > k) if (a[l++] == 0) zeros--;
        best = max(best, r - l + 1);
    }
    return best;
}
```
```py
def longest_ones(a, k):
    l = zeros = best = 0
    for r, x in enumerate(a):
        if x == 0: zeros += 1
        while zeros > k:
            if a[l] == 0: zeros -= 1
            l += 1
        best = max(best, r - l + 1)
    return best
```
TC: O(n). SC: O(1).
### Fruit Into Baskets
Idea: longest window with at most 2 distinct values.
```cpp
int totalFruit(vector<int>& f) {
    unordered_map<int,int> cnt; int l = 0, best = 0;
    for (int r = 0; r < (int)f.size(); r++) {
        cnt[f[r]]++;
        while (cnt.size() > 2) { if (--cnt[f[l]] == 0) cnt.erase(f[l]); l++; }
        best = max(best, r - l + 1);
    }
    return best;
}
```
```py
def total_fruit(f):
    cnt, l, best = {}, 0, 0
    for r, x in enumerate(f):
        cnt[x] = cnt.get(x, 0) + 1
        while len(cnt) > 2:
            cnt[f[l]] -= 1
            if cnt[f[l]] == 0: del cnt[f[l]]
            l += 1
        best = max(best, r - l + 1)
    return best
```
TC: O(n). SC: O(1) - at most 3 keys.
### Longest Substring With At Most K Distinct Characters
```cpp
int longestKDistinct(string s, int k) {
    unordered_map<char,int> cnt; int l = 0, best = 0;
    for (int r = 0; r < (int)s.size(); r++) {
        cnt[s[r]]++;
        while ((int)cnt.size() > k) { if (--cnt[s[l]] == 0) cnt.erase(s[l]); l++; }
        best = max(best, r - l + 1);
    }
    return best;
}
```
```py
def longest_k_distinct(s, k):
    cnt, l, best = {}, 0, 0
    for r, c in enumerate(s):
        cnt[c] = cnt.get(c, 0) + 1
        while len(cnt) > k:
            cnt[s[l]] -= 1
            if cnt[s[l]] == 0: del cnt[s[l]]
            l += 1
        best = max(best, r - l + 1)
    return best
```
TC: O(n). SC: O(k).
### Longest Repeating Character Replacement
Idea: a window is valid if (window length - count of the most frequent char) <= k: we replace all the others.
```cpp
int characterReplacement(string s, int k) {
    int f[26] = {0}, l = 0, maxF = 0, best = 0;
    for (int r = 0; r < (int)s.size(); r++) {
        maxF = max(maxF, ++f[s[r] - 'A']);
        while (r - l + 1 - maxF > k) f[s[l++] - 'A']--;
        best = max(best, r - l + 1);
    }
    return best;
}
```
```py
def character_replacement(s, k):
    f, l, max_f, best = {}, 0, 0, 0
    for r, c in enumerate(s):
        f[c] = f.get(c, 0) + 1
        max_f = max(max_f, f[c])
        while r - l + 1 - max_f > k:
            f[s[l]] -= 1; l += 1
        best = max(best, r - l + 1)
    return best
```
TC: O(n). SC: O(26).
### Minimum Window Substring
Idea: `need[c]` = how many of c are still required; `missing` = total chars still required. Expand r; when missing == 0 the window is valid: shrink l as far as possible and record it.
```cpp
string minWindow(string s, string t) {
    vector<int> need(128, 0); for (char c : t) need[c]++;
    int missing = t.size(), l = 0, bestL = 0, bestLen = INT_MAX;
    for (int r = 0; r < (int)s.size(); r++) {
        if (need[s[r]]-- > 0) missing--;
        while (missing == 0) {
            if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
            if (++need[s[l++]] > 0) missing++;
        }
    }
    return bestLen == INT_MAX ? "" : s.substr(bestL, bestLen);
}
```
```py
def min_window(s, t):
    need = Counter(t); missing = len(t); l = 0; best = (float('inf'), 0)
    for r, c in enumerate(s):
        if need[c] > 0: missing -= 1
        need[c] -= 1
        while missing == 0:
            if r - l + 1 < best[0]: best = (r - l + 1, l)
            need[s[l]] += 1
            if need[s[l]] > 0: missing += 1
            l += 1
    return "" if best[0] == float('inf') else s[best[1]:best[1] + best[0]]
```
TC: O(n + m). SC: O(128).
### Minimum Window Subsequence
Idea: scan forward in s matching t in order; when t is fully matched at index e, scan **backward** from e matching t in reverse to find the tightest start. Continue from start + 1.
```cpp
string minWindowSubsequence(string s, string t) {
    int n = s.size(), m = t.size(), i = 0, j = 0, bestL = -1, bestLen = INT_MAX;
    while (i < n) {
        if (s[i] == t[j]) j++;
        if (j == m) {
            int end = i; j = m - 1;
            while (j >= 0) { if (s[i] == t[j]) j--; i--; }
            i++;
            if (end - i + 1 < bestLen) { bestLen = end - i + 1; bestL = i; }
            j = 0;
        }
        i++;
    }
    return bestL == -1 ? "" : s.substr(bestL, bestLen);
}
```
```py
def min_window_subsequence(s, t):
    n, m = len(s), len(t); i = j = 0; best = (float('inf'), -1)
    while i < n:
        if s[i] == t[j]: j += 1
        if j == m:
            end, j = i, m - 1
            while j >= 0:
                if s[i] == t[j]: j -= 1
                i -= 1
            i += 1
            if end - i + 1 < best[0]: best = (end - i + 1, i)
            j = 0
        i += 1
    return "" if best[1] == -1 else s[best[1]:best[1] + best[0]]
```
TC: O(n x m) worst. SC: O(1).
### Number of Substrings Containing All Three Characters
Idea: for each right end r, let `last[c]` be the latest index of a, b, c. Every start <= min(last) gives a valid substring: add min(last) + 1.
```cpp
int numberOfSubstrings(string s) {
    int last[3] = {-1, -1, -1}, ans = 0;
    for (int r = 0; r < (int)s.size(); r++) {
        last[s[r] - 'a'] = r;
        ans += 1 + min(last[0], min(last[1], last[2]));
    }
    return ans;
}
```
```py
def number_of_substrings(s):
    last = {'a': -1, 'b': -1, 'c': -1}; ans = 0
    for r, c in enumerate(s):
        last[c] = r
        ans += 1 + min(last.values())
    return ans
```
TC: O(n). SC: O(1).
### Binary Subarrays With Sum
Idea: exactly(goal) = atMost(goal) - atMost(goal - 1).
```cpp
int atMostSum(vector<int>& a, int goal) {
    if (goal < 0) return 0;
    int l = 0, sum = 0, cnt = 0;
    for (int r = 0; r < (int)a.size(); r++) {
        sum += a[r];
        while (sum > goal) sum -= a[l++];
        cnt += r - l + 1;
    }
    return cnt;
}
int numSubarraysWithSum(vector<int>& a, int goal) { return atMostSum(a, goal) - atMostSum(a, goal - 1); }
```
```py
def num_subarrays_with_sum(a, goal):
    def at_most(g):
        if g < 0: return 0
        l = s = cnt = 0
        for r, x in enumerate(a):
            s += x
            while s > g: s -= a[l]; l += 1
            cnt += r - l + 1
        return cnt
    return at_most(goal) - at_most(goal - 1)
```
TC: O(n). SC: O(1).
### Count number of Nice subarrays (exactly k odd numbers)
Idea: replace each number by x % 2; it becomes "binary subarrays with sum k".
```cpp
int numberOfNiceSubarrays(vector<int>& a, int k) {
    vector<int> b; for (int x : a) b.push_back(x % 2);
    return atMostSum(b, k) - atMostSum(b, k - 1);
}
```
```py
def number_of_nice_subarrays(a, k):
    return num_subarrays_with_sum([x % 2 for x in a], k)
```
TC: O(n). SC: O(n) (O(1) if done in place).
### Subarrays with K Different Integers
```cpp
int atMostDistinct(vector<int>& a, int k) {
    unordered_map<int,int> cnt; int l = 0, res = 0;
    for (int r = 0; r < (int)a.size(); r++) {
        cnt[a[r]]++;
        while ((int)cnt.size() > k) { if (--cnt[a[l]] == 0) cnt.erase(a[l]); l++; }
        res += r - l + 1;
    }
    return res;
}
int subarraysWithKDistinct(vector<int>& a, int k) { return atMostDistinct(a, k) - atMostDistinct(a, k - 1); }
```
```py
def subarrays_with_k_distinct(a, k):
    def at_most(k):
        cnt, l, res = {}, 0, 0
        for r, x in enumerate(a):
            cnt[x] = cnt.get(x, 0) + 1
            while len(cnt) > k:
                cnt[a[l]] -= 1
                if cnt[a[l]] == 0: del cnt[a[l]]
                l += 1
            res += r - l + 1
        return res
    return at_most(k) - at_most(k - 1)
```
TC: O(n). SC: O(k).
