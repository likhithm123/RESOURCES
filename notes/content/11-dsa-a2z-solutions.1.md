# DSA A2Z Sheet - Complete Solutions (C++ and Python)
This notebook solves every problem of the A2Z DSA sheet, section by section. For every problem you get: the **idea** (how the solution is obtained), full **C++** code, full **Python** code, and the **time / space complexity** with the reason. Read the idea first, try it yourself for 15 minutes, then compare.
> Common structures used everywhere: `ListNode{val,next}`, `DNode{val,prev,next}`, `TreeNode{val,left,right}`. C++ code assumes `#include <bits/stdc++.h>` and `using namespace std;`.
```cpp
struct ListNode { int val; ListNode* next; ListNode(int v, ListNode* n = nullptr) : val(v), next(n) {} };
struct DNode { int val; DNode *prev, *next; DNode(int v) : val(v), prev(nullptr), next(nullptr) {} };
struct TreeNode { int val; TreeNode *left, *right; TreeNode(int v) : val(v), left(nullptr), right(nullptr) {} };
```
```py
class ListNode:
    def __init__(self, val=0, next=None): self.val, self.next = val, next
class DNode:
    def __init__(self, val=0): self.val, self.prev, self.next = val, None, None
class TreeNode:
    def __init__(self, val=0, left=None, right=None): self.val, self.left, self.right = val, left, right
```
## How to solve any problem (the 6 step method)
1. Read the statement twice. Write the input, the output and the constraints.
2. Solve one small example by hand. Notice what your brain did - that is the brute force.
3. Write the brute force and its complexity.
4. Ask "what work is repeated?" - remove it using sorting, hashing, two pointers, binary search, a stack, or DP.
5. Dry run the code on the example and on edge cases (empty, one element, all equal, negative, very large).
6. State time and space complexity with the reason.
@flow (Read problem) | Solve tiny example by hand | Write brute force | <Fast enough for constraints? ~ Find repeated work, pick a pattern> | Dry run + edge cases | (Submit) :: Problem solving loop
| n (input size) | Complexity that passes in 1 sec |
|---|---|
| n <= 10 | O(n!) , O(2^n * n) |
| n <= 20 | O(2^n) |
| n <= 500 | O(n^3) |
| n <= 5000 | O(n^2) |
| n <= 10^5 | O(n log n) |
| n <= 10^7 | O(n) |
| n > 10^8 | O(log n) or O(1) |
## Beginner: Fundamentals of Programming
### Breaking The Myth
- Myth: "coding needs a maths genius". Truth: programming is giving clear step by step instructions. It is a skill built by daily practice like cycling.
- You do not need to memorise code. You need to recognise patterns - and patterns come from solving many problems.
### Programming and What Are Computers?
- A computer is a machine that follows instructions very fast. It has a CPU (does the work), RAM (short term memory), disk (long term memory), and input/output devices.
- A **program** is a list of instructions. A **programming language** is how humans write those instructions; a compiler/interpreter converts them to machine code (0s and 1s).
@chain Source code -> Compiler / Interpreter -> Machine code -> CPU executes -> Output :: From code to result
### How to Think Like a Programmer
- Break a big problem into small steps (decomposition).
- Spot what repeats (loops) and what depends on a condition (if/else).
- Name the data you must remember (variables) and how it is arranged (data structures).
### Flowcharts and Pseudocode
- Flowchart symbols: oval = start/end, parallelogram = input/output, rectangle = process, diamond = decision.
- Pseudocode = the algorithm in plain English, no syntax rules.
@flow (Start) | /read a, b/ | <a > b ? ~ print b> | print a | (End) :: Flowchart: larger of two numbers
### Flowchart Problem-Solving
Example: Print the sum of the first n natural numbers.
@flow (Start) | /read n/ | i = 1, sum = 0 | <i <= n ? ~ print sum> | sum = sum + i | ^i = i + 1 :: Sum of 1..n
### Dry Runs, Edge Cases and Debugging
- **Dry run**: execute the code on paper, tracking every variable in a table.
- **Edge cases**: n = 0, n = 1, negative numbers, duplicates, already sorted, overflow of int.
- **Debugging**: print variables at checkpoints, test the smallest failing input, change one thing at a time.
| step | i | sum |
|---|---|---|
| start | 1 | 0 |
| after loop 1 | 2 | 1 |
| after loop 2 | 3 | 3 |
| after loop 3 | 4 | 6 (n = 3, stop) |
### Programming Languages and Choosing a Path
- C++: fastest, best for competitive programming, STL. Java: strongly typed, used in big companies. Python: shortest code, best for AI/data. Pick one for DSA and stay with it; logic transfers.
## Beginner: Language Basics
### Learn C++ / Learn Java / Learn Python
The full language notes are in notebooks 01 (C++), 02 (Python) and 03 (Java). Minimum needed for DSA: input/output, data types, if/else, loops, functions, arrays, strings.
```cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;                 // input
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    long long sum = 0;
    for (int x : a) sum += x;        // loop
    cout << sum << "\n";             // output
    return 0;
}
```
```py
n = int(input())
a = list(map(int, input().split()))
total = 0
for x in a:
    total += x
print(total)
```
## Beginner: Logic Building (Patterns)
Rule: The **outer loop** counts the rows. The **inner loop(s)** print the columns of that row as a function of the row number i. Always find: how many spaces, how many symbols, in row i.
### Pattern 1 - Square of stars
Idea: n rows, each row prints n stars.
```cpp
void pattern1(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) cout << "* ";
        cout << "\n";
    }
}
```
```py
def pattern1(n):
    for i in range(n):
        print("* " * n)
```
TC: O(n^2) - n rows x n columns. SC: O(1).
### Pattern 2 - Right angled triangle
Idea: row i (1-based) has i stars.
```cpp
void pattern2(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) cout << "* ";
        cout << "\n";
    }
}
```
```py
def pattern2(n):
    for i in range(1, n + 1):
        print("* " * i)
```
TC: O(n^2) (1+2+..+n = n(n+1)/2). SC: O(1).
### Pattern 3 - Number triangle (1 / 1 2 / 1 2 3)
Idea: row i prints the column number j from 1 to i.
```cpp
void pattern3(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) cout << j << " ";
        cout << "\n";
    }
}
```
```py
def pattern3(n):
    for i in range(1, n + 1):
        print(" ".join(str(j) for j in range(1, i + 1)))
```
TC: O(n^2). SC: O(1).
### Pattern 4 - Repeated row number (1 / 2 2 / 3 3 3)
Idea: row i prints the row number i, i times.
```cpp
void pattern4(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) cout << i << " ";
        cout << "\n";
    }
}
```
```py
def pattern4(n):
    for i in range(1, n + 1):
        print((str(i) + " ") * i)
```
TC: O(n^2). SC: O(1).
### Pattern 5 - Inverted right triangle
Idea: row i (0-based) has n - i stars.
```cpp
void pattern5(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - i; j++) cout << "* ";
        cout << "\n";
    }
}
```
```py
def pattern5(n):
    for i in range(n):
        print("* " * (n - i))
```
TC: O(n^2). SC: O(1).
### Pattern 6 - Inverted number triangle (1 2 3 / 1 2 / 1)
Idea: row i (0-based) prints 1..(n - i).
```cpp
void pattern6(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 1; j <= n - i; j++) cout << j << " ";
        cout << "\n";
    }
}
```
```py
def pattern6(n):
    for i in range(n):
        print(" ".join(str(j) for j in range(1, n - i + 1)))
```
TC: O(n^2). SC: O(1).
### Pattern 7 - Star pyramid
Idea: row i (0-based): n-i-1 spaces, then 2i+1 stars.
```cpp
void pattern7(int n) {
    for (int i = 0; i < n; i++) {
        cout << string(n - i - 1, ' ') << string(2 * i + 1, '*') << "\n";
    }
}
```
```py
def pattern7(n):
    for i in range(n):
        print(" " * (n - i - 1) + "*" * (2 * i + 1))
```
TC: O(n^2). SC: O(1).
### Pattern 8 - Inverted star pyramid
Idea: row i: i spaces, then 2(n-i)-1 stars.
```cpp
void pattern8(int n) {
    for (int i = 0; i < n; i++)
        cout << string(i, ' ') << string(2 * (n - i) - 1, '*') << "\n";
}
```
```py
def pattern8(n):
    for i in range(n):
        print(" " * i + "*" * (2 * (n - i) - 1))
```
TC: O(n^2). SC: O(1).
### Pattern 9 - Diamond
Idea: pattern 7 followed by pattern 8.
```cpp
void pattern9(int n) {
    for (int i = 0; i < n; i++) cout << string(n - i - 1, ' ') << string(2 * i + 1, '*') << "\n";
    for (int i = 0; i < n; i++) cout << string(i, ' ') << string(2 * (n - i) - 1, '*') << "\n";
}
```
```py
def pattern9(n):
    for i in range(n): print(" " * (n - i - 1) + "*" * (2 * i + 1))
    for i in range(n): print(" " * i + "*" * (2 * (n - i) - 1))
```
TC: O(n^2). SC: O(1).
### Pattern 10 - Half diamond
Idea: 2n-1 rows. stars = i for i <= n, otherwise 2n - i.
```cpp
void pattern10(int n) {
    for (int i = 1; i <= 2 * n - 1; i++) {
        int stars = (i <= n) ? i : 2 * n - i;
        for (int j = 0; j < stars; j++) cout << "*";
        cout << "\n";
    }
}
```
```py
def pattern10(n):
    for i in range(1, 2 * n):
        print("*" * (i if i <= n else 2 * n - i))
```
TC: O(n^2). SC: O(1).
### Pattern 11 - Binary triangle (1 / 0 1 / 1 0 1)
Idea: even rows (0-based) start with 1, odd rows start with 0; flip after each print.
```cpp
void pattern11(int n) {
    for (int i = 0; i < n; i++) {
        int bit = (i % 2 == 0) ? 1 : 0;
        for (int j = 0; j <= i; j++) { cout << bit << " "; bit = 1 - bit; }
        cout << "\n";
    }
}
```
```py
def pattern11(n):
    for i in range(n):
        bit = 1 if i % 2 == 0 else 0
        row = []
        for _ in range(i + 1):
            row.append(str(bit)); bit = 1 - bit
        print(" ".join(row))
```
TC: O(n^2). SC: O(1).
### Pattern 12 - Number crown (1      1 / 12    21 / 123  321)
Idea: row i: numbers 1..i, then 2(n-i) spaces, then numbers i..1.
```cpp
void pattern12(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) cout << j;
        cout << string(2 * (n - i), ' ');
        for (int j = i; j >= 1; j--) cout << j;
        cout << "\n";
    }
}
```
```py
def pattern12(n):
    for i in range(1, n + 1):
        left = "".join(str(j) for j in range(1, i + 1))
        print(left + " " * (2 * (n - i)) + left[::-1])
```
TC: O(n^2). SC: O(1).
### Pattern 13 - Increasing number triangle (1 / 2 3 / 4 5 6)
Idea: keep one counter that never resets.
```cpp
void pattern13(int n) {
    int num = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) cout << num++ << " ";
        cout << "\n";
    }
}
```
```py
def pattern13(n):
    num = 1
    for i in range(1, n + 1):
        print(" ".join(str(num + k) for k in range(i)))
        num += i
```
TC: O(n^2). SC: O(1).
### Pattern 14 - Increasing letter triangle (A / A B / A B C)
Idea: row i prints characters 'A' to 'A' + i.
```cpp
void pattern14(int n) {
    for (int i = 0; i < n; i++) {
        for (char c = 'A'; c <= 'A' + i; c++) cout << c << " ";
        cout << "\n";
    }
}
```
```py
def pattern14(n):
    for i in range(n):
        print(" ".join(chr(65 + j) for j in range(i + 1)))
```
TC: O(n^2). SC: O(1).
### Pattern 15 - Reverse letter triangle (A B C / A B / A)
```cpp
void pattern15(int n) {
    for (int i = 0; i < n; i++) {
        for (char c = 'A'; c < 'A' + (n - i); c++) cout << c << " ";
        cout << "\n";
    }
}
```
```py
def pattern15(n):
    for i in range(n):
        print(" ".join(chr(65 + j) for j in range(n - i)))
```
TC: O(n^2). SC: O(1).
### Pattern 16 - Alpha ramp (A / B B / C C C)
```cpp
void pattern16(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= i; j++) cout << char('A' + i) << " ";
        cout << "\n";
    }
}
```
```py
def pattern16(n):
    for i in range(n):
        print((chr(65 + i) + " ") * (i + 1))
```
TC: O(n^2). SC: O(1).
### Pattern 17 - Alpha hill (A / ABA / ABCBA)
Idea: spaces n-i-1; letters rise until the middle (index i) then fall.
```cpp
void pattern17(int n) {
    for (int i = 0; i < n; i++) {
        cout << string(n - i - 1, ' ');
        char c = 'A';
        for (int j = 0; j < 2 * i + 1; j++) {
            cout << c;
            if (j < i) c++; else c--;
        }
        cout << "\n";
    }
}
```
```py
def pattern17(n):
    for i in range(n):
        up = "".join(chr(65 + j) for j in range(i + 1))
        print(" " * (n - i - 1) + up + up[-2::-1])
```
TC: O(n^2). SC: O(1).
### Pattern 18 - Alpha triangle (E / D E / C D E)
Idea: row i starts at letter ('A' + n - 1 - i) and goes up to the last letter.
```cpp
void pattern18(int n) {
    for (int i = 0; i < n; i++) {
        for (char c = 'A' + n - 1 - i; c <= 'A' + n - 1; c++) cout << c << " ";
        cout << "\n";
    }
}
```
```py
def pattern18(n):
    for i in range(n):
        print(" ".join(chr(65 + j) for j in range(n - 1 - i, n)))
```
TC: O(n^2). SC: O(1).
### Pattern 19 - Symmetric void
Idea: upper half: (n-i) stars, 2i spaces, (n-i) stars. Lower half is the mirror.
```cpp
void pattern19(int n) {
    for (int i = 0; i < n; i++)
        cout << string(n - i, '*') << string(2 * i, ' ') << string(n - i, '*') << "\n";
    for (int i = 1; i <= n; i++)
        cout << string(i, '*') << string(2 * (n - i), ' ') << string(i, '*') << "\n";
}
```
```py
def pattern19(n):
    for i in range(n):
        print("*" * (n - i) + " " * (2 * i) + "*" * (n - i))
    for i in range(1, n + 1):
        print("*" * i + " " * (2 * (n - i)) + "*" * i)
```
TC: O(n^2). SC: O(1).
### Pattern 20 - Symmetric butterfly
Idea: 2n-1 rows. stars = i (or 2n-i after the middle); spaces = 2(n - stars).
```cpp
void pattern20(int n) {
    for (int i = 1; i <= 2 * n - 1; i++) {
        int stars = (i <= n) ? i : 2 * n - i;
        cout << string(stars, '*') << string(2 * (n - stars), ' ') << string(stars, '*') << "\n";
    }
}
```
```py
def pattern20(n):
    for i in range(1, 2 * n):
        s = i if i <= n else 2 * n - i
        print("*" * s + " " * (2 * (n - s)) + "*" * s)
```
TC: O(n^2). SC: O(1).
### Pattern 21 - Hollow rectangle
Idea: print a star only on the boundary (first/last row or first/last column).
```cpp
void pattern21(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++)
            cout << ((i == 0 || j == 0 || i == n - 1 || j == n - 1) ? '*' : ' ');
        cout << "\n";
    }
}
```
```py
def pattern21(n):
    for i in range(n):
        print("".join("*" if i in (0, n - 1) or j in (0, n - 1) else " " for j in range(n)))
```
TC: O(n^2). SC: O(1).
### Pattern 22 - Concentric number square (4 4 4.. / 4 3 3.. / 4 3 2..)
Idea: grid size 2n-1. Value at (i, j) = n - (minimum distance to any of the 4 walls).
@grid 3 3 3 3 3 / 3 2 2 2 3 / 3 2 1* 2 3 / 3 2 2 2 3 / 3 3 3 3 3 :: n = 3, value = n - min(top, left, bottom, right)
```cpp
void pattern22(int n) {
    int size = 2 * n - 1;
    for (int i = 0; i < size; i++) {
        for (int j = 0; j < size; j++) {
            int d = min(min(i, j), min(size - 1 - i, size - 1 - j));
            cout << n - d << " ";
        }
        cout << "\n";
    }
}
```
```py
def pattern22(n):
    size = 2 * n - 1
    for i in range(size):
        print(" ".join(str(n - min(i, j, size - 1 - i, size - 1 - j)) for j in range(size)))
```
TC: O(n^2). SC: O(1).
## Beginner: Time Complexity
- **Time complexity** = how the number of basic steps grows when the input size n grows. It is NOT the time in seconds.
- **Big-O** = upper bound (worst case). **Omega** = lower bound (best case). **Theta** = tight bound (average/exact growth).
- Rules: (1) count for the worst case, (2) drop constants: O(2n) is O(n), (3) drop lower terms: O(n^2 + n) is O(n^2).
- **Space complexity** = extra memory used (auxiliary space) + input space.
| Code shape | Complexity |
|---|---|
| single statement | O(1) |
| one loop 0..n | O(n) |
| loop inside loop | O(n^2) |
| i doubles or halves each step | O(log n) |
| loop n times, inside halving | O(n log n) |
| two branches of recursion, depth n | O(2^n) |
| all permutations | O(n!) |
```cpp
for (int i = 1; i < n; i *= 2) { }          // O(log n): i = 1,2,4,8,...
for (int i = 0; i < n; i++)                 // O(n^2): n*(n-1)/2 steps
    for (int j = i + 1; j < n; j++) { }
```
> Order from fastest to slowest: O(1) < O(log n) < O(sqrt n) < O(n) < O(n log n) < O(n^2) < O(n^3) < O(2^n) < O(n!).
## Beginner: Standard Libraries and Collections
### C++ STL
```cpp
vector<int> v = {3, 1, 2};  v.push_back(5);  v.pop_back();  v.size();
sort(v.begin(), v.end());                    // ascending, O(n log n)
sort(v.begin(), v.end(), greater<int>());    // descending
reverse(v.begin(), v.end());
pair<int,int> p = {1, 2};                    // p.first, p.second
stack<int> st;  st.push(1); st.top(); st.pop();
queue<int> q;   q.push(1); q.front(); q.pop();
deque<int> dq;  dq.push_front(1); dq.push_back(2);
priority_queue<int> maxHeap;                               // largest on top
priority_queue<int, vector<int>, greater<int>> minHeap;    // smallest on top
set<int> s;            // sorted unique, O(log n) insert/find
unordered_set<int> us; // hash, O(1) average
map<string,int> m;     // sorted keys, O(log n)
unordered_map<string,int> um;  um["a"]++;   // O(1) average
auto it = lower_bound(v.begin(), v.end(), 3);   // first element >= 3
int mx = *max_element(v.begin(), v.end());
long long total = accumulate(v.begin(), v.end(), 0LL);
next_permutation(v.begin(), v.end());
int bits = __builtin_popcount(13);              // 3 set bits
```
### Java Collections
```java
ArrayList<Integer> list = new ArrayList<>();   list.add(5); list.get(0); list.size();
Collections.sort(list);  Collections.reverse(list);
Deque<Integer> stack = new ArrayDeque<>();     stack.push(1); stack.peek(); stack.pop();
Queue<Integer> q = new LinkedList<>();         q.offer(1); q.peek(); q.poll();
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
HashSet<Integer> set = new HashSet<>();        set.add(1); set.contains(1);
HashMap<String,Integer> map = new HashMap<>(); map.put("a", map.getOrDefault("a", 0) + 1);
TreeMap<Integer,Integer> tm = new TreeMap<>(); tm.floorKey(5); tm.ceilingKey(5);
```
### Python Libraries Part 1 and Part 2
```py
a = [3, 1, 2];  a.append(5);  a.pop();  a.sort();  a.sort(reverse=True);  b = sorted(a)
from collections import deque, Counter, defaultdict, OrderedDict
dq = deque();  dq.append(1);  dq.appendleft(0);  dq.popleft()      # O(1) both ends
cnt = Counter("banana")           # {'a': 3, 'n': 2, 'b': 1};  cnt.most_common(1)
g = defaultdict(list);  g[1].append(2)
import heapq
h = [];  heapq.heappush(h, 5);  smallest = heapq.heappop(h)         # min heap
heapq.heappush(h, -5)                                               # max heap: push negatives
import bisect
i = bisect.bisect_left(a, 3)      # lower bound;  bisect_right = upper bound
from itertools import permutations, combinations, accumulate
from functools import lru_cache   # memoisation decorator for DP
import math;  math.gcd(12, 18);  math.isqrt(17);  math.inf
s = set();  s.add(1);  d = {};  d["a"] = d.get("a", 0) + 1
```
## Beginner: Concept Basics
### Basic Maths
- Extract digits: last digit = `n % 10`, remove last digit = `n / 10` (integer division). Number of digits = floor(log10(n)) + 1.
- Divisors come in pairs (d, n/d) so we only loop up to sqrt(n).
- GCD by Euclid: gcd(a, b) = gcd(b, a % b), gcd(a, 0) = a.
### Basic Arrays
- An array stores same type elements in **contiguous memory**; access by index is O(1) because address = base + index x size.
@array 10 20 30 40 50 :: Array with indices 0..n-1
### Basic Hashing
- Hashing = pre-store counts/positions so later queries are O(1). Use a frequency array when values are small (0..10^6), otherwise a hash map.
- Hash map: average O(1) insert/find, worst O(n) on collisions. Ordered map: O(log n) always.
@chain key -> hash function -> index (bucket) -> value :: How a hash map finds a key
### Basic String
- A string is an array of characters. `'a'` has ASCII 97, `'A'` 65, `'0'` 48. Character to index: `c - 'a'`.
- In Python and Java strings are **immutable**: building a string in a loop with + is O(n^2); use a list and join / StringBuilder.
## Beginner: Basic Maths
### Count all Digits of a Number
Idea: keep dividing by 10; each division removes one digit.
```cpp
int countDigits(int n) {
    if (n == 0) return 1;
    int cnt = 0;
    while (n > 0) { cnt++; n /= 10; }
    return cnt;
}
```
```py
def count_digits(n):
    if n == 0: return 1
    cnt = 0
    while n > 0:
        cnt += 1
        n //= 10
    return cnt
```
TC: O(log10 n) - the number of digits. SC: O(1).
### Count number of odd digits in a number
```cpp
int countOddDigits(int n) {
    int cnt = 0;
    while (n > 0) { if ((n % 10) % 2 == 1) cnt++; n /= 10; }
    return cnt;
}
```
```py
def count_odd_digits(n):
    cnt = 0
    while n > 0:
        if (n % 10) % 2 == 1: cnt += 1
        n //= 10
    return cnt
```
TC: O(log10 n). SC: O(1).
### Reverse a number
Idea: pull the last digit and push it to the result: `rev = rev * 10 + digit`.
Dry run: 123 -> rev 3, n 12 -> rev 32, n 1 -> rev 321.
```cpp
int reverseNumber(int n) {
    long long rev = 0;
    while (n > 0) { rev = rev * 10 + n % 10; n /= 10; }
    return (int)rev;
}
```
```py
def reverse_number(n):
    rev = 0
    while n > 0:
        rev = rev * 10 + n % 10
        n //= 10
    return rev
```
TC: O(log10 n). SC: O(1).
### Palindrome Number
Idea: a number is a palindrome if its reverse equals itself.
```cpp
bool isPalindrome(int n) {
    if (n < 0) return false;
    long long rev = 0; int t = n;
    while (t > 0) { rev = rev * 10 + t % 10; t /= 10; }
    return rev == n;
}
```
```py
def is_palindrome_number(n):
    if n < 0: return False
    rev, t = 0, n
    while t > 0:
        rev = rev * 10 + t % 10
        t //= 10
    return rev == n
```
TC: O(log10 n). SC: O(1).
### Return the Largest Digit in a Number
```cpp
int largestDigit(int n) {
    int best = 0;
    while (n > 0) { best = max(best, n % 10); n /= 10; }
    return best;
}
```
```py
def largest_digit(n):
    best = 0
    while n > 0:
        best = max(best, n % 10)
        n //= 10
    return best
```
TC: O(log10 n). SC: O(1).
### Factorial of a given number
Idea: n! = 1 x 2 x ... x n. Use long long, it overflows after 20!.
```cpp
long long factorial(int n) {
    long long f = 1;
    for (int i = 2; i <= n; i++) f *= i;
    return f;
}
```
```py
def factorial(n):
    f = 1
    for i in range(2, n + 1):
        f *= i
    return f
```
TC: O(n). SC: O(1).
### Check if the Number is Armstrong
Idea: sum of (each digit ^ number of digits) equals the number. 153 = 1^3 + 5^3 + 3^3.
```cpp
bool isArmstrong(int n) {
    int k = to_string(n).size(), t = n; long long sum = 0;
    while (t > 0) { sum += (long long)pow(t % 10, k); t /= 10; }
    return sum == n;
}
```
```py
def is_armstrong(n):
    k = len(str(n))
    return sum(int(d) ** k for d in str(n)) == n
```
TC: O(log10 n). SC: O(1).
### Check for Perfect Number
Idea: sum of proper divisors equals n (6 = 1 + 2 + 3). Loop i up to sqrt(n); add i and n/i together.
```cpp
bool isPerfect(int n) {
    if (n <= 1) return false;
    int sum = 1;
    for (int i = 2; (long long)i * i <= n; i++)
        if (n % i == 0) { sum += i; if (i != n / i) sum += n / i; }
    return sum == n;
}
```
```py
def is_perfect(n):
    if n <= 1: return False
    total, i = 1, 2
    while i * i <= n:
        if n % i == 0:
            total += i
            if i != n // i: total += n // i
        i += 1
    return total == n
```
TC: O(sqrt n) - divisors pair up around sqrt(n). SC: O(1).
### Check for Prime Number
Idea: a prime has no divisor between 2 and sqrt(n). If n = a x b then one of a, b is <= sqrt(n).
```cpp
bool isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; (long long)i * i <= n; i++)
        if (n % i == 0) return false;
    return true;
}
```
```py
def is_prime(n):
    if n < 2: return False
    i = 2
    while i * i <= n:
        if n % i == 0: return False
        i += 1
    return True
```
TC: O(sqrt n). SC: O(1).
### Count of Prime Numbers till N
Idea: Sieve of Eratosthenes - cross out multiples of every prime; what remains is prime.
```cpp
int countPrimes(int n) {
    if (n < 2) return 0;
    vector<bool> prime(n + 1, true); prime[0] = prime[1] = false;
    for (int i = 2; (long long)i * i <= n; i++)
        if (prime[i]) for (int j = i * i; j <= n; j += i) prime[j] = false;
    return count(prime.begin(), prime.end(), true);
}
```
```py
def count_primes(n):
    if n < 2: return 0
    prime = [True] * (n + 1)
    prime[0] = prime[1] = False
    i = 2
    while i * i <= n:
        if prime[i]:
            for j in range(i * i, n + 1, i): prime[j] = False
        i += 1
    return sum(prime)
```
TC: O(n log log n). SC: O(n).
### GCD of Two Numbers
Idea: Euclid - the gcd does not change if the bigger number is replaced by its remainder with the smaller. gcd(48, 18) -> gcd(18, 12) -> gcd(12, 6) -> gcd(6, 0) = 6.
```cpp
int gcd(int a, int b) {
    while (b != 0) { int r = a % b; a = b; b = r; }
    return a;
}
```
```py
def gcd(a, b):
    while b:
        a, b = b, a % b
    return a
```
TC: O(log(min(a, b))) - the remainder at least halves every two steps. SC: O(1).
### LCM of two numbers
Formula: lcm(a, b) = a / gcd(a, b) x b (divide first to avoid overflow).
```cpp
long long lcm(int a, int b) { return (long long)a / gcd(a, b) * b; }
```
```py
def lcm(a, b):
    return a // gcd(a, b) * b
```
TC: O(log(min(a, b))). SC: O(1).
### Divisors of a Number
```cpp
vector<int> divisors(int n) {
    vector<int> small, large;
    for (int i = 1; (long long)i * i <= n; i++)
        if (n % i == 0) { small.push_back(i); if (i != n / i) large.push_back(n / i); }
    small.insert(small.end(), large.rbegin(), large.rend());
    return small;                       // already sorted
}
```
```py
def divisors(n):
    small, large = [], []
    i = 1
    while i * i <= n:
        if n % i == 0:
            small.append(i)
            if i != n // i: large.append(n // i)
        i += 1
    return small + large[::-1]
```
TC: O(sqrt n). SC: O(number of divisors).
## Beginner: Basic Arrays
### Sum of Array Elements
```cpp
long long arraySum(vector<int>& a) {
    long long s = 0;
    for (int x : a) s += x;
    return s;
}
```
```py
def array_sum(a):
    s = 0
    for x in a: s += x
    return s
```
TC: O(n). SC: O(1).
### Count of odd numbers in Array
```cpp
int countOdd(vector<int>& a) {
    int c = 0;
    for (int x : a) if (x % 2 != 0) c++;
    return c;
}
```
```py
def count_odd(a):
    return sum(1 for x in a if x % 2 != 0)
```
TC: O(n). SC: O(1).
### Check if the Array is Sorted I
Idea: an array is sorted if every element is >= the one before it.
```cpp
bool isSorted(vector<int>& a) {
    for (int i = 1; i < (int)a.size(); i++) if (a[i] < a[i - 1]) return false;
    return true;
}
```
```py
def is_sorted(a):
    return all(a[i] >= a[i - 1] for i in range(1, len(a)))
```
TC: O(n). SC: O(1).
### Reverse an array
Idea: two pointers from both ends, swap and move inward.
@array 1^l 2 3 4 5^r :: swap a[l], a[r]; l++, r--
```cpp
void reverseArray(vector<int>& a) {
    int l = 0, r = (int)a.size() - 1;
    while (l < r) swap(a[l++], a[r--]);
}
```
```py
def reverse_array(a):
    l, r = 0, len(a) - 1
    while l < r:
        a[l], a[r] = a[r], a[l]
        l += 1; r -= 1
```
TC: O(n) - n/2 swaps. SC: O(1).
## Beginner: Basic Hashing
### Highest Occurring Element in an Array
Idea: count every value in a hash map, then take the largest count (smallest value on ties).
```cpp
int mostFrequent(vector<int>& a) {
    unordered_map<int,int> f;
    for (int x : a) f[x]++;
    int best = -1, bestCnt = 0;
    for (auto& [v, c] : f)
        if (c > bestCnt || (c == bestCnt && v < best)) { best = v; bestCnt = c; }
    return best;
}
```
```py
from collections import Counter
def most_frequent(a):
    f = Counter(a)
    best_cnt = max(f.values())
    return min(v for v, c in f.items() if c == best_cnt)
```
TC: O(n) average. SC: O(n) for the map.
### Second Highest Occurring Element
Idea: find the highest frequency, then the highest frequency strictly smaller than it.
```cpp
int secondMostFrequent(vector<int>& a) {
    unordered_map<int,int> f;
    for (int x : a) f[x]++;
    int mx = 0, smx = 0;
    for (auto& [v, c] : f) mx = max(mx, c);
    for (auto& [v, c] : f) if (c < mx) smx = max(smx, c);
    if (smx == 0) return -1;
    int ans = INT_MAX;
    for (auto& [v, c] : f) if (c == smx) ans = min(ans, v);
    return ans;
}
```
```py
def second_most_frequent(a):
    f = Counter(a)
    mx = max(f.values())
    lower = [c for c in f.values() if c < mx]
    if not lower: return -1
    smx = max(lower)
    return min(v for v, c in f.items() if c == smx)
```
TC: O(n). SC: O(n).
### Sum of Highest and Lowest Frequency
```cpp
int sumHighLowFreq(vector<int>& a) {
    unordered_map<int,int> f;
    for (int x : a) f[x]++;
    int hi = 0, lo = INT_MAX;
    for (auto& [v, c] : f) { hi = max(hi, c); lo = min(lo, c); }
    return hi + lo;
}
```
```py
def sum_high_low_freq(a):
    f = Counter(a)
    return max(f.values()) + min(f.values())
```
TC: O(n). SC: O(n).
## Beginner: Basic Strings
### Reverse a String II
Idea: two pointers swap in place.
```cpp
void reverseString(vector<char>& s) {
    int l = 0, r = (int)s.size() - 1;
    while (l < r) swap(s[l++], s[r--]);
}
```
```py
def reverse_string(s):          # s is a list of characters
    l, r = 0, len(s) - 1
    while l < r:
        s[l], s[r] = s[r], s[l]
        l += 1; r -= 1
```
TC: O(n). SC: O(1).
### Palindrome Check
```cpp
bool isPalindrome(string s) {
    int l = 0, r = (int)s.size() - 1;
    while (l < r) if (s[l++] != s[r--]) return false;
    return true;
}
```
```py
def is_palindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]: return False
        l += 1; r -= 1
    return True
```
TC: O(n). SC: O(1).
### Largest Odd Number in a String
Idea: a number is odd if its last digit is odd. Scan from the right; the first odd digit ends the answer. Skip leading zeros.
```cpp
string largestOddNumber(string s) {
    int end = -1;
    for (int i = (int)s.size() - 1; i >= 0; i--) if ((s[i] - '0') % 2 == 1) { end = i; break; }
    if (end == -1) return "";
    int start = 0;
    while (start < end && s[start] == '0') start++;
    return s.substr(start, end - start + 1);
}
```
```py
def largest_odd_number(s):
    end = -1
    for i in range(len(s) - 1, -1, -1):
        if int(s[i]) % 2 == 1:
            end = i; break
    if end == -1: return ""
    start = 0
    while start < end and s[start] == '0': start += 1
    return s[start:end + 1]
```
TC: O(n). SC: O(1) extra.
### Longest Common Prefix
Idea: after sorting, the first and last strings are the most different; their common prefix is the answer.
```cpp
string longestCommonPrefix(vector<string>& strs) {
    if (strs.empty()) return "";
    sort(strs.begin(), strs.end());
    string a = strs.front(), b = strs.back();
    int i = 0;
    while (i < (int)min(a.size(), b.size()) && a[i] == b[i]) i++;
    return a.substr(0, i);
}
```
```py
def longest_common_prefix(strs):
    if not strs: return ""
    strs.sort()
    a, b = strs[0], strs[-1]
    i = 0
    while i < min(len(a), len(b)) and a[i] == b[i]: i += 1
    return a[:i]
```
TC: O(n log n x m) for sorting n strings of length m. SC: O(1) extra.
### Isomorphic Strings
Idea: characters must map one-to-one. Store the last seen position of each char in both strings; they must always agree.
```cpp
bool isIsomorphic(string s, string t) {
    if (s.size() != t.size()) return false;
    int ms[256] = {0}, mt[256] = {0};
    for (int i = 0; i < (int)s.size(); i++) {
        if (ms[(unsigned char)s[i]] != mt[(unsigned char)t[i]]) return false;
        ms[(unsigned char)s[i]] = mt[(unsigned char)t[i]] = i + 1;
    }
    return true;
}
```
```py
def is_isomorphic(s, t):
    if len(s) != len(t): return False
    ms, mt = {}, {}
    for i, (a, b) in enumerate(zip(s, t)):
        if ms.get(a, 0) != mt.get(b, 0): return False
        ms[a] = mt[b] = i + 1
    return True
```
TC: O(n). SC: O(1) - at most 256 characters.
### Rotate String
Idea: every rotation of s is a substring of s + s. So check the goal inside s + s.
```cpp
bool rotateString(string s, string goal) {
    return s.size() == goal.size() && (s + s).find(goal) != string::npos;
}
```
```py
def rotate_string(s, goal):
    return len(s) == len(goal) and goal in s + s
```
TC: O(n^2) worst for naive find (O(n) with KMP). SC: O(n).
### Valid Anagram
Idea: anagrams have identical character counts. Add for s, subtract for t; all must be zero.
```cpp
bool isAnagram(string s, string t) {
    if (s.size() != t.size()) return false;
    int f[26] = {0};
    for (char c : s) f[c - 'a']++;
    for (char c : t) if (--f[c - 'a'] < 0) return false;
    return true;
}
```
```py
def is_anagram(s, t):
    return Counter(s) == Counter(t)
```
TC: O(n). SC: O(1) - 26 letters.
### Sort Characters by Frequency
Idea: count, then sort characters by count descending, then repeat each char count times.
```cpp
string frequencySort(string s) {
    unordered_map<char,int> f;
    for (char c : s) f[c]++;
    vector<pair<int,char>> v;
    for (auto& [c, n] : f) v.push_back({n, c});
    sort(v.begin(), v.end(), [](auto& a, auto& b) { return a.first != b.first ? a.first > b.first : a.second < b.second; });
    string ans;
    for (auto& [n, c] : v) ans += string(n, c);
    return ans;
}
```
```py
def frequency_sort(s):
    f = Counter(s)
    return "".join(c * n for c, n in sorted(f.items(), key=lambda p: (-p[1], p[0])))
```
TC: O(n + k log k), k = distinct chars. SC: O(n).
## Beginner: Basic Recursion
### Recursion Theory
- **Recursion** = a function that calls itself on a smaller input. Every recursion needs (1) a **base case** that stops it and (2) a **recursive case** that moves toward the base case.
- Each call is pushed on the **call stack**; when the base case returns, calls finish in reverse order. No base case = stack overflow.
@stack f(1)^base f(2) f(3) main() :: Call stack while computing f(3)
- Recursion tree: draw each call as a node. Time = number of nodes x work per node. Space = depth of the tree.
### Recursion Concepts with Parameters
- **Parameterised** recursion carries the answer down in a parameter: `f(i, sum)`. **Functional** recursion returns the answer up: `return n + f(n - 1)`.
- **Backtracking** = do the work after the recursive call returns (on the way back).
```cpp
void printNto1(int i) { if (i == 0) return; cout << i << " "; printNto1(i - 1); }      // work before call
void print1toN(int i) { if (i == 0) return; print1toN(i - 1); cout << i << " "; }      // work after call (backtrack)
```
```py
def print_n_to_1(i):
    if i == 0: return
    print(i); print_n_to_1(i - 1)
def print_1_to_n(i):
    if i == 0: return
    print_1_to_n(i - 1); print(i)
```
### Sum of First N Numbers
Recurrence: sum(n) = n + sum(n - 1), sum(0) = 0.
```cpp
int sumN(int n) { return n == 0 ? 0 : n + sumN(n - 1); }
```
```py
def sum_n(n):
    return 0 if n == 0 else n + sum_n(n - 1)
```
TC: O(n) calls. SC: O(n) stack depth.
### Factorial of a Given Number
```cpp
long long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }
```
```py
def fact(n):
    return 1 if n <= 1 else n * fact(n - 1)
```
TC: O(n). SC: O(n).
### Sum of Array Elements II
```cpp
int sumArr(vector<int>& a, int i = 0) { return i == (int)a.size() ? 0 : a[i] + sumArr(a, i + 1); }
```
```py
def sum_arr(a, i=0):
    return 0 if i == len(a) else a[i] + sum_arr(a, i + 1)
```
TC: O(n). SC: O(n).
### Reverse a String I
```cpp
void reverseRec(string& s, int l, int r) {
    if (l >= r) return;
    swap(s[l], s[r]);
    reverseRec(s, l + 1, r - 1);
}
```
```py
def reverse_rec(s, l, r):        # s is a list
    if l >= r: return
    s[l], s[r] = s[r], s[l]
    reverse_rec(s, l + 1, r - 1)
```
TC: O(n). SC: O(n) stack.
### Check if String is Palindrome or Not
```cpp
bool palRec(string& s, int l, int r) {
    if (l >= r) return true;
    if (s[l] != s[r]) return false;
    return palRec(s, l + 1, r - 1);
}
```
```py
def pal_rec(s, l, r):
    if l >= r: return True
    if s[l] != s[r]: return False
    return pal_rec(s, l + 1, r - 1)
```
TC: O(n). SC: O(n).
### Check if a Number is Prime or Not
Idea: try divisor d = 2, 3, ... recursively until d x d > n.
```cpp
bool primeRec(int n, int d = 2) {
    if (n < 2) return false;
    if ((long long)d * d > n) return true;
    if (n % d == 0) return false;
    return primeRec(n, d + 1);
}
```
```py
def prime_rec(n, d=2):
    if n < 2: return False
    if d * d > n: return True
    if n % d == 0: return False
    return prime_rec(n, d + 1)
```
TC: O(sqrt n). SC: O(sqrt n) stack.
### Reverse an array 2
```cpp
void reverseArr(vector<int>& a, int l, int r) {
    if (l >= r) return;
    swap(a[l], a[r]);
    reverseArr(a, l + 1, r - 1);
}
```
```py
def reverse_arr(a, l, r):
    if l >= r: return
    a[l], a[r] = a[r], a[l]
    reverse_arr(a, l + 1, r - 1)
```
TC: O(n). SC: O(n).
### Check if the Array is Sorted II
```cpp
bool sortedRec(vector<int>& a, int i = 1) {
    if (i >= (int)a.size()) return true;
    if (a[i] < a[i - 1]) return false;
    return sortedRec(a, i + 1);
}
```
```py
def sorted_rec(a, i=1):
    if i >= len(a): return True
    if a[i] < a[i - 1]: return False
    return sorted_rec(a, i + 1)
```
TC: O(n). SC: O(n).
### Sum of Digits in a Given Number
```cpp
int digitSum(int n) { return n == 0 ? 0 : n % 10 + digitSum(n / 10); }
```
```py
def digit_sum(n):
    return 0 if n == 0 else n % 10 + digit_sum(n // 10)
```
TC: O(log10 n). SC: O(log10 n).
### Fibonacci Number
Recurrence: F(n) = F(n-1) + F(n-2), F(0) = 0, F(1) = 1.
@tree f(4)(f(3)(f(2),f(1)),f(2)(f(1),f(0))) :: Recursion tree: the same sub-problems repeat
```cpp
int fibRec(int n) { return n <= 1 ? n : fibRec(n - 1) + fibRec(n - 2); }   // O(2^n)
int fib(int n) {                                                         // O(n), O(1)
    if (n <= 1) return n;
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; }
    return b;
}
```
```py
def fib_rec(n):
    return n if n <= 1 else fib_rec(n - 1) + fib_rec(n - 2)
def fib(n):
    a, b = 0, 1
    for _ in range(n): a, b = b, a + b
    return a
```
TC: plain recursion O(2^n) since each call makes 2 calls; iterative O(n). SC: O(n) stack / O(1).
