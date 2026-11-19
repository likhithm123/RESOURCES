## Binary Search: Fundamentals
Rule: binary search works whenever the search space is **monotonic** - once a condition becomes true it stays true (F F F T T T). Each step throws away half of the space, so it takes log2(n) steps.
@array 2 5^low 8 12*^mid 16 23 38^high :: compare target with a[mid]; discard the half that cannot contain it
@flow (low = 0, high = n-1) | <low <= high ? ~ (return -1)> | mid = low + (high-low)/2 | <a[mid] == x ? ~ a[mid] < x: low = mid+1, else high = mid-1> | (return mid) :: Binary search
### Search X in sorted array
```cpp
int binarySearch(vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;          // avoids overflow of lo + hi
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}
```
```py
def binary_search(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x: return mid
        if a[mid] < x: lo = mid + 1
        else: hi = mid - 1
    return -1
```
TC: O(log n) - the range halves each step: n -> n/2 -> n/4 ... 1. SC: O(1).
### Lower Bound (first index with a[i] >= x)
Idea: whenever a[mid] >= x it may be the answer: store it and look left for a smaller index.
```cpp
int lowerBound(vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1, ans = a.size();
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= x) { ans = mid; hi = mid - 1; } else lo = mid + 1;
    }
    return ans;
}
```
```py
def lower_bound(a, x):
    lo, hi, ans = 0, len(a) - 1, len(a)
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] >= x: ans = mid; hi = mid - 1
        else: lo = mid + 1
    return ans
```
TC: O(log n). SC: O(1).
### Upper Bound (first index with a[i] > x)
```cpp
int upperBound(vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1, ans = a.size();
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > x) { ans = mid; hi = mid - 1; } else lo = mid + 1;
    }
    return ans;
}
```
```py
def upper_bound(a, x):
    lo, hi, ans = 0, len(a) - 1, len(a)
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] > x: ans = mid; hi = mid - 1
        else: lo = mid + 1
    return ans
```
TC: O(log n). SC: O(1).
## Binary Search: Logic Building
### Search insert position
Idea: it is exactly the lower bound.
```cpp
int searchInsert(vector<int>& a, int x) { return lowerBound(a, x); }
```
```py
def search_insert(a, x): return lower_bound(a, x)
```
TC: O(log n). SC: O(1).
### Floor and Ceil in Sorted Array
Idea: floor = largest value <= x, ceil = smallest value >= x.
```cpp
pair<int,int> floorCeil(vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1, fl = -1, ce = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return {x, x};
        if (a[mid] < x) { fl = a[mid]; lo = mid + 1; }
        else { ce = a[mid]; hi = mid - 1; }
    }
    return {fl, ce};
}
```
```py
def floor_ceil(a, x):
    lo, hi, fl, ce = 0, len(a) - 1, -1, -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x: return x, x
        if a[mid] < x: fl = a[mid]; lo = mid + 1
        else: ce = a[mid]; hi = mid - 1
    return fl, ce
```
TC: O(log n). SC: O(1).
### First and last occurrence
Idea: first = lower bound (if it holds x), last = upper bound - 1.
```cpp
vector<int> searchRange(vector<int>& a, int x) {
    int f = lowerBound(a, x);
    if (f == (int)a.size() || a[f] != x) return {-1, -1};
    return {f, upperBound(a, x) - 1};
}
```
```py
def search_range(a, x):
    f = lower_bound(a, x)
    if f == len(a) or a[f] != x: return [-1, -1]
    return [f, upper_bound(a, x) - 1]
```
TC: O(log n). SC: O(1).
### Search in rotated sorted array-I (distinct values)
Idea: one of the two halves around mid is always sorted. Check if the target lies inside the sorted half; otherwise go to the other half.
@array 4^low 5 6 7^mid 0 1 2^high :: left half 4..7 is sorted; target 0 is not inside it, so go right
```cpp
int searchRotated(vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[lo] <= a[mid]) {                       // left half sorted
            if (a[lo] <= x && x < a[mid]) hi = mid - 1; else lo = mid + 1;
        } else {                                     // right half sorted
            if (a[mid] < x && x <= a[hi]) lo = mid + 1; else hi = mid - 1;
        }
    }
    return -1;
}
```
```py
def search_rotated(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x: return mid
        if a[lo] <= a[mid]:
            if a[lo] <= x < a[mid]: hi = mid - 1
            else: lo = mid + 1
        else:
            if a[mid] < x <= a[hi]: lo = mid + 1
            else: hi = mid - 1
    return -1
```
TC: O(log n). SC: O(1).
### Search in rotated sorted array-II (duplicates allowed)
Idea: when a[lo] == a[mid] == a[hi] we cannot tell which half is sorted; shrink both ends by one.
```cpp
bool searchRotatedII(vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return true;
        if (a[lo] == a[mid] && a[mid] == a[hi]) { lo++; hi--; continue; }
        if (a[lo] <= a[mid]) { if (a[lo] <= x && x < a[mid]) hi = mid - 1; else lo = mid + 1; }
        else { if (a[mid] < x && x <= a[hi]) lo = mid + 1; else hi = mid - 1; }
    }
    return false;
}
```
```py
def search_rotated_ii(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x: return True
        if a[lo] == a[mid] == a[hi]: lo += 1; hi -= 1; continue
        if a[lo] <= a[mid]:
            if a[lo] <= x < a[mid]: hi = mid - 1
            else: lo = mid + 1
        else:
            if a[mid] < x <= a[hi]: lo = mid + 1
            else: hi = mid - 1
    return False
```
TC: O(log n) average, O(n) worst (all duplicates). SC: O(1).
### Find minimum in Rotated Sorted Array
Idea: if a[mid] > a[hi] the minimum is to the right of mid, otherwise it is at mid or to the left.
```cpp
int findMin(vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1; else hi = mid;
    }
    return a[lo];
}
```
```py
def find_min(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] > a[hi]: lo = mid + 1
        else: hi = mid
    return a[lo]
```
TC: O(log n). SC: O(1).
### Find out how many times the array is rotated
Idea: number of rotations = index of the minimum element.
```cpp
int rotationCount(vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1; else hi = mid;
    }
    return lo;
}
```
```py
def rotation_count(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] > a[hi]: lo = mid + 1
        else: hi = mid
    return lo
```
TC: O(log n). SC: O(1).
### Single element in sorted array
Idea: before the single element, pairs start at even indices (even, odd). After it, pairs start at odd indices. Make mid even and compare with mid + 1.
```cpp
int singleNonDuplicate(vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (mid % 2 == 1) mid--;
        if (a[mid] == a[mid + 1]) lo = mid + 2; else hi = mid;
    }
    return a[lo];
}
```
```py
def single_non_duplicate(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if mid % 2 == 1: mid -= 1
        if a[mid] == a[mid + 1]: lo = mid + 2
        else: hi = mid
    return a[lo]
```
TC: O(log n). SC: O(1).
### Count Occurrences in a Sorted Array
```cpp
int countOccurrences(vector<int>& a, int x) { return upperBound(a, x) - lowerBound(a, x); }
```
```py
def count_occurrences(a, x): return upper_bound(a, x) - lower_bound(a, x)
```
TC: O(log n). SC: O(1).
## Binary Search: On Answers
Rule: when asked for the **minimum X such that something is possible** (or maximum), and "possible" is monotonic in X, binary search on X itself. Write a function `can(X)` and search the range [lowest possible, highest possible].
@cells F F F F T* T T T :: can(x) over the answer range: find the first T (minimise) or last T (maximise)
### Find square root of a number
```cpp
long long floorSqrt(long long n) {
    long long lo = 0, hi = n, ans = 0;
    while (lo <= hi) {
        long long mid = lo + (hi - lo) / 2;
        if (mid <= n / max(mid, 1LL)) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
}
```
```py
def floor_sqrt(n):
    lo, hi, ans = 0, n, 0
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid * mid <= n: ans = mid; lo = mid + 1
        else: hi = mid - 1
    return ans
```
TC: O(log n). SC: O(1).
### Find Nth root of a number
Idea: search x in [1, m] with x^n == m. Stop multiplying as soon as the power exceeds m (prevents overflow).
```cpp
int nthRoot(int n, int m) {
    int lo = 1, hi = m;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        long long p = 1; bool over = false;
        for (int i = 0; i < n; i++) { p *= mid; if (p > m) { over = true; break; } }
        if (!over && p == m) return mid;
        if (over) hi = mid - 1; else lo = mid + 1;
    }
    return -1;
}
```
```py
def nth_root(n, m):
    lo, hi = 1, m
    while lo <= hi:
        mid = (lo + hi) // 2
        p = mid ** n
        if p == m: return mid
        if p > m: hi = mid - 1
        else: lo = mid + 1
    return -1
```
TC: O(n log m). SC: O(1).
### Find the smallest divisor
Idea: sum of ceil(a[i] / d) decreases as d grows. Find the smallest d with sum <= limit.
```cpp
int smallestDivisor(vector<int>& a, int limit) {
    int lo = 1, hi = *max_element(a.begin(), a.end());
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2; long long s = 0;
        for (int x : a) s += (x + mid - 1) / mid;
        if (s <= limit) hi = mid; else lo = mid + 1;
    }
    return lo;
}
```
```py
def smallest_divisor(a, limit):
    lo, hi = 1, max(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if sum((x + mid - 1) // mid for x in a) <= limit: hi = mid
        else: lo = mid + 1
    return lo
```
TC: O(n log(max)). SC: O(1).
### Koko eating bananas
Idea: speed k needs sum(ceil(pile / k)) hours. Larger k = fewer hours (monotonic). Smallest k with hours <= h.
```cpp
int minEatingSpeed(vector<int>& piles, int h) {
    int lo = 1, hi = *max_element(piles.begin(), piles.end());
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2; long long hrs = 0;
        for (int p : piles) hrs += (p + mid - 1) / mid;
        if (hrs <= h) hi = mid; else lo = mid + 1;
    }
    return lo;
}
```
```py
def min_eating_speed(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if sum((p + mid - 1) // mid for p in piles) <= h: hi = mid
        else: lo = mid + 1
    return lo
```
TC: O(n log(max pile)). SC: O(1).
### Minimum days to make M bouquets
Idea: on day d, a flower is usable if bloom <= d. Count groups of k adjacent usable flowers; need >= m groups.
```cpp
int minDays(vector<int>& bloom, int m, int k) {
    if ((long long)m * k > (long long)bloom.size()) return -1;
    int lo = *min_element(bloom.begin(), bloom.end()), hi = *max_element(bloom.begin(), bloom.end());
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2, run = 0, made = 0;
        for (int b : bloom) { if (b <= mid) { if (++run == k) { made++; run = 0; } } else run = 0; }
        if (made >= m) hi = mid; else lo = mid + 1;
    }
    return lo;
}
```
```py
def min_days(bloom, m, k):
    if m * k > len(bloom): return -1
    lo, hi = min(bloom), max(bloom)
    while lo < hi:
        mid = (lo + hi) // 2; run = made = 0
        for b in bloom:
            if b <= mid:
                run += 1
                if run == k: made += 1; run = 0
            else: run = 0
        if made >= m: hi = mid
        else: lo = mid + 1
    return lo
```
TC: O(n log(max - min)). SC: O(1).
### Capacity to Ship Packages Within D Days
Idea: capacity range = [max weight, sum of weights]. Simulate loading greedily to count the days needed.
```cpp
int shipWithinDays(vector<int>& w, int days) {
    int lo = *max_element(w.begin(), w.end()), hi = accumulate(w.begin(), w.end(), 0);
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2, need = 1, load = 0;
        for (int x : w) { if (load + x > mid) { need++; load = 0; } load += x; }
        if (need <= days) hi = mid; else lo = mid + 1;
    }
    return lo;
}
```
```py
def ship_within_days(w, days):
    lo, hi = max(w), sum(w)
    while lo < hi:
        mid = (lo + hi) // 2; need, load = 1, 0
        for x in w:
            if load + x > mid: need += 1; load = 0
            load += x
        if need <= days: hi = mid
        else: lo = mid + 1
    return lo
```
TC: O(n log(sum)). SC: O(1).
### Kth Missing Positive Number
Idea: up to index i, the count of missing numbers is a[i] - (i + 1). Binary search the first index where missing >= k. Answer = lo + k.
```cpp
int findKthPositive(vector<int>& a, int k) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] - (mid + 1) < k) lo = mid + 1; else hi = mid - 1;
    }
    return lo + k;
}
```
```py
def find_kth_positive(a, k):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] - (mid + 1) < k: lo = mid + 1
        else: hi = mid - 1
    return lo + k
```
TC: O(log n). SC: O(1).
### Painter's Partition / Split array - largest sum / Book Allocation
Idea: all three are the same problem: split the array into k contiguous parts minimising the largest part sum. Guess the limit `mid`; greedily count how many parts are needed.
```cpp
int partsNeeded(vector<int>& a, long long limit) {
    int parts = 1; long long cur = 0;
    for (int x : a) { if (cur + x > limit) { parts++; cur = 0; } cur += x; }
    return parts;
}
long long splitArray(vector<int>& a, int k) {
    if (k > (int)a.size()) return -1;                 // book allocation: not enough books
    long long lo = *max_element(a.begin(), a.end()), hi = accumulate(a.begin(), a.end(), 0LL);
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (partsNeeded(a, mid) <= k) hi = mid; else lo = mid + 1;
    }
    return lo;
}
```
```py
def split_array(a, k):
    if k > len(a): return -1
    def parts(limit):
        p, cur = 1, 0
        for x in a:
            if cur + x > limit: p += 1; cur = 0
            cur += x
        return p
    lo, hi = max(a), sum(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if parts(mid) <= k: hi = mid
        else: lo = mid + 1
    return lo
```
TC: O(n log(sum - max)). SC: O(1).
## Binary Search: FAQs
### Aggressive Cows
Idea: maximise the minimum distance. `can(d)`: place cows greedily, each at least d away from the previous one. If we can place all cows, try a bigger d.
```cpp
int aggressiveCows(vector<int>& stalls, int cows) {
    sort(stalls.begin(), stalls.end());
    int lo = 1, hi = stalls.back() - stalls[0], ans = 0;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2, placed = 1, last = stalls[0];
        for (int s : stalls) if (s - last >= mid) { placed++; last = s; }
        if (placed >= cows) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
}
```
```py
def aggressive_cows(stalls, cows):
    stalls.sort()
    lo, hi, ans = 1, stalls[-1] - stalls[0], 0
    while lo <= hi:
        mid = (lo + hi) // 2; placed, last = 1, stalls[0]
        for s in stalls:
            if s - last >= mid: placed += 1; last = s
        if placed >= cows: ans = mid; lo = mid + 1
        else: hi = mid - 1
    return ans
```
TC: O(n log n + n log(max dist)). SC: O(1).
### Book Allocation Problem
Solved above with `splitArray(pages, students)` - minimise the maximum pages given to a student.
### Find peak element
Idea: if a[mid] < a[mid+1] we are on a rising slope, so a peak exists to the right; otherwise at mid or to the left.
```cpp
int findPeakElement(vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < a[mid + 1]) lo = mid + 1; else hi = mid;
    }
    return lo;
}
```
```py
def find_peak_element(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < a[mid + 1]: lo = mid + 1
        else: hi = mid
    return lo
```
TC: O(log n). SC: O(1).
### Median of 2 sorted arrays
Idea: partition both arrays so that the left side has (n+m+1)/2 elements and every left element <= every right element. Binary search the cut in the smaller array.
@cells 1 3 | 8 9 :: cut1 in A.   B: 7 | 11 18 19.   valid when l1 <= r2 and l2 <= r1
```cpp
double findMedianSortedArrays(vector<int>& a, vector<int>& b) {
    if (a.size() > b.size()) return findMedianSortedArrays(b, a);
    int n = a.size(), m = b.size(), lo = 0, hi = n, half = (n + m + 1) / 2;
    while (lo <= hi) {
        int c1 = (lo + hi) / 2, c2 = half - c1;
        int l1 = c1 > 0 ? a[c1 - 1] : INT_MIN, r1 = c1 < n ? a[c1] : INT_MAX;
        int l2 = c2 > 0 ? b[c2 - 1] : INT_MIN, r2 = c2 < m ? b[c2] : INT_MAX;
        if (l1 <= r2 && l2 <= r1) {
            if ((n + m) % 2) return max(l1, l2);
            return (max(l1, l2) + min(r1, r2)) / 2.0;
        }
        if (l1 > r2) hi = c1 - 1; else lo = c1 + 1;
    }
    return 0;
}
```
```py
def find_median_sorted_arrays(a, b):
    if len(a) > len(b): a, b = b, a
    n, m = len(a), len(b); lo, hi, half = 0, n, (n + m + 1) // 2
    INF = float('inf')
    while lo <= hi:
        c1 = (lo + hi) // 2; c2 = half - c1
        l1 = a[c1 - 1] if c1 > 0 else -INF; r1 = a[c1] if c1 < n else INF
        l2 = b[c2 - 1] if c2 > 0 else -INF; r2 = b[c2] if c2 < m else INF
        if l1 <= r2 and l2 <= r1:
            if (n + m) % 2: return max(l1, l2)
            return (max(l1, l2) + min(r1, r2)) / 2
        if l1 > r2: hi = c1 - 1
        else: lo = c1 + 1
```
TC: O(log(min(n, m))). SC: O(1).
### Kth element of 2 sorted arrays
Idea: same partition trick with the left side holding exactly k elements.
```cpp
int kthElement(vector<int>& a, vector<int>& b, int k) {
    if (a.size() > b.size()) return kthElement(b, a, k);
    int n = a.size(), m = b.size(), lo = max(0, k - m), hi = min(k, n);
    while (lo <= hi) {
        int c1 = (lo + hi) / 2, c2 = k - c1;
        int l1 = c1 > 0 ? a[c1 - 1] : INT_MIN, r1 = c1 < n ? a[c1] : INT_MAX;
        int l2 = c2 > 0 ? b[c2 - 1] : INT_MIN, r2 = c2 < m ? b[c2] : INT_MAX;
        if (l1 <= r2 && l2 <= r1) return max(l1, l2);
        if (l1 > r2) hi = c1 - 1; else lo = c1 + 1;
    }
    return -1;
}
```
```py
def kth_element(a, b, k):
    if len(a) > len(b): a, b = b, a
    n, m = len(a), len(b); lo, hi = max(0, k - m), min(k, n); INF = float('inf')
    while lo <= hi:
        c1 = (lo + hi) // 2; c2 = k - c1
        l1 = a[c1 - 1] if c1 > 0 else -INF; r1 = a[c1] if c1 < n else INF
        l2 = b[c2 - 1] if c2 > 0 else -INF; r2 = b[c2] if c2 < m else INF
        if l1 <= r2 and l2 <= r1: return max(l1, l2)
        if l1 > r2: hi = c1 - 1
        else: lo = c1 + 1
    return -1
```
TC: O(log(min(n, m))). SC: O(1).
### Minimize Max Distance to Gas Station
Idea: binary search on a real number d. To make every gap <= d, a gap of length g needs ceil(g / d) - 1 new stations. If total needed <= k, d is possible.
```cpp
double minimiseMaxDistance(vector<int>& a, int k) {
    double lo = 0, hi = 0;
    for (int i = 1; i < (int)a.size(); i++) hi = max(hi, (double)a[i] - a[i - 1]);
    for (int it = 0; it < 60; it++) {
        double mid = (lo + hi) / 2; long long need = 0;
        for (int i = 1; i < (int)a.size(); i++) need += (long long)ceil((a[i] - a[i - 1]) / mid) - 1;
        if (need <= k) hi = mid; else lo = mid;
    }
    return hi;
}
```
```py
import math
def minimise_max_distance(a, k):
    lo, hi = 0.0, max(a[i] - a[i - 1] for i in range(1, len(a)))
    for _ in range(60):
        mid = (lo + hi) / 2
        need = sum(math.ceil((a[i] - a[i - 1]) / mid) - 1 for i in range(1, len(a)))
        if need <= k: hi = mid
        else: lo = mid
    return hi
```
TC: O(n x 60) iterations for precision. SC: O(1).
### Split array - largest sum
Solved above (`splitArray`).
## Binary Search: 2D Arrays
### Find row with maximum 1's
Idea: each row is sorted, so the count of ones = m - lowerBound(row, 1).
```cpp
int rowWithMax1s(vector<vector<int>>& mat) {
    int best = 0, idx = -1, m = mat[0].size();
    for (int i = 0; i < (int)mat.size(); i++) {
        int ones = m - (lower_bound(mat[i].begin(), mat[i].end(), 1) - mat[i].begin());
        if (ones > best) { best = ones; idx = i; }
    }
    return idx;
}
```
```py
import bisect
def row_with_max_1s(mat):
    best, idx = 0, -1
    for i, row in enumerate(mat):
        ones = len(row) - bisect.bisect_left(row, 1)
        if ones > best: best, idx = ones, i
    return idx
```
TC: O(n log m). SC: O(1).
### Search in a 2D Matrix (rows sorted, first of row > last of previous)
Idea: treat the matrix as one sorted 1D array of size n x m. Index k maps to row k / m, column k % m.
```cpp
bool searchMatrix(vector<vector<int>>& mat, int x) {
    int n = mat.size(), m = mat[0].size(), lo = 0, hi = n * m - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2, v = mat[mid / m][mid % m];
        if (v == x) return true;
        if (v < x) lo = mid + 1; else hi = mid - 1;
    }
    return false;
}
```
```py
def search_matrix(mat, x):
    n, m = len(mat), len(mat[0]); lo, hi = 0, n * m - 1
    while lo <= hi:
        mid = (lo + hi) // 2; v = mat[mid // m][mid % m]
        if v == x: return True
        if v < x: lo = mid + 1
        else: hi = mid - 1
    return False
```
TC: O(log(n x m)). SC: O(1).
### Search in 2D matrix - II (rows and columns sorted)
Idea: start at the top-right corner. If the value is bigger than x move left (whole column is bigger); if smaller move down. Each step removes a row or a column.
@grid 1 4 7 11* / 2 5 8 12 / 3 6 9 16 :: start at top-right: left if too big, down if too small
```cpp
bool searchMatrixII(vector<vector<int>>& mat, int x) {
    int r = 0, c = (int)mat[0].size() - 1;
    while (r < (int)mat.size() && c >= 0) {
        if (mat[r][c] == x) return true;
        if (mat[r][c] > x) c--; else r++;
    }
    return false;
}
```
```py
def search_matrix_ii(mat, x):
    r, c = 0, len(mat[0]) - 1
    while r < len(mat) and c >= 0:
        if mat[r][c] == x: return True
        if mat[r][c] > x: c -= 1
        else: r += 1
    return False
```
TC: O(n + m). SC: O(1).
### Find Peak Element - II
Idea: binary search on columns. In the middle column take the row of the maximum; if its left neighbour is bigger go left, if the right is bigger go right, else it is a peak.
```cpp
vector<int> findPeakGrid(vector<vector<int>>& mat) {
    int n = mat.size(), m = mat[0].size(), lo = 0, hi = m - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2, r = 0;
        for (int i = 1; i < n; i++) if (mat[i][mid] > mat[r][mid]) r = i;
        int left = mid > 0 ? mat[r][mid - 1] : -1, right = mid < m - 1 ? mat[r][mid + 1] : -1;
        if (mat[r][mid] > left && mat[r][mid] > right) return {r, mid};
        if (left > mat[r][mid]) hi = mid - 1; else lo = mid + 1;
    }
    return {-1, -1};
}
```
```py
def find_peak_grid(mat):
    n, m = len(mat), len(mat[0]); lo, hi = 0, m - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        r = max(range(n), key=lambda i: mat[i][mid])
        left = mat[r][mid - 1] if mid > 0 else -1
        right = mat[r][mid + 1] if mid < m - 1 else -1
        if mat[r][mid] > left and mat[r][mid] > right: return [r, mid]
        if left > mat[r][mid]: hi = mid - 1
        else: lo = mid + 1
    return [-1, -1]
```
TC: O(n log m). SC: O(1).
### Matrix Median (rows sorted, odd number of elements)
Idea: binary search on the value. The median is the smallest value v such that count(elements <= v) > (n x m) / 2. Count with upper_bound in each row.
```cpp
int matrixMedian(vector<vector<int>>& mat) {
    int n = mat.size(), m = mat[0].size(), lo = INT_MAX, hi = INT_MIN;
    for (auto& r : mat) { lo = min(lo, r[0]); hi = max(hi, r[m - 1]); }
    int need = (n * m) / 2;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2, cnt = 0;
        for (auto& r : mat) cnt += upper_bound(r.begin(), r.end(), mid) - r.begin();
        if (cnt > need) hi = mid; else lo = mid + 1;
    }
    return lo;
}
```
```py
def matrix_median(mat):
    n, m = len(mat), len(mat[0])
    lo, hi = min(r[0] for r in mat), max(r[-1] for r in mat); need = (n * m) // 2
    while lo < hi:
        mid = (lo + hi) // 2
        if sum(bisect.bisect_right(r, mid) for r in mat) > need: hi = mid
        else: lo = mid + 1
    return lo
```
TC: O(log(max - min) x n log m). SC: O(1).
## Strings (Basic and Medium)
### Remove Outermost Parentheses
Idea: keep a depth counter. A '(' is outermost when depth is 0 before it; a ')' is outermost when depth is 0 after it. Skip those.
```cpp
string removeOuterParentheses(string s) {
    string ans; int depth = 0;
    for (char c : s) {
        if (c == '(') { if (depth > 0) ans += c; depth++; }
        else { depth--; if (depth > 0) ans += c; }
    }
    return ans;
}
```
```py
def remove_outer_parentheses(s):
    ans, depth = [], 0
    for c in s:
        if c == '(':
            if depth > 0: ans.append(c)
            depth += 1
        else:
            depth -= 1
            if depth > 0: ans.append(c)
    return "".join(ans)
```
TC: O(n). SC: O(n) for the answer.
### Maximum Nesting Depth of the Parentheses
```cpp
int maxDepth(string s) {
    int depth = 0, best = 0;
    for (char c : s) { if (c == '(') best = max(best, ++depth); else if (c == ')') depth--; }
    return best;
}
```
```py
def max_depth(s):
    depth = best = 0
    for c in s:
        if c == '(': depth += 1; best = max(best, depth)
        elif c == ')': depth -= 1
    return best
```
TC: O(n). SC: O(1).
### Roman to Integer
Idea: add each symbol's value; if a smaller value stands before a bigger one (IV, IX, XL...) subtract it instead.
```cpp
int romanToInt(string s) {
    unordered_map<char,int> v = {{'I',1},{'V',5},{'X',10},{'L',50},{'C',100},{'D',500},{'M',1000}};
    int ans = 0;
    for (int i = 0; i < (int)s.size(); i++) {
        if (i + 1 < (int)s.size() && v[s[i]] < v[s[i + 1]]) ans -= v[s[i]];
        else ans += v[s[i]];
    }
    return ans;
}
```
```py
def roman_to_int(s):
    v = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    ans = 0
    for i, c in enumerate(s):
        if i + 1 < len(s) and v[c] < v[s[i + 1]]: ans -= v[c]
        else: ans += v[c]
    return ans
```
TC: O(n). SC: O(1).
### String to Integer (atoi)
Steps: skip leading spaces -> read optional sign -> read digits while clamping to the 32-bit range -> stop at the first non-digit.
```cpp
int myAtoi(string s) {
    int i = 0, n = s.size(), sign = 1; long long num = 0;
    while (i < n && s[i] == ' ') i++;
    if (i < n && (s[i] == '+' || s[i] == '-')) sign = (s[i++] == '-') ? -1 : 1;
    while (i < n && isdigit(s[i])) {
        num = num * 10 + (s[i++] - '0');
        if (sign * num > INT_MAX) return INT_MAX;
        if (sign * num < INT_MIN) return INT_MIN;
    }
    return (int)(sign * num);
}
```
```py
def my_atoi(s):
    i, n, sign, num = 0, len(s), 1, 0
    while i < n and s[i] == ' ': i += 1
    if i < n and s[i] in '+-':
        sign = -1 if s[i] == '-' else 1; i += 1
    while i < n and s[i].isdigit():
        num = num * 10 + int(s[i]); i += 1
    return max(-2**31, min(2**31 - 1, sign * num))
```
TC: O(n). SC: O(1).
### Count Number of Substrings (with exactly k distinct characters)
Idea: exactly(k) = atMost(k) - atMost(k - 1). atMost uses a sliding window; each right end adds (r - l + 1) substrings.
```cpp
long long atMostK(string& s, int k) {
    if (k < 0) return 0;
    int f[26] = {0}, distinct = 0, l = 0; long long cnt = 0;
    for (int r = 0; r < (int)s.size(); r++) {
        if (f[s[r] - 'a']++ == 0) distinct++;
        while (distinct > k) if (--f[s[l++] - 'a'] == 0) distinct--;
        cnt += r - l + 1;
    }
    return cnt;
}
long long countSubstrings(string s, int k) { return atMostK(s, k) - atMostK(s, k - 1); }
```
```py
def count_substrings(s, k):
    def at_most(k):
        if k < 0: return 0
        f, l, cnt = {}, 0, 0
        for r, c in enumerate(s):
            f[c] = f.get(c, 0) + 1
            while len(f) > k:
                f[s[l]] -= 1
                if f[s[l]] == 0: del f[s[l]]
                l += 1
            cnt += r - l + 1
        return cnt
    return at_most(k) - at_most(k - 1)
```
TC: O(n). SC: O(26).
### Longest Palindromic Substring
Idea: **expand around centre**. Every palindrome has a centre (a character or a gap between two). Try all 2n - 1 centres and expand while both ends match.
```cpp
string longestPalindrome(string s) {
    int n = s.size(), start = 0, best = 0;
    auto expand = [&](int l, int r) {
        while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
        if (r - l - 1 > best) { best = r - l - 1; start = l + 1; }
    };
    for (int i = 0; i < n; i++) { expand(i, i); expand(i, i + 1); }
    return s.substr(start, best);
}
```
```py
def longest_palindrome(s):
    start = best = 0
    for i in range(len(s)):
        for l, r in ((i, i), (i, i + 1)):
            while l >= 0 and r < len(s) and s[l] == s[r]: l -= 1; r += 1
            if r - l - 1 > best: best, start = r - l - 1, l + 1
    return s[start:start + best]
```
TC: O(n^2). SC: O(1).
### Sum of Beauty of All Substrings
Idea: beauty = max frequency - min frequency (non-zero). Fix the start i, extend the end j and maintain a 26-size frequency array.
```cpp
int beautySum(string s) {
    int n = s.size(), ans = 0;
    for (int i = 0; i < n; i++) {
        int f[26] = {0};
        for (int j = i; j < n; j++) {
            f[s[j] - 'a']++;
            int mx = 0, mn = INT_MAX;
            for (int k = 0; k < 26; k++) if (f[k]) { mx = max(mx, f[k]); mn = min(mn, f[k]); }
            ans += mx - mn;
        }
    }
    return ans;
}
```
```py
def beauty_sum(s):
    n, ans = len(s), 0
    for i in range(n):
        f = [0] * 26
        for j in range(i, n):
            f[ord(s[j]) - 97] += 1
            vals = [x for x in f if x]
            ans += max(vals) - min(vals)
    return ans
```
TC: O(26 n^2). SC: O(26).
## Recursion: Implementation Problems
### Pow(x, n)
Idea: **binary exponentiation**. x^n = (x^2)^(n/2) when n is even, x * x^(n-1) when odd. The exponent halves each step.
```cpp
double myPow(double x, long long n) {
    if (n < 0) { x = 1 / x; n = -n; }
    double res = 1;
    while (n > 0) {
        if (n & 1) res *= x;
        x *= x; n >>= 1;
    }
    return res;
}
```
```py
def my_pow(x, n):
    if n < 0: x, n = 1 / x, -n
    res = 1.0
    while n > 0:
        if n & 1: res *= x
        x *= x; n >>= 1
    return res
```
TC: O(log n). SC: O(1).
### Generate Parentheses
Idea: build the string one char at a time. We may add '(' if open < n, and ')' only if close < open (so it stays valid).
@tree start( open1( open2(close: valid 1) , close1(open2: valid 2) ) ) :: Decision tree for n = 2: add "(" if open < n, add ")" if close < open
```cpp
void genPar(int n, int open, int close, string cur, vector<string>& ans) {
    if ((int)cur.size() == 2 * n) { ans.push_back(cur); return; }
    if (open < n) genPar(n, open + 1, close, cur + '(', ans);
    if (close < open) genPar(n, open, close + 1, cur + ')', ans);
}
vector<string> generateParenthesis(int n) { vector<string> ans; genPar(n, 0, 0, "", ans); return ans; }
```
```py
def generate_parenthesis(n):
    ans = []
    def go(cur, open_, close):
        if len(cur) == 2 * n: ans.append(cur); return
        if open_ < n: go(cur + '(', open_ + 1, close)
        if close < open_: go(cur + ')', open_, close + 1)
    go("", 0, 0)
    return ans
```
TC: O(4^n / sqrt(n)) - the Catalan number of valid strings. SC: O(n) recursion depth.
### Power Set
Idea: for every element there are 2 choices: **take** or **not take**. That gives 2^n subsets.
@tree { }({1}({1 2},{1}),{ }({2},{ })) :: take / not take for [1, 2] gives 4 subsets
```cpp
void subsetsRec(vector<int>& a, int i, vector<int>& cur, vector<vector<int>>& ans) {
    if (i == (int)a.size()) { ans.push_back(cur); return; }
    cur.push_back(a[i]); subsetsRec(a, i + 1, cur, ans);   // take
    cur.pop_back();      subsetsRec(a, i + 1, cur, ans);   // not take
}
vector<vector<int>> powerSet(vector<int>& a) { vector<vector<int>> ans; vector<int> cur; subsetsRec(a, 0, cur, ans); return ans; }
```
```py
def power_set(a):
    ans, cur = [], []
    def go(i):
        if i == len(a): ans.append(cur[:]); return
        cur.append(a[i]); go(i + 1)
        cur.pop(); go(i + 1)
    go(0)
    return ans
```
TC: O(2^n x n). SC: O(n) depth.
### Count Good Numbers
Idea: even positions (0-indexed) take 5 choices (0,2,4,6,8), odd positions take 4 (2,3,5,7). Answer = 5^(ceil(n/2)) x 4^(floor(n/2)) mod 1e9+7 using fast power.
```cpp
const long long MOD = 1e9 + 7;
long long modPow(long long b, long long e) {
    long long r = 1; b %= MOD;
    while (e > 0) { if (e & 1) r = r * b % MOD; b = b * b % MOD; e >>= 1; }
    return r;
}
int countGoodNumbers(long long n) { return modPow(5, (n + 1) / 2) * modPow(4, n / 2) % MOD; }
```
```py
def count_good_numbers(n):
    MOD = 10**9 + 7
    return pow(5, (n + 1) // 2, MOD) * pow(4, n // 2, MOD) % MOD
```
TC: O(log n). SC: O(1).
### Reverse a Stack
Idea: pop the top, reverse the rest recursively, then insert the popped element at the **bottom** (another recursion).
```cpp
void insertAtBottom(stack<int>& st, int x) {
    if (st.empty()) { st.push(x); return; }
    int t = st.top(); st.pop();
    insertAtBottom(st, x);
    st.push(t);
}
void reverseStack(stack<int>& st) {
    if (st.empty()) return;
    int t = st.top(); st.pop();
    reverseStack(st);
    insertAtBottom(st, t);
}
```
```py
def insert_at_bottom(st, x):
    if not st: st.append(x); return
    t = st.pop()
    insert_at_bottom(st, x)
    st.append(t)
def reverse_stack(st):
    if not st: return
    t = st.pop()
    reverse_stack(st)
    insert_at_bottom(st, t)
```
TC: O(n^2). SC: O(n) recursion.
## Recursion: Subsequence Pattern Problems
### Learn All Patterns of Subsequences (Theory)
- A **subsequence** keeps the order but may skip elements (a **subarray** must be contiguous). n elements -> 2^n subsequences.
- Pattern 1 - print all: at index i, take or not take; at i == n print.
- Pattern 2 - print any one: make the function return true once found and stop exploring.
- Pattern 3 - count: return 1 at a valid base case, 0 otherwise, and add left + right.
### Check if there exists a subsequence with sum K
```cpp
bool existsSubseq(vector<int>& a, int i, int k) {
    if (k == 0) return true;
    if (i == (int)a.size() || k < 0) return false;
    return existsSubseq(a, i + 1, k - a[i]) || existsSubseq(a, i + 1, k);
}
```
```py
def exists_subseq(a, i, k):
    if k == 0: return True
    if i == len(a) or k < 0: return False
    return exists_subseq(a, i + 1, k - a[i]) or exists_subseq(a, i + 1, k)
```
TC: O(2^n). SC: O(n). (Positive numbers assumed for the k < 0 pruning.)
### Count all subsequences with sum K
```cpp
int countSubseq(vector<int>& a, int i, int k) {
    if (i == (int)a.size()) return k == 0;
    if (k < 0) return 0;
    return countSubseq(a, i + 1, k - a[i]) + countSubseq(a, i + 1, k);
}
```
```py
def count_subseq(a, i, k):
    if i == len(a): return 1 if k == 0 else 0
    if k < 0: return 0
    return count_subseq(a, i + 1, k - a[i]) + count_subseq(a, i + 1, k)
```
TC: O(2^n). SC: O(n).
### Generate Binary Strings Without Consecutive 1s
Idea: we may always append '0'; we may append '1' only if the previous char is not '1'.
```cpp
void genBinary(int n, string cur, vector<string>& ans) {
    if ((int)cur.size() == n) { ans.push_back(cur); return; }
    genBinary(n, cur + '0', ans);
    if (cur.empty() || cur.back() != '1') genBinary(n, cur + '1', ans);
}
```
```py
def gen_binary(n):
    ans = []
    def go(cur):
        if len(cur) == n: ans.append(cur); return
        go(cur + '0')
        if not cur or cur[-1] != '1': go(cur + '1')
    go("")
    return ans
```
TC: O(2^n). SC: O(n).
## Recursion: FAQs (Medium)
### Combination Sum (reuse allowed)
Idea: at index i either take a[i] and **stay** at i (it can be reused) or move to i + 1.
```cpp
void combSum(vector<int>& a, int i, int target, vector<int>& cur, vector<vector<int>>& ans) {
    if (target == 0) { ans.push_back(cur); return; }
    if (i == (int)a.size() || target < 0) return;
    cur.push_back(a[i]); combSum(a, i, target - a[i], cur, ans); cur.pop_back();
    combSum(a, i + 1, target, cur, ans);
}
```
```py
def combination_sum(a, target):
    ans, cur = [], []
    def go(i, t):
        if t == 0: ans.append(cur[:]); return
        if i == len(a) or t < 0: return
        cur.append(a[i]); go(i, t - a[i]); cur.pop()
        go(i + 1, t)
    go(0, target)
    return ans
```
TC: O(2^t x k) where t = target / min element. SC: O(t) depth.
### Combination Sum II (each number once, no duplicate combinations)
Idea: sort; in a loop pick each candidate for the current position, skipping equal neighbours (`j > i and a[j] == a[j-1]`).
```cpp
void combSum2(vector<int>& a, int i, int target, vector<int>& cur, vector<vector<int>>& ans) {
    if (target == 0) { ans.push_back(cur); return; }
    for (int j = i; j < (int)a.size(); j++) {
        if (j > i && a[j] == a[j - 1]) continue;
        if (a[j] > target) break;
        cur.push_back(a[j]); combSum2(a, j + 1, target - a[j], cur, ans); cur.pop_back();
    }
}
// call: sort(a.begin(), a.end()); combSum2(a, 0, target, cur, ans);
```
```py
def combination_sum2(a, target):
    a.sort(); ans, cur = [], []
    def go(i, t):
        if t == 0: ans.append(cur[:]); return
        for j in range(i, len(a)):
            if j > i and a[j] == a[j - 1]: continue
            if a[j] > t: break
            cur.append(a[j]); go(j + 1, t - a[j]); cur.pop()
    go(0, target)
    return ans
```
TC: O(2^n x k). SC: O(n).
### Subsets I (all subset sums)
```cpp
void subsetSums(vector<int>& a, int i, int sum, vector<int>& ans) {
    if (i == (int)a.size()) { ans.push_back(sum); return; }
    subsetSums(a, i + 1, sum + a[i], ans);
    subsetSums(a, i + 1, sum, ans);
}
```
```py
def subset_sums(a):
    ans = []
    def go(i, s):
        if i == len(a): ans.append(s); return
        go(i + 1, s + a[i]); go(i + 1, s)
    go(0, 0)
    return sorted(ans)
```
TC: O(2^n). SC: O(n) depth.
### Subsets II (array has duplicates, unique subsets)
```cpp
void subsetsDup(vector<int>& a, int i, vector<int>& cur, vector<vector<int>>& ans) {
    ans.push_back(cur);
    for (int j = i; j < (int)a.size(); j++) {
        if (j > i && a[j] == a[j - 1]) continue;
        cur.push_back(a[j]); subsetsDup(a, j + 1, cur, ans); cur.pop_back();
    }
}
// call after sorting a
```
```py
def subsets_with_dup(a):
    a.sort(); ans, cur = [], []
    def go(i):
        ans.append(cur[:])
        for j in range(i, len(a)):
            if j > i and a[j] == a[j - 1]: continue
            cur.append(a[j]); go(j + 1); cur.pop()
    go(0)
    return ans
```
TC: O(2^n x n). SC: O(n).
### Combination Sum III (k numbers from 1..9 that sum to n)
```cpp
void combSum3(int k, int n, int start, vector<int>& cur, vector<vector<int>>& ans) {
    if (k == 0) { if (n == 0) ans.push_back(cur); return; }
    for (int d = start; d <= 9 && d <= n; d++) {
        cur.push_back(d); combSum3(k - 1, n - d, d + 1, cur, ans); cur.pop_back();
    }
}
```
```py
def combination_sum3(k, n):
    ans, cur = [], []
    def go(k, n, start):
        if k == 0:
            if n == 0: ans.append(cur[:])
            return
        for d in range(start, min(9, n) + 1):
            cur.append(d); go(k - 1, n - d, d + 1); cur.pop()
    go(k, n, 1)
    return ans
```
TC: O(C(9, k) x k). SC: O(k).
## Recursion: Hard
### Letter Combinations of a Phone Number
Idea: for digit i try each of its letters, then recurse on digit i + 1.
```cpp
vector<string> letterCombinations(string digits) {
    if (digits.empty()) return {};
    vector<string> mp = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"}, ans;
    string cur;
    function<void(int)> go = [&](int i) {
        if (i == (int)digits.size()) { ans.push_back(cur); return; }
        for (char c : mp[digits[i] - '0']) { cur.push_back(c); go(i + 1); cur.pop_back(); }
    };
    go(0);
    return ans;
}
```
```py
def letter_combinations(digits):
    if not digits: return []
    mp = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"]
    ans = []
    def go(i, cur):
        if i == len(digits): ans.append(cur); return
        for c in mp[int(digits[i])]: go(i + 1, cur + c)
    go(0, "")
    return ans
```
TC: O(4^n x n). SC: O(n).
## Recursion: FAQs (Hard) - Backtracking
Rule: backtracking = **choose -> explore -> un-choose**. Try a choice, recurse; if it fails, undo it and try the next.
@flow (solve(state)) | <state is complete? ~ record answer, return> | for each choice | <choice is safe? ~ skip choice> | make choice, recurse | ^undo choice (backtrack) :: Backtracking template
### Palindrome partitioning
Idea: at position i try every end j such that s[i..j] is a palindrome, cut there, recurse from j + 1.
```cpp
bool isPal(string& s, int l, int r) { while (l < r) if (s[l++] != s[r--]) return false; return true; }
void partitionRec(string& s, int i, vector<string>& cur, vector<vector<string>>& ans) {
    if (i == (int)s.size()) { ans.push_back(cur); return; }
    for (int j = i; j < (int)s.size(); j++)
        if (isPal(s, i, j)) { cur.push_back(s.substr(i, j - i + 1)); partitionRec(s, j + 1, cur, ans); cur.pop_back(); }
}
```
```py
def partition(s):
    ans, cur = [], []
    def go(i):
        if i == len(s): ans.append(cur[:]); return
        for j in range(i, len(s)):
            piece = s[i:j + 1]
            if piece == piece[::-1]:
                cur.append(piece); go(j + 1); cur.pop()
    go(0)
    return ans
```
TC: O(2^n x n). SC: O(n).
### Word Search
Idea: DFS from every cell matching the word letter by letter; mark the cell as visited while it is on the current path and restore it afterwards.
```cpp
bool wsDfs(vector<vector<char>>& b, string& w, int i, int j, int k) {
    if (k == (int)w.size()) return true;
    if (i < 0 || j < 0 || i >= (int)b.size() || j >= (int)b[0].size() || b[i][j] != w[k]) return false;
    char c = b[i][j]; b[i][j] = '#';
    bool ok = wsDfs(b, w, i + 1, j, k + 1) || wsDfs(b, w, i - 1, j, k + 1) || wsDfs(b, w, i, j + 1, k + 1) || wsDfs(b, w, i, j - 1, k + 1);
    b[i][j] = c;
    return ok;
}
bool exist(vector<vector<char>>& b, string w) {
    for (int i = 0; i < (int)b.size(); i++) for (int j = 0; j < (int)b[0].size(); j++) if (wsDfs(b, w, i, j, 0)) return true;
    return false;
}
```
```py
def exist(b, w):
    n, m = len(b), len(b[0])
    def dfs(i, j, k):
        if k == len(w): return True
        if i < 0 or j < 0 or i >= n or j >= m or b[i][j] != w[k]: return False
        c, b[i][j] = b[i][j], '#'
        ok = dfs(i + 1, j, k + 1) or dfs(i - 1, j, k + 1) or dfs(i, j + 1, k + 1) or dfs(i, j - 1, k + 1)
        b[i][j] = c
        return ok
    return any(dfs(i, j, 0) for i in range(n) for j in range(m))
```
TC: O(n x m x 3^L), L = word length (3 directions after the first step). SC: O(L).
### N Queen
Idea: place one queen per column. A row is safe if no queen is in the same row or on either diagonal. Use hash arrays: row[r], lowerDiag[r + c], upperDiag[n - 1 + c - r] to check in O(1).
@grid . Q* . . / . . . Q* / Q* . . . / . . Q* . :: One solution of 4 Queens
```cpp
void nQueens(int col, int n, vector<string>& board, vector<int>& row, vector<int>& d1, vector<int>& d2, vector<vector<string>>& ans) {
    if (col == n) { ans.push_back(board); return; }
    for (int r = 0; r < n; r++) {
        if (row[r] || d1[r + col] || d2[n - 1 + col - r]) continue;
        board[r][col] = 'Q'; row[r] = d1[r + col] = d2[n - 1 + col - r] = 1;
        nQueens(col + 1, n, board, row, d1, d2, ans);
        board[r][col] = '.'; row[r] = d1[r + col] = d2[n - 1 + col - r] = 0;
    }
}
vector<vector<string>> solveNQueens(int n) {
    vector<vector<string>> ans; vector<string> board(n, string(n, '.'));
    vector<int> row(n, 0), d1(2 * n, 0), d2(2 * n, 0);
    nQueens(0, n, board, row, d1, d2, ans);
    return ans;
}
```
```py
def solve_n_queens(n):
    ans, board = [], [['.'] * n for _ in range(n)]
    row, d1, d2 = [0] * n, [0] * (2 * n), [0] * (2 * n)
    def go(col):
        if col == n: ans.append(["".join(r) for r in board]); return
        for r in range(n):
            if row[r] or d1[r + col] or d2[n - 1 + col - r]: continue
            board[r][col] = 'Q'; row[r] = d1[r + col] = d2[n - 1 + col - r] = 1
            go(col + 1)
            board[r][col] = '.'; row[r] = d1[r + col] = d2[n - 1 + col - r] = 0
    go(0)
    return ans
```
TC: O(n!). SC: O(n).
### Rat in a Maze
Idea: DFS from (0,0) to (n-1,n-1), trying moves in the order D, L, R, U (gives sorted paths); mark visited on the way in, unmark on the way back.
```cpp
void ratDfs(vector<vector<int>>& g, int i, int j, string path, vector<string>& ans) {
    int n = g.size();
    if (i < 0 || j < 0 || i >= n || j >= n || g[i][j] != 1) return;
    if (i == n - 1 && j == n - 1) { ans.push_back(path); return; }
    g[i][j] = 0;
    ratDfs(g, i + 1, j, path + 'D', ans); ratDfs(g, i, j - 1, path + 'L', ans);
    ratDfs(g, i, j + 1, path + 'R', ans); ratDfs(g, i - 1, j, path + 'U', ans);
    g[i][j] = 1;
}
```
```py
def rat_in_maze(g):
    n, ans = len(g), []
    def dfs(i, j, path):
        if i < 0 or j < 0 or i >= n or j >= n or g[i][j] != 1: return
        if i == n - 1 and j == n - 1: ans.append(path); return
        g[i][j] = 0
        dfs(i + 1, j, path + 'D'); dfs(i, j - 1, path + 'L')
        dfs(i, j + 1, path + 'R'); dfs(i - 1, j, path + 'U')
        g[i][j] = 1
    dfs(0, 0, "")
    return ans
```
TC: O(4^(n^2)) worst. SC: O(n^2) path depth.
### M Coloring Problem
Idea: colour nodes one by one; a colour is safe if no neighbour already has it.
```cpp
bool colorRec(int node, int m, vector<vector<int>>& adj, vector<int>& color) {
    int n = adj.size();
    if (node == n) return true;
    for (int c = 1; c <= m; c++) {
        bool ok = true;
        for (int nb : adj[node]) if (color[nb] == c) { ok = false; break; }
        if (!ok) continue;
        color[node] = c;
        if (colorRec(node + 1, m, adj, color)) return true;
        color[node] = 0;
    }
    return false;
}
```
```py
def graph_coloring(adj, m):
    n = len(adj); color = [0] * n
    def go(node):
        if node == n: return True
        for c in range(1, m + 1):
            if any(color[nb] == c for nb in adj[node]): continue
            color[node] = c
            if go(node + 1): return True
            color[node] = 0
        return False
    return go(0)
```
TC: O(m^n). SC: O(n).
### Sudoku Solver
Idea: find an empty cell, try digits 1-9 that do not clash with the row, column and 3x3 box; recurse; undo on failure.
```cpp
bool validPut(vector<vector<char>>& b, int r, int c, char d) {
    for (int i = 0; i < 9; i++) {
        if (b[r][i] == d || b[i][c] == d) return false;
        if (b[3 * (r / 3) + i / 3][3 * (c / 3) + i % 3] == d) return false;
    }
    return true;
}
bool solveSudoku(vector<vector<char>>& b) {
    for (int r = 0; r < 9; r++) for (int c = 0; c < 9; c++) if (b[r][c] == '.') {
        for (char d = '1'; d <= '9'; d++) if (validPut(b, r, c, d)) {
            b[r][c] = d;
            if (solveSudoku(b)) return true;
            b[r][c] = '.';
        }
        return false;
    }
    return true;
}
```
```py
def solve_sudoku(b):
    def valid(r, c, d):
        for i in range(9):
            if b[r][i] == d or b[i][c] == d: return False
            if b[3 * (r // 3) + i // 3][3 * (c // 3) + i % 3] == d: return False
        return True
    for r in range(9):
        for c in range(9):
            if b[r][c] == '.':
                for d in "123456789":
                    if valid(r, c, d):
                        b[r][c] = d
                        if solve_sudoku(b): return True
                        b[r][c] = '.'
                return False
    return True
```
TC: O(9^(empty cells)) worst. SC: O(81) depth.
### Expression Add Operators
Idea: split the digits into numbers and put +, - or x between them. Track the running value and the **last operand** so multiplication can undo it: new = value - last + last x cur.
```cpp
void addOps(string& num, long long target, int pos, long long val, long long last, string expr, vector<string>& ans) {
    if (pos == (int)num.size()) { if (val == target) ans.push_back(expr); return; }
    for (int i = pos; i < (int)num.size(); i++) {
        if (i > pos && num[pos] == '0') break;              // no leading zeros
        string part = num.substr(pos, i - pos + 1); long long cur = stoll(part);
        if (pos == 0) addOps(num, target, i + 1, cur, cur, part, ans);
        else {
            addOps(num, target, i + 1, val + cur, cur, expr + "+" + part, ans);
            addOps(num, target, i + 1, val - cur, -cur, expr + "-" + part, ans);
            addOps(num, target, i + 1, val - last + last * cur, last * cur, expr + "*" + part, ans);
        }
    }
}
```
```py
def add_operators(num, target):
    ans = []
    def go(pos, val, last, expr):
        if pos == len(num):
            if val == target: ans.append(expr)
            return
        for i in range(pos, len(num)):
            if i > pos and num[pos] == '0': break
            part = num[pos:i + 1]; cur = int(part)
            if pos == 0: go(i + 1, cur, cur, part)
            else:
                go(i + 1, val + cur, cur, expr + "+" + part)
                go(i + 1, val - cur, -cur, expr + "-" + part)
                go(i + 1, val - last + last * cur, last * cur, expr + "*" + part)
    go(0, 0, 0, "")
    return ans
```
TC: O(4^n). SC: O(n).
