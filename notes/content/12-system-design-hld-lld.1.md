# System Design - High Level and Low Level Design
This notebook teaches system design from first principles: how a request travels, every building block (DNS, CDN, load balancers, caches, databases, queues, Kafka, Redis, search, storage), the theory (CAP, consistency, consensus, scaling), estimation, a repeatable interview framework, 15 fully designed systems (YouTube, GitHub, WhatsApp, Uber, Twitter, URL shortener, rate limiter, payments...) and low level design with code.
## What System Design Means
- **High Level Design (HLD)**: the architecture - which components (services, databases, caches, queues) exist, how data flows between them, how it scales and survives failures.
- **Low Level Design (LLD)**: the inside of one component - classes, interfaces, relationships, design patterns, APIs, database schema, concurrency.
- Interviews test: requirement gathering, trade-off reasoning, knowledge of building blocks, communication. There is no single right answer - justify choices.
## The Interview Framework (45 minutes)
@flow (1. Requirements: functional + non-functional, 5 min) | 2. Estimation: users, QPS, storage, bandwidth (5 min) | 3. API design + data model (5 min) | 4. High level diagram (10 min) | 5. Deep dives: bottlenecks, scaling, failures (15 min) | (6. Wrap up: trade-offs, monitoring, future, 5 min) :: System design interview steps
- **Functional requirements**: what the system does (post a video, watch, search, comment).
- **Non-functional requirements**: scale (DAU), latency (p99 < 200 ms), availability (99.99%), consistency needs, durability, security, cost.
- Always ask: read-heavy or write-heavy? Global users? Real-time? What can be eventually consistent?
## Back-of-the-Envelope Estimation
| Number | Value |
|---|---|
| seconds per day | 86,400 (~10^5) |
| 1 million requests/day | ~12 per second |
| 1 billion requests/day | ~12,000 per second |
| char / int / long | 1 / 4 / 8 bytes |
| 1 KB / MB / GB / TB / PB | 10^3 / 10^6 / 10^9 / 10^12 / 10^15 bytes |
| Latency | Approx time |
|---|---|
| L1 cache reference | 1 ns |
| main memory reference | 100 ns |
| read 1 MB sequentially from memory | 3 microseconds |
| SSD random read | 16-100 microseconds |
| round trip in same data centre | 0.5 ms |
| read 1 MB from SSD | 50 microseconds - 1 ms |
| disk seek (HDD) | 2-10 ms |
| packet India -> US -> India | 150-250 ms |
Example: Twitter-like app, 200M DAU, each posts 2 tweets/day and reads 100.
- Write QPS = 200M x 2 / 86,400 ~ 4,600/s (peak x2-3 ~ 12,000/s). Read QPS = 200M x 100 / 86,400 ~ 230,000/s -> read-heavy: cache aggressively.
- Storage: 400M tweets/day x 300 bytes ~ 120 GB/day ~ 44 TB/year (+ media much more, stored in object storage).
| Availability | Downtime per year |
|---|---|
| 99% | 3.65 days |
| 99.9% | 8.76 hours |
| 99.99% | 52.6 minutes |
| 99.999% | 5.26 minutes |
- Components in series multiply availability (0.999 x 0.999 = 0.998); redundant components in parallel improve it (1 - 0.001 x 0.001).
## How a Web Request Travels
@chain Browser -> DNS resolves domain -> CDN edge (static) -> Load balancer -> API gateway -> App server -> Cache (Redis) -> Database -> response back :: Life of a request
1. Browser checks its cache, then asks DNS for the IP (browser -> OS -> resolver -> root -> TLD -> authoritative).
2. TCP handshake + TLS handshake (HTTPS) with the nearest edge / load balancer.
3. Load balancer picks a healthy server; the server authenticates, reads cache, falls back to the database, renders JSON.
4. Response travels back; static assets come from the CDN. (Full networking detail in notebook 14.)
## Scaling Basics
### Vertical vs horizontal scaling
| Vertical (scale up) | Horizontal (scale out) |
|---|---|
| bigger machine (more CPU/RAM) | more machines behind a load balancer |
| simple, no code change | needs stateless services, data partitioning |
| hardware limit, single point of failure | near-unlimited, fault tolerant |
### Stateless services
- Keep app servers **stateless**: session data in Redis or a JWT, files in S3. Then any server can handle any request and you can add/remove servers freely.
@layers Clients | Load balancer | App 1, App 2, App 3 (stateless) | Redis (sessions), Database, S3 :: Stateless tier scales horizontally
## Building Block: DNS
- Translates names to IPs. Records: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), TXT (verification, SPF), NS (name servers). TTL controls caching.
- DNS-based load balancing / geo-routing: return different IPs per region, weighted, latency-based, failover (Route 53, Cloudflare).
## Building Block: CDN (Content Delivery Network)
- Servers at the network edge cache static content (images, video segments, JS, CSS) close to users -> lower latency, less load on origin.
- **Pull CDN**: edge fetches from origin on first miss (simple). **Push CDN**: you upload content proactively (big, rarely changing files).
- Cache control with headers (Cache-Control, ETag), versioned file names for invalidation (app.3f9a.js). CDNs also terminate TLS, absorb DDoS, run edge functions.
## Building Block: Load Balancer
- Spreads traffic over servers, removes unhealthy ones (health checks), enables zero-downtime deploys.
| Algorithm | How |
|---|---|
| Round robin | next server in order |
| Weighted round robin | bigger servers get more |
| Least connections | server with fewest active connections |
| Least response time | fastest healthy server |
| IP hash / consistent hash | same client -> same server (sticky) |
| Random with two choices | pick 2 random, use the less loaded |
- **L4** (TCP/UDP: by IP+port, very fast) vs **L7** (HTTP: route by path/header/cookie, TLS termination, can rewrite).
- Avoid the LB being a single point of failure: active-passive pair with a floating IP, or managed (AWS ALB, GCP LB). Tools: Nginx, HAProxy, Envoy, Traefik.
## Building Block: API Gateway and Reverse Proxy
- **Reverse proxy** sits in front of servers: TLS, compression, caching, hiding internal servers.
- **API gateway** = reverse proxy for APIs: routing to microservices, authentication, rate limiting, request transformation, API keys, analytics (Kong, AWS API Gateway, Apigee, Envoy).
- **BFF** (Backend for Frontend): a gateway tailored for each client type (web, mobile).
## Proxy, Reverse Proxy and Load Balancer (in depth)
### Forward proxy vs reverse proxy - in simple words
- A **proxy** is a middleman that passes requests along.
- **Forward proxy** sits in front of **clients** and talks to the internet for them. Example: a college Wi-Fi proxy that blocks some sites, a VPN, a corporate proxy. The website sees the proxy, not the student.
- **Reverse proxy** sits in front of **servers** and receives requests from the internet for them. Example: Nginx in front of three app servers. The user sees only the reverse proxy; the real servers stay hidden.
- Real-life analogy: a forward proxy is like **your assistant** who makes calls for you. A reverse proxy is like a **company receptionist** who receives every visitor and sends each one to the right department.
@chain Students -> Forward proxy (hides the clients) -> Internet -> website :: Forward proxy works for the clients
@chain Users -> Internet -> Reverse proxy (hides the servers) -> App server 1 / App server 2 / App server 3 :: Reverse proxy works for the servers
| | Forward proxy | Reverse proxy |
|---|---|---|
| sits in front of | clients | servers |
| who configures it | the client / organisation | the website owner |
| hides | the client's identity | the servers' identity and layout |
| typical uses | filtering, privacy, caching for an office, bypassing geo blocks | load balancing, TLS, caching, security, routing |
| examples | Squid, corporate proxies, VPN | Nginx, HAProxy, Envoy, Traefik, Cloudflare, AWS ALB |
### What a reverse proxy does for you
| Job | Explanation |
|---|---|
| TLS / SSL termination | handles HTTPS encryption once, so app servers speak plain HTTP inside the private network |
| Load balancing | spreads requests across many servers |
| Caching | stores responses (images, pages) and replies without disturbing the servers |
| Compression | gzip / brotli to make responses smaller |
| Security | hides server IPs, blocks bad requests (WAF), limits request size, rate limits, absorbs DDoS |
| Routing | /api goes to the API service, /images to the image service, / to the frontend |
| Static files | serves CSS / JS / images directly, very fast |
| Single entry point | one domain and certificate for many services |
```txt
# nginx.conf - a reverse proxy + load balancer in one file
upstream api_servers {                       # the pool of back-end servers
    least_conn;                              # algorithm: server with fewest active connections
    server 10.0.1.11:8000 weight=3;          # stronger machine gets more traffic
    server 10.0.1.12:8000;
    server 10.0.1.13:8000 backup;            # used only if the others are down
}
server {
    listen 443 ssl http2;
    server_name example.com;
    ssl_certificate     /etc/ssl/example.crt;    # TLS termination happens here
    ssl_certificate_key /etc/ssl/example.key;
    client_max_body_size 10m;                    # reject huge uploads
    gzip on;
    location /static/ { root /var/www; expires 30d; }           # served by Nginx itself
    location /api/ {
        proxy_pass http://api_servers;                          # forward to the pool
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;                # tell the app who the real user is
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
server { listen 80; return 301 https://$host$request_uri; }    # force HTTPS
```
### Load balancer - why and how
- One server can handle only so many users. When traffic grows we run **many identical servers**. A **load balancer** decides which server gets each request, so no single server is overloaded and a dead server is skipped.
- Analogy: a supermarket manager who sends each new customer to the shortest billing counter and closes a counter whose machine is broken.
@layers Users | Load balancer (health checks every 5 s) | Server A (healthy), Server B (healthy), Server C (failed - skipped) :: A load balancer stops sending traffic to an unhealthy server
| Algorithm | How it picks | Best when |
|---|---|---|
| Round robin | A, B, C, A, B, C ... | servers are equal, requests similar |
| Weighted round robin | bigger servers get more turns | servers of different size |
| Least connections | the server with fewest open connections | requests take different time (uploads, long calls) |
| Least response time | fastest and least busy | latency matters |
| IP hash | the same user IP always goes to the same server | simple stickiness |
| Consistent hashing | key -> position on a ring | caches, minimal reshuffling when servers change |
| Random / power of two choices | pick 2 random servers, use the less busy | very large clusters |
| Layer 4 (transport) load balancer | Layer 7 (application) load balancer |
|---|---|
| looks only at IP address and port (TCP / UDP) | reads the HTTP request: URL, headers, cookies |
| very fast, cannot route by URL | can send /api and /video to different pools |
| TLS usually passes through | can terminate TLS, rewrite, add headers |
| AWS NLB, HAProxy TCP mode | AWS ALB, Nginx, Envoy, Traefik, Cloudflare |
- **Health checks**: the LB calls `/health` every few seconds; after N failures the server is removed, after N successes it is added back.
- **Sticky sessions (session affinity)**: the LB sends a user to the same server every time (by cookie or IP). Needed only when servers keep session data in memory - better to make servers **stateless** and keep sessions in Redis.
- **Connection draining**: during a deploy the LB stops sending new requests to a server but lets running requests finish.
- **Avoiding a single point of failure**: run two load balancers (active-passive with a floating IP via keepalived / VRRP) or use a managed, multi-AZ cloud LB. **DNS load balancing / GeoDNS** spreads users across regions before they reach any LB.
- **Global server load balancing**: route users to the nearest healthy region (Route 53 latency routing, Cloudflare, anycast).
| Reverse proxy vs load balancer vs API gateway | |
|---|---|
| Reverse proxy | any server-side middleman (one or many back ends): TLS, cache, routing |
| Load balancer | a reverse proxy whose main job is spreading traffic over many identical servers |
| API gateway | a reverse proxy for APIs with extra features: auth, API keys, rate limits per client, request transformation, analytics |
- In practice one tool often does all three (Nginx, Envoy, Kong, AWS ALB + API Gateway).
## Cookies vs Sessions vs Tokens (JWT)
### Why we need them
- **HTTP is stateless**: every request is independent; the server does not remember that you logged in one second ago. Cookies, sessions and tokens add memory.
### Cookies
- A **cookie** is a small piece of text (up to about 4 KB) that the **server asks the browser to store** with `Set-Cookie`. The browser sends it back automatically with every request to that site in the `Cookie` header.
@chain Browser logs in -> Server replies Set-Cookie: sid=abc123; HttpOnly; Secure -> Browser stores it -> Every next request carries Cookie: sid=abc123 :: How a cookie travels
| Cookie attribute | Meaning |
|---|---|
| Expires / Max-Age | when it is deleted; without it = session cookie (gone when the browser closes) |
| HttpOnly | JavaScript cannot read it - protects against XSS stealing it |
| Secure | sent only over HTTPS |
| SameSite=Strict / Lax / None | whether it is sent on requests from other sites - protects against CSRF |
| Domain / Path | which hosts and paths receive it |
| __Host- prefix | forces Secure, Path=/ and no Domain (strongest) |
### Sessions
- A **session** is data stored **on the server** (in memory, Redis or a database) about a logged-in user. The server gives the browser only a random **session id**, usually inside a cookie.
- Analogy: a cloakroom. You hand over your coat (data stays with the staff) and get a token number (session id). The number alone is useless to a thief only if it is long and random - so session ids must be unguessable.
@chain Login OK -> server creates session {user: 7, role: admin} in Redis under id abc123 -> cookie sid=abc123 sent to browser -> each request: server looks up abc123 -> finds user 7 :: Session-based authentication
### Tokens (JWT)
- A **JWT** (JSON Web Token) puts the user data **inside the token itself**, signed by the server so it cannot be changed: `header.payload.signature` (Base64URL). The server does not need to store anything; it just checks the signature.
- The payload is only encoded, **not encrypted** - never put passwords or secrets in it.
| | Cookie | Session | JWT |
|---|---|---|---|
| what it is | a storage and transport mechanism in the browser | server-side record of the user | self-contained signed token |
| where data lives | browser | server (Redis / DB) | inside the token (client) |
| size | up to 4 KB | tiny id on the client | larger (hundreds of bytes) |
| logout / revoke | delete the cookie | delete the session: instant | hard before expiry: needs short expiry + refresh tokens or a block-list |
| scaling | - | needs a shared store (Redis) across servers | stateless, easy across servers and services |
| typical use | carry a session id or token | classic web apps | mobile apps, APIs, microservices, single sign-on |
- **Cookie vs session is not either-or**: the session id usually travels **in** a cookie. Likewise a JWT can travel in a cookie or in the `Authorization: Bearer <token>` header.
- Where to keep tokens in a browser: an **HttpOnly, Secure, SameSite cookie** is safest. `localStorage` can be read by any script, so an XSS bug can steal the token.
- **Refresh tokens**: short-lived access token (5-15 min) + long-lived refresh token (stored safely, rotated on every use) to get new access tokens.
### Attacks and protections
| Attack | What it is | Protection |
|---|---|---|
| XSS (cross-site scripting) | attacker's script runs in your page and steals tokens / acts as the user | HttpOnly cookies, escape output, Content-Security-Policy |
| CSRF (cross-site request forgery) | another site makes the browser send a request with your cookie | SameSite cookies, CSRF tokens, check Origin, custom headers |
| Session hijacking | stolen session id is reused | HTTPS only, Secure flag, short expiry, bind to device, re-auth for sensitive actions |
| Session fixation | attacker sets your session id before login | create a new session id after login |
| Token theft / replay | stolen JWT reused until it expires | short expiry, rotation, revocation list, HTTPS |
```py
# FastAPI: setting a secure session cookie
from fastapi import FastAPI, Response
import secrets
app = FastAPI(); SESSIONS = {}                         # use Redis in production
@app.post("/login")
def login(response: Response):
    sid = secrets.token_urlsafe(32)                    # long random id
    SESSIONS[sid] = {"user_id": 7, "role": "student"}
    response.set_cookie("sid", sid, httponly=True, secure=True, samesite="strict", max_age=7 * 24 * 3600)
    return {"ok": True}
```
Q: Cookie vs session?
A: A cookie is data the browser stores and sends automatically; a session is user state stored on the server, usually identified by a random id kept in a cookie.
Q: Session vs JWT?
A: Sessions keep state on the server and are easy to revoke but need a shared store; JWTs are signed self-contained tokens that scale statelessly but are hard to revoke before expiry, so use short lifetimes and refresh tokens.
Q: How do you protect cookies?
A: HttpOnly, Secure, SameSite=Lax or Strict, short expiry, a new id after login, HTTPS everywhere, CSRF protection for state-changing requests.
Q: Reverse proxy vs load balancer?
A: A reverse proxy is any server-side intermediary (TLS, caching, routing, security); a load balancer is a reverse proxy focused on distributing traffic across many identical back ends with health checks.
Q: L4 vs L7 load balancing?
A: L4 routes by IP and port and is very fast; L7 understands HTTP, so it can route by path, header or cookie and terminate TLS.
## Building Block: Caching
- Store hot data in fast memory to cut latency and database load. 80/20 rule: 20% of data gets 80% of reads.
@chain App -> check Redis (hit? return) -> miss: read DB -> write to Redis with TTL -> return :: Cache-aside (lazy loading)
| Strategy | How | Trade-off |
|---|---|---|
| Cache-aside (lazy) | app reads cache, on miss reads DB and fills cache | most common; first read slow; stale until TTL/invalidation |
| Read-through | cache library loads from DB itself | simpler app code |
| Write-through | write cache and DB together | consistent, slower writes |
| Write-behind (write-back) | write cache, flush to DB later | fast writes, risk of loss |
| Write-around | write DB only, cache fills on read | avoids caching data never read |
- **Eviction**: LRU (least recently used), LFU (least frequently used), FIFO, TTL expiry.
- Cache layers: browser, CDN, API gateway, application (in-process), distributed cache (Redis/Memcached), database buffer pool.
- Problems:
  - **Cache stampede / thundering herd**: a hot key expires and thousands of requests hit the DB. Fix: request coalescing (lock / single flight), early refresh, jittered TTLs.
  - **Cache penetration**: requests for keys that do not exist bypass the cache. Fix: cache nulls, Bloom filter.
  - **Cache avalanche**: many keys expire together. Fix: random TTLs, multi-level cache.
  - **Consistency**: delete (invalidate) the cache key after updating the DB; use short TTLs; for strictness use change-data-capture to invalidate.
  - **Hot keys**: replicate the key or add a local in-process cache.
```py
import json, redis
r = redis.Redis()
def get_user(uid):
    key = f"user:{uid}"
    if (cached := r.get(key)) is not None:
        return json.loads(cached)                       # cache hit
    user = db.fetch_user(uid)                           # cache miss -> database
    r.set(key, json.dumps(user), ex=300 + random.randint(0, 60))   # TTL with jitter
    return user
def update_user(uid, data):
    db.update_user(uid, data)
    r.delete(f"user:{uid}")                             # invalidate after write
```
## Redis Deep Dive
- In-memory key-value server with rich types (strings, hashes, lists, sets, sorted sets, streams, bitmaps, HyperLogLog, geo, JSON, vectors). Single-threaded command execution -> every command is atomic; ~100k+ ops/sec per node, sub-millisecond.
| Use case | Redis feature |
|---|---|
| cache | GET/SET with EX TTL |
| session store | HASH + TTL |
| rate limiter | INCR + EXPIRE, or sorted set sliding window, Lua script |
| leaderboard | ZADD / ZREVRANGE |
| distributed lock | SET key value NX PX 30000 (Redlock for multi-node) |
| queue / jobs | LIST (LPUSH/BRPOP) or STREAMS with consumer groups |
| pub/sub | PUBLISH / SUBSCRIBE (fire-and-forget) |
| unique counts | HyperLogLog (PFADD/PFCOUNT, 12 KB for billions) |
| geo search | GEOADD / GEOSEARCH (nearby drivers) |
| feature flags, counters | INCR, HINCRBY |
- **Persistence**: RDB snapshots (compact, may lose minutes) and AOF append-only log (fsync every second). **High availability**: replicas + **Sentinel** (automatic failover). **Scaling**: **Redis Cluster** shards keys into 16,384 hash slots across masters (CRC16(key) mod 16384); hash tags {user1} keep related keys together.
- **Pipelining** batches commands in one round trip; **Lua scripts / MULTI-EXEC** run multiple commands atomically.
```py
# sliding-window rate limiter with a sorted set: max 100 requests per 60 s
def allow(user_id, limit=100, window=60):
    now = time.time(); key = f"rl:{user_id}"
    p = r.pipeline()
    p.zremrangebyscore(key, 0, now - window)       # drop old timestamps
    p.zadd(key, {str(now): now})
    p.zcard(key)
    p.expire(key, window)
    _, _, count, _ = p.execute()
    return count <= limit
```
## Building Block: Databases at Scale
- Choose SQL vs NoSQL by data shape, consistency and access patterns (notebooks 05 and 06).
### Replication
| Type | How | Trade-off |
|---|---|---|
| Leader-follower (primary-replica) | writes to leader, async copy to followers | read scaling; replication lag; failover needed |
| Multi-leader | several regions accept writes | conflict resolution needed |
| Leaderless (Dynamo-style) | write/read quorums W + R > N | high availability, eventual consistency |
- Replication lag problems: read-your-own-writes (route a user's reads to the leader for a few seconds after writing), monotonic reads (stick a user to one replica).
### Partitioning / sharding
| Method | Pros | Cons |
|---|---|---|
| Range (A-M, N-Z; by date) | range queries easy | hot spots |
| Hash (hash(key) mod N) | even spread | range queries hard; resharding moves most keys |
| Consistent hashing | adding a node moves ~1/N keys | slightly more complex |
| Directory / lookup service | flexible | lookup becomes a dependency |
| Geo | data near users, compliance | uneven sizes |
- Problems: **hot partitions** (celebrity user), cross-shard joins and transactions, rebalancing, global IDs.
### Consistent hashing
- Place nodes and keys on a ring of hash values; a key belongs to the first node clockwise. Adding/removing a node only moves the keys of its neighbour. **Virtual nodes** (each server appears ~100-200 times) balance load.
@graph N1-N2 N2-N3 N3-N4 N4-N1 :: Hash ring: key k goes to the next node clockwise; add N5 between N1 and N2 -> only part of N2's keys move
```py
import bisect, hashlib
class ConsistentHash:
    def __init__(self, nodes, vnodes=100):
        self.ring, self.keys = {}, []
        for n in nodes: self.add(n, vnodes)
    def _h(self, s): return int(hashlib.md5(s.encode()).hexdigest(), 16)
    def add(self, node, vnodes=100):
        for i in range(vnodes):
            h = self._h(f"{node}#{i}"); self.ring[h] = node; bisect.insort(self.keys, h)
    def get(self, key):
        i = bisect.bisect(self.keys, self._h(key)) % len(self.keys)
        return self.ring[self.keys[i]]
ch = ConsistentHash(["cache-a", "cache-b", "cache-c"]); print(ch.get("user:42"))
```
### Unique ID generation
| Method | Notes |
|---|---|
| DB auto increment | simple, single point, not global |
| UUID v4 | 128-bit random, no coordination, not sortable, big index |
| UUID v7 / ULID | time-ordered, sortable |
| Snowflake (Twitter) | 64-bit: 41 bits timestamp + 10 bits machine + 12 bits sequence = 4096 IDs/ms/machine, sortable |
| Ticket server / ranges | each server reserves a block of IDs |
@cells 0 41-bit-time 10-bit-machine 12-bit-seq :: Snowflake ID layout (sign bit + 63 bits)
## Building Block: Message Queues and Asynchronous Processing
- A **queue** decouples producers from consumers: the API accepts the request fast, workers process later. Benefits: absorbs spikes (buffer), retries, independent scaling, fault isolation.
@chain API -> Queue -> Worker 1 / Worker 2 / Worker 3 -> DB / email / ML job :: Async processing with competing consumers
| Concept | Meaning |
|---|---|
| point-to-point | each message processed by one consumer (SQS, RabbitMQ queue) |
| pub/sub | each subscriber gets a copy (SNS, Kafka consumer groups, Redis pub/sub) |
| at-most-once | may lose, never duplicates |
| at-least-once | never loses, may duplicate -> make consumers **idempotent** |
| exactly-once | hard; Kafka transactions + idempotent producers, or dedupe keys |
| dead letter queue | messages that keep failing go aside for inspection |
| back-pressure | slow consumers signal producers to slow down |
- Tools: RabbitMQ (smart broker, routing, AMQP), AWS SQS/SNS, Google Pub/Sub, Kafka (log), Redis Streams, NATS, Pulsar.
## Kafka Deep Dive
### Concepts
- Kafka is a distributed, durable, **append-only commit log**. Producers write records to **topics**; topics are split into **partitions** (ordered logs); each record gets an **offset**. Consumers read at their own pace and can **replay** from any offset (retention by time/size, or compaction).
@layers Producers | Topic orders: partition 0, partition 1, partition 2 (spread over brokers, replicated) | Consumer group A: c1 reads p0, c2 reads p1 + p2 ; Consumer group B: analytics :: Kafka topic, partitions and consumer groups
- **Broker** = Kafka server; a **cluster** has many brokers. Metadata/leader election via **KRaft** (Zookeeper removed in Kafka 4.0).
- **Partition** = unit of parallelism and ordering: order is guaranteed only within a partition. The record **key** decides the partition (hash(key) % partitions), so all events for order-42 stay ordered.
- **Replication**: each partition has a leader + followers (replication factor 3). **ISR** = in-sync replicas. Producer `acks=all` + `min.insync.replicas=2` = no data loss if one broker dies.
- **Consumer group**: partitions are divided among consumers of the group; max useful consumers = number of partitions. Different groups each get all messages (pub/sub). **Rebalance** happens when consumers join/leave.
- **Offsets** are committed per group to the internal `__consumer_offsets` topic; commit after processing for at-least-once.
- Why so fast: sequential disk writes, OS page cache, zero-copy (sendfile) transfer, batching and compression.
### Delivery semantics
| Setting | Result |
|---|---|
| acks=0 | fire and forget, may lose |
| acks=1 | leader stored it |
| acks=all + idempotent producer | no loss, no duplicates from retries |
| transactions + read_committed | exactly-once across topics (stream processing) |
### Code
```py
from confluent_kafka import Producer, Consumer
p = Producer({"bootstrap.servers": "localhost:9092", "acks": "all", "enable.idempotence": True})
p.produce("orders", key="order-42", value='{"id": 42, "status": "PLACED"}')
p.flush()
c = Consumer({"bootstrap.servers": "localhost:9092", "group.id": "billing", "auto.offset.reset": "earliest", "enable.auto.commit": False})
c.subscribe(["orders"])
while True:
    msg = c.poll(1.0)
    if msg is None or msg.error(): continue
    process(msg.value())                  # must be idempotent
    c.commit(msg)                         # commit after successful processing
```
```sh
kafka-topics.sh --create --topic orders --partitions 6 --replication-factor 3 --bootstrap-server localhost:9092
kafka-console-consumer.sh --topic orders --from-beginning --bootstrap-server localhost:9092
kafka-consumer-groups.sh --describe --group billing --bootstrap-server localhost:9092   # shows lag
```
### Kafka ecosystem and use cases
- **Kafka Connect** (move data in/out: Debezium CDC from MySQL/Postgres, S3 sink), **Kafka Streams** / **ksqlDB** / Flink (stream processing: joins, windows, aggregations), **Schema Registry** (Avro/Protobuf schemas, compatibility).
- Use cases: event-driven microservices, activity tracking, log aggregation, metrics, CDC to search/warehouse, real-time ML features, event sourcing.
| Kafka | RabbitMQ |
|---|---|
| durable replayable log, consumers pull | broker pushes, message deleted after ack |
| very high throughput (millions/sec) | lower throughput, rich routing (exchanges) |
| ordering per partition | ordering per queue |
| streaming, event sourcing, analytics | task queues, RPC, complex routing |
## Building Block: Object Storage, Blob and File Storage
- **Object storage** (S3, GCS, Azure Blob): files addressed by key, virtually infinite, cheap, durable - for images, videos, backups, data lakes. Upload directly from clients with **presigned URLs**; serve via CDN.
- **Block storage** (EBS) for databases on VMs; **file storage** (NFS/EFS) for shared file systems.
- Large files: **multipart / chunked uploads** with resume; content hashing for dedupe.
## Building Block: Search
- Full-text search uses an **inverted index**: term -> list of documents containing it (with positions), plus ranking (TF-IDF / BM25). Elasticsearch / OpenSearch / Solr / Typesense / Meilisearch.
@chain "kafka is fast" -> tokenize + lowercase + stem -> kafka: [d1, d7], fast: [d1, d3] :: Inverted index
- Keep search in sync with the primary DB via CDC or events (not dual writes). **Vector search** (embeddings + ANN indexes like HNSW) powers semantic search and RAG (notebook 19).
## Communication Between Services
| Style | When |
|---|---|
| REST over HTTP (JSON) | public APIs, CRUD (notebook 26) |
| gRPC (HTTP/2 + Protobuf) | fast internal service-to-service, streaming |
## Microservices vs Monolith
### The Real-Life Analogy: Mega Supermarket vs Shopping Mall Food Court
- **The Monolith (The Mega Supermarket / Walmart):**
  - Everything is housed under one single roof: groceries, electronics, clothing, pharmacy, and checkout counters.
  - *Benefits:* Super simple to coordinate initially. If you want to transfer money from the bakery till to the electronics register, you just hand over the cash in person (in-memory function call). Transactions are ACID and instant.
  - *Disasters:* If a small fire breaks out in the bakery oven or the main power grid trips, **the entire supermarket must evacuate and shut down**. If the pharmacy needs a specialized temperature license, the whole building must undergo compliance inspection.
- **Microservices (The Shopping Mall with Independent Boutique Stores & Food Court):**
  - Each shop (Taco Store, Shoe Shop, Pharmacy) is an independent business with its own staff, lease, operating hours, and cash register (**Database per service**).
  - *Benefits:* If the taco store runs out of salsa or their grill breaks, the bookstore and shoe shop operate 100% unaffected. The taco store can scale up 5 extra cooks on Taco Tuesday without hiring extra shoe clerks (**independent scaling & technology freedom**).
  - *Disasters:* If a customer wants to buy a taco, a book, and medicine in one transaction, you cannot easily do it. You need a courier service (**network calls**), distributed coordination (**Saga Pattern**), and if the network is slow, orders get delayed.

### Service Types in Modern Distributed Systems
| Service Type | Definition and Characteristics | Real-Life Analogy |
|---|---|---|
| **Stateless Services** | Do not keep local client state or session memory on disk. Any instance can handle any incoming request. Scale horizontally behind a load balancer instantly. | Bank tellers: any teller can serve you as long as you hand them your debit card. |
| **Stateful Services** | Maintain local persistent state, active in-memory connections, or partition data (e.g. databases, Redis, Kafka brokers, WebSocket servers). Require sticky routing or partition keys. | Personal doctor who holds your physical paper medical folder in their specific office. |
| **API Gateways** | The single entry door for external clients. Handles rate limiting, authentication, SSL termination, and request routing to internal microservices. | Hotel concierge who verifies your room key and directs you to the spa, restaurant, or gym. |
| **Event-Driven Services** | Communicate asynchronously via message brokers (Kafka, RabbitMQ) instead of blocking HTTP calls. Highly decoupled. | Post office drop-box: you drop your parcel and walk away; delivery happens in background. |

| Monolith | Microservices |
|---|---|
| one deployable, simple to start | many small services owned by teams |
| easy local dev, transactions, debugging | independent deploy and scaling, tech freedom |
| harder to scale teams and parts independently | network failures, distributed data, observability overhead |
- Start with a **modular monolith**; split when team size or scaling needs justify it. Split by business capability (bounded contexts, DDD).
- Microservice patterns: API gateway, service discovery (Consul, Kubernetes DNS), **database per service**, **Saga** for distributed transactions (choreography with events or orchestration), **CQRS** (separate write and read models), **event sourcing**, **outbox pattern** (write the event in the same DB transaction, relay to Kafka), **circuit breaker**, **bulkhead**, **retry with exponential backoff + jitter**, timeouts, **idempotency keys**, sidecar / **service mesh** (Istio, Linkerd: mTLS, retries, telemetry), strangler fig migration.
@flow (Order created) | Reserve inventory | <Payment succeeded? ~ Compensate: release inventory, cancel order> | Ship order | (Order completed) :: Saga with compensating actions

## Database Crash Recovery: SQL vs NoSQL
- What happens when a database server suddenly loses power mid-write? How does it guarantee data durability and zero corruption?

### SQL Recovery: WAL & The ARIES Algorithm
- In SQL databases (PostgreSQL, MySQL InnoDB), writes to disk data pages are expensive random I/O.
- **Write-Ahead Logging (WAL):** Before any data page is modified in RAM or written to disk, the database writes an append-only sequential log entry describing the change (`Redo` and `Undo` records) to the WAL on disk.
- **ARIES (Algorithm for Recovery and Isolation Exploiting Semantics):**
  1. **Analysis Phase:** Scans WAL forward from the last safe checkpoint to identify dirty pages in RAM and active uncommitted transactions at the moment of crash.
  2. **REDO Phase:** Replays all logged changes forward from the oldest dirty page to restore the database buffer to the exact state right before the crash ("repeating history").
  3. **UNDO Phase:** Scans backwards and rolls back every transaction that was active but never committed when power died.
- **Checkpointing & PITR:** Periodically flushes all dirty pages to disk and records a checkpoint sequence number so crash recovery only needs to replay logs written after the checkpoint. **Point-In-Time Recovery (PITR)** allows restoring base backups and replaying WAL logs up to an exact second.

### NoSQL Distributed Recovery
- In distributed NoSQL stores (Cassandra, DynamoDB, MongoDB, Kafka), nodes crash independently across the cluster:
  - **Hinted Handoff:** If Node B is temporarily dead when a write arrives, the coordinator node holds a temporary "hint". When Node B boots back up, the coordinator sends the missed writes.
  - **Read Repair:** During a quorum read ($R + W > N$), if one replica returns an older version timestamp, the client reads the newest version and triggers a background write to update the stale replica.
  - **Anti-Entropy with Merkle Trees:** Background daemon compares cryptographic hash trees of data ranges between replicas. Only diverging leaf branches are synchronized across the network.
  - **Raft / Paxos Log Replay:** In consensus-based stores (etcd, CockroachDB), recovering nodes request the committed consensus log from the elected leader and replay entries sequentially.

## Programming Language Comparison: When to Use What
| Language | Primary Purpose & Strength | Execution & Memory Model | When to Use | When NOT to Use |
|---|---|---|---|---|
| **C++** | Maximum raw speed, hardware control, predictable sub-millisecond latency. | Ahead-of-Time (AOT) machine code. Manual memory management / RAII smart pointers. No Garbage Collector (GC). | Game engines, database storage engines, high-frequency trading (HFT), OS kernels, robotics. | Quick MVP web apps, small CRUD APIs, teams without senior memory-safety discipline. |
| **Rust** | Fearless concurrency and performance matching C++ without memory crashes or data races. | AOT machine code. Compile-time Ownership & Borrow Checker. Zero-cost abstractions, no GC. | High-performance networking proxies, cryptographic tools, blockchain, systems programming, secure CLI tooling. | Rapid prototyping, early-stage exploratory code where borrow checker slows rapid refactoring. |
| **Go (Golang)** | High-concurrency backend networking services and cloud-native infrastructure. | AOT machine code. Concurrent Garbage Collector. Ultra-lightweight Goroutines (4KB stack) and channels. | Cloud-native tools (Docker, Kubernetes, Terraform), high-throughput microservices, API proxies. | Complex domain logic with deep OOP hierarchies, GUI applications, numerical computation. |
| **Java** | Enterprise backends, massive financial engines, distributed big data. | Compiled to JVM Bytecode, executed via JIT compiler. Advanced generational Garbage Collection. | Large enterprise systems (Spring Boot), Kafka, Hadoop, Spark, Android backend systems. | Low-memory CLI utilities, real-time audio/trading (GC pauses can cause latency spikes). |
| **Python** | Artificial Intelligence, Machine Learning, Data Science, rapid automation. | Interpreted bytecode, reference counting GC, Global Interpreter Lock (GIL). Dynamic typing. | GenAI, LLM pipelines, PyTorch/TensorFlow, fast data analysis with Pandas, scripting. | Compute-heavy loops without C-extensions, low-latency mobile apps, highly concurrent CPU tasks. |
| **TypeScript / Node.js** | Unified full-stack web engineering across client and server. | Single-threaded non-blocking event loop (V8 engine) with libuv async I/O. Dynamic/Static JIT. | Real-time chat, collaborative documents, SaaS web apps, full-stack React/Next.js/Node backends. | Heavy CPU-bound computation (video encoding, cryptography) that blocks the single event loop. |
| **PHP** | Dynamic web applications, content management, high-velocity SaaS. | Share-nothing architecture via PHP-FPM. Ephemeral request lifecycle, automatic memory wipe. | Web platforms, Laravel APIs, WordPress enterprise CMS, rapid MVPs. | Persistent background daemons, socket-level network proxies, embedded computing. |

## HTTPS vs HTTP and How HTTPS Works
- **The Real-Life Analogy (Postcard vs Sealed Titanium Safe):**
  - **HTTP:** Writing a confidential message on an open **Postcard**. Every mail sorter, postal truck driver, and neighbour can read your credit card number, or even erase a line with white-out and write a fake bank account (**Man-in-the-Middle attack**).
  - **HTTPS:** Placing your message inside a **tamper-proof titanium safe with a dual-key cryptographic lock**. Only you and the destination bank hold the keys. Anyone intercepting the safe sees only unreadable garbled steel.

### How the TLS 1.3 Handshake Works
- HTTPS = HTTP + SSL/TLS (Transport Layer Security).
- Modern TLS 1.3 completes the cryptographic handshake in **1 single network round trip (1-RTT)**:
@flow /Client sends ClientHello (supported ciphers + key share)/ | [Server verifies domain Certificate with Certificate Authority (CA)] | [Server sends ServerHello + digital certificate + server key share] | [Both sides independently compute shared symmetric session key (Diffie-Hellman)] | (Secure Encrypted Communication begins using fast AES-GCM) :: TLS 1.3 Cryptographic Handshake

- **Hybrid Encryption: The Best of Both Worlds:**
  1. **Asymmetric Encryption (RSA / Elliptic Curve Diffie-Hellman):** Slow and computationally heavy. Used *only* during the first 1-2 seconds of the handshake to safely exchange keys and authenticate the server's identity.
  2. **Symmetric Encryption (AES-256-GCM / ChaCha20):** Blazing fast. Once the shared key is agreed upon, 100% of the actual HTTP data payload is encrypted and decrypted symmetrically.

### Evolution of HTTP: HTTP/1.1 vs HTTP/2 vs HTTP/3
| Protocol | Transport | Core Innovation | Major Bottleneck Solved |
|---|---|---|---|
| **HTTP/1.1 (1997)** | TCP | Persistent connections (`keep-alive`). Requests sent sequentially. | Closed connection after every single asset download. |
| **HTTP/2 (2015)** | TCP | Binary framing, **Multiplexing** (multiple parallel requests/responses interleaved over a single TCP connection), HPACK header compression. | Head-of-Line (HoL) blocking at the HTTP application layer. |
| **HTTP/3 (2022)** | **UDP (QUIC)** | Runs over **QUIC (Quick UDP Internet Connections)**. Built-in encryption (TLS 1.3 mandatory), independent streams. | **TCP-Level Head-of-Line blocking**: In HTTP/2, if 1 packet is lost on a spotty Wi-Fi network, TCP halts all multiplexed streams until that 1 packet is retransmitted. HTTP/3 on UDP ensures only the affected stream pauses, while all other streams continue loading! Seamless connection migration when switching from Wi-Fi to 5G. |

## Database Migration Strategies: Normal & AWS Security
- How do enterprise systems migrate multi-terabyte databases without downtime or data loss?

### 1. Normal Data Migration: Offline vs Online Cutover
- **Offline Migration (Maintenance Window):**
  - *Process:* Shut down app traffic at midnight $\rightarrow$ run `pg_dump` $\rightarrow$ copy dump $\rightarrow$ run `pg_restore` on new database $\rightarrow$ point DNS $\rightarrow$ restart app.
  - *Trade-off:* Acceptable for small non-critical internal apps, unacceptable for 24/7 global banking/e-commerce.
- **Online Migration (Zero-Downtime Dual-Write):**
  1. **Dual-Write:** Application writes to both Old DB and New DB simultaneously (writes to New DB are wrapped in non-blocking try/catch).
  2. **Backfill:** Background batch migration script copies all historical records created before dual-write began.
  3. **Reconciliation / Audit:** Automated script compares rows and checksums across both databases until 100% parity is verified.
  4. **Read Cutover:** Switch application read traffic to New DB.
  5. **Deprecate Old DB:** Stop writes to Old DB and decommission.

### 2. Security Database Migration in AWS
- When migrating on-premises databases (Oracle, SQL Server, MySQL) to AWS (Amazon Aurora, RDS, DynamoDB), security, compliance, and zero downtime are critical:
@flow [On-Premises Database] | [AWS Schema Conversion Tool (SCT) converts schema & stored procedures] | [AWS Database Migration Service (DMS) Replication Instance] | [Encrypted Data Replication over AWS Direct Connect / Private VPC VPN] | (Amazon Aurora Multi-AZ Target Database) :: Secure AWS Database Migration Workflow

- **Key AWS Migration Architecture & Security Controls:**
  - **AWS Schema Conversion Tool (SCT):** Automatically inspects and converts proprietary database schemas (e.g. Oracle PL/SQL or Microsoft T-SQL) into open-source equivalents (PostgreSQL or MySQL).
  - **AWS Database Migration Service (DMS):**
    - Performs full initial load followed by continuous **Change Data Capture (CDC)**: it reads the source database transaction logs in real time and streams changes to the target database with sub-second latency.
  - **Security Controls:**
    - **Encryption in Transit:** Enforce SSL/TLS connections between DMS replication instances and both source and destination endpoints.
    - **Encryption at Rest:** All replication storage volumes, logs, and target RDS/Aurora storage must be encrypted using customer-managed **AWS KMS** keys.
    - **Network Isolation:** DMS replication instances must run in private isolated VPC subnets with zero public IP addresses, communicating via **VPC Peering** or **AWS Direct Connect**.
    - **Least-Privilege IAM & Audit:** Dedicated IAM service roles restricting access to specific replication tasks; all migration events logged to **AWS CloudTrail**.
## Consistency, CAP and Consensus
- **CAP**: during a network partition choose consistency or availability (notebook 06). **PACELC** adds the latency trade-off when there is no partition.
- Consistency models (strong -> weak): linearizable, sequential, causal, read-your-writes, monotonic reads, eventual.
- **Consensus** = several nodes agreeing on a value despite failures: **Raft** (leader election + log replication, used by etcd, Consul, Kafka KRaft, CockroachDB) and **Paxos** (Google Spanner/Chubby). Needs a majority (quorum): 5 nodes tolerate 2 failures.
- **Two-phase commit (2PC)**: coordinator asks all participants to prepare, then commit - atomic but blocking if the coordinator fails; prefer Sagas across microservices.
- Clocks: physical clocks drift - use logical clocks (Lamport), vector clocks, or TrueTime-like bounded clocks; **leases** and **fencing tokens** for locks.
- Failure detection: heartbeats, gossip protocols (Cassandra), phi-accrual detectors. Split brain prevented by quorums.
## Reliability Patterns
- **Redundancy** (N+1, multi-AZ), **health checks + auto-healing**, **graceful degradation** (serve cached/partial results), **rate limiting and load shedding**, **timeouts everywhere**, **retries with backoff + jitter** (only for idempotent operations), **circuit breaker** (stop calling a failing dependency, half-open to test recovery), **bulkheads** (isolate pools), **idempotency**, **chaos engineering** (Netflix Chaos Monkey), backups + tested restore, multi-region DR.
@chain CLOSED (normal) -> too many failures -> OPEN (fail fast) -> after timeout -> HALF-OPEN (trial request) -> success: CLOSED / failure: OPEN :: Circuit breaker states
## Rate Limiting Algorithms
| Algorithm | Idea | Pros / cons |
|---|---|---|
| Token bucket | bucket refills r tokens/s up to capacity b; each request takes a token | allows bursts; most used (AWS, Stripe) |
| Leaky bucket | queue drained at a constant rate | smooth output; bursts queued/dropped |
| Fixed window counter | count per minute window | simple; burst at window edges |
| Sliding window log | store timestamps of requests | exact; memory heavy |
| Sliding window counter | weighted mix of current and previous window | accurate and cheap |
```py
import time
class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate, self.capacity = rate, capacity
        self.tokens, self.last = capacity, time.monotonic()
    def allow(self):
        now = time.monotonic()
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)   # refill
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1; return True
        return False                       # -> HTTP 429 Too Many Requests
```
## Observability
- **Metrics** (Prometheus + Grafana): the four golden signals - latency, traffic, errors, saturation. RED (rate, errors, duration) for services, USE for resources.
- **Logs** (structured JSON, centralised: ELK/OpenSearch, Loki, CloudWatch) with request IDs.
- **Traces** (OpenTelemetry, Jaeger, Tempo, X-Ray): follow one request across services.
- **SLI** (measured indicator, e.g. % requests < 300 ms), **SLO** (target, 99.9%), **SLA** (contract with penalties), **error budget** = 100% - SLO. Alerts on symptoms, runbooks, on-call, postmortems.
## Security in System Design
- HTTPS/TLS everywhere, authentication (OAuth 2.0 / OIDC, JWT, sessions), authorization (RBAC/ABAC), API gateway with WAF and rate limits, secrets in a vault, encryption at rest, least privilege IAM, input validation, audit logs, DDoS protection, private networks for databases. Details in notebook 23.
