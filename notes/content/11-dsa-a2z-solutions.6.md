## Graphs: Theory and Traversals
### Introduction to Graph
- A **graph** is a set of **vertices** (nodes) joined by **edges**. It models networks: roads, friends, web pages, dependencies.
- **Undirected** (edge works both ways) vs **directed** (one way, also called digraph). **Weighted** (edges have a cost) vs unweighted.
- **Degree** = number of edges at a node. In a directed graph: indegree (incoming) and outdegree (outgoing). **Path** = sequence of edges; **cycle** = path that returns to its start. **DAG** = Directed Acyclic Graph. A **tree** is a connected graph with n - 1 edges and no cycle.
@graph A-B A-C B-D C-D D-E :: Undirected graph with 5 vertices and 5 edges
| Representation | Space | Check edge (u, v) | List neighbours |
|---|---|---|---|
| Adjacency matrix | O(V^2) | O(1) | O(V) |
| Adjacency list | O(V + E) | O(degree) | O(degree) |
```cpp
// adjacency list for n nodes from an edge list
vector<vector<int>> buildAdj(int n, vector<vector<int>>& edges, bool directed = false) {
    vector<vector<int>> adj(n);
    for (auto& e : edges) { adj[e[0]].push_back(e[1]); if (!directed) adj[e[1]].push_back(e[0]); }
    return adj;
}
```
```py
def build_adj(n, edges, directed=False):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        if not directed: adj[v].append(u)
    return adj
```
### Traversal Techniques (BFS and DFS)
- **BFS** (Breadth First Search): visit level by level using a **queue**. It reaches every node by the fewest edges, so it gives the **shortest path in an unweighted graph**.
- **DFS** (Depth First Search): go as deep as possible, then backtrack, using **recursion / a stack**. Good for connectivity, cycles, topological order, components.
- Both need a `visited` array so a node is processed only once.
@flow (push source, mark visited) | <queue empty? ~ pop node u, process it> | (done) :: BFS: for each unvisited neighbour v of u: mark visited and push v, repeat
@graph 0-1 0-2 1-3 1-4 2-5 :: BFS from 0: 0 1 2 3 4 5.  DFS from 0: 0 1 3 4 2 5
```cpp
vector<int> bfs(int src, vector<vector<int>>& adj) {
    vector<int> order; vector<bool> vis(adj.size(), false);
    queue<int> q; q.push(src); vis[src] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (!vis[v]) { vis[v] = true; q.push(v); }
    }
    return order;
}
void dfs(int u, vector<vector<int>>& adj, vector<bool>& vis, vector<int>& order) {
    vis[u] = true; order.push_back(u);
    for (int v : adj[u]) if (!vis[v]) dfs(v, adj, vis, order);
}
```
```py
from collections import deque
def bfs(src, adj):
    order, vis, q = [], [False] * len(adj), deque([src]); vis[src] = True
    while q:
        u = q.popleft(); order.append(u)
        for v in adj[u]:
            if not vis[v]: vis[v] = True; q.append(v)
    return order
def dfs(u, adj, vis, order):
    vis[u] = True; order.append(u)
    for v in adj[u]:
        if not vis[v]: dfs(v, adj, vis, order)
```
TC: O(V + E) - every vertex is queued once and every edge is looked at once (twice if undirected). SC: O(V).
### Connected Components
Idea: start a DFS/BFS from every unvisited node; each start discovers one whole component.
```cpp
int countComponents(int n, vector<vector<int>>& adj) {
    vector<bool> vis(n, false); vector<int> order; int comps = 0;
    for (int i = 0; i < n; i++) if (!vis[i]) { comps++; dfs(i, adj, vis, order); }
    return comps;
}
```
```py
def count_components(n, adj):
    vis, comps = [False] * n, 0
    for i in range(n):
        if not vis[i]: comps += 1; dfs(i, adj, vis, [])
    return comps
```
TC: O(V + E). SC: O(V).
## Graphs: Traversal Problems
### Number of provinces
Idea: the adjacency **matrix** gives connections; count connected components.
```cpp
int findCircleNum(vector<vector<int>>& M) {
    int n = M.size(), comps = 0; vector<bool> vis(n, false);
    function<void(int)> go = [&](int u) { vis[u] = true; for (int v = 0; v < n; v++) if (M[u][v] && !vis[v]) go(v); };
    for (int i = 0; i < n; i++) if (!vis[i]) { comps++; go(i); }
    return comps;
}
```
```py
def find_circle_num(M):
    n = len(M); vis = [False] * n; comps = 0
    def go(u):
        vis[u] = True
        for v in range(n):
            if M[u][v] and not vis[v]: go(v)
    for i in range(n):
        if not vis[i]: comps += 1; go(i)
    return comps
```
TC: O(V^2). SC: O(V).
### Number of islands
Idea: a grid is a graph: each cell is a node, neighbours are up/down/left/right. Every unvisited land cell starts a flood fill that sinks the whole island.
@grid 1* 1* 0 0 / 1* 0 0 1 / 0 0 1 1 :: 2 islands (4-directional)
```cpp
void sink(vector<vector<char>>& g, int i, int j) {
    if (i < 0 || j < 0 || i >= (int)g.size() || j >= (int)g[0].size() || g[i][j] != '1') return;
    g[i][j] = '0';
    sink(g, i + 1, j); sink(g, i - 1, j); sink(g, i, j + 1); sink(g, i, j - 1);
}
int numIslands(vector<vector<char>>& g) {
    int cnt = 0;
    for (int i = 0; i < (int)g.size(); i++) for (int j = 0; j < (int)g[0].size(); j++)
        if (g[i][j] == '1') { cnt++; sink(g, i, j); }
    return cnt;
}
```
```py
def num_islands(g):
    n, m, cnt = len(g), len(g[0]), 0
    def sink(i, j):
        st = [(i, j)]; g[i][j] = '0'
        while st:
            x, y = st.pop()
            for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= a < n and 0 <= b < m and g[a][b] == '1': g[a][b] = '0'; st.append((a, b))
    for i in range(n):
        for j in range(m):
            if g[i][j] == '1': cnt += 1; sink(i, j)
    return cnt
```
TC: O(n x m). SC: O(n x m) worst stack.
### Flood fill algorithm
```cpp
void fill(vector<vector<int>>& img, int i, int j, int old, int color) {
    if (i < 0 || j < 0 || i >= (int)img.size() || j >= (int)img[0].size() || img[i][j] != old) return;
    img[i][j] = color;
    fill(img, i + 1, j, old, color); fill(img, i - 1, j, old, color); fill(img, i, j + 1, old, color); fill(img, i, j - 1, old, color);
}
vector<vector<int>> floodFill(vector<vector<int>>& img, int sr, int sc, int color) {
    if (img[sr][sc] != color) fill(img, sr, sc, img[sr][sc], color);
    return img;
}
```
```py
def flood_fill(img, sr, sc, color):
    old = img[sr][sc]
    if old == color: return img
    st = [(sr, sc)]; img[sr][sc] = color
    while st:
        x, y = st.pop()
        for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= a < len(img) and 0 <= b < len(img[0]) and img[a][b] == old: img[a][b] = color; st.append((a, b))
    return img
```
TC: O(n x m). SC: O(n x m).
### Number of enclaves
Idea: land connected to the border can walk off. Flood from all border land cells; count the land that remains.
```cpp
int numEnclaves(vector<vector<int>>& g) {
    int n = g.size(), m = g[0].size();
    function<void(int,int)> go = [&](int i, int j) {
        if (i < 0 || j < 0 || i >= n || j >= m || g[i][j] != 1) return;
        g[i][j] = 0; go(i + 1, j); go(i - 1, j); go(i, j + 1); go(i, j - 1);
    };
    for (int i = 0; i < n; i++) { go(i, 0); go(i, m - 1); }
    for (int j = 0; j < m; j++) { go(0, j); go(n - 1, j); }
    int cnt = 0; for (auto& r : g) for (int x : r) cnt += x;
    return cnt;
}
```
```py
def num_enclaves(g):
    n, m = len(g), len(g[0])
    st = [(i, j) for i in range(n) for j in range(m) if (i in (0, n - 1) or j in (0, m - 1)) and g[i][j] == 1]
    for i, j in st: g[i][j] = 0
    while st:
        x, y = st.pop()
        for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= a < n and 0 <= b < m and g[a][b] == 1: g[a][b] = 0; st.append((a, b))
    return sum(map(sum, g))
```
TC: O(n x m). SC: O(n x m).
### Rotten Oranges
Idea: **multi-source BFS**. Put all rotten oranges in the queue at time 0; each BFS level is one minute. If fresh oranges remain, return -1.
```cpp
int orangesRotting(vector<vector<int>>& g) {
    int n = g.size(), m = g[0].size(), fresh = 0, mins = 0; queue<pair<int,int>> q;
    for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) { if (g[i][j] == 2) q.push({i, j}); else if (g[i][j] == 1) fresh++; }
    int d[5] = {0, 1, 0, -1, 0};
    while (!q.empty() && fresh) {
        int sz = q.size(); mins++;
        while (sz--) {
            auto [x, y] = q.front(); q.pop();
            for (int k = 0; k < 4; k++) {
                int a = x + d[k], b = y + d[k + 1];
                if (a >= 0 && b >= 0 && a < n && b < m && g[a][b] == 1) { g[a][b] = 2; fresh--; q.push({a, b}); }
            }
        }
    }
    return fresh ? -1 : mins;
}
```
```py
def oranges_rotting(g):
    n, m = len(g), len(g[0]); q = deque(); fresh = mins = 0
    for i in range(n):
        for j in range(m):
            if g[i][j] == 2: q.append((i, j))
            elif g[i][j] == 1: fresh += 1
    while q and fresh:
        mins += 1
        for _ in range(len(q)):
            x, y = q.popleft()
            for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= a < n and 0 <= b < m and g[a][b] == 1: g[a][b] = 2; fresh -= 1; q.append((a, b))
    return -1 if fresh else mins
```
TC: O(n x m). SC: O(n x m).
### Distance of nearest cell having one
Idea: multi-source BFS starting from **all the 1 cells** at distance 0; the first time a 0 cell is reached is its nearest distance.
```cpp
vector<vector<int>> nearest(vector<vector<int>>& g) {
    int n = g.size(), m = g[0].size(); vector<vector<int>> dist(n, vector<int>(m, -1)); queue<pair<int,int>> q;
    for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) if (g[i][j] == 1) { dist[i][j] = 0; q.push({i, j}); }
    int d[5] = {0, 1, 0, -1, 0};
    while (!q.empty()) {
        auto [x, y] = q.front(); q.pop();
        for (int k = 0; k < 4; k++) {
            int a = x + d[k], b = y + d[k + 1];
            if (a >= 0 && b >= 0 && a < n && b < m && dist[a][b] == -1) { dist[a][b] = dist[x][y] + 1; q.push({a, b}); }
        }
    }
    return dist;
}
```
```py
def nearest(g):
    n, m = len(g), len(g[0]); dist = [[-1] * m for _ in range(n)]; q = deque()
    for i in range(n):
        for j in range(m):
            if g[i][j] == 1: dist[i][j] = 0; q.append((i, j))
    while q:
        x, y = q.popleft()
        for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= a < n and 0 <= b < m and dist[a][b] == -1: dist[a][b] = dist[x][y] + 1; q.append((a, b))
    return dist
```
TC: O(n x m). SC: O(n x m).
### Surrounded Regions
Idea: an 'O' region survives only if it touches the border. Mark border-connected 'O' as safe ('#'), flip every other 'O' to 'X', restore '#'.
```cpp
void solveRegions(vector<vector<char>>& b) {
    int n = b.size(), m = b[0].size();
    function<void(int,int)> go = [&](int i, int j) {
        if (i < 0 || j < 0 || i >= n || j >= m || b[i][j] != 'O') return;
        b[i][j] = '#'; go(i + 1, j); go(i - 1, j); go(i, j + 1); go(i, j - 1);
    };
    for (int i = 0; i < n; i++) { go(i, 0); go(i, m - 1); }
    for (int j = 0; j < m; j++) { go(0, j); go(n - 1, j); }
    for (auto& r : b) for (char& c : r) c = (c == '#') ? 'O' : 'X';
}
```
```py
def solve_regions(b):
    n, m = len(b), len(b[0])
    st = [(i, j) for i in range(n) for j in range(m) if (i in (0, n - 1) or j in (0, m - 1)) and b[i][j] == 'O']
    for i, j in st: b[i][j] = '#'
    while st:
        x, y = st.pop()
        for a, c in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= a < n and 0 <= c < m and b[a][c] == 'O': b[a][c] = '#'; st.append((a, c))
    for i in range(n):
        for j in range(m): b[i][j] = 'O' if b[i][j] == '#' else 'X'
```
TC: O(n x m). SC: O(n x m).
### Number of distinct islands
Idea: two islands are the same if their **shape** is the same. Record each cell's offset from the island's first cell; store the shapes in a set.
```cpp
int countDistinctIslands(vector<vector<int>>& g) {
    int n = g.size(), m = g[0].size(); set<vector<pair<int,int>>> shapes;
    for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) if (g[i][j] == 1) {
        vector<pair<int,int>> shape;
        function<void(int,int)> go = [&](int x, int y) {
            if (x < 0 || y < 0 || x >= n || y >= m || g[x][y] != 1) return;
            g[x][y] = 0; shape.push_back({x - i, y - j});
            go(x + 1, y); go(x - 1, y); go(x, y + 1); go(x, y - 1);
        };
        go(i, j); shapes.insert(shape);
    }
    return shapes.size();
}
```
```py
def count_distinct_islands(g):
    n, m, shapes = len(g), len(g[0]), set()
    for i in range(n):
        for j in range(m):
            if g[i][j] == 1:
                shape, st = [], [(i, j)]; g[i][j] = 0
                while st:
                    x, y = st.pop(); shape.append((x - i, y - j))
                    for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                        if 0 <= a < n and 0 <= b < m and g[a][b] == 1: g[a][b] = 0; st.append((a, b))
                shapes.add(tuple(sorted(shape)))
    return len(shapes)
```
TC: O(n x m log(n x m)). SC: O(n x m).
## Graphs: Cycles
### Detect a cycle in an undirected graph
Idea: DFS remembering the **parent**. Reaching an already visited node that is not the parent means a cycle.
```cpp
bool cycleDfs(int u, int parent, vector<vector<int>>& adj, vector<bool>& vis) {
    vis[u] = true;
    for (int v : adj[u]) {
        if (!vis[v]) { if (cycleDfs(v, u, adj, vis)) return true; }
        else if (v != parent) return true;
    }
    return false;
}
bool hasCycleUndirected(int n, vector<vector<int>>& adj) {
    vector<bool> vis(n, false);
    for (int i = 0; i < n; i++) if (!vis[i] && cycleDfs(i, -1, adj, vis)) return true;
    return false;
}
```
```py
def has_cycle_undirected(n, adj):
    vis = [False] * n
    def go(u, parent):
        vis[u] = True
        for v in adj[u]:
            if not vis[v]:
                if go(v, u): return True
            elif v != parent: return True
        return False
    return any(not vis[i] and go(i, -1) for i in range(n))
```
TC: O(V + E). SC: O(V).
### Bipartite graph
Idea: a graph is bipartite if it can be 2-coloured so that every edge joins different colours (equivalently: no odd cycle). BFS/DFS giving each neighbour the opposite colour; a conflict means not bipartite.
```cpp
bool isBipartite(vector<vector<int>>& adj) {
    int n = adj.size(); vector<int> color(n, -1);
    for (int s = 0; s < n; s++) if (color[s] == -1) {
        queue<int> q; q.push(s); color[s] = 0;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) {
                if (color[v] == -1) { color[v] = 1 - color[u]; q.push(v); }
                else if (color[v] == color[u]) return false;
            }
        }
    }
    return true;
}
```
```py
def is_bipartite(adj):
    n = len(adj); color = [-1] * n
    for s in range(n):
        if color[s] != -1: continue
        q = deque([s]); color[s] = 0
        while q:
            u = q.popleft()
            for v in adj[u]:
                if color[v] == -1: color[v] = 1 - color[u]; q.append(v)
                elif color[v] == color[u]: return False
    return True
```
TC: O(V + E). SC: O(V).
### Topological sort or Kahn's algorithm
Definition: a topological order of a DAG lists the nodes so that for every edge u -> v, u comes before v (do prerequisites first).
Idea: (Kahn, BFS) a node with **indegree 0** has no pending prerequisite. Repeatedly take such a node, output it, and reduce the indegree of its neighbours.
@graph A>B A>C B>D C>D D>E :: Topological order: A B C D E
```cpp
vector<int> topoSort(int n, vector<vector<int>>& adj) {
    vector<int> indeg(n, 0), order;
    for (int u = 0; u < n; u++) for (int v : adj[u]) indeg[v]++;
    queue<int> q; for (int i = 0; i < n; i++) if (!indeg[i]) q.push(i);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);
    }
    return order;              // size < n means the graph has a cycle
}
```
```py
def topo_sort(n, adj):
    indeg = [0] * n
    for u in range(n):
        for v in adj[u]: indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0); order = []
    while q:
        u = q.popleft(); order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0: q.append(v)
    return order
```
TC: O(V + E). SC: O(V).
### Detect a cycle in a directed graph
Idea: run Kahn's algorithm; nodes on a cycle never reach indegree 0, so the order is shorter than n. (DFS alternative: a back edge to a node on the current recursion path.)
```cpp
bool hasCycleDirected(int n, vector<vector<int>>& adj) { return (int)topoSort(n, adj).size() < n; }
```
```py
def has_cycle_directed(n, adj): return len(topo_sort(n, adj)) < n
```
TC: O(V + E). SC: O(V).
## Graphs: Hard Problems
### Find eventual safe states
Idea: a node is safe if every path from it ends at a terminal node. Reverse all edges and run Kahn's from the terminal nodes; whatever gets removed is safe.
```cpp
vector<int> eventualSafeNodes(vector<vector<int>>& g) {
    int n = g.size(); vector<vector<int>> rev(n); vector<int> outdeg(n), safe;
    for (int u = 0; u < n; u++) { outdeg[u] = g[u].size(); for (int v : g[u]) rev[v].push_back(u); }
    queue<int> q; for (int i = 0; i < n; i++) if (!outdeg[i]) q.push(i);
    while (!q.empty()) { int u = q.front(); q.pop(); safe.push_back(u); for (int p : rev[u]) if (--outdeg[p] == 0) q.push(p); }
    sort(safe.begin(), safe.end());
    return safe;
}
```
```py
def eventual_safe_nodes(g):
    n = len(g); rev = [[] for _ in range(n)]; outdeg = [len(x) for x in g]
    for u in range(n):
        for v in g[u]: rev[v].append(u)
    q = deque(i for i in range(n) if outdeg[i] == 0); safe = []
    while q:
        u = q.popleft(); safe.append(u)
        for p in rev[u]:
            outdeg[p] -= 1
            if outdeg[p] == 0: q.append(p)
    return sorted(safe)
```
TC: O(V + E). SC: O(V + E).
### Course Schedule I
Idea: courses are nodes, prerequisite [a, b] is an edge b -> a. All courses can be finished if there is no cycle.
```cpp
bool canFinish(int n, vector<vector<int>>& pre) {
    vector<vector<int>> adj(n); for (auto& p : pre) adj[p[1]].push_back(p[0]);
    return (int)topoSort(n, adj).size() == n;
}
```
```py
def can_finish(n, pre):
    adj = [[] for _ in range(n)]
    for a, b in pre: adj[b].append(a)
    return len(topo_sort(n, adj)) == n
```
TC: O(V + E). SC: O(V + E).
### Course Schedule II
```cpp
vector<int> findOrder(int n, vector<vector<int>>& pre) {
    vector<vector<int>> adj(n); for (auto& p : pre) adj[p[1]].push_back(p[0]);
    vector<int> order = topoSort(n, adj);
    return (int)order.size() == n ? order : vector<int>{};
}
```
```py
def find_order(n, pre):
    adj = [[] for _ in range(n)]
    for a, b in pre: adj[b].append(a)
    order = topo_sort(n, adj)
    return order if len(order) == n else []
```
TC: O(V + E). SC: O(V + E).
### Alien Dictionary
Idea: compare each pair of adjacent words; the first differing letters give an edge (letter of word1 -> letter of word2). Topologically sort the k letters.
```cpp
string alienOrder(vector<string>& words, int k) {
    vector<vector<int>> adj(k);
    for (int i = 0; i + 1 < (int)words.size(); i++) {
        string &a = words[i], &b = words[i + 1];
        for (int j = 0; j < (int)min(a.size(), b.size()); j++)
            if (a[j] != b[j]) { adj[a[j] - 'a'].push_back(b[j] - 'a'); break; }
    }
    string ans; for (int x : topoSort(k, adj)) ans += char('a' + x);
    return (int)ans.size() == k ? ans : "";
}
```
```py
def alien_order(words, k):
    adj = [[] for _ in range(k)]
    for a, b in zip(words, words[1:]):
        for x, y in zip(a, b):
            if x != y: adj[ord(x) - 97].append(ord(y) - 97); break
    order = topo_sort(k, adj)
    return "".join(chr(97 + x) for x in order) if len(order) == k else ""
```
TC: O(total letters + k). SC: O(k + edges).
### Shortest path in DAG
Idea: process nodes in topological order and relax their outgoing edges. Every node's distance is final before we use it. Works with negative weights too.
```cpp
vector<int> shortestPathDAG(int n, vector<vector<pair<int,int>>>& adj, int src) {
    vector<int> indeg(n, 0), dist(n, INT_MAX), order;
    for (int u = 0; u < n; u++) for (auto& [v, w] : adj[u]) indeg[v]++;
    queue<int> q; for (int i = 0; i < n; i++) if (!indeg[i]) q.push(i);
    while (!q.empty()) { int u = q.front(); q.pop(); order.push_back(u); for (auto& [v, w] : adj[u]) if (--indeg[v] == 0) q.push(v); }
    dist[src] = 0;
    for (int u : order) if (dist[u] != INT_MAX) for (auto& [v, w] : adj[u]) dist[v] = min(dist[v], dist[u] + w);
    for (int& d : dist) if (d == INT_MAX) d = -1;
    return dist;
}
```
```py
def shortest_path_dag(n, adj, src):          # adj[u] = [(v, w)]
    order = topo_sort(n, [[v for v, _ in adj[u]] for u in range(n)])
    INF = float('inf'); dist = [INF] * n; dist[src] = 0
    for u in order:
        if dist[u] == INF: continue
        for v, w in adj[u]: dist[v] = min(dist[v], dist[u] + w)
    return [-1 if d == INF else d for d in dist]
```
TC: O(V + E). SC: O(V).
### Shortest path in undirected graph with unit weights
Idea: plain BFS; dist[v] = dist[u] + 1 on first visit.
```cpp
vector<int> shortestPathUnit(int n, vector<vector<int>>& adj, int src) {
    vector<int> dist(n, -1); queue<int> q; q.push(src); dist[src] = 0;
    while (!q.empty()) { int u = q.front(); q.pop(); for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); } }
    return dist;
}
```
```py
def shortest_path_unit(n, adj, src):
    dist = [-1] * n; dist[src] = 0; q = deque([src])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if dist[v] == -1: dist[v] = dist[u] + 1; q.append(v)
    return dist
```
TC: O(V + E). SC: O(V).
### Word ladder I
Idea: words are nodes; two words are neighbours if they differ in one letter. BFS from beginWord; to find neighbours change each position to 'a'..'z' and look it up in the set.
```cpp
int ladderLength(string begin, string end, vector<string>& wordList) {
    unordered_set<string> dict(wordList.begin(), wordList.end());
    queue<pair<string,int>> q; q.push({begin, 1}); dict.erase(begin);
    while (!q.empty()) {
        auto [w, steps] = q.front(); q.pop();
        if (w == end) return steps;
        for (int i = 0; i < (int)w.size(); i++) {
            char orig = w[i];
            for (char c = 'a'; c <= 'z'; c++) {
                w[i] = c;
                if (dict.count(w)) { dict.erase(w); q.push({w, steps + 1}); }
            }
            w[i] = orig;
        }
    }
    return 0;
}
```
```py
def ladder_length(begin, end, word_list):
    words = set(word_list); q = deque([(begin, 1)]); words.discard(begin)
    while q:
        w, steps = q.popleft()
        if w == end: return steps
        for i in range(len(w)):
            for c in "abcdefghijklmnopqrstuvwxyz":
                nw = w[:i] + c + w[i + 1:]
                if nw in words: words.remove(nw); q.append((nw, steps + 1))
    return 0
```
TC: O(N x L x 26), N words of length L. SC: O(N x L).
### Word ladder II
Idea: BFS records each word's **level**. Then DFS backwards from endWord, stepping only to words whose level is exactly one less - this rebuilds all shortest sequences without exploring dead ends.
```cpp
vector<vector<string>> findLadders(string begin, string end, vector<string>& wordList) {
    unordered_set<string> dict(wordList.begin(), wordList.end()); unordered_map<string,int> level;
    queue<string> q; q.push(begin); level[begin] = 0; dict.erase(begin);
    while (!q.empty()) {
        string w = q.front(); q.pop(); int lv = level[w];
        if (w == end) break;
        for (int i = 0; i < (int)w.size(); i++) {
            string nw = w;
            for (char c = 'a'; c <= 'z'; c++) { nw[i] = c; if (dict.count(nw)) { dict.erase(nw); level[nw] = lv + 1; q.push(nw); } }
        }
    }
    vector<vector<string>> ans; if (!level.count(end)) return ans;
    vector<string> path = {end};
    function<void(string)> back = [&](string w) {
        if (w == begin) { ans.push_back(vector<string>(path.rbegin(), path.rend())); return; }
        int lv = level[w];
        for (int i = 0; i < (int)w.size(); i++) {
            string nw = w;
            for (char c = 'a'; c <= 'z'; c++) {
                nw[i] = c;
                auto it = level.find(nw);
                if (it != level.end() && it->second == lv - 1) { path.push_back(nw); back(nw); path.pop_back(); }
            }
        }
    };
    back(end);
    return ans;
}
```
```py
def find_ladders(begin, end, word_list):
    words = set(word_list); level = {begin: 0}; q = deque([begin]); words.discard(begin)
    letters = "abcdefghijklmnopqrstuvwxyz"
    while q:
        w = q.popleft()
        if w == end: break
        for i in range(len(w)):
            for c in letters:
                nw = w[:i] + c + w[i + 1:]
                if nw in words: words.remove(nw); level[nw] = level[w] + 1; q.append(nw)
    ans = []
    if end not in level: return ans
    path = [end]
    def back(w):
        if w == begin: ans.append(path[::-1]); return
        for i in range(len(w)):
            for c in letters:
                nw = w[:i] + c + w[i + 1:]
                if level.get(nw, -5) == level[w] - 1: path.append(nw); back(nw); path.pop()
    back(end)
    return ans
```
TC: O(N x L x 26) for the BFS plus the number of answers. SC: O(N x L).
## Graphs: Shortest Path Algorithms
| Algorithm | Works for | Time | Idea |
|---|---|---|---|
| BFS | unweighted | O(V + E) | level by level |
| Dijkstra | non-negative weights | O(E log V) | always expand the closest node |
| Bellman-Ford | negative weights, detects negative cycle | O(V x E) | relax all edges V - 1 times |
| Floyd-Warshall | all pairs | O(V^3) | try every node as a middle point |
### Dijkstra's algorithm
Idea: greedy. Keep a min heap of (distance, node). Pop the closest unsettled node - its distance is final because all weights are non-negative - and **relax** its edges: if dist[u] + w < dist[v], update and push.
@graph A-B:4 A-C:1 C-B:2 B-D:5 C-D:8 :: From A: C = 1, B = 3 (via C), D = 8 (A-C-B-D)
```cpp
vector<int> dijkstra(int n, vector<vector<pair<int,int>>>& adj, int src) {
    vector<int> dist(n, INT_MAX);
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
    dist[src] = 0; pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;                       // stale entry
        for (auto& [v, w] : adj[u])
            if (d + w < dist[v]) { dist[v] = d + w; pq.push({dist[v], v}); }
    }
    return dist;
}
```
```py
import heapq
def dijkstra(n, adj, src):                 # adj[u] = [(v, w)]
    dist = [float('inf')] * n; dist[src] = 0; pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in adj[u]:
            if d + w < dist[v]: dist[v] = d + w; heapq.heappush(pq, (dist[v], v))
    return dist
```
TC: O(E log V) - each edge can push one heap entry. SC: O(V + E).
### Print Shortest Path
Idea: remember `parent[v] = u` whenever v is improved through u; walk the parents back from the target.
```cpp
vector<int> shortestPath(int n, vector<vector<pair<int,int>>>& adj, int src, int dst) {
    vector<long long> dist(n, LLONG_MAX); vector<int> parent(n, -1);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[src] = 0; pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) if (d + w < dist[v]) { dist[v] = d + w; parent[v] = u; pq.push({dist[v], v}); }
    }
    if (dist[dst] == LLONG_MAX) return {-1};
    vector<int> path; for (int v = dst; v != -1; v = parent[v]) path.push_back(v);
    reverse(path.begin(), path.end());
    return path;
}
```
```py
def shortest_path(n, adj, src, dst):
    dist = [float('inf')] * n; parent = [-1] * n; dist[src] = 0; pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in adj[u]:
            if d + w < dist[v]: dist[v] = d + w; parent[v] = u; heapq.heappush(pq, (dist[v], v))
    if dist[dst] == float('inf'): return [-1]
    path, v = [], dst
    while v != -1: path.append(v); v = parent[v]
    return path[::-1]
```
TC: O(E log V). SC: O(V).
### Shortest Distance in a Binary Maze
Idea: all moves cost 1, so plain BFS on the grid (cells with 1 are walkable).
```cpp
int shortestBinaryMaze(vector<vector<int>>& g, pair<int,int> s, pair<int,int> t) {
    int n = g.size(), m = g[0].size(); vector<vector<int>> dist(n, vector<int>(m, -1));
    if (!g[s.first][s.second]) return -1;
    queue<pair<int,int>> q; q.push(s); dist[s.first][s.second] = 0; int d[5] = {0, 1, 0, -1, 0};
    while (!q.empty()) {
        auto [x, y] = q.front(); q.pop();
        if (make_pair(x, y) == t) return dist[x][y];
        for (int k = 0; k < 4; k++) {
            int a = x + d[k], b = y + d[k + 1];
            if (a >= 0 && b >= 0 && a < n && b < m && g[a][b] == 1 && dist[a][b] == -1) { dist[a][b] = dist[x][y] + 1; q.push({a, b}); }
        }
    }
    return -1;
}
```
```py
def shortest_binary_maze(g, s, t):
    n, m = len(g), len(g[0])
    if not g[s[0]][s[1]]: return -1
    dist = {s: 0}; q = deque([s])
    while q:
        x, y = q.popleft()
        if (x, y) == t: return dist[(x, y)]
        for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= a < n and 0 <= b < m and g[a][b] == 1 and (a, b) not in dist: dist[(a, b)] = dist[(x, y)] + 1; q.append((a, b))
    return -1
```
TC: O(n x m). SC: O(n x m).
### Path with minimum effort
Idea: Dijkstra where the "distance" of a path is its **maximum** height difference instead of the sum. Relax with max(effort so far, |height difference|).
```cpp
int minimumEffortPath(vector<vector<int>>& h) {
    int n = h.size(), m = h[0].size(); vector<vector<int>> eff(n, vector<int>(m, INT_MAX));
    priority_queue<array<int,3>, vector<array<int,3>>, greater<>> pq; pq.push({0, 0, 0}); eff[0][0] = 0;
    int d[5] = {0, 1, 0, -1, 0};
    while (!pq.empty()) {
        auto [e, x, y] = pq.top(); pq.pop();
        if (x == n - 1 && y == m - 1) return e;
        if (e > eff[x][y]) continue;
        for (int k = 0; k < 4; k++) {
            int a = x + d[k], b = y + d[k + 1];
            if (a < 0 || b < 0 || a >= n || b >= m) continue;
            int ne = max(e, abs(h[a][b] - h[x][y]));
            if (ne < eff[a][b]) { eff[a][b] = ne; pq.push({ne, a, b}); }
        }
    }
    return 0;
}
```
```py
def minimum_effort_path(h):
    n, m = len(h), len(h[0]); eff = [[float('inf')] * m for _ in range(n)]; eff[0][0] = 0; pq = [(0, 0, 0)]
    while pq:
        e, x, y = heapq.heappop(pq)
        if (x, y) == (n - 1, m - 1): return e
        if e > eff[x][y]: continue
        for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= a < n and 0 <= b < m:
                ne = max(e, abs(h[a][b] - h[x][y]))
                if ne < eff[a][b]: eff[a][b] = ne; heapq.heappush(pq, (ne, a, b))
    return 0
```
TC: O(n m log(n m)). SC: O(n m).
### Cheapest flight within K stops
Idea: Bellman-Ford limited to k + 1 rounds: round i finds the cheapest price using at most i flights. Use a copy of the previous round so one round adds only one flight.
```cpp
int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {
    vector<int> dist(n, INT_MAX); dist[src] = 0;
    for (int i = 0; i <= k; i++) {
        vector<int> nd(dist);
        for (auto& f : flights) if (dist[f[0]] != INT_MAX) nd[f[1]] = min(nd[f[1]], dist[f[0]] + f[2]);
        dist = nd;
    }
    return dist[dst] == INT_MAX ? -1 : dist[dst];
}
```
```py
def find_cheapest_price(n, flights, src, dst, k):
    INF = float('inf'); dist = [INF] * n; dist[src] = 0
    for _ in range(k + 1):
        nd = dist[:]
        for u, v, w in flights:
            if dist[u] + w < nd[v]: nd[v] = dist[u] + w
        dist = nd
    return -1 if dist[dst] == INF else dist[dst]
```
TC: O(k x E). SC: O(V).
### Minimum multiplications to reach end
Idea: numbers 0..99999 are nodes; an edge multiplies by an array element modulo 100000. Every step costs 1, so BFS.
```cpp
int minimumMultiplications(vector<int>& arr, int start, int end) {
    const int MOD = 100000; vector<int> dist(MOD, -1); queue<int> q; q.push(start); dist[start] = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (u == end) return dist[u];
        for (int x : arr) { int v = (long long)u * x % MOD; if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); } }
    }
    return -1;
}
```
```py
def minimum_multiplications(arr, start, end):
    MOD = 100000; dist = [-1] * MOD; dist[start] = 0; q = deque([start])
    while q:
        u = q.popleft()
        if u == end: return dist[u]
        for x in arr:
            v = u * x % MOD
            if dist[v] == -1: dist[v] = dist[u] + 1; q.append(v)
    return -1
```
TC: O(100000 x len(arr)). SC: O(100000).
### Number of ways to arrive at destination
Idea: Dijkstra with a `ways` array. Strictly shorter path found: ways[v] = ways[u]. Equal length path found: ways[v] += ways[u].
```cpp
int countPaths(int n, vector<vector<int>>& roads) {
    const long long MOD = 1e9 + 7; vector<vector<pair<int,int>>> adj(n);
    for (auto& r : roads) { adj[r[0]].push_back({r[1], r[2]}); adj[r[1]].push_back({r[0], r[2]}); }
    vector<long long> dist(n, LLONG_MAX), ways(n, 0);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[0] = 0; ways[0] = 1; pq.push({0, 0});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            if (d + w < dist[v]) { dist[v] = d + w; ways[v] = ways[u]; pq.push({dist[v], v}); }
            else if (d + w == dist[v]) ways[v] = (ways[v] + ways[u]) % MOD;
        }
    }
    return ways[n - 1] % MOD;
}
```
```py
def count_paths(n, roads):
    MOD = 10**9 + 7; adj = [[] for _ in range(n)]
    for u, v, w in roads: adj[u].append((v, w)); adj[v].append((u, w))
    dist = [float('inf')] * n; ways = [0] * n; dist[0] = 0; ways[0] = 1; pq = [(0, 0)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in adj[u]:
            if d + w < dist[v]: dist[v] = d + w; ways[v] = ways[u]; heapq.heappush(pq, (dist[v], v))
            elif d + w == dist[v]: ways[v] = (ways[v] + ways[u]) % MOD
    return ways[n - 1] % MOD
```
TC: O(E log V). SC: O(V + E).
### Bellman ford algorithm
Idea: a shortest path has at most V - 1 edges. Relaxing **every edge** V - 1 times therefore finds all shortest paths. If a V-th round still improves something, a **negative cycle** exists.
```cpp
vector<int> bellmanFord(int n, vector<vector<int>>& edges, int src) {     // edge = {u, v, w}
    const int INF = 1e9; vector<int> dist(n, INF); dist[src] = 0;
    for (int i = 0; i < n - 1; i++)
        for (auto& e : edges) if (dist[e[0]] != INF && dist[e[0]] + e[2] < dist[e[1]]) dist[e[1]] = dist[e[0]] + e[2];
    for (auto& e : edges) if (dist[e[0]] != INF && dist[e[0]] + e[2] < dist[e[1]]) return {-1};   // negative cycle
    return dist;
}
```
```py
def bellman_ford(n, edges, src):
    INF = 10**9; dist = [INF] * n; dist[src] = 0
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] != INF and dist[u] + w < dist[v]: dist[v] = dist[u] + w
    for u, v, w in edges:
        if dist[u] != INF and dist[u] + w < dist[v]: return [-1]
    return dist
```
TC: O(V x E). SC: O(V).
### Floyd warshall algorithm
Idea: DP over the allowed middle nodes. dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]) for every k. The loop over k must be the **outermost**.
```cpp
void floydWarshall(vector<vector<int>>& dist) {            // dist[i][j] = weight or 1e9 if no edge
    int n = dist.size();
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (dist[i][k] < 1e9 && dist[k][j] < 1e9) dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);
}
```
```py
def floyd_warshall(dist):
    n = len(dist)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]: dist[i][j] = dist[i][k] + dist[k][j]
```
TC: O(V^3). SC: O(1) extra. A negative value on the diagonal (dist[i][i] < 0) means a negative cycle.
### Find the city with the smallest number of neighbors (within a distance threshold)
Idea: all-pairs shortest paths (Floyd-Warshall), then count for each city how many others are within the threshold; ties go to the largest index.
```cpp
int findTheCity(int n, vector<vector<int>>& edges, int threshold) {
    vector<vector<int>> d(n, vector<int>(n, 1e9));
    for (int i = 0; i < n; i++) d[i][i] = 0;
    for (auto& e : edges) d[e[0]][e[1]] = d[e[1]][e[0]] = e[2];
    floydWarshall(d);
    int best = n + 1, city = -1;
    for (int i = 0; i < n; i++) {
        int cnt = 0; for (int j = 0; j < n; j++) if (i != j && d[i][j] <= threshold) cnt++;
        if (cnt <= best) { best = cnt; city = i; }
    }
    return city;
}
```
```py
def find_the_city(n, edges, threshold):
    INF = float('inf'); d = [[INF] * n for _ in range(n)]
    for i in range(n): d[i][i] = 0
    for u, v, w in edges: d[u][v] = d[v][u] = w
    floyd_warshall(d)
    best, city = n + 1, -1
    for i in range(n):
        cnt = sum(1 for j in range(n) if i != j and d[i][j] <= threshold)
        if cnt <= best: best, city = cnt, i
    return city
```
TC: O(V^3). SC: O(V^2).
### Network Delay Time
Idea: Dijkstra from node k; the answer is the largest shortest distance (or -1 if some node is unreachable).
```cpp
int networkDelayTime(vector<vector<int>>& times, int n, int k) {
    vector<vector<pair<int,int>>> adj(n + 1);
    for (auto& t : times) adj[t[0]].push_back({t[1], t[2]});
    vector<int> dist = dijkstra(n + 1, adj, k); int ans = 0;
    for (int i = 1; i <= n; i++) { if (dist[i] == INT_MAX) return -1; ans = max(ans, dist[i]); }
    return ans;
}
```
```py
def network_delay_time(times, n, k):
    adj = [[] for _ in range(n + 1)]
    for u, v, w in times: adj[u].append((v, w))
    dist = dijkstra(n + 1, adj, k)[1:]
    return -1 if max(dist) == float('inf') else max(dist)
```
TC: O(E log V). SC: O(V + E).
### Swim in Rising Water
Idea: the cost of a path is the **highest cell** on it. Dijkstra-style: always expand the reachable cell with the smallest elevation; the answer is the max seen when we reach the end.
```cpp
int swimInWater(vector<vector<int>>& g) {
    int n = g.size(); vector<vector<bool>> vis(n, vector<bool>(n, false));
    priority_queue<array<int,3>, vector<array<int,3>>, greater<>> pq; pq.push({g[0][0], 0, 0}); vis[0][0] = true;
    int d[5] = {0, 1, 0, -1, 0}, ans = 0;
    while (!pq.empty()) {
        auto [t, x, y] = pq.top(); pq.pop(); ans = max(ans, t);
        if (x == n - 1 && y == n - 1) return ans;
        for (int k = 0; k < 4; k++) {
            int a = x + d[k], b = y + d[k + 1];
            if (a >= 0 && b >= 0 && a < n && b < n && !vis[a][b]) { vis[a][b] = true; pq.push({g[a][b], a, b}); }
        }
    }
    return ans;
}
```
```py
def swim_in_water(g):
    n = len(g); vis = {(0, 0)}; pq = [(g[0][0], 0, 0)]; ans = 0
    while pq:
        t, x, y = heapq.heappop(pq); ans = max(ans, t)
        if (x, y) == (n - 1, n - 1): return ans
        for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= a < n and 0 <= b < n and (a, b) not in vis: vis.add((a, b)); heapq.heappush(pq, (g[a][b], a, b))
    return ans
```
TC: O(n^2 log n). SC: O(n^2).
## Graphs: Minimum Spanning Tree
### MST theory
- A **spanning tree** connects all V vertices using exactly V - 1 edges and no cycle. The **minimum** spanning tree has the smallest total weight.
- **Prim**: grow one tree; always add the cheapest edge leaving the tree (min heap). O(E log V).
- **Kruskal**: sort all edges; add an edge if it joins two different components (checked with a Disjoint Set). O(E log E).
@graph A-B:1 B-C:2 A-C:3 C-D:4 B-D:5 :: MST = A-B (1), B-C (2), C-D (4), total 7
### Disjoint Set (Union-Find)
Idea: each set is a tree with a representative (root). `find(x)` returns the root; `union(a, b)` joins two roots. Two optimisations make both nearly O(1): **path compression** (point nodes straight to the root during find) and **union by size/rank** (attach the smaller tree under the bigger).
```cpp
class DSU {
public:
    vector<int> parent, sz;
    DSU(int n) : parent(n), sz(n, 1) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (sz[a] < sz[b]) swap(a, b);
        parent[b] = a; sz[a] += sz[b];
        return true;
    }
};
```
```py
class DSU:
    def __init__(self, n): self.parent = list(range(n)); self.sz = [1] * n
    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]; x = self.parent[x]
        return x
    def unite(self, a, b):
        a, b = self.find(a), self.find(b)
        if a == b: return False
        if self.sz[a] < self.sz[b]: a, b = b, a
        self.parent[b] = a; self.sz[a] += self.sz[b]
        return True
```
TC: O(alpha(n)) per operation - practically constant. SC: O(n).
### Find the MST weight
```cpp
int kruskalMST(int n, vector<vector<int>>& edges) {          // edge = {u, v, w}
    sort(edges.begin(), edges.end(), [](auto& a, auto& b) { return a[2] < b[2]; });
    DSU d(n); int total = 0;
    for (auto& e : edges) if (d.unite(e[0], e[1])) total += e[2];
    return total;
}
int primMST(int n, vector<vector<pair<int,int>>>& adj) {
    vector<bool> in(n, false); int total = 0;
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq; pq.push({0, 0});
    while (!pq.empty()) {
        auto [w, u] = pq.top(); pq.pop();
        if (in[u]) continue;
        in[u] = true; total += w;
        for (auto& [v, wt] : adj[u]) if (!in[v]) pq.push({wt, v});
    }
    return total;
}
```
```py
def kruskal_mst(n, edges):
    d, total = DSU(n), 0
    for u, v, w in sorted(edges, key=lambda e: e[2]):
        if d.unite(u, v): total += w
    return total
def prim_mst(n, adj):
    seen, total, pq = [False] * n, 0, [(0, 0)]
    while pq:
        w, u = heapq.heappop(pq)
        if seen[u]: continue
        seen[u] = True; total += w
        for v, wt in adj[u]:
            if not seen[v]: heapq.heappush(pq, (wt, v))
    return total
```
TC: O(E log E). SC: O(V + E).
## Graphs: Hard Problems II (Disjoint Set)
### Number of operations to make network connected
Idea: with C components we need C - 1 cables. Every edge inside an already connected component is a spare cable. Possible only if total edges >= n - 1.
```cpp
int makeConnected(int n, vector<vector<int>>& conn) {
    if ((int)conn.size() < n - 1) return -1;
    DSU d(n); int comps = n;
    for (auto& c : conn) if (d.unite(c[0], c[1])) comps--;
    return comps - 1;
}
```
```py
def make_connected(n, conn):
    if len(conn) < n - 1: return -1
    d, comps = DSU(n), n
    for a, b in conn:
        if d.unite(a, b): comps -= 1
    return comps - 1
```
TC: O(E alpha(V)). SC: O(V).
### Accounts merge
Idea: union accounts that share an email. Map each email to the first account index that owns it; group emails by their root account and sort.
```cpp
vector<vector<string>> accountsMerge(vector<vector<string>>& acc) {
    int n = acc.size(); DSU d(n); unordered_map<string,int> owner;
    for (int i = 0; i < n; i++) for (int j = 1; j < (int)acc[i].size(); j++) {
        if (owner.count(acc[i][j])) d.unite(i, owner[acc[i][j]]); else owner[acc[i][j]] = i;
    }
    vector<vector<string>> emails(n);
    for (auto& [mail, i] : owner) emails[d.find(i)].push_back(mail);
    vector<vector<string>> ans;
    for (int i = 0; i < n; i++) if (!emails[i].empty()) {
        sort(emails[i].begin(), emails[i].end());
        vector<string> row = {acc[i][0]}; row.insert(row.end(), emails[i].begin(), emails[i].end());
        ans.push_back(row);
    }
    return ans;
}
```
```py
def accounts_merge(acc):
    d, owner = DSU(len(acc)), {}
    for i, a in enumerate(acc):
        for mail in a[1:]:
            if mail in owner: d.unite(i, owner[mail])
            else: owner[mail] = i
    groups = defaultdict(list)
    for mail, i in owner.items(): groups[d.find(i)].append(mail)
    return [[acc[i][0]] + sorted(mails) for i, mails in groups.items()]
```
TC: O(N log N) for sorting N emails. SC: O(N).
### Number of islands II (online queries)
Idea: each new land cell starts as its own island (count + 1); union with each neighbouring land cell (count - 1 for each successful union).
```cpp
vector<int> numIslands2(int n, int m, vector<vector<int>>& ops) {
    DSU d(n * m); vector<bool> land(n * m, false); vector<int> ans; int cnt = 0; int dir[5] = {0, 1, 0, -1, 0};
    for (auto& o : ops) {
        int id = o[0] * m + o[1];
        if (!land[id]) {
            land[id] = true; cnt++;
            for (int k = 0; k < 4; k++) {
                int a = o[0] + dir[k], b = o[1] + dir[k + 1];
                if (a >= 0 && b >= 0 && a < n && b < m && land[a * m + b] && d.unite(id, a * m + b)) cnt--;
            }
        }
        ans.push_back(cnt);
    }
    return ans;
}
```
```py
def num_islands2(n, m, ops):
    d, land, ans, cnt = DSU(n * m), set(), [], 0
    for r, c in ops:
        idx = r * m + c
        if idx not in land:
            land.add(idx); cnt += 1
            for a, b in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= a < n and 0 <= b < m and a * m + b in land and d.unite(idx, a * m + b): cnt -= 1
        ans.append(cnt)
    return ans
```
TC: O(k alpha(nm)) for k operations. SC: O(n m).
### Making a large island (flip at most one 0)
Idea: union all existing land. For each 0 cell, add 1 plus the sizes of the **distinct** neighbouring components.
```cpp
int largestIsland(vector<vector<int>>& g) {
    int n = g.size(); DSU d(n * n); int dir[5] = {0, 1, 0, -1, 0}, best = 0;
    for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) if (g[i][j])
        for (int k = 0; k < 4; k++) { int a = i + dir[k], b = j + dir[k + 1]; if (a >= 0 && b >= 0 && a < n && b < n && g[a][b]) d.unite(i * n + j, a * n + b); }
    for (int i = 0; i < n * n; i++) if (g[i / n][i % n]) best = max(best, d.sz[d.find(i)]);
    for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) if (!g[i][j]) {
        set<int> roots; int total = 1;
        for (int k = 0; k < 4; k++) { int a = i + dir[k], b = j + dir[k + 1]; if (a >= 0 && b >= 0 && a < n && b < n && g[a][b]) roots.insert(d.find(a * n + b)); }
        for (int r : roots) total += d.sz[r];
        best = max(best, total);
    }
    return best;
}
```
```py
def largest_island(g):
    n = len(g); d = DSU(n * n)
    nb = lambda i, j: [(a, b) for a, b in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)) if 0 <= a < n and 0 <= b < n and g[a][b]]
    for i in range(n):
        for j in range(n):
            if g[i][j]:
                for a, b in nb(i, j): d.unite(i * n + j, a * n + b)
    best = max([d.sz[d.find(i * n + j)] for i in range(n) for j in range(n) if g[i][j]] or [0])
    for i in range(n):
        for j in range(n):
            if not g[i][j]:
                roots = {d.find(a * n + b) for a, b in nb(i, j)}
                best = max(best, 1 + sum(d.sz[r] for r in roots))
    return best
```
TC: O(n^2 alpha). SC: O(n^2).
### Most stones removed with same row or column
Idea: stones sharing a row or column form a component; from a component of size s we can remove s - 1 stones. Answer = stones - components. Union each stone's row with its column (columns offset by a constant).
```cpp
int removeStones(vector<vector<int>>& stones) {
    DSU d(20002); unordered_set<int> used;
    for (auto& s : stones) { d.unite(s[0], s[1] + 10001); used.insert(s[0]); used.insert(s[1] + 10001); }
    int comps = 0; for (int x : used) if (d.find(x) == x) comps++;
    return (int)stones.size() - comps;
}
```
```py
def remove_stones(stones):
    d, used = DSU(20002), set()
    for r, c in stones: d.unite(r, c + 10001); used.update((r, c + 10001))
    return len(stones) - sum(1 for x in used if d.find(x) == x)
```
TC: O(n alpha). SC: O(rows + columns).
## Graphs: Additional Algorithms
### Kosaraju's algorithm (Strongly Connected Components)
Definition: an SCC is a maximal group of nodes in a directed graph where every node can reach every other.
Steps: (1) DFS and push nodes on a stack by **finish time**. (2) Reverse all edges. (3) Pop nodes from the stack; each DFS on the reversed graph from an unvisited node collects exactly one SCC.
```cpp
int kosaraju(int n, vector<vector<int>>& adj) {
    vector<bool> vis(n, false); vector<int> order; vector<vector<int>> rev(n);
    function<void(int)> dfs1 = [&](int u) { vis[u] = true; for (int v : adj[u]) if (!vis[v]) dfs1(v); order.push_back(u); };
    for (int i = 0; i < n; i++) if (!vis[i]) dfs1(i);
    for (int u = 0; u < n; u++) for (int v : adj[u]) rev[v].push_back(u);
    fill(vis.begin(), vis.end(), false); int scc = 0;
    function<void(int)> dfs2 = [&](int u) { vis[u] = true; for (int v : rev[u]) if (!vis[v]) dfs2(v); };
    for (int i = n - 1; i >= 0; i--) if (!vis[order[i]]) { scc++; dfs2(order[i]); }
    return scc;
}
```
```py
import sys
sys.setrecursionlimit(1 << 20)
def kosaraju(n, adj):
    vis, order = [False] * n, []
    def dfs1(u):
        vis[u] = True
        for v in adj[u]:
            if not vis[v]: dfs1(v)
        order.append(u)
    for i in range(n):
        if not vis[i]: dfs1(i)
    rev = [[] for _ in range(n)]
    for u in range(n):
        for v in adj[u]: rev[v].append(u)
    vis, scc = [False] * n, 0
    def dfs2(u):
        vis[u] = True
        for v in rev[u]:
            if not vis[v]: dfs2(v)
    for u in reversed(order):
        if not vis[u]: scc += 1; dfs2(u)
    return scc
```
TC: O(V + E). SC: O(V + E).
### Bridges in graph (Tarjan)
Definition: a **bridge** is an edge whose removal disconnects the graph.
Idea: DFS with `tin[u]` (time of discovery) and `low[u]` (earliest time reachable from u's subtree using at most one back edge). Tree edge (u, v) is a bridge if low[v] > tin[u]: v's subtree cannot climb back to u or above.
```cpp
vector<vector<int>> criticalConnections(int n, vector<vector<int>>& conn) {
    vector<vector<int>> adj(n), bridges; for (auto& c : conn) { adj[c[0]].push_back(c[1]); adj[c[1]].push_back(c[0]); }
    vector<int> tin(n, -1), low(n); int timer = 0;
    function<void(int,int)> dfs = [&](int u, int parent) {
        tin[u] = low[u] = timer++;
        for (int v : adj[u]) {
            if (v == parent) continue;
            if (tin[v] != -1) low[u] = min(low[u], tin[v]);
            else { dfs(v, u); low[u] = min(low[u], low[v]); if (low[v] > tin[u]) bridges.push_back({u, v}); }
        }
    };
    dfs(0, -1);
    return bridges;
}
```
```py
def critical_connections(n, conn):
    adj = [[] for _ in range(n)]
    for a, b in conn: adj[a].append(b); adj[b].append(a)
    tin, low, bridges, timer = [-1] * n, [0] * n, [], [0]
    def dfs(u, parent):
        tin[u] = low[u] = timer[0]; timer[0] += 1
        for v in adj[u]:
            if v == parent: continue
            if tin[v] != -1: low[u] = min(low[u], tin[v])
            else:
                dfs(v, u); low[u] = min(low[u], low[v])
                if low[v] > tin[u]: bridges.append([u, v])
    dfs(0, -1)
    return bridges
```
TC: O(V + E). SC: O(V + E).
### Articulation point in graph
Definition: an **articulation point** is a vertex whose removal disconnects the graph.
Idea: same tin/low. A non-root u is an articulation point if some child v has low[v] >= tin[u]. The root is one only if it has more than one DFS child.
```cpp
vector<int> articulationPoints(int n, vector<vector<int>>& adj) {
    vector<int> tin(n, -1), low(n), mark(n, 0); int timer = 0;
    function<void(int,int)> dfs = [&](int u, int parent) {
        tin[u] = low[u] = timer++; int children = 0;
        for (int v : adj[u]) {
            if (v == parent) continue;
            if (tin[v] != -1) low[u] = min(low[u], tin[v]);
            else {
                dfs(v, u); low[u] = min(low[u], low[v]); children++;
                if (parent != -1 && low[v] >= tin[u]) mark[u] = 1;
            }
        }
        if (parent == -1 && children > 1) mark[u] = 1;
    };
    for (int i = 0; i < n; i++) if (tin[i] == -1) dfs(i, -1);
    vector<int> ans; for (int i = 0; i < n; i++) if (mark[i]) ans.push_back(i);
    return ans.empty() ? vector<int>{-1} : ans;
}
```
```py
def articulation_points(n, adj):
    tin, low, mark, timer = [-1] * n, [0] * n, [False] * n, [0]
    def dfs(u, parent):
        tin[u] = low[u] = timer[0]; timer[0] += 1; children = 0
        for v in adj[u]:
            if v == parent: continue
            if tin[v] != -1: low[u] = min(low[u], tin[v])
            else:
                dfs(v, u); low[u] = min(low[u], low[v]); children += 1
                if parent != -1 and low[v] >= tin[u]: mark[u] = True
        if parent == -1 and children > 1: mark[u] = True
    for i in range(n):
        if tin[i] == -1: dfs(i, -1)
    return [i for i in range(n) if mark[i]] or [-1]
```
TC: O(V + E). SC: O(V).
