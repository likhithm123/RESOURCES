## Kafka Explained Like a Story (for absolute beginners)
### The problem Kafka solves
- Imagine **Swiggy / Zomato**. When you place an order, many things must happen: the restaurant must be told, a delivery partner found, payment recorded, the bill emailed, the analytics team must count it, the recommendation system must learn you like biryani.
- **Without Kafka**: the order service calls each of these services one by one. If the email service is slow, your order screen hangs. If analytics is down, the order fails. Every new team asks the order team to add one more call. It becomes a tangled web.
@chain Order service -> calls restaurant -> calls delivery -> calls payment -> calls email -> calls analytics (one slow = all slow) :: Without Kafka: tightly connected services
- **With Kafka**: the order service simply writes one message, "Order 501 placed", into Kafka and immediately tells you "Order placed!". Every other service **reads** that message by itself, at its own speed. If email is down for 10 minutes, it reads the missed messages when it comes back. A new team just starts reading - nobody else changes.
@layers Order service (producer) writes "Order 501 placed" | KAFKA topic: orders (stored safely, in order) | Restaurant service, Delivery service, Email service, Analytics, Recommendations (each reads by itself) :: With Kafka: one write, many independent readers
### Kafka in simple real-life terms
| Kafka word | Real-life picture |
|---|---|
| Kafka | a huge, very fast notice board / post office that never loses letters |
| Message (event / record) | one letter: "Order 501 placed at 8:05 PM by user 77" |
| Topic | a named section of the board: "orders", "payments", "deliveries" |
| Producer | whoever pins letters on the board (the order service) |
| Consumer | whoever reads letters (the email service) |
| Consumer group | a team of readers sharing the work - each letter handled by one member of the team |
| Partition | a topic split into several lanes so many workers can read in parallel |
| Offset | the letter number in a lane - each team remembers "we have read up to letter 1,042" |
| Broker | one Kafka server; a cluster has many |
| Replication | photocopies of every lane on other servers, so a broken server loses nothing |
| Retention | how long letters stay on the board (for example 7 days), even after they are read |
### Why Kafka is special compared with a normal queue
- In a normal queue, once a message is read it is **deleted**. In Kafka, messages **stay** for the retention period, so **many different teams** can read the same message, and a team can **re-read** old messages (replay) after fixing a bug.
- It is extremely fast (millions of messages per second) because it writes to disk in order, like adding lines to the end of a notebook.
- Messages in one partition stay **in order**. If we use the order id as the **key**, all events of order 501 (placed -> paid -> picked up -> delivered) land in the same partition, in the right order.
@grid P0: msg0 msg1 msg2 msg3 / P1: msg0 msg1 msg2 / P2: msg0 msg1 msg2 msg3 msg4 :: Topic "orders" with 3 partitions; each consumer remembers its offset in each lane
### Real companies using Kafka
| Company | Use |
|---|---|
| LinkedIn (created Kafka) | activity feed, profile views, metrics |
| Uber / Ola | live driver locations, trip events, surge pricing |
| Netflix | what you watch -> recommendations, monitoring |
| Banks / UPI apps | transaction events, fraud detection in real time |
| Swiggy / Zomato / Flipkart | order life cycle, notifications, analytics |
| Any large app | collecting logs and metrics from thousands of servers |
### A tiny end-to-end example
```py
# producer.py - the order service
from confluent_kafka import Producer
import json
p = Producer({"bootstrap.servers": "localhost:9092", "acks": "all"})       # acks=all: wait until copies are saved
order = {"order_id": 501, "user": 77, "items": ["biryani"], "total": 249}
p.produce("orders", key=str(order["order_id"]), value=json.dumps(order))     # same key -> same partition -> in order
p.flush()
print("Order placed! (the user does not wait for email, delivery, analytics)")
```
```py
# email_consumer.py - one of many independent readers
from confluent_kafka import Consumer
import json
c = Consumer({"bootstrap.servers": "localhost:9092", "group.id": "email-service", "auto.offset.reset": "earliest", "enable.auto.commit": False})
c.subscribe(["orders"])
while True:
    msg = c.poll(1.0)
    if msg is None or msg.error(): continue
    order = json.loads(msg.value())
    print(f"Emailing bill for order {order['order_id']}")
    c.commit(msg)                                      # remember: read up to here
```
- Run two copies of `email_consumer.py` with the same group id and Kafka splits the partitions between them (more speed). Start an analytics consumer with a different group id and it receives **every** order too.
### Kafka interview one-liners
- Kafka = distributed, durable, replayable event log for real-time streaming. Ordering is per partition; scale = more partitions + more consumers in a group; reliability = replication factor 3 + acks=all; at-least-once by committing after processing, so consumers must be idempotent.
## Concurrency Scenarios in System Design (simultaneous booking and friends)
### The problem: two people, one seat
- Asha and Ravi both open BookMyShow and both see seat **F12** as available. Both click "Book" within the same millisecond. Without care, the code does:
@flow (Asha: SELECT status of F12 -> AVAILABLE) | (Ravi: SELECT status of F12 -> AVAILABLE) | Asha: UPDATE F12 = BOOKED, charge Asha | Ravi: UPDATE F12 = BOOKED, charge Ravi | (Both paid for one seat: DOUBLE BOOKING) :: The race condition (check-then-act)
- The bug is **check-then-act**: reading the status and writing it are two separate steps, and the other user slips in between. Every correct solution makes "check and take the seat" one **atomic** step.
### Solution 1: Atomic conditional update (simplest and best)
```sql
-- Only one of the two requests can change a row that is still AVAILABLE.
UPDATE seats
SET status = 'HELD', held_by = :user_id, hold_expires_at = NOW() + INTERVAL '10 minutes'
WHERE show_id = :show AND seat_no = 'F12' AND status = 'AVAILABLE';
-- rows affected = 1  -> you got the seat, go to payment
-- rows affected = 0  -> someone else got it first: "Sorry, this seat was just taken"
```
- The database locks the row while updating, so the second update waits, then finds status = 'HELD' and changes 0 rows.
### Solution 2: Pessimistic locking (SELECT ... FOR UPDATE)
```sql
BEGIN;
SELECT status FROM seats WHERE show_id = :show AND seat_no IN ('F12', 'F13') ORDER BY seat_no FOR UPDATE;  -- lock rows; others wait
-- check all are AVAILABLE in application code
UPDATE seats SET status = 'HELD', held_by = :user_id, hold_expires_at = NOW() + INTERVAL '10 minutes'
WHERE show_id = :show AND seat_no IN ('F12', 'F13');
COMMIT;
```
- Lock seats in a **fixed order** (ORDER BY seat_no) so two users picking overlapping seats cannot deadlock. Keep the transaction short - never call the payment gateway while holding the lock.
### Solution 3: Optimistic locking (version column)
```sql
SELECT status, version FROM seats WHERE id = 42;                  -- AVAILABLE, version 7
UPDATE seats SET status = 'HELD', held_by = :user_id, version = version + 1
WHERE id = 42 AND version = 7;                                    -- 0 rows if someone changed it meanwhile -> retry or report
```
- Good when collisions are rare. During a flash sale (many collisions) it causes many retries - use solution 1 or a queue instead.
### Solution 4: Unique constraint as the final safety net
```sql
CREATE TABLE bookings (show_id INT, seat_no TEXT, user_id INT, payment_id TEXT, UNIQUE (show_id, seat_no));
-- Even if two requests get through due to a bug, the second INSERT fails with a duplicate-key error.
```
### Solution 5: Distributed lock in Redis (when seats live in a cache / many services)
```py
import redis, uuid
r = redis.Redis()
def hold_seat(show, seat, user):
    token = str(uuid.uuid4())
    ok = r.set(f"seat:{show}:{seat}", f"{user}:{token}", nx=True, ex=600)   # NX = only if nobody holds it; expires in 10 min
    return token if ok else None                                              # None -> already held by someone
RELEASE = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end"
def release(show, seat, user, token): r.eval(RELEASE, 1, f"seat:{show}:{seat}", f"{user}:{token}")   # delete only your own hold
```
- Always set an **expiry** (otherwise a crashed server holds the seat forever) and release only with your own token. The database update is still the source of truth.
### The complete booking flow with seat holds
@flow (User selects seats) | Atomic HOLD with 10-minute expiry | <Hold succeeded? ~ ("Seat just taken" - show updated map)> | Create order (PENDING) with an idempotency key | Redirect to payment gateway | <Payment success webhook before expiry? ~ Release seats: status AVAILABLE, order FAILED / refund if money was taken> | (Mark seats BOOKED, order CONFIRMED, send ticket) :: Seat booking with holds and payment
- **Hold expiry**: a background job (or Redis TTL) every minute runs `UPDATE seats SET status='AVAILABLE' WHERE status='HELD' AND hold_expires_at < NOW()`.
- **Payment and booking consistency**: the payment webhook may arrive twice, late, or after the hold expired. Make the handler **idempotent** (store the payment id; second call does nothing) and if the seat is already gone, auto-refund.
- **Flash sale (Coldplay tickets, IPL final)**: millions arrive at once. Use a **virtual waiting room**: users get a queue position and are let in at a rate the system can handle; seat holds still use atomic updates; cache the seat map; rate-limit per user; block bots (CAPTCHA, device checks).
### Other classic concurrency scenarios
| Scenario | Danger | Fix |
|---|---|---|
| Last item in stock bought by two users | overselling | UPDATE stock = stock - 1 WHERE id = ? AND stock > 0 (check rows affected) or Redis DECR with a floor |
| Wallet / bank transfer | balance goes negative, money created or lost | one DB transaction, lock both accounts in id order, CHECK (balance >= 0), double-entry ledger |
| Double click on "Pay" | charged twice | idempotency key per payment attempt, disable the button, unique constraint on the key |
| Like counter updated by thousands | lost updates | atomic increment (UPDATE likes = likes + 1 / Redis INCR) or count events asynchronously |
| Coupon "first 100 users" | 140 users get it | atomic counter (Redis DECR, DB conditional update) |
| Two admins edit the same document | one overwrites the other | optimistic locking (ETag / version + If-Match), merge or show a conflict |
| Same username registered twice | duplicates | UNIQUE constraint, handle the duplicate-key error |
| Ride hailing: one driver, two riders | driver double-assigned | atomic state change of the driver (AVAILABLE -> ASSIGNED) with compare-and-set |
| Cron job on 3 servers | the job runs 3 times | leader election / distributed lock / SELECT FOR UPDATE SKIP LOCKED queue |
| Webhook / message delivered twice | duplicate processing | idempotent consumers (store processed ids) |
## REST API Design for a Booking System
### Resources and endpoints
| Method and path | Purpose | Success | Common errors |
|---|---|---|---|
| GET /shows/{id}/seats | seat map with status | 200 | 404 show not found |
| POST /shows/{id}/holds | hold seats {seats: [F12, F13]} | 201 + hold id, expires_at | 409 seat taken, 422 invalid seats, 429 too many requests |
| DELETE /holds/{holdId} | release a hold | 204 | 404 |
| POST /bookings (Idempotency-Key header) | create booking from a hold | 201 + booking (PENDING_PAYMENT) + payment URL | 409 hold expired, 400 bad input |
| POST /payments/webhook | gateway calls this (signed) | 200 | 401 bad signature |
| GET /bookings/{id} | booking status and ticket | 200 | 403 not your booking, 404 |
| POST /bookings/{id}/cancel | cancel and refund | 202 | 409 too late to cancel |
```txt
POST /api/v1/shows/88/holds HTTP/1.1
Host: api.tickets.example
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{ "seats": ["F12", "F13"] }

HTTP/1.1 201 Created
Location: /api/v1/holds/h_7Q2
Content-Type: application/json

{ "hold_id": "h_7Q2", "seats": ["F12", "F13"], "expires_at": "2026-11-17T14:10:00Z", "amount": 520 }
```
```txt
HTTP/1.1 409 Conflict
Content-Type: application/json

{ "error": "SEAT_UNAVAILABLE", "message": "F12 was just booked by someone else", "unavailable": ["F12"] }
```
### How the API call actually works, step by step
@flow (User taps "Hold seats" in the app) | App sends HTTPS POST with JSON body and the user's token | DNS -> load balancer -> API gateway: TLS, auth check, rate limit | Booking service validates input (seats exist, max 10 seats) | Atomic UPDATE in the database (one transaction) | <Row updated? ~ (409 Conflict JSON)> | (201 Created JSON with hold id and expiry; app starts a 10-minute timer) :: Life of a booking API request
```py
# FastAPI implementation of the hold endpoint (PostgreSQL via psycopg)
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field
import psycopg, uuid
app = FastAPI()
class HoldIn(BaseModel):
    seats: list[str] = Field(min_length=1, max_length=10)

@app.post("/api/v1/shows/{show_id}/holds", status_code=201)
def hold(show_id: int, body: HoldIn, user=Depends(current_user)):            # current_user checks the token
    hold_id = "h_" + uuid.uuid4().hex[:8]
    with psycopg.connect(DB_URL) as con, con.transaction():
        rows = con.execute("""
            UPDATE seats SET status = 'HELD', held_by = %s, hold_id = %s, hold_expires_at = now() + interval '10 minutes'
            WHERE show_id = %s AND seat_no = ANY(%s) AND status = 'AVAILABLE'
            RETURNING seat_no""", (user.id, hold_id, show_id, body.seats)).fetchall()
        if len(rows) != len(body.seats):                   # some seat was taken -> undo everything
            raise HTTPException(409, detail={"error": "SEAT_UNAVAILABLE", "unavailable": sorted(set(body.seats) - {r[0] for r in rows})})
    return {"hold_id": hold_id, "seats": body.seats, "expires_in_seconds": 600}
```
- Raising inside `con.transaction()` rolls the transaction back, so a partial hold (F13 held but F12 taken) never stays.
## Low Level Design (LLD)
- LLD = designing the **classes, interfaces, relationships, methods and patterns** inside one component, plus concurrency safety. Interview flow: clarify requirements -> identify entities (nouns) -> behaviours (verbs) -> class diagram -> patterns -> code the core -> handle edge cases and concurrency.
@flow (Clarify requirements and scope) | List entities and their attributes | Define relationships (has-a, is-a) and interfaces | Choose design patterns (Strategy, Factory, Observer, State) | (Write the core classes and walk through a use case) :: LLD interview approach
### LLD 1: Movie Ticket Booking (BookMyShow)
@layers BookingService (facade) | Movie, Theatre, Screen, Show, Seat, Booking, Payment, User | SeatLockProvider (interface): InMemoryLock / RedisLock | PaymentStrategy: UPI / Card / Wallet | NotificationObserver: Email / SMS :: Classes for ticket booking
```java
enum SeatStatus { AVAILABLE, HELD, BOOKED }
enum BookingStatus { PENDING, CONFIRMED, CANCELLED, EXPIRED }
class Seat { final String id; final int price; Seat(String id, int price) { this.id = id; this.price = price; } }
class Show {
    final String id; final Map<String, Seat> seats; final Map<String, SeatStatus> status = new ConcurrentHashMap<>();
    Show(String id, List<Seat> list) { this.id = id; seats = new HashMap<>(); for (Seat s : list) { seats.put(s.id, s); status.put(s.id, SeatStatus.AVAILABLE); } }
}
interface SeatLockProvider {                       // swap in-memory for Redis without touching the service (DIP)
    boolean lock(Show show, List<String> seatIds, String userId, Duration ttl);
    void unlock(Show show, List<String> seatIds, String userId);
}
class InMemorySeatLockProvider implements SeatLockProvider {
    private final Map<String, String> owner = new HashMap<>(); private final Map<String, Instant> expiry = new HashMap<>();
    public synchronized boolean lock(Show show, List<String> ids, String user, Duration ttl) {   // synchronized = atomic check + set
        Instant now = Instant.now();
        for (String id : ids) {
            String k = show.id + ":" + id;
            boolean heldByOther = owner.containsKey(k) && !owner.get(k).equals(user) && expiry.get(k).isAfter(now);
            if (heldByOther || show.status.get(id) == SeatStatus.BOOKED) return false;           // all-or-nothing
        }
        for (String id : ids) { String k = show.id + ":" + id; owner.put(k, user); expiry.put(k, now.plus(ttl)); show.status.put(id, SeatStatus.HELD); }
        return true;
    }
    public synchronized void unlock(Show show, List<String> ids, String user) {
        for (String id : ids) { String k = show.id + ":" + id; if (user.equals(owner.get(k))) { owner.remove(k); expiry.remove(k); show.status.put(id, SeatStatus.AVAILABLE); } }
    }
}
interface PaymentStrategy { boolean pay(String userId, int amount); }
class UpiPayment implements PaymentStrategy { public boolean pay(String u, int a) { return true; } }
class Booking {
    final String id = UUID.randomUUID().toString(); final Show show; final List<String> seatIds; final String userId;
    BookingStatus status = BookingStatus.PENDING;
    Booking(Show s, List<String> ids, String u) { show = s; seatIds = ids; userId = u; }
}
class BookingService {
    private final SeatLockProvider locks; private final List<Consumer<Booking>> listeners = new ArrayList<>();   // Observer
    BookingService(SeatLockProvider locks) { this.locks = locks; }
    void onConfirmed(Consumer<Booking> l) { listeners.add(l); }
    Booking hold(Show show, List<String> seatIds, String userId) {
        if (!locks.lock(show, seatIds, userId, Duration.ofMinutes(10))) throw new IllegalStateException("Seats not available");
        return new Booking(show, seatIds, userId);
    }
    void confirm(Booking b, PaymentStrategy payment) {
        int amount = b.seatIds.stream().mapToInt(id -> b.show.seats.get(id).price).sum();
        if (!payment.pay(b.userId, amount)) { locks.unlock(b.show, b.seatIds, b.userId); b.status = BookingStatus.CANCELLED; return; }
        b.seatIds.forEach(id -> b.show.status.put(id, SeatStatus.BOOKED));
        b.status = BookingStatus.CONFIRMED;
        listeners.forEach(l -> l.accept(b));                                    // email / SMS ticket
    }
}
```
- Patterns used: **Strategy** (payments, lock provider), **Observer** (notifications), **Facade** (BookingService), **Dependency inversion** (interfaces). Concurrency: atomic all-or-nothing lock with expiry.
### LLD 2: Parking Lot
- Covered with code in notebook 04 (OOP case study): ParkingLot -> Floors -> Spots by size, Vehicle hierarchy, Ticket, fee strategy, synchronized park / unpark.
### LLD 3: LRU Cache (thread-safe)
```java
class LRUCache<K, V> {
    private final int capacity;
    private final LinkedHashMap<K, V> map;
    LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(16, 0.75f, true) {                       // true = access order
            protected boolean removeEldestEntry(Map.Entry<K, V> e) { return size() > LRUCache.this.capacity; }
        };
    }
    public synchronized V get(K k) { return map.get(k); }
    public synchronized void put(K k, V v) { map.put(k, v); }
}
```
- Full hand-made version (hash map + doubly linked list) is in notebook 11 (LRU Cache).
### LLD 4: Rate Limiter (token bucket per user)
```java
class TokenBucket {
    private final long capacity; private final double refillPerMs; private double tokens; private long last = System.currentTimeMillis();
    TokenBucket(long capacity, double perSecond) { this.capacity = capacity; this.refillPerMs = perSecond / 1000.0; this.tokens = capacity; }
    synchronized boolean tryConsume() {
        long now = System.currentTimeMillis();
        tokens = Math.min(capacity, tokens + (now - last) * refillPerMs); last = now;
        if (tokens >= 1) { tokens -= 1; return true; }
        return false;
    }
}
class RateLimiter {
    private final ConcurrentHashMap<String, TokenBucket> buckets = new ConcurrentHashMap<>();
    boolean allow(String userId) { return buckets.computeIfAbsent(userId, k -> new TokenBucket(10, 5)).tryConsume(); }   // burst 10, 5 per second
}
```
### LLD 5: Elevator System
@layers ElevatorController (dispatch strategy) | Elevator 1, Elevator 2, Elevator 3 (state: IDLE / MOVING_UP / MOVING_DOWN / DOORS_OPEN) | Requests: hall calls (floor + direction), car calls (destination) :: Elevator design
```py
from enum import Enum
import heapq
class Dir(Enum): UP = 1; DOWN = -1; IDLE = 0
class Elevator:
    def __init__(self, eid, floors): self.id, self.floor, self.dir, self.up, self.down, self.floors = eid, 0, Dir.IDLE, [], [], floors
    def add_stop(self, f):
        if f > self.floor: heapq.heappush(self.up, f)          # serve upward stops in increasing order
        elif f < self.floor: heapq.heappush(self.down, -f)     # downward stops in decreasing order
    def step(self):                                             # SCAN / LOOK: keep going in one direction while stops remain
        if self.dir != Dir.DOWN and self.up: self.dir, nxt = Dir.UP, heapq.heappop(self.up)
        elif self.down: self.dir, nxt = Dir.DOWN, -heapq.heappop(self.down)
        else: self.dir = Dir.IDLE; return
        self.floor = nxt
class Controller:
    def __init__(self, n, floors): self.elevators = [Elevator(i, floors) for i in range(n)]
    def request(self, floor):                                   # dispatch strategy: nearest idle-or-same-direction elevator
        best = min(self.elevators, key=lambda e: abs(e.floor - floor) + (0 if e.dir == Dir.IDLE else 3))
        best.add_stop(floor); return best.id
```
### LLD 6: Splitwise (expense sharing)
```py
from collections import defaultdict
class Splitwise:
    def __init__(self): self.balance = defaultdict(float)       # + means the person should receive money
    def add_expense(self, paid_by, amount, members, shares=None):
        shares = shares or {m: amount / len(members) for m in members}     # equal split by default (Strategy: equal / exact / percent)
        assert abs(sum(shares.values()) - amount) < 0.01
        self.balance[paid_by] += amount
        for m, s in shares.items(): self.balance[m] -= s
    def settle(self):                                           # greedy: biggest debtor pays biggest creditor -> few transactions
        cred = sorted([(v, k) for k, v in self.balance.items() if v > 0.01], reverse=True)
        debt = sorted([(-v, k) for k, v in self.balance.items() if v < -0.01], reverse=True)
        out, i, j = [], 0, 0
        while i < len(cred) and j < len(debt):
            pay = min(cred[i][0], debt[j][0]); out.append(f"{debt[j][1]} pays {cred[i][1]} Rs {pay:.2f}")
            cred[i] = (cred[i][0] - pay, cred[i][1]); debt[j] = (debt[j][0] - pay, debt[j][1])
            if cred[i][0] < 0.01: i += 1
            if debt[j][0] < 0.01: j += 1
        return out
s = Splitwise(); s.add_expense("Asha", 900, ["Asha", "Ravi", "Meena"]); s.add_expense("Ravi", 300, ["Ravi", "Meena"])
print(s.settle())          # ['Meena pays Asha Rs 450.00', 'Ravi pays Asha Rs 150.00']
```
### LLD 7: Vending machine (State pattern)
@chain Idle -> insert coin -> HasMoney -> select item -> Dispensing -> give item + change -> Idle :: Vending machine states
```java
interface State { void insertCoin(Machine m, int amt); void select(Machine m, String item); }
class Idle implements State {
    public void insertCoin(Machine m, int amt) { m.balance += amt; m.state = new HasMoney(); }
    public void select(Machine m, String item) { System.out.println("Insert money first"); }
}
class HasMoney implements State {
    public void insertCoin(Machine m, int amt) { m.balance += amt; }
    public void select(Machine m, String item) {
        int price = m.prices.getOrDefault(item, Integer.MAX_VALUE);
        if (m.balance < price) { System.out.println("Not enough money"); return; }
        System.out.println("Dispensing " + item + ", change " + (m.balance - price));
        m.balance = 0; m.state = new Idle();
    }
}
class Machine { State state = new Idle(); int balance; Map<String, Integer> prices = Map.of("chips", 20, "juice", 35);
    void insertCoin(int a) { state.insertCoin(this, a); } void select(String i) { state.select(this, i); } }
```
### More LLD problems to practise
- Library management (notebook 01 mini project), chess (board, pieces with Strategy for moves), Snake and Ladder, Tic-Tac-Toe, logging framework (Chain of Responsibility + Singleton), notification service (Factory + Observer), food delivery (order state machine), ATM (State), hotel booking (same concurrency as seats), URL shortener classes, pub-sub message broker (Observer + queues), file system (Composite).
## Software Engineering Methodologies (SDLC basics)
- **SDLC** (Software Development Life Cycle): requirements -> design -> implementation -> testing -> deployment -> maintenance. Methodologies decide how these steps are organised.
| Model | How it works | Good for | Weak point |
|---|---|---|---|
| Waterfall | each phase completes fully before the next | fixed, well-known requirements (government, construction-like projects) | late feedback, hard to change |
| V-Model | each development phase has a matching test phase | safety-critical systems (medical, automotive) | rigid |
| Iterative / incremental | build in small versions, improve each round | evolving products | needs good planning |
| Spiral | iterations with risk analysis in every loop | large, risky projects | costly |
| Agile | short iterations, working software often, collaboration, respond to change | most product companies | needs discipline, less upfront documentation |
| Scrum | Agile framework: 1-4 week sprints, roles and ceremonies | product teams | meetings overhead if done badly |
| Kanban | continuous flow on a board with work-in-progress limits | support, operations, maintenance | less time-boxed planning |
| DevOps | development + operations together, automation, CI/CD, monitoring | fast, reliable delivery | culture change needed |
@chain Product backlog -> Sprint planning -> Sprint backlog -> Sprint (1-4 weeks, daily stand-up) -> Increment -> Sprint review -> Retrospective :: Scrum cycle
| Scrum term | Meaning |
|---|---|
| Product owner | decides what to build and the priority (owns the backlog) |
| Scrum master | removes blockers, coaches the process |
| Development team | builds the product (5-9 people, cross-functional) |
| User story | "As a student I want to track progress so that I know what is left" + acceptance criteria |
| Story points | relative effort estimate (Fibonacci 1, 2, 3, 5, 8, 13) |
| Velocity | story points finished per sprint |
| Definition of done | checklist: coded, reviewed, tested, documented, deployed to staging |
| Daily stand-up | 15 min: what I did, what I will do, any blockers |
| Retrospective | what went well, what to improve |
- Engineering practices every company expects: Git branching and pull requests with **code review**, **unit tests** and **TDD** (write the test first), CI/CD (notebook 25), clean code (meaningful names, small functions, SOLID - notebook 04), documentation, monitoring, on-call and blameless postmortems.
Q: Agile vs Waterfall?
A: Waterfall completes each phase once in sequence and suits fixed requirements; Agile delivers working software in short iterations with continuous feedback and suits changing requirements.
Q: What happens in a sprint?
A: Planning picks backlog items, the team builds them with daily stand-ups, then shows the increment in the review and improves the process in the retrospective.
Q: How do you prevent double booking of a seat?
A: Make check-and-reserve atomic: a conditional UPDATE ... WHERE status = 'AVAILABLE' and check rows affected (or SELECT FOR UPDATE, or optimistic versioning), hold with an expiry, a unique constraint on (show, seat) as a safety net, and idempotent payment confirmation.
