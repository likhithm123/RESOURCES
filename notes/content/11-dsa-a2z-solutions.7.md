## Dynamic Programming: Introduction
### Introduction to DP
- **Dynamic Programming** = recursion + remembering. Use it when a problem has (1) **overlapping sub-problems** (the same call happens again and again) and (2) **optimal substructure** (the best answer is built from best answers of smaller parts).
- Clue words: "count the ways", "minimum / maximum", "is it possible", with choices at each step.
- The 3 steps: (1) define the **state** - what indices/values identify a sub-problem, e.g. f(i) or f(i, j). (2) write the **recurrence** - try all choices at this state. (3) add the base case.
- Then convert: **Memoization** (top-down: recursion + dp array) -> **Tabulation** (bottom-up loops) -> **Space optimisation** (keep only the previous row/values).
@flow (Write recursion: state + choices + base) | Memoization: store f(state) in dp | Tabulation: fill dp from base case upward | (Space optimise: keep only what the next step needs) :: The DP conversion pipeline
@tree f(5)(f(4)(f(3),f(2)),f(3)(f(2),f(1))) :: f(3) and f(2) repeat: memoization computes each once, O(2^n) becomes O(n)
```cpp
// Fibonacci in the three styles
int fibMemo(int n, vector<int>& dp) { if (n <= 1) return n; if (dp[n] != -1) return dp[n]; return dp[n] = fibMemo(n - 1, dp) + fibMemo(n - 2, dp); }
int fibTab(int n) { vector<int> dp(n + 2); dp[0] = 0; dp[1] = 1; for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2]; return dp[n]; }
int fibOpt(int n) { int a = 0, b = 1; for (int i = 0; i < n; i++) { int c = a + b; a = b; b = c; } return a; }
```
```py
from functools import lru_cache
@lru_cache(None)
def fib_memo(n): return n if n <= 1 else fib_memo(n - 1) + fib_memo(n - 2)
def fib_tab(n):
    dp = [0, 1] + [0] * n
    for i in range(2, n + 1): dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]
```
TC: O(n) for all three. SC: memo O(n) + stack, tab O(n), optimised O(1).
## Dynamic Programming: 1D DP
### Climbing stairs
Recurrence: ways(n) = ways(n - 1) + ways(n - 2): the last move was 1 step or 2 steps.
```cpp
int climbStairs(int n) { int a = 1, b = 1; for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; } return b; }
```
```py
def climb_stairs(n):
    a = b = 1
    for _ in range(2, n + 1): a, b = b, a + b
    return b
```
TC: O(n). SC: O(1).
### Frog Jump
Recurrence: cost(i) = min(cost(i-1) + |h[i] - h[i-1]|, cost(i-2) + |h[i] - h[i-2]|).
```cpp
int frogJump(vector<int>& h) {
    int prev2 = 0, prev = 0;
    for (int i = 1; i < (int)h.size(); i++) {
        int one = prev + abs(h[i] - h[i - 1]);
        int two = i > 1 ? prev2 + abs(h[i] - h[i - 2]) : INT_MAX;
        prev2 = prev; prev = min(one, two);
    }
    return prev;
}
```
```py
def frog_jump(h):
    prev2 = prev = 0
    for i in range(1, len(h)):
        one = prev + abs(h[i] - h[i - 1])
        two = prev2 + abs(h[i] - h[i - 2]) if i > 1 else float('inf')
        prev2, prev = prev, min(one, two)
    return prev
```
TC: O(n). SC: O(1).
### Frog jump with K distances
```cpp
int frogJumpK(vector<int>& h, int k) {
    int n = h.size(); vector<int> dp(n, INT_MAX); dp[0] = 0;
    for (int i = 1; i < n; i++) for (int j = 1; j <= k && i - j >= 0; j++) dp[i] = min(dp[i], dp[i - j] + abs(h[i] - h[i - j]));
    return dp[n - 1];
}
```
```py
def frog_jump_k(h, k):
    n = len(h); dp = [0] + [float('inf')] * (n - 1)
    for i in range(1, n):
        for j in range(1, min(k, i) + 1): dp[i] = min(dp[i], dp[i - j] + abs(h[i] - h[i - j]))
    return dp[-1]
```
TC: O(n x k). SC: O(n).
### Maximum sum of non adjacent elements / House robber
Recurrence: at house i either **rob** it (a[i] + best up to i-2) or **skip** it (best up to i-1).
@array 2 7* 9 3* 1 :: take 7 and 3? No: best is 2 + 9 + 1 = 12
```cpp
int rob(vector<int>& a) {
    int prev2 = 0, prev = 0;
    for (int x : a) { int cur = max(prev, prev2 + x); prev2 = prev; prev = cur; }
    return prev;
}
```
```py
def rob(a):
    prev2 = prev = 0
    for x in a: prev2, prev = prev, max(prev, prev2 + x)
    return prev
```
TC: O(n). SC: O(1).
### House robber (circular street, House Robber II)
Idea: the first and last houses are neighbours, so we cannot take both. Answer = max(rob houses 0..n-2, rob houses 1..n-1).
```cpp
int robCircular(vector<int>& a) {
    int n = a.size(); if (n == 1) return a[0];
    vector<int> x(a.begin(), a.end() - 1), y(a.begin() + 1, a.end());
    return max(rob(x), rob(y));
}
```
```py
def rob_circular(a):
    if len(a) == 1: return a[0]
    return max(rob(a[:-1]), rob(a[1:]))
```
TC: O(n). SC: O(n) for the copies.
## Dynamic Programming: 2D DP
### Ninja's training
Idea: state = (day, last activity done). For each day choose any activity different from the previous day's.
```cpp
int ninjaTraining(vector<vector<int>>& p) {
    vector<int> prev(3);
    for (int j = 0; j < 3; j++) prev[j] = p[0][j];
    for (int d = 1; d < (int)p.size(); d++) {
        vector<int> cur(3, 0);
        for (int j = 0; j < 3; j++) for (int k = 0; k < 3; k++) if (k != j) cur[j] = max(cur[j], prev[k] + p[d][j]);
        prev = cur;
    }
    return *max_element(prev.begin(), prev.end());
}
```
```py
def ninja_training(p):
    prev = p[0][:]
    for d in range(1, len(p)):
        prev = [p[d][j] + max(prev[k] for k in range(3) if k != j) for j in range(3)]
    return max(prev)
```
TC: O(n x 3 x 3). SC: O(3).
## Dynamic Programming: DP on Grids
### Grid unique paths
Recurrence: paths(i, j) = paths(i-1, j) + paths(i, j-1) (we arrive from above or from the left).
@grid 1 1 1 / 1 2 3 / 1 3 6* :: number of paths to each cell of a 3 x 3 grid
```cpp
int uniquePaths(int m, int n) {
    vector<int> row(n, 1);
    for (int i = 1; i < m; i++) for (int j = 1; j < n; j++) row[j] += row[j - 1];
    return row[n - 1];
}
```
```py
def unique_paths(m, n):
    row = [1] * n
    for _ in range(1, m):
        for j in range(1, n): row[j] += row[j - 1]
    return row[-1]
```
TC: O(m x n). SC: O(n).
### Unique paths II (with obstacles)
```cpp
int uniquePathsWithObstacles(vector<vector<int>>& g) {
    int n = g[0].size(); vector<long long> row(n, 0); row[0] = 1;
    for (auto& r : g) for (int j = 0; j < n; j++) { if (r[j] == 1) row[j] = 0; else if (j > 0) row[j] += row[j - 1]; }
    return row[n - 1];
}
```
```py
def unique_paths_with_obstacles(g):
    n = len(g[0]); row = [0] * n; row[0] = 1
    for r in g:
        for j in range(n):
            if r[j] == 1: row[j] = 0
            elif j > 0: row[j] += row[j - 1]
    return row[-1]
```
TC: O(m x n). SC: O(n).
### Minimum Falling Path Sum
Idea: each cell takes the best of the three cells above it (up-left, up, up-right).
```cpp
int minFallingPathSum(vector<vector<int>>& m) {
    int n = m.size(); vector<int> prev = m[0];
    for (int i = 1; i < n; i++) {
        vector<int> cur(n);
        for (int j = 0; j < n; j++) {
            int best = prev[j];
            if (j > 0) best = min(best, prev[j - 1]);
            if (j < n - 1) best = min(best, prev[j + 1]);
            cur[j] = m[i][j] + best;
        }
        prev = cur;
    }
    return *min_element(prev.begin(), prev.end());
}
```
```py
def min_falling_path_sum(m):
    n, prev = len(m), m[0][:]
    for i in range(1, n):
        prev = [m[i][j] + min(prev[max(0, j - 1):j + 2]) for j in range(n)]
    return min(prev)
```
TC: O(n^2). SC: O(n).
### Triangle
Idea: go bottom-up. dp[j] = triangle[i][j] + min(dp[j], dp[j + 1]).
```cpp
int minimumTotal(vector<vector<int>>& t) {
    vector<int> dp = t.back();
    for (int i = (int)t.size() - 2; i >= 0; i--) for (int j = 0; j <= i; j++) dp[j] = t[i][j] + min(dp[j], dp[j + 1]);
    return dp[0];
}
```
```py
def minimum_total(t):
    dp = t[-1][:]
    for i in range(len(t) - 2, -1, -1):
        for j in range(i + 1): dp[j] = t[i][j] + min(dp[j], dp[j + 1])
    return dp[0]
```
TC: O(n^2). SC: O(n).
### Cherry pickup II
Idea: both robots move down one row at a time, so the state is (row, column of robot 1, column of robot 2). Each robot has 3 moves -> 9 combinations. If both stand on the same cell count it once.
```cpp
int cherryPickup(vector<vector<int>>& g) {
    int n = g.size(), m = g[0].size();
    vector<vector<int>> dp(m, vector<int>(m, 0)), nxt;
    for (int i = n - 1; i >= 0; i--) {
        nxt = vector<vector<int>>(m, vector<int>(m, 0));
        for (int a = 0; a < m; a++) for (int b = 0; b < m; b++) {
            int best = 0;
            if (i < n - 1) for (int da = -1; da <= 1; da++) for (int db = -1; db <= 1; db++) {
                int na = a + da, nb = b + db;
                if (na >= 0 && nb >= 0 && na < m && nb < m) best = max(best, dp[na][nb]);
            }
            nxt[a][b] = best + g[i][a] + (a != b ? g[i][b] : 0);
        }
        dp = nxt;
    }
    return dp[0][m - 1];
}
```
```py
def cherry_pickup(g):
    n, m = len(g), len(g[0]); dp = [[0] * m for _ in range(m)]
    for i in range(n - 1, -1, -1):
        nxt = [[0] * m for _ in range(m)]
        for a in range(m):
            for b in range(m):
                best = 0
                if i < n - 1:
                    for na in (a - 1, a, a + 1):
                        for nb in (b - 1, b, b + 1):
                            if 0 <= na < m and 0 <= nb < m: best = max(best, dp[na][nb])
                nxt[a][b] = best + g[i][a] + (g[i][b] if a != b else 0)
        dp = nxt
    return dp[0][m - 1]
```
TC: O(n x m^2 x 9). SC: O(m^2).
### Count Square Submatrices with All Ones
Idea: dp[i][j] = side of the largest all-ones square whose bottom-right corner is (i, j) = 1 + min(top, left, top-left). A square of side s contains s squares ending at that corner, so the answer is the sum of dp.
```cpp
int countSquares(vector<vector<int>>& m) {
    int total = 0;
    for (int i = 0; i < (int)m.size(); i++) for (int j = 0; j < (int)m[0].size(); j++) {
        if (m[i][j] && i && j) m[i][j] = 1 + min({m[i - 1][j], m[i][j - 1], m[i - 1][j - 1]});
        total += m[i][j];
    }
    return total;
}
```
```py
def count_squares(m):
    total = 0
    for i in range(len(m)):
        for j in range(len(m[0])):
            if m[i][j] and i and j: m[i][j] = 1 + min(m[i - 1][j], m[i][j - 1], m[i - 1][j - 1])
            total += m[i][j]
    return total
```
TC: O(n x m). SC: O(1) (in place).
## Dynamic Programming: DP on Stocks
Rule: state = (day, holding or not, transactions left). Each day: do nothing, buy (if not holding) or sell (if holding).
### Best time to buy and sell stock (one transaction)
Idea: for each day, the best profit selling today = price - cheapest price so far.
```cpp
int maxProfit(vector<int>& p) {
    int mn = INT_MAX, best = 0;
    for (int x : p) { mn = min(mn, x); best = max(best, x - mn); }
    return best;
}
```
```py
def max_profit(p):
    mn, best = float('inf'), 0
    for x in p: mn = min(mn, x); best = max(best, x - mn)
    return best
```
TC: O(n). SC: O(1).
### Best time to buy and sell stock II (unlimited transactions)
Idea: collect every upward step: sum of max(0, p[i] - p[i-1]).
```cpp
int maxProfitII(vector<int>& p) { int s = 0; for (int i = 1; i < (int)p.size(); i++) s += max(0, p[i] - p[i - 1]); return s; }
```
```py
def max_profit_ii(p): return sum(max(0, p[i] - p[i - 1]) for i in range(1, len(p)))
```
TC: O(n). SC: O(1).
### Best time to buy and sell stock III (at most 2) and IV (at most k)
Idea: buy[t] = best money after the t-th buy, sell[t] = best money after the t-th sell. Update for each price: buy[t] = max(buy[t], sell[t-1] - price), sell[t] = max(sell[t], buy[t] + price).
```cpp
int maxProfitK(int k, vector<int>& p) {
    vector<int> buy(k + 1, INT_MIN), sell(k + 1, 0);
    for (int x : p) for (int t = 1; t <= k; t++) { buy[t] = max(buy[t], sell[t - 1] - x); sell[t] = max(sell[t], buy[t] + x); }
    return sell[k];
}
int maxProfitIII(vector<int>& p) { return maxProfitK(2, p); }
```
```py
def max_profit_k(k, p):
    buy, sell = [float('-inf')] * (k + 1), [0] * (k + 1)
    for x in p:
        for t in range(1, k + 1):
            buy[t] = max(buy[t], sell[t - 1] - x); sell[t] = max(sell[t], buy[t] + x)
    return sell[k]
def max_profit_iii(p): return max_profit_k(2, p)
```
TC: O(n x k). SC: O(k).
### Best time to buy and sell stock with transaction fees
```cpp
int maxProfitFee(vector<int>& p, int fee) {
    long long hold = LLONG_MIN / 2, cash = 0;
    for (int x : p) { hold = max(hold, cash - x); cash = max(cash, hold + x - fee); }
    return cash;
}
```
```py
def max_profit_fee(p, fee):
    hold, cash = float('-inf'), 0
    for x in p: hold = max(hold, cash - x); cash = max(cash, hold + x - fee)
    return cash
```
TC: O(n). SC: O(1).
### Best Time to Buy and Sell Stock with Cooldown
Idea: three states: hold, sold (just sold today), rest (free, can buy). After selling we must rest one day.
```cpp
int maxProfitCooldown(vector<int>& p) {
    int hold = INT_MIN, sold = 0, rest = 0;
    for (int x : p) { int prevSold = sold; sold = hold + x; hold = max(hold, rest - x); rest = max(rest, prevSold); }
    return max(sold, rest);
}
```
```py
def max_profit_cooldown(p):
    hold, sold, rest = float('-inf'), 0, 0
    for x in p: hold, sold, rest = max(hold, rest - x), hold + x, max(rest, sold)
    return max(sold, rest)
```
TC: O(n). SC: O(1).
## Dynamic Programming: DP on Subsequences
Rule: state = (index, remaining target). At each index: **take** or **not take**. In the 1D table, loop the target **downward** when each item is used once (0/1) and **upward** when items can be reused (unbounded).
### Subset sum equals to target
```cpp
bool subsetSum(vector<int>& a, int target) {
    vector<bool> dp(target + 1, false); dp[0] = true;
    for (int x : a) for (int t = target; t >= x; t--) if (dp[t - x]) dp[t] = true;
    return dp[target];
}
```
```py
def subset_sum(a, target):
    dp = [True] + [False] * target
    for x in a:
        for t in range(target, x - 1, -1):
            if dp[t - x]: dp[t] = True
    return dp[target]
```
TC: O(n x target). SC: O(target).
### Partition equal subset sum
Idea: possible only if the total is even; then find a subset with sum total / 2.
```cpp
bool canPartition(vector<int>& a) {
    int total = accumulate(a.begin(), a.end(), 0);
    return total % 2 == 0 && subsetSum(a, total / 2);
}
```
```py
def can_partition(a):
    total = sum(a)
    return total % 2 == 0 and subset_sum(a, total // 2)
```
TC: O(n x sum). SC: O(sum).
### Partition a set into two subsets with minimum absolute sum difference
Idea: find every reachable subset sum s1 <= total / 2; the difference is total - 2 x s1; take the smallest.
```cpp
int minSubsetSumDifference(vector<int>& a) {
    int total = accumulate(a.begin(), a.end(), 0);
    vector<bool> dp(total / 2 + 1, false); dp[0] = true;
    for (int x : a) for (int t = total / 2; t >= x; t--) if (dp[t - x]) dp[t] = true;
    for (int s = total / 2; s >= 0; s--) if (dp[s]) return total - 2 * s;
    return total;
}
```
```py
def min_subset_sum_difference(a):
    total = sum(a); half = total // 2; dp = [True] + [False] * half
    for x in a:
        for t in range(half, x - 1, -1):
            if dp[t - x]: dp[t] = True
    return total - 2 * max(s for s in range(half + 1) if dp[s])
```
TC: O(n x sum). SC: O(sum).
### Count subsets with sum K
```cpp
int countSubsets(vector<int>& a, int k) {
    const int MOD = 1e9 + 7; vector<int> dp(k + 1, 0); dp[0] = 1;
    for (int x : a) for (int t = k; t >= x; t--) dp[t] = (dp[t] + dp[t - x]) % MOD;
    return dp[k];
}
```
```py
def count_subsets(a, k):
    MOD = 10**9 + 7; dp = [1] + [0] * k
    for x in a:
        for t in range(k, x - 1, -1): dp[t] = (dp[t] + dp[t - x]) % MOD
    return dp[k]
```
TC: O(n x k). SC: O(k).
### Count partitions with given difference
Idea: S1 - S2 = D and S1 + S2 = total, so S2 = (total - D) / 2. Count subsets with that sum.
```cpp
int countPartitions(vector<int>& a, int d) {
    int total = accumulate(a.begin(), a.end(), 0);
    if (total < d || (total - d) % 2) return 0;
    return countSubsets(a, (total - d) / 2);
}
```
```py
def count_partitions(a, d):
    total = sum(a)
    if total < d or (total - d) % 2: return 0
    return count_subsets(a, (total - d) // 2)
```
TC: O(n x sum). SC: O(sum).
### 0 and 1 Knapsack
Recurrence: best(i, W) = max(skip: best(i-1, W), take: val[i] + best(i-1, W - wt[i])).
| item | weight | value |
|---|---|---|
| A | 1 | 10 |
| B | 3 | 40 |
| C | 4 | 50 |
```cpp
int knapsack01(vector<int>& wt, vector<int>& val, int W) {
    vector<int> dp(W + 1, 0);
    for (int i = 0; i < (int)wt.size(); i++) for (int w = W; w >= wt[i]; w--) dp[w] = max(dp[w], dp[w - wt[i]] + val[i]);
    return dp[W];
}
```
```py
def knapsack01(wt, val, W):
    dp = [0] * (W + 1)
    for w_i, v_i in zip(wt, val):
        for w in range(W, w_i - 1, -1): dp[w] = max(dp[w], dp[w - w_i] + v_i)
    return dp[W]
```
TC: O(n x W). SC: O(W).
### Minimum coins (Coin Change)
Recurrence: dp[t] = 1 + min over coins c of dp[t - c].
```cpp
int coinChange(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, 1e9); dp[0] = 0;
    for (int t = 1; t <= amount; t++) for (int c : coins) if (c <= t) dp[t] = min(dp[t], dp[t - c] + 1);
    return dp[amount] >= 1e9 ? -1 : dp[amount];
}
```
```py
def coin_change(coins, amount):
    INF = float('inf'); dp = [0] + [INF] * amount
    for t in range(1, amount + 1):
        for c in coins:
            if c <= t: dp[t] = min(dp[t], dp[t - c] + 1)
    return -1 if dp[amount] == INF else dp[amount]
```
TC: O(amount x coins). SC: O(amount).
### Target sum
Idea: put + on a set P and - on the rest: P - (total - P) = target, so P = (total + target) / 2. Count subsets with sum P.
```cpp
int findTargetSumWays(vector<int>& a, int target) {
    int total = accumulate(a.begin(), a.end(), 0);
    if (abs(target) > total || (total + target) % 2) return 0;
    int p = (total + target) / 2; vector<int> dp(p + 1, 0); dp[0] = 1;
    for (int x : a) for (int t = p; t >= x; t--) dp[t] += dp[t - x];
    return dp[p];
}
```
```py
def find_target_sum_ways(a, target):
    total = sum(a)
    if abs(target) > total or (total + target) % 2: return 0
    p = (total + target) // 2; dp = [1] + [0] * p
    for x in a:
        for t in range(p, x - 1, -1): dp[t] += dp[t - x]
    return dp[p]
```
TC: O(n x sum). SC: O(sum).
### Coin change II (number of combinations)
Idea: loop coins **outside** so each combination is counted once (order does not matter); loop the amount upward so a coin can repeat.
```cpp
int change(int amount, vector<int>& coins) {
    vector<unsigned long long> dp(amount + 1, 0); dp[0] = 1;
    for (int c : coins) for (int t = c; t <= amount; t++) dp[t] += dp[t - c];
    return dp[amount];
}
```
```py
def change(amount, coins):
    dp = [1] + [0] * amount
    for c in coins:
        for t in range(c, amount + 1): dp[t] += dp[t - c]
    return dp[amount]
```
TC: O(amount x coins). SC: O(amount).
### Unbounded knapsack
```cpp
int unboundedKnapsack(vector<int>& wt, vector<int>& val, int W) {
    vector<int> dp(W + 1, 0);
    for (int i = 0; i < (int)wt.size(); i++) for (int w = wt[i]; w <= W; w++) dp[w] = max(dp[w], dp[w - wt[i]] + val[i]);
    return dp[W];
}
```
```py
def unbounded_knapsack(wt, val, W):
    dp = [0] * (W + 1)
    for w_i, v_i in zip(wt, val):
        for w in range(w_i, W + 1): dp[w] = max(dp[w], dp[w - w_i] + v_i)
    return dp[W]
```
TC: O(n x W). SC: O(W).
### Rod cutting problem
Idea: unbounded knapsack where the piece of length i + 1 has value price[i] and the capacity is the rod length n.
```cpp
int rodCutting(vector<int>& price) {
    int n = price.size(); vector<int> dp(n + 1, 0);
    for (int len = 1; len <= n; len++) for (int w = len; w <= n; w++) dp[w] = max(dp[w], dp[w - len] + price[len - 1]);
    return dp[n];
}
```
```py
def rod_cutting(price):
    n = len(price); dp = [0] * (n + 1)
    for length in range(1, n + 1):
        for w in range(length, n + 1): dp[w] = max(dp[w], dp[w - length] + price[length - 1])
    return dp[n]
```
TC: O(n^2). SC: O(n).
## Dynamic Programming: LIS
### Longest Increasing Subsequence
Idea: O(n^2) DP: dp[i] = 1 + max dp[j] for j < i with a[j] < a[i]. Faster: keep `tails` where tails[k] = the smallest possible tail of an increasing subsequence of length k + 1; binary search the place of each number.
Dry run: [10, 9, 2, 5, 3, 7] -> tails: [10] [9] [2] [2,5] [2,3] [2,3,7] -> length 3.
```cpp
int lengthOfLIS(vector<int>& a) {
    vector<int> tails;
    for (int x : a) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x); else *it = x;
    }
    return tails.size();
}
```
```py
import bisect
def length_of_lis(a):
    tails = []
    for x in a:
        i = bisect.bisect_left(tails, x)
        if i == len(tails): tails.append(x)
        else: tails[i] = x
    return len(tails)
```
TC: O(n log n). SC: O(n).
### Print Longest Increasing Subsequence
Idea: O(n^2) DP with a `parent` array to walk back from the best end.
```cpp
vector<int> printLIS(vector<int>& a) {
    int n = a.size(), best = 0; vector<int> dp(n, 1), parent(n, -1);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) if (a[j] < a[i] && dp[j] + 1 > dp[i]) { dp[i] = dp[j] + 1; parent[i] = j; }
        if (dp[i] > dp[best]) best = i;
    }
    vector<int> lis; for (int i = best; i != -1; i = parent[i]) lis.push_back(a[i]);
    reverse(lis.begin(), lis.end());
    return lis;
}
```
```py
def print_lis(a):
    n = len(a); dp = [1] * n; parent = [-1] * n; best = 0
    for i in range(n):
        for j in range(i):
            if a[j] < a[i] and dp[j] + 1 > dp[i]: dp[i] = dp[j] + 1; parent[i] = j
        if dp[i] > dp[best]: best = i
    lis, i = [], best
    while i != -1: lis.append(a[i]); i = parent[i]
    return lis[::-1]
```
TC: O(n^2). SC: O(n).
### Largest Divisible Subset
Idea: sort. Then it is LIS with the condition "a[i] % a[j] == 0" instead of "a[j] < a[i]".
```cpp
vector<int> largestDivisibleSubset(vector<int>& a) {
    sort(a.begin(), a.end()); int n = a.size(), best = 0; vector<int> dp(n, 1), parent(n, -1);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) if (a[i] % a[j] == 0 && dp[j] + 1 > dp[i]) { dp[i] = dp[j] + 1; parent[i] = j; }
        if (dp[i] > dp[best]) best = i;
    }
    vector<int> ans; for (int i = best; i != -1; i = parent[i]) ans.push_back(a[i]);
    reverse(ans.begin(), ans.end());
    return ans;
}
```
```py
def largest_divisible_subset(a):
    a.sort(); n = len(a); dp = [1] * n; parent = [-1] * n; best = 0
    for i in range(n):
        for j in range(i):
            if a[i] % a[j] == 0 and dp[j] + 1 > dp[i]: dp[i] = dp[j] + 1; parent[i] = j
        if dp[i] > dp[best]: best = i
    ans, i = [], best
    while i != -1: ans.append(a[i]); i = parent[i]
    return ans[::-1]
```
TC: O(n^2). SC: O(n).
### Longest String Chain
Idea: sort words by length. dp[word] = 1 + max dp[predecessor], where a predecessor is the word with one letter removed.
```cpp
int longestStrChain(vector<string>& words) {
    sort(words.begin(), words.end(), [](auto& a, auto& b) { return a.size() < b.size(); });
    unordered_map<string,int> dp; int best = 0;
    for (auto& w : words) {
        int cur = 1;
        for (int i = 0; i < (int)w.size(); i++) { string p = w.substr(0, i) + w.substr(i + 1); if (dp.count(p)) cur = max(cur, dp[p] + 1); }
        dp[w] = cur; best = max(best, cur);
    }
    return best;
}
```
```py
def longest_str_chain(words):
    dp, best = {}, 0
    for w in sorted(words, key=len):
        dp[w] = 1 + max((dp.get(w[:i] + w[i + 1:], 0) for i in range(len(w))), default=0)
        best = max(best, dp[w])
    return best
```
TC: O(n log n + n x L^2). SC: O(n x L).
### Longest Bitonic Subsequence
Idea: inc[i] = LIS ending at i (from the left), dec[i] = LIS starting at i going right (computed from the right). Answer = max(inc[i] + dec[i] - 1).
```cpp
int longestBitonic(vector<int>& a) {
    int n = a.size(), best = 0; vector<int> inc(n, 1), dec(n, 1);
    for (int i = 0; i < n; i++) for (int j = 0; j < i; j++) if (a[j] < a[i]) inc[i] = max(inc[i], inc[j] + 1);
    for (int i = n - 1; i >= 0; i--) for (int j = n - 1; j > i; j--) if (a[j] < a[i]) dec[i] = max(dec[i], dec[j] + 1);
    for (int i = 0; i < n; i++) if (inc[i] > 1 && dec[i] > 1) best = max(best, inc[i] + dec[i] - 1);
    return best;
}
```
```py
def longest_bitonic(a):
    n = len(a); inc, dec = [1] * n, [1] * n
    for i in range(n):
        for j in range(i):
            if a[j] < a[i]: inc[i] = max(inc[i], inc[j] + 1)
    for i in range(n - 1, -1, -1):
        for j in range(n - 1, i, -1):
            if a[j] < a[i]: dec[i] = max(dec[i], dec[j] + 1)
    return max((inc[i] + dec[i] - 1 for i in range(n) if inc[i] > 1 and dec[i] > 1), default=0)
```
TC: O(n^2). SC: O(n).
### Number of Longest Increasing Subsequences
Idea: keep cnt[i] = number of LIS of length dp[i] ending at i. Longer found: copy the count. Same length found: add the count.
```cpp
int findNumberOfLIS(vector<int>& a) {
    int n = a.size(), best = 0, ans = 0; vector<int> dp(n, 1), cnt(n, 1);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) if (a[j] < a[i]) {
            if (dp[j] + 1 > dp[i]) { dp[i] = dp[j] + 1; cnt[i] = cnt[j]; }
            else if (dp[j] + 1 == dp[i]) cnt[i] += cnt[j];
        }
        best = max(best, dp[i]);
    }
    for (int i = 0; i < n; i++) if (dp[i] == best) ans += cnt[i];
    return ans;
}
```
```py
def find_number_of_lis(a):
    n = len(a); dp, cnt = [1] * n, [1] * n
    for i in range(n):
        for j in range(i):
            if a[j] < a[i]:
                if dp[j] + 1 > dp[i]: dp[i], cnt[i] = dp[j] + 1, cnt[j]
                elif dp[j] + 1 == dp[i]: cnt[i] += cnt[j]
    best = max(dp, default=0)
    return sum(c for d, c in zip(dp, cnt) if d == best)
```
TC: O(n^2). SC: O(n).
## Dynamic Programming: DP on Strings
Rule: state = (i, j) = prefixes of the two strings. If the characters match, move both; otherwise try the options (skip one side, or edit).
### Longest common subsequence
Recurrence: s1[i] == s2[j] -> 1 + f(i-1, j-1); else max(f(i-1, j), f(i, j-1)).
@grid . . a c e / . 0 0 0 0 / a 0 1 1 1 / b 0 1 1 1 / c 0 1 2 2 / d 0 1 2 2 / e 0 1 2 3* :: LCS table of "abcde" and "ace" = 3
```cpp
int longestCommonSubsequence(string a, string b) {
    int n = a.size(), m = b.size(); vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++)
        dp[i][j] = a[i - 1] == b[j - 1] ? 1 + dp[i - 1][j - 1] : max(dp[i - 1][j], dp[i][j - 1]);
    return dp[n][m];
}
```
```py
def longest_common_subsequence(a, b):
    n, m = len(a), len(b); dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            dp[i][j] = 1 + dp[i - 1][j - 1] if a[i - 1] == b[j - 1] else max(dp[i - 1][j], dp[i][j - 1])
    return dp[n][m]
```
TC: O(n x m). SC: O(n x m) (O(m) with two rows).
### Longest common substring
Idea: a substring must be contiguous, so on a mismatch the length resets to 0.
```cpp
int longestCommonSubstring(string a, string b) {
    int n = a.size(), m = b.size(), best = 0; vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++)
        if (a[i - 1] == b[j - 1]) { dp[i][j] = 1 + dp[i - 1][j - 1]; best = max(best, dp[i][j]); }
    return best;
}
```
```py
def longest_common_substring(a, b):
    n, m, best = len(a), len(b), 0; dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if a[i - 1] == b[j - 1]: dp[i][j] = 1 + dp[i - 1][j - 1]; best = max(best, dp[i][j])
    return best
```
TC: O(n x m). SC: O(n x m).
### Longest palindromic subsequence
Idea: LPS(s) = LCS(s, reverse(s)).
```cpp
int longestPalindromeSubseq(string s) { string r(s.rbegin(), s.rend()); return longestCommonSubsequence(s, r); }
```
```py
def longest_palindrome_subseq(s): return longest_common_subsequence(s, s[::-1])
```
TC: O(n^2). SC: O(n^2).
### Minimum insertions to make string palindrome
Idea: keep the longest palindromic subsequence; every other character needs a partner: n - LPS.
```cpp
int minInsertions(string s) { return (int)s.size() - longestPalindromeSubseq(s); }
```
```py
def min_insertions(s): return len(s) - longest_palindrome_subseq(s)
```
TC: O(n^2). SC: O(n^2).
### Minimum insertions or deletions to convert string A to B
Idea: keep the LCS; delete the rest of A (n - lcs) and insert the rest of B (m - lcs).
```cpp
int minOperations(string a, string b) { int l = longestCommonSubsequence(a, b); return (int)a.size() + (int)b.size() - 2 * l; }
```
```py
def min_operations(a, b): return len(a) + len(b) - 2 * longest_common_subsequence(a, b)
```
TC: O(n x m). SC: O(n x m).
### Shortest common supersequence
Idea: write the LCS characters once and all the other characters in order. Walk the LCS table backwards to build the string. Length = n + m - lcs.
```cpp
string shortestCommonSupersequence(string a, string b) {
    int n = a.size(), m = b.size(); vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++)
        dp[i][j] = a[i - 1] == b[j - 1] ? 1 + dp[i - 1][j - 1] : max(dp[i - 1][j], dp[i][j - 1]);
    string res; int i = n, j = m;
    while (i > 0 && j > 0) {
        if (a[i - 1] == b[j - 1]) { res += a[i - 1]; i--; j--; }
        else if (dp[i - 1][j] > dp[i][j - 1]) res += a[--i];
        else res += b[--j];
    }
    while (i > 0) res += a[--i];
    while (j > 0) res += b[--j];
    reverse(res.begin(), res.end());
    return res;
}
```
```py
def shortest_common_supersequence(a, b):
    n, m = len(a), len(b); dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            dp[i][j] = 1 + dp[i - 1][j - 1] if a[i - 1] == b[j - 1] else max(dp[i - 1][j], dp[i][j - 1])
    res, i, j = [], n, m
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]: res.append(a[i - 1]); i -= 1; j -= 1
        elif dp[i - 1][j] > dp[i][j - 1]: i -= 1; res.append(a[i])
        else: j -= 1; res.append(b[j])
    while i > 0: i -= 1; res.append(a[i])
    while j > 0: j -= 1; res.append(b[j])
    return "".join(reversed(res))
```
TC: O(n x m). SC: O(n x m).
### Distinct subsequences (count ways t appears in s)
Recurrence: if s[i] == t[j]: f(i-1, j-1) (use it) + f(i-1, j) (skip it); else f(i-1, j). 1D: loop j downward.
```cpp
int numDistinct(string s, string t) {
    vector<unsigned long long> dp(t.size() + 1, 0); dp[0] = 1;
    for (char c : s) for (int j = t.size(); j >= 1; j--) if (c == t[j - 1]) dp[j] += dp[j - 1];
    return dp[t.size()];
}
```
```py
def num_distinct(s, t):
    dp = [1] + [0] * len(t)
    for c in s:
        for j in range(len(t), 0, -1):
            if c == t[j - 1]: dp[j] += dp[j - 1]
    return dp[len(t)]
```
TC: O(n x m). SC: O(m).
### Edit distance
Recurrence: match -> f(i-1, j-1). Else 1 + min(insert: f(i, j-1), delete: f(i-1, j), replace: f(i-1, j-1)). Base: converting to/from an empty string costs the length.
```cpp
int minDistance(string a, string b) {
    int n = a.size(), m = b.size(); vector<vector<int>> dp(n + 1, vector<int>(m + 1));
    for (int i = 0; i <= n; i++) dp[i][0] = i;
    for (int j = 0; j <= m; j++) dp[0][j] = j;
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++)
        dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1] : 1 + min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});
    return dp[n][m];
}
```
```py
def min_distance(a, b):
    n, m = len(a), len(b); dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1): dp[i][0] = i
    for j in range(m + 1): dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            dp[i][j] = dp[i - 1][j - 1] if a[i - 1] == b[j - 1] else 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[n][m]
```
TC: O(n x m). SC: O(n x m).
### Wildcard matching ('?' = one char, '*' = any sequence)
Recurrence: char match or '?' -> f(i-1, j-1). '*' -> f(i, j-1) (star matches nothing) or f(i-1, j) (star eats one more char).
```cpp
bool isMatch(string s, string p) {
    int n = s.size(), m = p.size(); vector<vector<bool>> dp(n + 1, vector<bool>(m + 1, false)); dp[0][0] = true;
    for (int j = 1; j <= m && p[j - 1] == '*'; j++) dp[0][j] = true;
    for (int i = 1; i <= n; i++) for (int j = 1; j <= m; j++) {
        if (p[j - 1] == '*') dp[i][j] = dp[i][j - 1] || dp[i - 1][j];
        else dp[i][j] = dp[i - 1][j - 1] && (p[j - 1] == '?' || p[j - 1] == s[i - 1]);
    }
    return dp[n][m];
}
```
```py
def is_match(s, p):
    n, m = len(s), len(p); dp = [[False] * (m + 1) for _ in range(n + 1)]; dp[0][0] = True
    for j in range(1, m + 1):
        if p[j - 1] != '*': break
        dp[0][j] = True
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if p[j - 1] == '*': dp[i][j] = dp[i][j - 1] or dp[i - 1][j]
            else: dp[i][j] = dp[i - 1][j - 1] and p[j - 1] in ('?', s[i - 1])
    return dp[n][m]
```
TC: O(n x m). SC: O(n x m).
### Word Break
Idea: dp[i] = the prefix s[0..i) can be split into dictionary words. dp[i] is true if some j < i has dp[j] true and s[j..i) is a word.
```cpp
bool wordBreak(string s, vector<string>& dict) {
    unordered_set<string> words(dict.begin(), dict.end()); int n = s.size();
    vector<bool> dp(n + 1, false); dp[0] = true;
    for (int i = 1; i <= n; i++) for (int j = 0; j < i; j++) if (dp[j] && words.count(s.substr(j, i - j))) { dp[i] = true; break; }
    return dp[n];
}
```
```py
def word_break(s, dict_):
    words, n = set(dict_), len(s); dp = [True] + [False] * n
    for i in range(1, n + 1):
        dp[i] = any(dp[j] and s[j:i] in words for j in range(i))
    return dp[n]
```
TC: O(n^2 x L). SC: O(n).
### Count Palindromic Subsequences
Recurrence: if s[i] == s[j]: f(i+1, j) + f(i, j-1) + 1; else f(i+1, j) + f(i, j-1) - f(i+1, j-1) (inclusion-exclusion).
```cpp
long long countPalindromicSubsequences(string s) {
    int n = s.size(); const long long MOD = 1e9 + 7; vector<vector<long long>> dp(n, vector<long long>(n, 0));
    for (int i = n - 1; i >= 0; i--) {
        dp[i][i] = 1;
        for (int j = i + 1; j < n; j++) {
            long long inner = (j - 1 >= i + 1) ? dp[i + 1][j - 1] : 0;
            if (s[i] == s[j]) dp[i][j] = (dp[i + 1][j] + dp[i][j - 1] + 1) % MOD;
            else dp[i][j] = ((dp[i + 1][j] + dp[i][j - 1] - inner) % MOD + MOD) % MOD;
        }
    }
    return dp[0][n - 1];
}
```
```py
def count_palindromic_subsequences(s):
    n = len(s); MOD = 10**9 + 7; dp = [[0] * n for _ in range(n)]
    for i in range(n - 1, -1, -1):
        dp[i][i] = 1
        for j in range(i + 1, n):
            inner = dp[i + 1][j - 1] if j - 1 >= i + 1 else 0
            if s[i] == s[j]: dp[i][j] = (dp[i + 1][j] + dp[i][j - 1] + 1) % MOD
            else: dp[i][j] = (dp[i + 1][j] + dp[i][j - 1] - inner) % MOD
    return dp[0][n - 1]
```
TC: O(n^2). SC: O(n^2).
## Dynamic Programming: MCM DP (Partition DP)
Rule: when the answer depends on **where we split** a range, use f(i, j) and try every partition point k between i and j: f(i, j) = best over k of f(i, k) + f(k+1, j) + cost of joining.
### Matrix chain multiplication
Idea: matrices have sizes arr[0] x arr[1], arr[1] x arr[2], ... Multiplying (i..k) with (k+1..j) costs arr[i-1] x arr[k] x arr[j].
```cpp
int matrixMultiplication(vector<int>& arr) {
    int n = arr.size(); vector<vector<int>> dp(n, vector<int>(n, 0));
    for (int i = n - 1; i >= 1; i--) for (int j = i + 1; j < n; j++) {
        dp[i][j] = INT_MAX;
        for (int k = i; k < j; k++) dp[i][j] = min(dp[i][j], dp[i][k] + dp[k + 1][j] + arr[i - 1] * arr[k] * arr[j]);
    }
    return dp[1][n - 1];
}
```
```py
def matrix_multiplication(arr):
    n = len(arr); dp = [[0] * n for _ in range(n)]
    for i in range(n - 1, 0, -1):
        for j in range(i + 1, n):
            dp[i][j] = min(dp[i][k] + dp[k + 1][j] + arr[i - 1] * arr[k] * arr[j] for k in range(i, j))
    return dp[1][n - 1]
```
TC: O(n^3). SC: O(n^2).
### Burst balloons
Idea: think of the balloon burst **last** in a range (i..j): at that time its neighbours are a[i-1] and a[j+1], so sub-ranges become independent. Pad the array with 1 at both ends.
```cpp
int maxCoins(vector<int>& nums) {
    vector<int> a = {1}; a.insert(a.end(), nums.begin(), nums.end()); a.push_back(1);
    int n = nums.size(); vector<vector<int>> dp(n + 2, vector<int>(n + 2, 0));
    for (int i = n; i >= 1; i--) for (int j = i; j <= n; j++)
        for (int k = i; k <= j; k++) dp[i][j] = max(dp[i][j], dp[i][k - 1] + dp[k + 1][j] + a[i - 1] * a[k] * a[j + 1]);
    return dp[1][n];
}
```
```py
def max_coins(nums):
    a = [1] + nums + [1]; n = len(nums); dp = [[0] * (n + 2) for _ in range(n + 2)]
    for i in range(n, 0, -1):
        for j in range(i, n + 1):
            dp[i][j] = max(dp[i][k - 1] + dp[k + 1][j] + a[i - 1] * a[k] * a[j + 1] for k in range(i, j + 1))
    return dp[1][n]
```
TC: O(n^3). SC: O(n^2).
### Palindrome partitioning II (minimum cuts)
Idea: cuts[i] = minimum cuts for the suffix starting at i. Try every j where s[i..j] is a palindrome: 1 + cuts[j + 1]. Precompute the palindrome table.
```cpp
int minCut(string s) {
    int n = s.size(); vector<vector<bool>> pal(n, vector<bool>(n, false)); vector<int> cuts(n + 1, 0);
    for (int i = n - 1; i >= 0; i--) for (int j = i; j < n; j++) pal[i][j] = s[i] == s[j] && (j - i < 2 || pal[i + 1][j - 1]);
    for (int i = n - 1; i >= 0; i--) {
        cuts[i] = INT_MAX;
        for (int j = i; j < n; j++) if (pal[i][j]) cuts[i] = min(cuts[i], 1 + cuts[j + 1]);
    }
    return cuts[0] - 1;
}
```
```py
def min_cut(s):
    n = len(s); pal = [[False] * n for _ in range(n)]
    for i in range(n - 1, -1, -1):
        for j in range(i, n): pal[i][j] = s[i] == s[j] and (j - i < 2 or pal[i + 1][j - 1])
    cuts = [0] * (n + 1)
    for i in range(n - 1, -1, -1):
        cuts[i] = min(1 + cuts[j + 1] for j in range(i, n) if pal[i][j])
    return cuts[0] - 1
```
TC: O(n^2). SC: O(n^2).
### Partition Array for Maximum Sum
Idea: dp[i] = best sum for the suffix from i. Try a first block of length 1..k; every element becomes the block's maximum.
```cpp
int maxSumAfterPartitioning(vector<int>& a, int k) {
    int n = a.size(); vector<int> dp(n + 1, 0);
    for (int i = n - 1; i >= 0; i--) {
        int mx = 0;
        for (int len = 1; len <= k && i + len <= n; len++) { mx = max(mx, a[i + len - 1]); dp[i] = max(dp[i], mx * len + dp[i + len]); }
    }
    return dp[0];
}
```
```py
def max_sum_after_partitioning(a, k):
    n = len(a); dp = [0] * (n + 1)
    for i in range(n - 1, -1, -1):
        mx = 0
        for length in range(1, min(k, n - i) + 1):
            mx = max(mx, a[i + length - 1]); dp[i] = max(dp[i], mx * length + dp[i + length])
    return dp[0]
```
TC: O(n x k). SC: O(n).
### Minimum cost to cut the stick
Idea: sort the cuts and add 0 and n at the ends. f(i, j) = cheapest way to make cuts i..j; making cut k first costs the current stick length cuts[j+1] - cuts[i-1].
```cpp
int minCost(int n, vector<int>& cuts) {
    cuts.push_back(0); cuts.push_back(n); sort(cuts.begin(), cuts.end());
    int c = cuts.size() - 2; vector<vector<int>> dp(c + 2, vector<int>(c + 2, 0));
    for (int i = c; i >= 1; i--) for (int j = i; j <= c; j++) {
        dp[i][j] = INT_MAX;
        for (int k = i; k <= j; k++) dp[i][j] = min(dp[i][j], cuts[j + 1] - cuts[i - 1] + dp[i][k - 1] + dp[k + 1][j]);
    }
    return dp[1][c];
}
```
```py
def min_cost(n, cuts):
    cuts = [0] + sorted(cuts) + [n]; c = len(cuts) - 2; dp = [[0] * (c + 2) for _ in range(c + 2)]
    for i in range(c, 0, -1):
        for j in range(i, c + 1):
            dp[i][j] = min(cuts[j + 1] - cuts[i - 1] + dp[i][k - 1] + dp[k + 1][j] for k in range(i, j + 1))
    return dp[1][c]
```
TC: O(c^3). SC: O(c^2).
### Different Ways to Evaluate a Boolean Expression (to true)
Idea: state (i, j, wantTrue). Split at each operator k; count left-true/false and right-true/false and combine by the operator's truth table.
```cpp
long long evaluateExp(string& e) {
    int n = e.size(); const long long MOD = 1e9 + 7;
    vector<vector<array<long long,2>>> dp(n, vector<array<long long,2>>(n, {0, 0}));
    for (int i = n - 1; i >= 0; i -= 2) for (int j = i; j < n; j += 2) {
        if (i == j) { dp[i][j] = {e[i] == 'F', e[i] == 'T'}; continue; }
        long long T = 0, F = 0;
        for (int k = i + 1; k < j; k += 2) {
            long long lt = dp[i][k - 1][1], lf = dp[i][k - 1][0], rt = dp[k + 1][j][1], rf = dp[k + 1][j][0];
            if (e[k] == '&') { T += lt * rt; F += lt * rf + lf * rt + lf * rf; }
            else if (e[k] == '|') { T += lt * rt + lt * rf + lf * rt; F += lf * rf; }
            else { T += lt * rf + lf * rt; F += lt * rt + lf * rf; }
            T %= MOD; F %= MOD;
        }
        dp[i][j] = {F, T};
    }
    return dp[0][n - 1][1];
}
```
```py
def evaluate_exp(e):
    MOD = 10**9 + 7
    @lru_cache(None)
    def f(i, j):                                  # returns (ways true, ways false)
        if i == j: return (1, 0) if e[i] == 'T' else (0, 1)
        T = F = 0
        for k in range(i + 1, j, 2):
            lt, lf = f(i, k - 1); rt, rf = f(k + 1, j)
            if e[k] == '&': T += lt * rt; F += lt * rf + lf * rt + lf * rf
            elif e[k] == '|': T += lt * rt + lt * rf + lf * rt; F += lf * rf
            else: T += lt * rf + lf * rt; F += lt * rt + lf * rf
        return T % MOD, F % MOD
    return f(0, len(e) - 1)[0]
```
TC: O(n^3). SC: O(n^2).
## Tries
### Bit PreRequisites for TRIE Problems
- A number can be stored in a trie **bit by bit** from the most significant bit (bit 31) to bit 0; each node has two children: 0 and 1.
- To maximise x XOR y, at each bit we want the **opposite** bit of x (1 ^ 0 = 1). Walk the trie greedily taking the opposite child when it exists.
### Trie Implementation and Operations
Definition: a **trie** (prefix tree) stores strings character by character; words with a common prefix share the same path. Insert / search / startsWith all cost O(length of the word), independent of how many words are stored.
@tree root(a(p(p*(l(e*)))),b(a(t*))) :: Trie holding "app", "apple", "bat" (* = end of word)
```cpp
struct TrieNode { TrieNode* child[26] = {}; bool end = false; int cntEnd = 0, cntPrefix = 0; };
class Trie {
    TrieNode* root = new TrieNode();
public:
    void insert(const string& w) {
        TrieNode* n = root;
        for (char c : w) { if (!n->child[c - 'a']) n->child[c - 'a'] = new TrieNode(); n = n->child[c - 'a']; n->cntPrefix++; }
        n->end = true; n->cntEnd++;
    }
    TrieNode* walk(const string& w) { TrieNode* n = root; for (char c : w) { n = n->child[c - 'a']; if (!n) return nullptr; } return n; }
    bool search(const string& w) { TrieNode* n = walk(w); return n && n->end; }
    bool startsWith(const string& p) { return walk(p) != nullptr; }
};
```
```py
class TrieNode:
    def __init__(self): self.child = {}; self.end = False; self.cnt_end = 0; self.cnt_prefix = 0
class Trie:
    def __init__(self): self.root = TrieNode()
    def insert(self, w):
        n = self.root
        for c in w:
            n = n.child.setdefault(c, TrieNode()); n.cnt_prefix += 1
        n.end = True; n.cnt_end += 1
    def _walk(self, w):
        n = self.root
        for c in w:
            n = n.child.get(c)
            if not n: return None
        return n
    def search(self, w): n = self._walk(w); return bool(n and n.end)
    def starts_with(self, p): return self._walk(p) is not None
```
TC: O(L) per operation. SC: O(total characters x 26) worst.
### Trie Implementation and Advanced Operations
Idea: with the counters above we also get countWordsEqualTo (cntEnd), countWordsStartingWith (cntPrefix) and erase (walk and decrement).
```cpp
class Trie2 : public Trie {
public:
    int countWordsEqualTo(const string& w) { TrieNode* n = walk(w); return n ? n->cntEnd : 0; }
    int countWordsStartingWith(const string& p) { TrieNode* n = walk(p); return n ? n->cntPrefix : 0; }
    void erase(const string& w) {
        if (!search(w)) return;
        TrieNode* n = walk("");
        for (char c : w) { n = n->child[c - 'a']; n->cntPrefix--; }
        if (--n->cntEnd == 0) n->end = false;
    }
};
```
```py
class Trie2(Trie):
    def count_words_equal_to(self, w): n = self._walk(w); return n.cnt_end if n else 0
    def count_words_starting_with(self, p): n = self._walk(p); return n.cnt_prefix if n else 0
    def erase(self, w):
        if not self.search(w): return
        n = self.root
        for c in w: n = n.child[c]; n.cnt_prefix -= 1
        n.cnt_end -= 1; n.end = n.cnt_end > 0
```
TC: O(L). SC: O(1) extra.
### Longest Word with All Prefixes
Idea: insert all words. A word qualifies if every node on its path is an end of some word. Keep the longest (smallest lexicographically on ties).
```cpp
string completeString(vector<string>& words) {
    Trie t; for (auto& w : words) t.insert(w);
    string best;
    for (auto& w : words) {
        bool ok = true;
        for (int len = 1; len <= (int)w.size() && ok; len++) ok = t.search(w.substr(0, len));
        if (ok && (w.size() > best.size() || (w.size() == best.size() && w < best))) best = w;
    }
    return best.empty() ? "None" : best;
}
```
```py
def complete_string(words):
    t = Trie(); best = ""
    for w in words: t.insert(w)
    for w in words:
        n, ok = t.root, True
        for c in w:
            n = n.child[c]
            if not n.end: ok = False; break
        if ok and (len(w) > len(best) or (len(w) == len(best) and w < best)): best = w
    return best or "None"
```
TC: O(total characters). SC: O(total characters).
### Number of distinct substrings in a string
Idea: insert every suffix into a trie; each **new node** created is one new distinct substring. Add 1 for the empty substring if it is counted.
```cpp
int countDistinctSubstrings(string& s) {
    TrieNode* root = new TrieNode(); int cnt = 0;
    for (int i = 0; i < (int)s.size(); i++) {
        TrieNode* n = root;
        for (int j = i; j < (int)s.size(); j++) {
            if (!n->child[s[j] - 'a']) { n->child[s[j] - 'a'] = new TrieNode(); cnt++; }
            n = n->child[s[j] - 'a'];
        }
    }
    return cnt + 1;
}
```
```py
def count_distinct_substrings(s):
    root, cnt = {}, 0
    for i in range(len(s)):
        n = root
        for c in s[i:]:
            if c not in n: n[c] = {}; cnt += 1
            n = n[c]
    return cnt + 1
```
TC: O(n^2). SC: O(n^2) worst.
### Maximum XOR of two numbers in an array
```cpp
struct BitNode { BitNode* c[2] = {}; };
struct BitTrie {
    BitNode* root = new BitNode();
    void insert(int x) { BitNode* n = root; for (int b = 31; b >= 0; b--) { int bit = (x >> b) & 1; if (!n->c[bit]) n->c[bit] = new BitNode(); n = n->c[bit]; } }
    int maxXor(int x) {
        BitNode* n = root; int res = 0;
        for (int b = 31; b >= 0; b--) {
            int bit = (x >> b) & 1;
            if (n->c[1 - bit]) { res |= 1 << b; n = n->c[1 - bit]; } else n = n->c[bit];
        }
        return res;
    }
};
int findMaximumXOR(vector<int>& a) {
    BitTrie t; int best = 0;
    for (int x : a) t.insert(x);
    for (int x : a) best = max(best, t.maxXor(x));
    return best;
}
```
```py
class BitTrie:
    def __init__(self): self.root = {}
    def insert(self, x):
        n = self.root
        for b in range(31, -1, -1): n = n.setdefault((x >> b) & 1, {})
    def max_xor(self, x):
        n, res = self.root, 0
        for b in range(31, -1, -1):
            bit = (x >> b) & 1
            if 1 - bit in n: res |= 1 << b; n = n[1 - bit]
            else: n = n[bit]
        return res
def find_maximum_xor(a):
    t = BitTrie()
    for x in a: t.insert(x)
    return max(t.max_xor(x) for x in a)
```
TC: O(32 n). SC: O(32 n).
### Maximum Xor with an element from an array (queries [x, m]: only elements <= m)
Idea: **offline queries**. Sort the array and sort the queries by m. Insert elements <= m into the trie as m grows, then answer the query.
```cpp
vector<int> maximizeXor(vector<int>& a, vector<vector<int>>& queries) {
    sort(a.begin(), a.end()); int q = queries.size(); vector<int> idx(q), ans(q); iota(idx.begin(), idx.end(), 0);
    sort(idx.begin(), idx.end(), [&](int x, int y) { return queries[x][1] < queries[y][1]; });
    BitTrie t; int i = 0;
    for (int id : idx) {
        while (i < (int)a.size() && a[i] <= queries[id][1]) t.insert(a[i++]);
        ans[id] = i ? t.maxXor(queries[id][0]) : -1;
    }
    return ans;
}
```
```py
def maximize_xor(a, queries):
    a.sort(); t = BitTrie(); ans = [-1] * len(queries); i = 0
    for qi in sorted(range(len(queries)), key=lambda k: queries[k][1]):
        x, m = queries[qi]
        while i < len(a) and a[i] <= m: t.insert(a[i]); i += 1
        if i: ans[qi] = t.max_xor(x)
    return ans
```
TC: O(n log n + q log q + 32(n + q)). SC: O(32 n).
## Strings (Advanced Algo): Medium Problems
### Reverse every word in a string (reverse the order of words)
```cpp
string reverseWords(string s) {
    stringstream ss(s); string w, ans;
    while (ss >> w) ans = ans.empty() ? w : w + " " + ans;
    return ans;
}
```
```py
def reverse_words(s): return " ".join(reversed(s.split()))
```
TC: O(n) (C++ version O(n^2) worst because of prepending; push words to a vector and reverse for O(n)). SC: O(n).
### Minimum number of bracket reversals to make an expression balanced
Idea: remove all already balanced pairs. What remains looks like `}}}...{{{` with c closing and o opening. Answer = ceil(c / 2) + ceil(o / 2). Odd length is impossible.
```cpp
int countReversals(string s) {
    if (s.size() % 2) return -1;
    int open = 0, close = 0;
    for (char c : s) { if (c == '{') open++; else if (open) open--; else close++; }
    return (open + 1) / 2 + (close + 1) / 2;
}
```
```py
def count_reversals(s):
    if len(s) % 2: return -1
    open_ = close = 0
    for c in s:
        if c == '{': open_ += 1
        elif open_: open_ -= 1
        else: close += 1
    return (open_ + 1) // 2 + (close + 1) // 2
```
TC: O(n). SC: O(1).
### Count and say
Idea: each term describes the previous one: read runs of equal digits as "count digit". 1 -> 11 -> 21 -> 1211 -> 111221.
```cpp
string countAndSay(int n) {
    string s = "1";
    for (int t = 1; t < n; t++) {
        string nxt;
        for (int i = 0; i < (int)s.size();) { int j = i; while (j < (int)s.size() && s[j] == s[i]) j++; nxt += to_string(j - i) + s[i]; i = j; }
        s = nxt;
    }
    return s;
}
```
```py
def count_and_say(n):
    s = "1"
    for _ in range(n - 1):
        nxt, i = [], 0
        while i < len(s):
            j = i
            while j < len(s) and s[j] == s[i]: j += 1
            nxt.append(str(j - i) + s[i]); i = j
        s = "".join(nxt)
    return s
```
TC: O(n x length of term). SC: O(length).
## Strings (Advanced Algo): Advanced Problems
### Hashing In Strings (Theory)
- A **polynomial rolling hash** turns a string into a number: hash = s[0] x p^(n-1) + s[1] x p^(n-2) + ... (mod M), with p = 31 or 131 and M a big prime (1e9 + 7).
- Sliding a window by one char updates the hash in O(1): remove the left char's contribution, multiply by p, add the new char. Equal hashes mean "probably equal" - verify on a hit (or use two hashes) to avoid collisions.
### Rabin Karp Algorithm
```cpp
vector<int> rabinKarp(string& text, string& pat) {
    const long long P = 131, M = 1e9 + 7; int n = text.size(), m = pat.size(); vector<int> res;
    if (m > n) return res;
    long long hp = 0, ht = 0, power = 1;
    for (int i = 0; i < m; i++) { hp = (hp * P + pat[i]) % M; ht = (ht * P + text[i]) % M; if (i) power = power * P % M; }
    for (int i = 0; i + m <= n; i++) {
        if (hp == ht && text.compare(i, m, pat) == 0) res.push_back(i);
        if (i + m < n) ht = ((ht - text[i] * power % M + M) * P + text[i + m]) % M;
    }
    return res;
}
```
```py
def rabin_karp(text, pat):
    P, M = 131, 10**9 + 7; n, m = len(text), len(pat); res = []
    if m > n: return res
    hp = ht = 0; power = pow(P, m - 1, M)
    for i in range(m):
        hp = (hp * P + ord(pat[i])) % M; ht = (ht * P + ord(text[i])) % M
    for i in range(n - m + 1):
        if hp == ht and text[i:i + m] == pat: res.append(i)
        if i + m < n: ht = ((ht - ord(text[i]) * power) * P + ord(text[i + m])) % M
    return res
```
TC: O(n + m) average, O(n m) worst (many collisions). SC: O(1).
### Z function
Definition: z[i] = length of the longest substring starting at i that matches a **prefix** of the string. For pattern search build `pat + "$" + text`; positions with z[i] == len(pat) are matches.
Idea: keep the rightmost matched window [l, r). Inside it, z[i] can be copied from z[i - l] (bounded by r - i), then extended by direct comparison.
```cpp
vector<int> zFunction(const string& s) {
    int n = s.size(); vector<int> z(n, 0);
    for (int i = 1, l = 0, r = 0; i < n; i++) {
        if (i < r) z[i] = min(r - i, z[i - l]);
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
        if (i + z[i] > r) { l = i; r = i + z[i]; }
    }
    return z;
}
vector<int> zSearch(string& text, string& pat) {
    vector<int> z = zFunction(pat + "$" + text), res; int m = pat.size();
    for (int i = m + 1; i < (int)z.size(); i++) if (z[i] == m) res.push_back(i - m - 1);
    return res;
}
```
```py
def z_function(s):
    n = len(s); z = [0] * n; l = r = 0
    for i in range(1, n):
        if i < r: z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]: z[i] += 1
        if i + z[i] > r: l, r = i, i + z[i]
    return z
def z_search(text, pat):
    z, m = z_function(pat + "$" + text), len(pat)
    return [i - m - 1 for i in range(m + 1, len(z)) if z[i] == m]
```
TC: O(n + m). SC: O(n + m).
### KMP Algorithm or LPS array
Definition: lps[i] = length of the longest proper prefix of pat[0..i] that is also a suffix of it.
Idea: on a mismatch after matching j characters, we do not restart the text pointer; we fall back to j = lps[j - 1], because that many characters are already known to match.
@cells a b a b a c a :: lps = 0 0 1 2 3 0 1
```cpp
vector<int> buildLPS(const string& p) {
    int m = p.size(); vector<int> lps(m, 0);
    for (int i = 1, len = 0; i < m;) {
        if (p[i] == p[len]) lps[i++] = ++len;
        else if (len) len = lps[len - 1];
        else lps[i++] = 0;
    }
    return lps;
}
vector<int> kmpSearch(const string& text, const string& pat) {
    vector<int> lps = buildLPS(pat), res; int j = 0;
    for (int i = 0; i < (int)text.size(); i++) {
        while (j && text[i] != pat[j]) j = lps[j - 1];
        if (text[i] == pat[j]) j++;
        if (j == (int)pat.size()) { res.push_back(i - j + 1); j = lps[j - 1]; }
    }
    return res;
}
```
```py
def build_lps(p):
    lps, length, i = [0] * len(p), 0, 1
    while i < len(p):
        if p[i] == p[length]: length += 1; lps[i] = length; i += 1
        elif length: length = lps[length - 1]
        else: i += 1
    return lps
def kmp_search(text, pat):
    lps, res, j = build_lps(pat), [], 0
    for i, c in enumerate(text):
        while j and c != pat[j]: j = lps[j - 1]
        if c == pat[j]: j += 1
        if j == len(pat): res.append(i - j + 1); j = lps[j - 1]
    return res
```
TC: O(n + m) - the text pointer never moves back. SC: O(m).
### Shortest Palindrome (add characters only in front)
Idea: find the longest palindromic **prefix** of s. Build t = s + "#" + reverse(s); the last LPS value is that prefix length. Prepend the reverse of the remaining suffix.
```cpp
string shortestPalindrome(string s) {
    string r(s.rbegin(), s.rend());
    int keep = buildLPS(s + "#" + r).back();
    return r.substr(0, s.size() - keep) + s;
}
```
```py
def shortest_palindrome(s):
    if not s: return s
    r = s[::-1]; keep = build_lps(s + "#" + r)[-1]
    return r[:len(s) - keep] + s
```
TC: O(n). SC: O(n).
### Longest happy prefix (longest prefix that is also a suffix)
Idea: it is exactly the last value of the LPS array.
```cpp
string longestPrefix(string s) { return s.substr(0, buildLPS(s).back()); }
```
```py
def longest_prefix(s): return s[:build_lps(s)[-1]] if s else ""
```
TC: O(n). SC: O(n).
## Maths: Sieve of Eratosthenes
### Print all primes till N
Idea: start with all numbers marked prime. For each prime p, cross out p x p, p x p + p, ... (smaller multiples were already crossed by smaller primes).
@cells 2* 3* 4 5* 6 7* 8 9 10 11* :: multiples of 2, then 3 are crossed out; the starred ones remain
```cpp
vector<int> primesTill(int n) {
    vector<bool> is(n + 1, true); vector<int> primes; if (n >= 0) is[0] = false; if (n >= 1) is[1] = false;
    for (int i = 2; i <= n; i++) {
        if (!is[i]) continue;
        primes.push_back(i);
        for (long long j = (long long)i * i; j <= n; j += i) is[j] = false;
    }
    return primes;
}
```
```py
def primes_till(n):
    is_p = [True] * (n + 1); is_p[0:2] = [False] * min(2, n + 1); primes = []
    for i in range(2, n + 1):
        if is_p[i]:
            primes.append(i)
            for j in range(i * i, n + 1, i): is_p[j] = False
    return primes
```
TC: O(n log log n). SC: O(n).
### Prime factorisation of a Number
Idea: for many queries precompute **SPF** (smallest prime factor) of every number with a sieve; then divide n by spf[n] repeatedly - O(log n) per query.
```cpp
vector<int> buildSPF(int n) {
    vector<int> spf(n + 1); iota(spf.begin(), spf.end(), 0);
    for (int i = 2; (long long)i * i <= n; i++) if (spf[i] == i) for (int j = i * i; j <= n; j += i) if (spf[j] == j) spf[j] = i;
    return spf;
}
vector<int> primeFactors(int x, vector<int>& spf) {
    vector<int> f;
    while (x > 1) { f.push_back(spf[x]); x /= spf[x]; }
    return f;
}
```
```py
def build_spf(n):
    spf = list(range(n + 1)); i = 2
    while i * i <= n:
        if spf[i] == i:
            for j in range(i * i, n + 1, i):
                if spf[j] == j: spf[j] = i
        i += 1
    return spf
def prime_factors(x, spf):
    f = []
    while x > 1: f.append(spf[x]); x //= spf[x]
    return f
```
TC: sieve O(n log log n), each query O(log x). SC: O(n).
### Count primes in range L to R
Idea: sieve up to the maximum R once, build a **prefix count** of primes; each query is prefix[R] - prefix[L - 1].
```cpp
vector<int> countPrimesInRanges(vector<pair<int,int>>& queries) {
    int mx = 0; for (auto& q : queries) mx = max(mx, q.second);
    vector<bool> is(mx + 1, true); is[0] = false; if (mx >= 1) is[1] = false;
    for (int i = 2; (long long)i * i <= mx; i++) if (is[i]) for (int j = i * i; j <= mx; j += i) is[j] = false;
    vector<int> pre(mx + 1, 0), ans;
    for (int i = 1; i <= mx; i++) pre[i] = pre[i - 1] + is[i];
    for (auto& [l, r] : queries) ans.push_back(pre[r] - (l > 0 ? pre[l - 1] : 0));
    return ans;
}
```
```py
def count_primes_in_ranges(queries):
    mx = max(r for _, r in queries); is_p = [True] * (mx + 1); is_p[0] = False
    if mx >= 1: is_p[1] = False
    i = 2
    while i * i <= mx:
        if is_p[i]:
            for j in range(i * i, mx + 1, i): is_p[j] = False
        i += 1
    pre = [0] * (mx + 1)
    for i in range(1, mx + 1): pre[i] = pre[i - 1] + is_p[i]
    return [pre[r] - (pre[l - 1] if l > 0 else 0) for l, r in queries]
```
TC: O(mx log log mx + q). SC: O(mx).
## Last Minute Revision: Pattern Cheat Sheet
| If the problem says... | Think of... |
|---|---|
| sorted array, find / first / last | binary search |
| min X such that possible / max of min | binary search on the answer |
| subarray sum equals K | prefix sum + hash map |
| longest / shortest subarray or substring with a condition | sliding window |
| pair / triplet with a sum in sorted data | two pointers |
| next greater / smaller, histogram, span | monotonic stack |
| k largest / smallest, k-th, median of stream | heap |
| all subsets / permutations / combinations | recursion + backtracking |
| count ways, min / max with choices, overlapping work | dynamic programming |
| shortest path, unweighted | BFS |
| shortest path, weighted non-negative | Dijkstra |
| prerequisites / ordering | topological sort |
| connected groups, merging sets | DFS or Disjoint Set |
| prefix lookups, max XOR | trie |
| intervals, meetings | sort + greedy |
| linked list middle / cycle | slow and fast pointers |
| tree answer from children | postorder DFS |
## Most Asked in Top MNCs (do these first)
Asked in: Amazon, Google, Microsoft, Meta, Adobe, Flipkart, Walmart, Goldman Sachs, Oracle, Uber, Atlassian. Every problem below is solved in this notebook.
- **Arrays / Hashing**: Two Sum, 3 Sum, Kadane's Algorithm, Next Permutation, Sort 0 1 2, Majority Element, Merge Intervals, Set Matrix Zeroes, Spiral Matrix, Rotate Matrix, Longest Consecutive Sequence, Subarray Sum Equals K, Count Inversions, Maximum Product Subarray, Trapping Rainwater.
- **Binary Search**: Search in Rotated Sorted Array, Find Peak Element, Median of 2 Sorted Arrays, Koko Eating Bananas, Aggressive Cows, Book Allocation, Search a 2D Matrix.
- **Strings / Sliding window**: Longest Substring Without Repeating Characters, Minimum Window Substring, Longest Palindromic Substring, Valid Anagram, String to Integer, Longest Repeating Character Replacement, KMP.
- **Linked List**: Reverse a LL, Detect Cycle and its start, Merge Two Sorted Lists, Remove Nth From End, Reverse in K Groups, Clone List with Random Pointer, Add Two Numbers, LRU Cache, Merge K Sorted Lists.
- **Stack / Queue**: Valid Parentheses, Min Stack, Next Greater Element, Largest Rectangle in Histogram, Sliding Window Maximum, Stock Span.
- **Trees / BST**: Level Order, Zig Zag, Diameter, LCA, Maximum Path Sum, Right View, Vertical Order, Validate BST, Kth Smallest in BST, Serialize / Deserialize, Construct from Preorder + Inorder.
- **Heaps / Greedy**: Kth Largest, Top K Frequent, Median from Data Stream, Task Scheduler, N Meetings, Jump Game I and II, Candy.
- **Graphs**: Number of Islands, Rotten Oranges, Course Schedule I and II, Word Ladder, Dijkstra, Detect Cycle, Bipartite, Alien Dictionary, Number of Provinces, MST, Bridges.
- **DP**: Climbing Stairs, House Robber, Coin Change, 0/1 Knapsack, LIS, LCS, Edit Distance, Partition Equal Subset Sum, Word Break, Unique Paths, Buy and Sell Stock (all), Burst Balloons, Palindrome Partitioning II.
- **Backtracking / Bits / Trie**: N Queens, Sudoku Solver, Subsets, Combination Sum, Generate Parentheses, Single Number, Power Set, Implement Trie, Maximum XOR.
## Last Minute Practice Set (solve without looking)
1. Reverse a linked list iteratively and recursively. (O(n), O(1) / O(n))
2. Find the first non-repeating character in a string. (hash count, O(n))
3. Two Sum, then 3 Sum without duplicates. (hash map / sort + two pointers)
4. Maximum subarray sum and print the subarray. (Kadane, track start index)
5. Check balanced parentheses. (stack)
6. Merge two sorted arrays / lists. (two pointers)
7. Binary search: first and last position of x. (lower / upper bound)
8. Level order traversal and height of a binary tree. (BFS / DFS)
9. Detect a cycle in a linked list and in a graph. (Floyd / DFS / Kahn)
10. Number of islands. (DFS flood fill)
11. Longest substring without repeating characters. (sliding window)
12. Climbing stairs and coin change. (1D DP)
13. Kth largest element. (min heap of size k)
14. LRU cache. (hash map + doubly linked list)
15. Longest common subsequence and edit distance. (2D DP)
> In the interview: repeat the question, ask about constraints and edge cases, say the brute force first, then optimise, then code while talking, then dry run your own code and state TC and SC.
