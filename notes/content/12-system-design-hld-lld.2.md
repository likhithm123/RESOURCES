## HLD Case Study 1: URL Shortener (TinyURL / bit.ly)
### Requirements
- Functional: shorten a long URL, redirect short -> long, optional custom alias and expiry, click analytics.
- Non-functional: 100M new URLs/month, read:write = 100:1, redirect latency < 50 ms, highly available, short codes unguessable-ish.
### Estimation
- Writes ~ 100M / (30 x 86,400) ~ 40/s; reads ~ 4,000/s (peak 10-20k/s). 5 years x 1.2B/year = 6B URLs x 500 bytes ~ 3 TB.
- Code length: base62 (a-z, A-Z, 0-9). 62^7 = 3.5 trillion -> 7 characters is plenty.
### API
```txt
POST /api/v1/urls        { "longUrl": "...", "alias": "optional", "expiresAt": "optional" }  -> 201 { "shortUrl": "https://sho.rt/aZ3kP9q" }
GET  /{code}             -> 301/302 redirect with Location: longUrl
GET  /api/v1/urls/{code}/stats
```
- 301 (permanent) lets browsers cache (less load, lose analytics); 302 (temporary) keeps every click visible.
### Design
@layers Clients | CDN / Load balancer | Shortener service (write), Redirect service (read) | Redis cache (code -> url) | Key-value DB (Cassandra / DynamoDB): code, long_url, user, created, expiry | Kafka click events -> analytics (ClickHouse) :: URL shortener
- **Code generation** options: (1) hash (MD5/SHA of URL) and take 7 chars - handle collisions by retry; (2) **counter + base62** - a distributed ID (Snowflake or ranges handed out by a key-generation service) encoded in base62: no collisions; (3) pre-generated random keys stored in a key DB, handed out in batches.
- Redirect path: Redis lookup (hit rate > 90%), fallback to DB, write-through cache. Analytics are written asynchronously to Kafka so redirects stay fast.
```py
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
def base62(n):
    s = []
    while n: n, r = divmod(n, 62); s.append(ALPHABET[r])
    return "".join(reversed(s)) or "0"
print(base62(125_000_000_000))        # 7-char code from a unique numeric id
```
- Deep dives: rate limit creation per user, block malicious URLs (Safe Browsing check), expiry cleanup job, custom alias uniqueness (conditional write).
## HLD Case Study 2: Rate Limiter Service
- Requirements: limit each user/API key/IP to N requests per window across many API servers; low latency (< 1 ms overhead); return 429 with Retry-After header.
@chain Client -> API gateway (rate limit middleware) -> Redis cluster (token buckets per key, Lua script) -> allowed? backend : 429 :: Distributed rate limiter
- Store counters in Redis (shared by all gateway nodes); use atomic Lua scripts so check+update is one operation; rules (limits per plan) loaded from config; fail-open vs fail-closed choice if Redis is down; local in-memory pre-limit to cut Redis calls.
## HLD Case Study 3: YouTube / Netflix (Video Streaming)
### Requirements
- Upload videos, transcode to many resolutions, stream smoothly worldwide, search, likes/comments, recommendations, view counts.
- Scale: 2B users, 500 hours uploaded per minute, billions of views/day; streaming must start in < 2 s with minimal buffering.
### Upload pipeline
@flow (User requests upload) | API returns presigned URL | Client uploads raw video in chunks to object storage | Upload event -> queue | Transcoding workers: split into segments, encode 144p..4K (H.264/VP9/AV1), thumbnails, captions | Store segments + HLS/DASH manifests in object storage | (Push popular content to CDN, mark video READY, notify subscribers) :: Video upload and processing
- Transcoding is a **DAG of tasks** (split -> encode per resolution in parallel -> merge -> package) run by many workers (spot instances); retries per segment.
### Streaming
- **Adaptive bitrate streaming** (HLS / MPEG-DASH): the video is cut into 2-10 second segments in several bitrates; the player reads a manifest and switches quality per segment based on bandwidth.
- Segments served from **CDN** edge caches (Netflix Open Connect puts boxes inside ISPs). Popular videos pre-warmed; long-tail fetched from origin.
@layers Clients (player with ABR) | CDN edges / ISP caches | Origin: object storage (segments, manifests) | Metadata service (MySQL/Vitess + cache), Search (Elasticsearch), Recommendations (ML), Comments/Likes (Cassandra/Bigtable), View counter (Kafka + stream aggregation) :: YouTube architecture
### Data and deep dives
- Video metadata in a sharded SQL (YouTube uses Vitess over MySQL) with heavy caching. Comments in wide-column store. View counts: increment events in Kafka -> aggregated in windows -> stored; display approximate counts.
- Recommendations: candidate generation (collaborative filtering, embeddings) + ranking model (watch time prediction), features from watch history.
- Search: inverted index on title/description/tags + ML ranking.
- Copyright detection (Content ID fingerprints), moderation pipeline, resumable uploads, cost of storage (old unpopular videos to cold storage).
## HLD Case Study 4: GitHub (Code Hosting)
### Requirements
- Host Git repositories (push, pull, clone over HTTPS/SSH), web UI to browse code, pull requests with reviews, issues, notifications, search, Actions (CI).
- Scale: 100M+ developers, 400M+ repositories, very read-heavy clones/fetches, large repos (monorepos), high durability (code must never be lost).
### Design
@layers Users (git CLI, browser, API) | Load balancers + Git proxy (routes by repo) | Web/API app (Rails), Git service (Spokes / Gitaly-like), Search, Actions | Git storage nodes (repos as bare git dirs, 3 replicas across racks/DCs), MySQL (Vitess) for users/PRs/issues, Redis, Elasticsearch, Object storage (LFS, artifacts), Kafka/queues (webhooks, notifications) :: GitHub-like architecture
- **Repository storage**: each repo is a bare Git repository on a file server; writes replicated to 3 nodes with a quorum (GitHub "Spokes" uses a 3-phase commit across replicas); a routing service maps repo -> storage nodes. Forks share objects (alternates) to save space.
- **Push flow**: SSH/HTTPS -> auth + permission check -> proxy routes to the repo's replicas -> `git receive-pack` writes objects/refs on all replicas -> post-receive hooks publish an event -> webhooks, CI (Actions), notifications, search indexing happen asynchronously.
- **Clone/fetch**: served by any up-to-date replica; packfiles cached; CDN for release archives; large files via Git LFS in object storage.
- **Pull requests**: metadata (title, reviewers, comments, status checks) in MySQL; diffs computed on demand from Git and cached; merge = server-side git merge on the storage nodes with conflict detection.
- **Actions/CI**: job queue -> runner fleet (ephemeral VMs/containers) -> logs and artifacts to object storage -> status checks back on the PR.
- Deep dives: code search (custom index over trigrams/ngrams across all repos), permission model (orgs, teams, branch protection), abuse/rate limiting of API, high availability across data centres, backups of Git data.
## HLD Case Study 5: WhatsApp / Chat System
### Requirements
- 1:1 and group chat, online/last seen, delivery and read receipts, media, push notifications for offline users, end-to-end encryption, message history on devices. 2B users, 100B messages/day, low latency.
### Design
@layers Mobile clients | Load balancer (sticky WebSocket) | Chat servers (persistent WebSocket connections), Presence service (Redis), Session registry user -> server | Message queue (Kafka) | Message store (Cassandra: partition = chat_id, clustering = message time), Media service + object storage + CDN, Push notification service (APNs/FCM), Group service :: Chat system
@flow (Alice sends message over WebSocket) | Chat server assigns id + stores (or queues) message | Look up Bob's connection in session registry | <Bob online? ~ Store for later + push notification via FCM/APNs> | Deliver to Bob's chat server -> Bob's device | (Bob's device acks -> delivered/read receipt flows back) :: Message delivery
- Persistent connections: WebSockets (or MQTT); each server holds ~1M connections (Erlang in WhatsApp). Heartbeats detect disconnects -> presence updates.
- Ordering: per-chat sequence numbers; client reorders and de-duplicates by message id (idempotent).
- Groups: fan-out on write to each member's inbox for small groups; large groups/channels use fan-out on read.
- E2E encryption (Signal protocol): server only relays ciphertext; it cannot read messages. Media encrypted and uploaded to object storage; only the key travels in the message.
- Storage: WhatsApp deletes messages from servers after delivery; others keep history in Cassandra/HBase.
## HLD Case Study 6: Twitter / Instagram News Feed
### Requirements
- Post tweets/photos, follow users, home timeline of followed accounts, likes, search, trends. 300M DAU, read-heavy (timeline reads 100x posts).
### Fan-out strategies
| Fan-out on write (push) | Fan-out on read (pull) |
|---|---|
| on post, insert tweet id into each follower's cached timeline | on read, fetch recent tweets of everyone you follow and merge |
| fast reads | slow reads for users following many |
| expensive for celebrities (100M followers) | cheap writes |
- **Hybrid**: push for normal users; for celebrities (above a follower threshold) pull their tweets at read time and merge.
@layers Clients | API gateway | Tweet service, Timeline service, User/graph service, Search, Media | Kafka (new tweet events) -> Fan-out workers -> Redis timelines (list of tweet ids per user) | Tweet store (sharded by tweet id), Social graph store, Object storage + CDN (media) :: News feed architecture
- Timeline read: get tweet ids from the user's Redis list -> hydrate tweets from cache (multi-get) -> merge celebrity tweets -> rank (ML ranking for "For You") -> return page with cursor pagination.
- Trends: count hashtags in sliding windows with stream processing (Count-Min Sketch for heavy hitters).
## HLD Case Study 7: Uber / Ola (Ride Hailing)
### Requirements
- Riders request rides, nearby drivers matched in seconds, live location tracking, ETA and pricing (surge), payments, trip history. Millions of drivers sending location every 4 seconds.
### Location indexing
- Need "drivers within 2 km". Use a spatial index: **geohash** (encode lat/long into a string; nearby points share a prefix), **quadtree**, or **H3 hexagons** (Uber). Store driver locations in memory (Redis GEO / a sharded location service) keyed by cell.
@grid g1 g2 g3 / g4 rider* g6 / g7 g8 g9 :: Search the rider's geohash cell and its 8 neighbours
### Design
@layers Rider app, Driver app | API gateway + WebSocket gateway | Location service (driver pings -> in-memory geo index), Matching/dispatch service, Pricing/surge service, Trip service, Payment service, ETA/maps service | Kafka (location + trip events) | Trip DB (sharded SQL), Redis geo, Analytics :: Ride-hailing architecture
@flow (Rider requests ride) | Pricing service returns fare (surge by supply/demand per cell) | Matching finds nearest available drivers via geo index + ETA | Offer sent to best driver (timeout -> next driver) | <Driver accepts? ~ Offer to next driver> | (Trip created; both apps get live location over WebSocket) :: Ride matching
- Consistency: a driver must not be assigned to two riders -> atomic state change (compare-and-set in the dispatch service / distributed lock per driver).
- Payments after trip via payment service with idempotency keys; fraud checks.
## HLD Case Study 8: Payment System (Razorpay / Stripe / UPI-like)
- Requirements: accept payments, call banks/card networks, never double-charge, exact money accounting, reconciliation, refunds, webhooks to merchants, PCI-DSS compliance.
@chain Merchant checkout -> Payment API (idempotency key) -> Payment service (state machine) -> Payment gateway / PSP -> Card network / bank -> result -> Ledger (double-entry) -> Webhook to merchant :: Payment flow
- **Idempotency**: client sends Idempotency-Key; server stores key -> result; a retried request returns the stored result instead of charging again.
- **State machine**: CREATED -> AUTHORIZED -> CAPTURED -> SETTLED, or FAILED / REFUNDED; transitions persisted transactionally (outbox pattern for events).
- **Double-entry ledger**: every movement is two entries (debit one account, credit another) that sum to zero; append-only; balances derived. Strong consistency (SQL with serializable transactions).
- **Reconciliation**: daily jobs compare internal ledger with bank/PSP settlement files; mismatches alerted.
- Retries with exponential backoff for PSP timeouts; unknown outcomes resolved by status polling; webhooks retried with signatures (HMAC) for authenticity.
- Security: tokenise cards (never store PAN), PCI scope minimised, encryption, fraud detection (ML risk scores).
## HLD Case Study 9: Notification System
- Send email, SMS, push and in-app notifications at scale with user preferences, templates, rate limits, retries and tracking.
@layers Services (order, payment, marketing) | Notification API (validate, dedupe, preferences, templates) | Kafka topics per channel (priority queues) | Workers: Email (SES/SendGrid), SMS (Twilio/MSG91), Push (FCM/APNs), In-app (WebSocket) | Status store + analytics, DLQ :: Notification system
- Idempotency (dedupe key), user opt-out and quiet hours, per-provider rate limiting, fallback provider, scheduled and bulk campaigns, tracking delivery/open events.
## HLD Case Study 10: Search Autocomplete (Typeahead)
- Return top 5-10 suggestions for a prefix in < 100 ms as the user types.
- **Trie** where each node stores the top-k completions (precomputed) -> O(prefix length) lookup. Built offline from query logs (counts with time decay) by batch/stream jobs; served from memory, sharded by prefix, cached at CDN/browser for short prefixes.
@tree root(t(r(e(e*,nd*)),o(p*))) :: Trie: each node keeps its top-k suggestions (tree, trend, top)
- Client: debounce keystrokes (~100 ms), cancel stale requests. Filter offensive suggestions. Personalisation layer re-ranks.
## HLD Case Study 11: Google Drive / Dropbox (File Sync)
- Upload/download/sync files across devices, sharing, versioning, large files, offline edits.
@layers Desktop/mobile clients (watcher, chunker, local DB) | Block service (upload chunks), Metadata service, Sync/notification service (long polling / WebSocket) | Object storage (chunks addressed by hash), Metadata DB (files, versions, chunk lists, ACLs), Cache, Queue :: File sync architecture
- Split files into 4 MB **chunks**, hash each (SHA-256): only changed chunks are uploaded (**delta sync**), identical chunks stored once (**deduplication**). A file version = ordered list of chunk hashes.
- Metadata strongly consistent (SQL); conflicts when two devices edit offline -> keep both ("conflicted copy") or operational transform for docs.
- Notify other devices via a sync service; they pull changed metadata and missing chunks.
## HLD Case Study 12: Ticket Booking (BookMyShow)
- Browse shows, view seat map, hold seats for 10 minutes during payment, book exactly once, handle flash sales.
- Seat state: AVAILABLE -> HELD (with expiry) -> BOOKED. Holding uses an atomic conditional update (`UPDATE seats SET status='HELD', held_by=?, hold_until=now()+10min WHERE id IN (...) AND status='AVAILABLE'` and check affected rows) or Redis locks with TTL. Expired holds released by TTL/background job.
- Flash sale: virtual waiting room / queue, rate limiting, cache show data, idempotent payment callbacks.
## HLD Case Study 13: Web Crawler
@flow (Seed URLs) | URL frontier (priority + politeness queues per host) | Fetcher (respects robots.txt, rate per domain) | Content seen? (hash) dedupe | Parser: extract links + text | <URL already seen? (Bloom filter) ~ add to frontier> | (Store page in object storage, send to indexer) :: Web crawler
- Scale: billions of pages; distributed workers partitioned by host hash; DNS cache; handle traps (infinite calendars), freshness re-crawl scheduling.
## HLD Case Study 14: Distributed Key-Value Store (Dynamo-style)
- Partition with consistent hashing + virtual nodes; replicate each key to N = 3 nodes; tunable quorum (W = 2, R = 2); vector clocks or last-write-wins for conflicts; **hinted handoff** when a node is down; **anti-entropy** repair with Merkle trees; gossip for membership; LSM-tree storage (memtable + SSTables + Bloom filters).
## HLD Case Study 15: Distributed Cache, Leaderboard, Metrics/Monitoring, Job Scheduler
- **Distributed cache**: consistent hashing over cache nodes, replication for hot keys, LRU eviction, client-side library routing.
- **Real-time leaderboard**: Redis sorted set per game/period (ZINCRBY on score, ZREVRANGE for top 100, ZREVRANK for my rank); shard by game; persist scores in DB.
- **Metrics system** (Datadog/Prometheus-like): agents push/pull metrics -> Kafka -> time-series DB (downsampling, retention tiers) -> query + alerting engine -> dashboards.
- **Distributed job scheduler** (cron at scale): jobs table with next_run_at index; scheduler nodes claim due jobs with leader election or `SELECT ... FOR UPDATE SKIP LOCKED`; execute via queue + workers; retries, idempotency, monitoring.
## HLD Case Study 16: LLM Chat Application (ChatGPT-like)
@layers Web/mobile client (SSE streaming) | API gateway (auth, rate limit by tokens) | Chat service (conversation history), Orchestrator (prompt building, tools, RAG retrieval), Safety filters | Model serving cluster (GPU, vLLM, batching, KV cache) / external LLM API | Postgres (conversations), Redis (sessions, semantic cache), Vector DB (documents), Object storage (files) :: LLM application architecture
- Stream tokens via Server-Sent Events; limit context length (summarise old turns); semantic cache for repeated questions; queue and batch requests on GPUs; fallback model; evaluate quality and log traces. Details in notebooks 19 and 22.
