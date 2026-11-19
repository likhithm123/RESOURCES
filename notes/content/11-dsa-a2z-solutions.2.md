## Sorting: Algorithms
| Algorithm | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Selection | O(n^2) | O(n^2) | O(n^2) | O(1) | No |
| Bubble | O(n) | O(n^2) | O(n^2) | O(1) | Yes |
| Insertion | O(n) | O(n^2) | O(n^2) | O(1) | Yes |
| Merge | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick | O(n log n) | O(n log n) | O(n^2) | O(log n) | No |
| Heap | O(n log n) | O(n log n) | O(n log n) | O(1) | No |
### Selection Sort
Idea: **select** the minimum of the unsorted part and swap it to the front. After pass i the first i+1 elements are final.
@array 13 46 24 52 20 9*^min :: pass 1: swap 9 with a[0]
```cpp
void selectionSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {
        int mn = i;
        for (int j = i + 1; j < n; j++) if (a[j] < a[mn]) mn = j;
        swap(a[i], a[mn]);
    }
}
```
```py
def selection_sort(a):
    n = len(a)
    for i in range(n - 1):
        mn = i
        for j in range(i + 1, n):
            if a[j] < a[mn]: mn = j
        a[i], a[mn] = a[mn], a[i]
```
TC: O(n^2) always: (n-1)+(n-2)+...+1 comparisons. SC: O(1).
### Bubble Sort
Idea: compare **adjacent** pairs and swap if out of order; the largest "bubbles" to the end each pass. If a pass makes no swap the array is already sorted - stop.
```cpp
void bubbleSort(vector<int>& a) {
    int n = a.size();
    for (int i = n - 1; i >= 1; i--) {
        bool swapped = false;
        for (int j = 0; j < i; j++)
            if (a[j] > a[j + 1]) { swap(a[j], a[j + 1]); swapped = true; }
        if (!swapped) break;
    }
}
```
```py
def bubble_sort(a):
    n = len(a)
    for i in range(n - 1, 0, -1):
        swapped = False
        for j in range(i):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]; swapped = True
        if not swapped: break
```
TC: O(n^2) worst/average, O(n) best (sorted input, one pass). SC: O(1).
### Insertion Sorting
Idea: like sorting playing cards - take the next element and **insert** it into its correct place in the sorted left part by shifting bigger elements right.
```cpp
void insertionSort(vector<int>& a) {
    for (int i = 1; i < (int)a.size(); i++) {
        int key = a[i], j = i - 1;
        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
        a[j + 1] = key;
    }
}
```
```py
def insertion_sort(a):
    for i in range(1, len(a)):
        key, j = a[i], i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]; j -= 1
        a[j + 1] = key
```
TC: O(n^2) worst, O(n) best. SC: O(1). Best for small or nearly sorted arrays.
### Merge Sorting
Idea: **divide and conquer**. Split the array in two halves, sort each half recursively, then **merge** two sorted halves with two pointers.
@tree 5 2 4 1(5 2(5,2),4 1(4,1)) :: Divide until size 1, then merge upward: [2 5] + [1 4] = [1 2 4 5]
```cpp
void mergeHalves(vector<int>& a, int l, int m, int r) {
    vector<int> t; int i = l, j = m + 1;
    while (i <= m && j <= r) t.push_back(a[i] <= a[j] ? a[i++] : a[j++]);
    while (i <= m) t.push_back(a[i++]);
    while (j <= r) t.push_back(a[j++]);
    for (int k = l; k <= r; k++) a[k] = t[k - l];
}
void mergeSort(vector<int>& a, int l, int r) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    mergeSort(a, l, m); mergeSort(a, m + 1, r);
    mergeHalves(a, l, m, r);
}
```
```py
def merge_sort(a):
    if len(a) <= 1: return a
    m = len(a) // 2
    left, right = merge_sort(a[:m]), merge_sort(a[m:])
    res, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]: res.append(left[i]); i += 1
        else: res.append(right[j]); j += 1
    return res + left[i:] + right[j:]
```
TC: O(n log n) - log n levels, each level merges n elements. T(n) = 2T(n/2) + O(n). SC: O(n) temp array.
### Quick Sorting
Idea: pick a **pivot**, place it at its correct position so that smaller elements are on its left and larger on its right (partition). Recurse on both sides.
@array 4^pivot 6 2 5 7 9 1 3 :: after partition: 1 3 2 | 4 | 7 9 5 6
```cpp
int partitionArr(vector<int>& a, int lo, int hi) {
    int pivot = a[lo], i = lo, j = hi;
    while (i < j) {
        while (i <= hi - 1 && a[i] <= pivot) i++;
        while (j >= lo + 1 && a[j] > pivot) j--;
        if (i < j) swap(a[i], a[j]);
    }
    swap(a[lo], a[j]);
    return j;
}
void quickSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int p = partitionArr(a, lo, hi);
    quickSort(a, lo, p - 1); quickSort(a, p + 1, hi);
}
```
```py
def quick_sort(a, lo, hi):
    if lo >= hi: return
    pivot, i, j = a[lo], lo, hi
    while i < j:
        while i <= hi - 1 and a[i] <= pivot: i += 1
        while j >= lo + 1 and a[j] > pivot: j -= 1
        if i < j: a[i], a[j] = a[j], a[i]
    a[lo], a[j] = a[j], a[lo]
    quick_sort(a, lo, j - 1); quick_sort(a, j + 1, hi)
```
TC: average O(n log n); worst O(n^2) when the pivot is always the smallest/largest (sorted input) - fix with a random pivot. SC: O(log n) recursion stack.
### Recursive Bubble Sort
Idea: one pass pushes the max to the end, then recurse on the first n-1 elements.
```cpp
void bubbleRec(vector<int>& a, int n) {
    if (n <= 1) return;
    bool swapped = false;
    for (int j = 0; j < n - 1; j++) if (a[j] > a[j + 1]) { swap(a[j], a[j + 1]); swapped = true; }
    if (swapped) bubbleRec(a, n - 1);
}
```
```py
def bubble_rec(a, n):
    if n <= 1: return
    swapped = False
    for j in range(n - 1):
        if a[j] > a[j + 1]: a[j], a[j + 1] = a[j + 1], a[j]; swapped = True
    if swapped: bubble_rec(a, n - 1)
```
TC: O(n^2). SC: O(n) stack.
### Recursive Insertion Sort
```cpp
void insertionRec(vector<int>& a, int i = 1) {
    if (i >= (int)a.size()) return;
    int key = a[i], j = i - 1;
    while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
    a[j + 1] = key;
    insertionRec(a, i + 1);
}
```
```py
def insertion_rec(a, i=1):
    if i >= len(a): return
    key, j = a[i], i - 1
    while j >= 0 and a[j] > key:
        a[j + 1] = a[j]; j -= 1
    a[j + 1] = key
    insertion_rec(a, i + 1)
```
TC: O(n^2). SC: O(n) stack.
## Arrays: Fundamentals
### Linear Search
```cpp
int linearSearch(vector<int>& a, int target) {
    for (int i = 0; i < (int)a.size(); i++) if (a[i] == target) return i;
    return -1;
}
```
```py
def linear_search(a, target):
    for i, x in enumerate(a):
        if x == target: return i
    return -1
```
TC: O(n). SC: O(1).
### Largest Element
```cpp
int largest(vector<int>& a) {
    int mx = a[0];
    for (int x : a) mx = max(mx, x);
    return mx;
}
```
```py
def largest(a):
    mx = a[0]
    for x in a:
        if x > mx: mx = x
    return mx
```
TC: O(n). SC: O(1).
### Second Largest Element
Idea: track largest and second largest in one pass. When a new largest arrives, the old largest becomes second.
```cpp
int secondLargest(vector<int>& a) {
    int mx = INT_MIN, smx = INT_MIN;
    for (int x : a) {
        if (x > mx) { smx = mx; mx = x; }
        else if (x < mx && x > smx) smx = x;
    }
    return smx == INT_MIN ? -1 : smx;
}
```
```py
def second_largest(a):
    mx = smx = float('-inf')
    for x in a:
        if x > mx: smx, mx = mx, x
        elif mx > x > smx: smx = x
    return -1 if smx == float('-inf') else smx
```
TC: O(n). SC: O(1).
### Maximum Consecutive Ones
Idea: running counter; reset to 0 at a zero.
```cpp
int maxConsecutiveOnes(vector<int>& a) {
    int cur = 0, best = 0;
    for (int x : a) { cur = (x == 1) ? cur + 1 : 0; best = max(best, cur); }
    return best;
}
```
```py
def max_consecutive_ones(a):
    cur = best = 0
    for x in a:
        cur = cur + 1 if x == 1 else 0
        best = max(best, cur)
    return best
```
TC: O(n). SC: O(1).
### Left Rotate Array by One
```cpp
void rotateByOne(vector<int>& a) {
    int first = a[0];
    for (int i = 1; i < (int)a.size(); i++) a[i - 1] = a[i];
    a.back() = first;
}
```
```py
def rotate_by_one(a):
    first = a[0]
    for i in range(1, len(a)): a[i - 1] = a[i]
    a[-1] = first
```
TC: O(n). SC: O(1).
### Left Rotate Array by K Places
Idea: reversal trick. Reverse first k, reverse the rest, reverse the whole array.
Dry run: [1 2 3 4 5], k=2 -> [2 1 | 3 4 5] -> [2 1 | 5 4 3] -> [3 4 5 1 2].
```cpp
void rotateLeft(vector<int>& a, int k) {
    int n = a.size(); k %= n;
    reverse(a.begin(), a.begin() + k);
    reverse(a.begin() + k, a.end());
    reverse(a.begin(), a.end());
}
```
```py
def rotate_left(a, k):
    n = len(a); k %= n
    def rev(l, r):
        while l < r:
            a[l], a[r] = a[r], a[l]; l += 1; r -= 1
    rev(0, k - 1); rev(k, n - 1); rev(0, n - 1)
```
TC: O(n) - each element is touched twice. SC: O(1).
## Arrays: Logic Building
### Move Zeros to End
Idea: pointer j marks the place for the next non-zero. Swap every non-zero to j.
```cpp
void moveZeroes(vector<int>& a) {
    int j = 0;
    for (int i = 0; i < (int)a.size(); i++) if (a[i] != 0) swap(a[i], a[j++]);
}
```
```py
def move_zeroes(a):
    j = 0
    for i in range(len(a)):
        if a[i] != 0:
            a[i], a[j] = a[j], a[i]; j += 1
```
TC: O(n). SC: O(1).
### Remove duplicates from sorted array
Idea: i points to the last unique element; when a[j] differs, advance i and copy.
@array 1 1^i 2^j 2 3 :: write a[j] to a[i+1] whenever a[j] != a[i]
```cpp
int removeDuplicates(vector<int>& a) {
    if (a.empty()) return 0;
    int i = 0;
    for (int j = 1; j < (int)a.size(); j++) if (a[j] != a[i]) a[++i] = a[j];
    return i + 1;
}
```
```py
def remove_duplicates(a):
    if not a: return 0
    i = 0
    for j in range(1, len(a)):
        if a[j] != a[i]:
            i += 1; a[i] = a[j]
    return i + 1
```
TC: O(n). SC: O(1).
### Find missing number
Idea: numbers are 0..n with one missing. XOR of all indices and all values cancels everything except the missing one (x ^ x = 0). Sum formula also works.
```cpp
int missingNumber(vector<int>& a) {
    int x = a.size();
    for (int i = 0; i < (int)a.size(); i++) x ^= i ^ a[i];
    return x;
}
```
```py
def missing_number(a):
    x = len(a)
    for i, v in enumerate(a): x ^= i ^ v
    return x
```
TC: O(n). SC: O(1).
### Union of two sorted arrays
Idea: two pointers like merge; push the smaller, skip duplicates by comparing with the last pushed.
```cpp
vector<int> unionSorted(vector<int>& a, vector<int>& b) {
    vector<int> u; int i = 0, j = 0, n = a.size(), m = b.size();
    auto add = [&](int x) { if (u.empty() || u.back() != x) u.push_back(x); };
    while (i < n && j < m) { if (a[i] <= b[j]) add(a[i++]); else add(b[j++]); }
    while (i < n) add(a[i++]);
    while (j < m) add(b[j++]);
    return u;
}
```
```py
def union_sorted(a, b):
    u, i, j = [], 0, 0
    def add(x):
        if not u or u[-1] != x: u.append(x)
    while i < len(a) and j < len(b):
        if a[i] <= b[j]: add(a[i]); i += 1
        else: add(b[j]); j += 1
    while i < len(a): add(a[i]); i += 1
    while j < len(b): add(b[j]); j += 1
    return u
```
TC: O(n + m). SC: O(n + m) for the answer.
### Intersection of two sorted arrays
```cpp
vector<int> intersectionSorted(vector<int>& a, vector<int>& b) {
    vector<int> ans; int i = 0, j = 0;
    while (i < (int)a.size() && j < (int)b.size()) {
        if (a[i] < b[j]) i++;
        else if (a[i] > b[j]) j++;
        else { ans.push_back(a[i]); i++; j++; }
    }
    return ans;
}
```
```py
def intersection_sorted(a, b):
    ans, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] < b[j]: i += 1
        elif a[i] > b[j]: j += 1
        else: ans.append(a[i]); i += 1; j += 1
    return ans
```
TC: O(n + m). SC: O(1) extra.
## Arrays: FAQs (Medium)
### Majority Element-I (appears more than n/2 times)
Idea: **Moore's voting**. Keep a candidate and a count. Same element: count++, different: count--. When count is 0 choose a new candidate. The majority survives because it out-numbers all others combined.
```cpp
int majorityElement(vector<int>& a) {
    int cand = 0, cnt = 0;
    for (int x : a) {
        if (cnt == 0) cand = x;
        cnt += (x == cand) ? 1 : -1;
    }
    return cand;
}
```
```py
def majority_element(a):
    cand, cnt = None, 0
    for x in a:
        if cnt == 0: cand = x
        cnt += 1 if x == cand else -1
    return cand
```
TC: O(n). SC: O(1). (Brute O(n^2); hashing O(n) time O(n) space.)
### Leaders in an Array
Idea: a leader is greater than everything on its right. Scan from the right keeping the max so far.
```cpp
vector<int> leaders(vector<int>& a) {
    vector<int> ans; int mx = INT_MIN;
    for (int i = (int)a.size() - 1; i >= 0; i--) if (a[i] > mx) { ans.push_back(a[i]); mx = a[i]; }
    reverse(ans.begin(), ans.end());
    return ans;
}
```
```py
def leaders(a):
    ans, mx = [], float('-inf')
    for x in reversed(a):
        if x > mx: ans.append(x); mx = x
    return ans[::-1]
```
TC: O(n). SC: O(1) extra.
### Rearrange array elements by sign
Idea: positives go to even indices, negatives to odd indices of a new array.
```cpp
vector<int> rearrangeBySign(vector<int>& a) {
    vector<int> ans(a.size()); int pos = 0, neg = 1;
    for (int x : a) {
        if (x > 0) { ans[pos] = x; pos += 2; }
        else { ans[neg] = x; neg += 2; }
    }
    return ans;
}
```
```py
def rearrange_by_sign(a):
    ans = [0] * len(a); pos, neg = 0, 1
    for x in a:
        if x > 0: ans[pos] = x; pos += 2
        else: ans[neg] = x; neg += 2
    return ans
```
TC: O(n). SC: O(n).
### Print the matrix in spiral manner
Idea: four boundaries top, bottom, left, right. Walk right, down, left, up and shrink the boundary after each walk.
@grid 1* 2* 3* / 8 9 4* / 7 6 5* :: go right on top row, down on right column, left on bottom, up on left
```cpp
vector<int> spiralOrder(vector<vector<int>>& m) {
    vector<int> ans;
    int top = 0, bot = m.size() - 1, left = 0, right = m[0].size() - 1;
    while (top <= bot && left <= right) {
        for (int j = left; j <= right; j++) ans.push_back(m[top][j]);
        top++;
        for (int i = top; i <= bot; i++) ans.push_back(m[i][right]);
        right--;
        if (top <= bot) { for (int j = right; j >= left; j--) ans.push_back(m[bot][j]); bot--; }
        if (left <= right) { for (int i = bot; i >= top; i--) ans.push_back(m[i][left]); left++; }
    }
    return ans;
}
```
```py
def spiral_order(m):
    ans = []
    top, bot, left, right = 0, len(m) - 1, 0, len(m[0]) - 1
    while top <= bot and left <= right:
        for j in range(left, right + 1): ans.append(m[top][j])
        top += 1
        for i in range(top, bot + 1): ans.append(m[i][right])
        right -= 1
        if top <= bot:
            for j in range(right, left - 1, -1): ans.append(m[bot][j])
            bot -= 1
        if left <= right:
            for i in range(bot, top - 1, -1): ans.append(m[i][left])
            left += 1
    return ans
```
TC: O(n x m). SC: O(1) extra.
### Pascal's Triangle I (element at row r, column c)
Formula: value = C(r-1, c-1). Compute nCr in O(r) by multiplying and dividing step by step.
```cpp
long long nCr(int n, int r) {
    long long res = 1;
    for (int i = 0; i < r; i++) res = res * (n - i) / (i + 1);
    return res;
}
long long pascalElement(int r, int c) { return nCr(r - 1, c - 1); }
```
```py
def n_c_r(n, r):
    res = 1
    for i in range(r): res = res * (n - i) // (i + 1)
    return res
def pascal_element(r, c): return n_c_r(r - 1, c - 1)
```
TC: O(c). SC: O(1).
### Pascal's Triangle II (print the r-th row)
Idea: next element = previous x (r - col) / col.
```cpp
vector<long long> pascalRow(int r) {
    vector<long long> row = {1}; long long v = 1;
    for (int c = 1; c < r; c++) { v = v * (r - c) / c; row.push_back(v); }
    return row;
}
```
```py
def pascal_row(r):
    row, v = [1], 1
    for c in range(1, r):
        v = v * (r - c) // c
        row.append(v)
    return row
```
TC: O(r). SC: O(1) extra.
### Pascal's Triangle III (print first n rows)
```cpp
vector<vector<long long>> pascalTriangle(int n) {
    vector<vector<long long>> t;
    for (int r = 1; r <= n; r++) t.push_back(pascalRow(r));
    return t;
}
```
```py
def pascal_triangle(n):
    return [pascal_row(r) for r in range(1, n + 1)]
```
TC: O(n^2). SC: O(1) extra.
### Rotate matrix by 90 degrees (clockwise)
Idea: **transpose** (swap m[i][j] with m[j][i]) then **reverse each row**.
```cpp
void rotate90(vector<vector<int>>& m) {
    int n = m.size();
    for (int i = 0; i < n; i++) for (int j = i + 1; j < n; j++) swap(m[i][j], m[j][i]);
    for (auto& row : m) reverse(row.begin(), row.end());
}
```
```py
def rotate90(m):
    n = len(m)
    for i in range(n):
        for j in range(i + 1, n): m[i][j], m[j][i] = m[j][i], m[i][j]
    for row in m: row.reverse()
```
TC: O(n^2). SC: O(1).
### Set Matrix Zeroes
Idea: use the first row and first column as markers (instead of extra arrays). One extra variable col0 remembers whether column 0 must be zeroed.
```cpp
void setZeroes(vector<vector<int>>& m) {
    int n = m.size(), c = m[0].size(); bool col0 = false;
    for (int i = 0; i < n; i++) {
        if (m[i][0] == 0) col0 = true;
        for (int j = 1; j < c; j++) if (m[i][j] == 0) m[i][0] = m[0][j] = 0;
    }
    for (int i = n - 1; i >= 0; i--) {
        for (int j = c - 1; j >= 1; j--) if (m[i][0] == 0 || m[0][j] == 0) m[i][j] = 0;
        if (col0) m[i][0] = 0;
    }
}
```
```py
def set_zeroes(m):
    n, c, col0 = len(m), len(m[0]), False
    for i in range(n):
        if m[i][0] == 0: col0 = True
        for j in range(1, c):
            if m[i][j] == 0: m[i][0] = m[0][j] = 0
    for i in range(n - 1, -1, -1):
        for j in range(c - 1, 0, -1):
            if m[i][0] == 0 or m[0][j] == 0: m[i][j] = 0
        if col0: m[i][0] = 0
```
TC: O(n x m). SC: O(1).
### Two Sum
Idea: for each x we need target - x. A hash map of value -> index answers "have I seen it?" in O(1).
```cpp
vector<int> twoSum(vector<int>& a, int target) {
    unordered_map<int,int> seen;
    for (int i = 0; i < (int)a.size(); i++) {
        auto it = seen.find(target - a[i]);
        if (it != seen.end()) return {it->second, i};
        seen[a[i]] = i;
    }
    return {-1, -1};
}
```
```py
def two_sum(a, target):
    seen = {}
    for i, x in enumerate(a):
        if target - x in seen: return [seen[target - x], i]
        seen[x] = i
    return [-1, -1]
```
TC: O(n). SC: O(n). (Brute O(n^2); sort + two pointers O(n log n) if indices are not needed.)
### 3 Sum
Idea: sort. Fix i, then two pointers j, k on the rest looking for sum 0. Skip equal neighbours to avoid duplicate triplets.
```cpp
vector<vector<int>> threeSum(vector<int>& a) {
    sort(a.begin(), a.end());
    vector<vector<int>> ans; int n = a.size();
    for (int i = 0; i < n; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;
        int j = i + 1, k = n - 1;
        while (j < k) {
            long long s = (long long)a[i] + a[j] + a[k];
            if (s < 0) j++;
            else if (s > 0) k--;
            else {
                ans.push_back({a[i], a[j], a[k]});
                j++; k--;
                while (j < k && a[j] == a[j - 1]) j++;
                while (j < k && a[k] == a[k + 1]) k--;
            }
        }
    }
    return ans;
}
```
```py
def three_sum(a):
    a.sort(); ans, n = [], len(a)
    for i in range(n):
        if i > 0 and a[i] == a[i - 1]: continue
        j, k = i + 1, n - 1
        while j < k:
            s = a[i] + a[j] + a[k]
            if s < 0: j += 1
            elif s > 0: k -= 1
            else:
                ans.append([a[i], a[j], a[k]])
                j += 1; k -= 1
                while j < k and a[j] == a[j - 1]: j += 1
                while j < k and a[k] == a[k + 1]: k -= 1
    return ans
```
TC: O(n^2) (sort n log n + n x two-pointer n). SC: O(1) extra.
### 4 Sum
Idea: same as 3 Sum with one more fixed loop.
```cpp
vector<vector<int>> fourSum(vector<int>& a, int target) {
    sort(a.begin(), a.end());
    vector<vector<int>> ans; int n = a.size();
    for (int i = 0; i < n; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;
        for (int j = i + 1; j < n; j++) {
            if (j > i + 1 && a[j] == a[j - 1]) continue;
            int k = j + 1, l = n - 1;
            while (k < l) {
                long long s = (long long)a[i] + a[j] + a[k] + a[l];
                if (s < target) k++;
                else if (s > target) l--;
                else {
                    ans.push_back({a[i], a[j], a[k], a[l]});
                    k++; l--;
                    while (k < l && a[k] == a[k - 1]) k++;
                    while (k < l && a[l] == a[l + 1]) l--;
                }
            }
        }
    }
    return ans;
}
```
```py
def four_sum(a, target):
    a.sort(); ans, n = [], len(a)
    for i in range(n):
        if i > 0 and a[i] == a[i - 1]: continue
        for j in range(i + 1, n):
            if j > i + 1 and a[j] == a[j - 1]: continue
            k, l = j + 1, n - 1
            while k < l:
                s = a[i] + a[j] + a[k] + a[l]
                if s < target: k += 1
                elif s > target: l -= 1
                else:
                    ans.append([a[i], a[j], a[k], a[l]])
                    k += 1; l -= 1
                    while k < l and a[k] == a[k - 1]: k += 1
                    while k < l and a[l] == a[l + 1]: l -= 1
    return ans
```
TC: O(n^3). SC: O(1) extra.
### Sort an array of 0's 1's and 2's
Idea: **Dutch National Flag**. Three pointers: [0..low-1] are 0s, [low..mid-1] are 1s, [high+1..n-1] are 2s; mid scans the unknown part.
@array 0 0 1^low 1 2^mid 0 1 2^high 2 :: a[mid]=0: swap with low; 1: mid++; 2: swap with high
```cpp
void sortColors(vector<int>& a) {
    int low = 0, mid = 0, high = (int)a.size() - 1;
    while (mid <= high) {
        if (a[mid] == 0) swap(a[low++], a[mid++]);
        else if (a[mid] == 1) mid++;
        else swap(a[mid], a[high--]);
    }
}
```
```py
def sort_colors(a):
    low, mid, high = 0, 0, len(a) - 1
    while mid <= high:
        if a[mid] == 0:
            a[low], a[mid] = a[mid], a[low]; low += 1; mid += 1
        elif a[mid] == 1: mid += 1
        else:
            a[mid], a[high] = a[high], a[mid]; high -= 1
```
TC: O(n) single pass. SC: O(1).
### Kadane's Algorithm (maximum subarray sum)
Idea: a negative running sum can only hurt the future, so drop it. cur = max(x, cur + x).
Dry run: [-2, 1, -3, 4, -1, 2, 1, -5, 4] -> cur: -2, 1, -2, 4, 3, 5, 6, 1, 5 -> best = 6.
```cpp
long long maxSubArray(vector<int>& a) {
    long long cur = 0, best = LLONG_MIN;
    for (int x : a) {
        cur = max((long long)x, cur + x);
        best = max(best, cur);
    }
    return best;
}
```
```py
def max_sub_array(a):
    cur, best = 0, float('-inf')
    for x in a:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
```
TC: O(n). SC: O(1). (Brute: all subarrays O(n^2).)
### Next Permutation
Idea: (1) from the right find the first index i with a[i] < a[i+1] (the "dip"). (2) swap a[i] with the smallest element greater than it on the right (first from the right). (3) reverse the suffix after i. If no dip, reverse everything.
Dry run: [1, 3, 5, 4, 2] -> dip at 3 -> swap with 4 -> [1, 4, 5, 3, 2] -> reverse suffix -> [1, 4, 2, 3, 5].
```cpp
void nextPermutation(vector<int>& a) {
    int n = a.size(), i = n - 2;
    while (i >= 0 && a[i] >= a[i + 1]) i--;
    if (i >= 0) {
        int j = n - 1;
        while (a[j] <= a[i]) j--;
        swap(a[i], a[j]);
    }
    reverse(a.begin() + i + 1, a.end());
}
```
```py
def next_permutation(a):
    n = len(a); i = n - 2
    while i >= 0 and a[i] >= a[i + 1]: i -= 1
    if i >= 0:
        j = n - 1
        while a[j] <= a[i]: j -= 1
        a[i], a[j] = a[j], a[i]
    a[i + 1:] = reversed(a[i + 1:])
```
TC: O(n). SC: O(1).
## Arrays: FAQs (Hard)
### Majority Element-II (more than n/3 times)
Idea: at most 2 such elements can exist. Extended Moore's voting with two candidates, then verify by counting.
```cpp
vector<int> majorityElementII(vector<int>& a) {
    int c1 = 0, c2 = 0, e1 = INT_MIN, e2 = INT_MIN;
    for (int x : a) {
        if (c1 == 0 && x != e2) { e1 = x; c1 = 1; }
        else if (c2 == 0 && x != e1) { e2 = x; c2 = 1; }
        else if (x == e1) c1++;
        else if (x == e2) c2++;
        else { c1--; c2--; }
    }
    vector<int> ans; int n = a.size();
    if (count(a.begin(), a.end(), e1) > n / 3) ans.push_back(e1);
    if (e2 != e1 && count(a.begin(), a.end(), e2) > n / 3) ans.push_back(e2);
    return ans;
}
```
```py
def majority_element_ii(a):
    c1 = c2 = 0; e1 = e2 = None
    for x in a:
        if c1 == 0 and x != e2: e1, c1 = x, 1
        elif c2 == 0 and x != e1: e2, c2 = x, 1
        elif x == e1: c1 += 1
        elif x == e2: c2 += 1
        else: c1 -= 1; c2 -= 1
    return [e for e in {e1, e2} if e is not None and a.count(e) > len(a) // 3]
```
TC: O(n). SC: O(1).
### Find the repeating and missing number
Idea: values are 1..n; one repeats (A), one is missing (B). Use two equations: sum gives A - B, sum of squares gives A^2 - B^2 = (A-B)(A+B).
```cpp
vector<int> repeatingMissing(vector<int>& a) {
    long long n = a.size(), S = n * (n + 1) / 2, S2 = n * (n + 1) * (2 * n + 1) / 6, s = 0, s2 = 0;
    for (int x : a) { s += x; s2 += (long long)x * x; }
    long long d = s - S;            // A - B
    long long sum = (s2 - S2) / d;  // A + B
    return {(int)((d + sum) / 2), (int)((sum - d) / 2)};   // {repeating, missing}
}
```
```py
def repeating_missing(a):
    n = len(a)
    S, S2 = n * (n + 1) // 2, n * (n + 1) * (2 * n + 1) // 6
    d = sum(a) - S
    tot = (sum(x * x for x in a) - S2) // d
    return [(d + tot) // 2, (tot - d) // 2]
```
TC: O(n). SC: O(1).
### Count Inversions
Idea: an inversion is a pair i < j with a[i] > a[j]. During **merge sort**, when a right element is smaller than left[i], it is smaller than all remaining left elements: add (mid - i + 1).
```cpp
long long mergeCount(vector<int>& a, int l, int r) {
    if (l >= r) return 0;
    int m = l + (r - l) / 2;
    long long cnt = mergeCount(a, l, m) + mergeCount(a, m + 1, r);
    vector<int> t; int i = l, j = m + 1;
    while (i <= m && j <= r) {
        if (a[i] <= a[j]) t.push_back(a[i++]);
        else { cnt += m - i + 1; t.push_back(a[j++]); }
    }
    while (i <= m) t.push_back(a[i++]);
    while (j <= r) t.push_back(a[j++]);
    for (int k = l; k <= r; k++) a[k] = t[k - l];
    return cnt;
}
```
```py
def count_inversions(a):
    if len(a) <= 1: return a, 0
    m = len(a) // 2
    left, x = count_inversions(a[:m]); right, y = count_inversions(a[m:])
    res, i, j, cnt = [], 0, 0, x + y
    while i < len(left) and j < len(right):
        if left[i] <= right[j]: res.append(left[i]); i += 1
        else: cnt += len(left) - i; res.append(right[j]); j += 1
    return res + left[i:] + right[j:], cnt
```
TC: O(n log n). SC: O(n).
### Reverse Pairs (i < j and a[i] > 2 x a[j])
Idea: merge sort again. Before merging two sorted halves, count pairs with a moving pointer (it never moves back).
```cpp
int reversePairsRec(vector<int>& a, int l, int r) {
    if (l >= r) return 0;
    int m = l + (r - l) / 2;
    int cnt = reversePairsRec(a, l, m) + reversePairsRec(a, m + 1, r);
    int j = m + 1;
    for (int i = l; i <= m; i++) {
        while (j <= r && (long long)a[i] > 2LL * a[j]) j++;
        cnt += j - (m + 1);
    }
    inplace_merge(a.begin() + l, a.begin() + m + 1, a.begin() + r + 1);
    return cnt;
}
```
```py
def reverse_pairs(a):
    def rec(arr):
        if len(arr) <= 1: return arr, 0
        m = len(arr) // 2
        L, x = rec(arr[:m]); R, y = rec(arr[m:])
        cnt, j = x + y, 0
        for v in L:
            while j < len(R) and v > 2 * R[j]: j += 1
            cnt += j
        return sorted(L + R), cnt
    return rec(a)[1]
```
TC: O(n log n). SC: O(n).
### Maximum Product Subarray in an Array
Idea: a negative number flips max and min, so track both. Equivalent trick: best of prefix products and suffix products, resetting to 1 after a zero.
```cpp
long long maxProduct(vector<int>& a) {
    long long pre = 1, suf = 1, best = LLONG_MIN; int n = a.size();
    for (int i = 0; i < n; i++) {
        if (pre == 0) pre = 1;
        if (suf == 0) suf = 1;
        pre *= a[i]; suf *= a[n - 1 - i];
        best = max(best, max(pre, suf));
    }
    return best;
}
```
```py
def max_product(a):
    pre = suf = 1; best = float('-inf'); n = len(a)
    for i in range(n):
        if pre == 0: pre = 1
        if suf == 0: suf = 1
        pre *= a[i]; suf *= a[n - 1 - i]
        best = max(best, pre, suf)
    return best
```
TC: O(n). SC: O(1).
### Merge two sorted arrays without extra space
Idea: compare the largest of a (from the end) with the smallest of b (from the start); swap while a's is bigger; finally sort both.
```cpp
void mergeNoExtra(vector<int>& a, vector<int>& b) {
    int i = (int)a.size() - 1, j = 0;
    while (i >= 0 && j < (int)b.size() && a[i] > b[j]) swap(a[i--], b[j++]);
    sort(a.begin(), a.end()); sort(b.begin(), b.end());
}
```
```py
def merge_no_extra(a, b):
    i, j = len(a) - 1, 0
    while i >= 0 and j < len(b) and a[i] > b[j]:
        a[i], b[j] = b[j], a[i]; i -= 1; j += 1
    a.sort(); b.sort()
```
TC: O(min(n, m) + n log n + m log m). SC: O(1).
## Hashing
### Basic Hashing (theory recap)
- Frequency array for small ranges, hash map for large/negative values. **Prefix sum + hash map** is the key trick for subarray problems: sum(i..j) = prefix[j] - prefix[i-1].
@array 1 2 3 -3 1 1 :: prefix sums: 1 3 6 3 4 5. Equal prefix sums (3 and 3) mean the subarray between them sums to 0
### Longest Consecutive Sequence in an Array
Idea: put all numbers in a set. Start counting only from x where x - 1 is absent (x is the start of a run).
```cpp
int longestConsecutive(vector<int>& a) {
    unordered_set<int> s(a.begin(), a.end()); int best = 0;
    for (int x : s) {
        if (s.count(x - 1)) continue;
        int len = 1;
        while (s.count(x + len)) len++;
        best = max(best, len);
    }
    return best;
}
```
```py
def longest_consecutive(a):
    s, best = set(a), 0
    for x in s:
        if x - 1 in s: continue
        length = 1
        while x + length in s: length += 1
        best = max(best, length)
    return best
```
TC: O(n) - every number is visited at most twice. SC: O(n).
### Longest subarray with sum K
Idea: store the **first** index of each prefix sum. If prefix - K was seen at index p, then (p+1..i) sums to K.
```cpp
int longestSubarraySumK(vector<int>& a, long long k) {
    unordered_map<long long,int> first; long long pre = 0; int best = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        pre += a[i];
        if (pre == k) best = i + 1;
        auto it = first.find(pre - k);
        if (it != first.end()) best = max(best, i - it->second);
        if (!first.count(pre)) first[pre] = i;
    }
    return best;
}
```
```py
def longest_subarray_sum_k(a, k):
    first, pre, best = {}, 0, 0
    for i, x in enumerate(a):
        pre += x
        if pre == k: best = i + 1
        if pre - k in first: best = max(best, i - first[pre - k])
        first.setdefault(pre, i)
    return best
```
TC: O(n). SC: O(n). (If all numbers are positive, a sliding window gives O(1) space.)
### Largest Subarray with Sum 0
```cpp
int largestSubarrayZero(vector<int>& a) {
    unordered_map<long long,int> first; long long pre = 0; int best = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        pre += a[i];
        if (pre == 0) best = i + 1;
        else if (first.count(pre)) best = max(best, i - first[pre]);
        else first[pre] = i;
    }
    return best;
}
```
```py
def largest_subarray_zero(a):
    first, pre, best = {}, 0, 0
    for i, x in enumerate(a):
        pre += x
        if pre == 0: best = i + 1
        elif pre in first: best = max(best, i - first[pre])
        else: first[pre] = i
    return best
```
TC: O(n). SC: O(n).
### Count subarrays with given sum
Idea: count how many earlier prefixes equal pre - K. Start the map with {0: 1} for subarrays starting at index 0.
```cpp
int subarraySum(vector<int>& a, int k) {
    unordered_map<long long,int> cnt; cnt[0] = 1; long long pre = 0; int ans = 0;
    for (int x : a) {
        pre += x;
        if (cnt.count(pre - k)) ans += cnt[pre - k];
        cnt[pre]++;
    }
    return ans;
}
```
```py
from collections import defaultdict
def subarray_sum(a, k):
    cnt = defaultdict(int); cnt[0] = 1; pre = ans = 0
    for x in a:
        pre += x
        ans += cnt[pre - k]
        cnt[pre] += 1
    return ans
```
TC: O(n). SC: O(n).
### Count subarrays with given xor K
Idea: same as above with XOR. If prefixXor ^ y = K then y = prefixXor ^ K.
```cpp
int subarraysWithXorK(vector<int>& a, int k) {
    unordered_map<int,int> cnt; cnt[0] = 1; int xr = 0, ans = 0;
    for (int x : a) {
        xr ^= x;
        if (cnt.count(xr ^ k)) ans += cnt[xr ^ k];
        cnt[xr]++;
    }
    return ans;
}
```
```py
def subarrays_with_xor_k(a, k):
    cnt = defaultdict(int); cnt[0] = 1; xr = ans = 0
    for x in a:
        xr ^= x
        ans += cnt[xr ^ k]
        cnt[xr] += 1
    return ans
```
TC: O(n). SC: O(n).
