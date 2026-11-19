# NoSQL - MongoDB, Redis, Cassandra, DynamoDB and Graph Databases (Neo4j)
NoSQL databases trade some relational features for flexible schemas, horizontal scale and data models that fit specific problems. This notebook covers why NoSQL exists, the CAP theorem, the four NoSQL families, MongoDB in depth (CRUD, aggregation, indexes, replication, sharding, schema design), graph databases with Cypher, Redis, Cassandra, DynamoDB and interview questions.
## Why NoSQL Exists
- Relational databases scale **up** (bigger server) easily but scale **out** (many servers) with difficulty, and need a fixed schema.
- Web-scale apps (Facebook, Amazon, Netflix) needed: huge write throughput, data spread over many machines, flexible/evolving data, low latency worldwide.
- "NoSQL" = **Not Only SQL**. Most NoSQL stores are distributed, schema-flexible and optimised for specific access patterns.
| | SQL (RDBMS) | NoSQL |
|---|---|---|
| data model | tables, fixed schema | documents, key-value, wide-column, graph |
| scaling | vertical (+ replicas) | horizontal (sharding built in) |
| transactions | strong ACID | often BASE; many now support ACID per document/partition |
| joins | powerful | limited; data is embedded/denormalised |
| query language | SQL | API / own query language |
| best for | relations, consistency, complex queries | scale, flexible data, specific patterns |
## CAP Theorem and BASE
- In a distributed system with a **network partition** (P), you must choose between **Consistency** (every read sees the latest write) and **Availability** (every request gets a response). You cannot have all three during a partition.
@chain Consistency <-> Availability <-> Partition tolerance :: Pick 2 when the network splits: CP or AP
| Choice | Behaviour during partition | Examples |
|---|---|---|
| CP | refuses some requests to stay consistent | MongoDB (default), HBase, etcd, Zookeeper |
| AP | answers, may return stale data | Cassandra, DynamoDB (default), CouchDB, Riak |
| CA | only without partitions (single node) | single-node RDBMS |
- **PACELC**: if Partition -> choose A or C; Else (normal) -> choose Latency or Consistency.
- **BASE**: Basically Available, Soft state, Eventually consistent - replicas converge over time.
- **Consistency levels**: strong, eventual, read-your-writes, monotonic reads, causal. Quorum rule: if W + R > N (writes acknowledged by W replicas, reads from R of N replicas) a read sees the latest write.
### CAP explained with an example
- Imagine a database copied on two servers, Mumbai and Delhi. The network link between them breaks (a **partition**). A user in Delhi writes balance = 500, and a user in Mumbai reads the balance.
@chain Delhi replica (balance = 500) <-> network cut <-> Mumbai replica (balance = 300) :: A partition: the replicas cannot talk
- **Choose Consistency (CP)**: Mumbai refuses to answer (error / timeout) until it can confirm the latest value. Data is never stale but some requests fail. Banking ledgers, inventory counts, leader election (etcd, Zookeeper, HBase, MongoDB with majority writes/reads).
- **Choose Availability (AP)**: Mumbai answers 300 (stale), and the replicas reconcile later. Always responds but may be stale. Shopping carts, likes counters, feeds, DNS (Cassandra, DynamoDB, CouchDB).
- **CA** is only possible when partitions never happen, i.e. a single machine - real distributed systems must tolerate partitions, so the real choice is C vs A **during** a failure.
| Consistency term | Meaning |
|---|---|
| strong / linearizable | every read sees the latest committed write |
| eventual | replicas converge if writes stop |
| read-your-writes | you always see your own updates |
| monotonic reads | you never see older data after newer |
| causal | causally related writes seen in order |
| tunable | choose per request (Cassandra ONE / QUORUM / ALL, DynamoDB ConsistentRead) |
- **Quorum math**: N replicas, a write waits for W acknowledgements, a read asks R replicas. If W + R > N, at least one replica in every read has the latest write. N = 3, W = 2, R = 2 is the usual balance. W = 1, R = 1 is fast but eventually consistent.
- **MongoDB knobs**: writeConcern ({ w: "majority", j: true }) for durability, readConcern ("local", "majority", "linearizable", "snapshot"), readPreference ("primary", "primaryPreferred", "secondary", "nearest").
- **ACID vs BASE** in one line: ACID prefers correctness first (banks), BASE prefers availability and scale first (social apps).
## The Four NoSQL Families
| Type | Model | Examples | Use cases |
|---|---|---|---|
| Key-value | key -> opaque value | Redis, DynamoDB, Memcached, etcd | cache, sessions, carts, counters, leaderboards |
| Document | key -> JSON/BSON document | MongoDB, Couchbase, Firestore | catalogs, CMS, user profiles, events |
| Wide-column | rows with dynamic columns grouped in families, partitioned | Cassandra, HBase, ScyllaDB, Bigtable | time series, IoT, messaging, write-heavy logs |
| Graph | nodes + relationships with properties | Neo4j, Amazon Neptune, ArangoDB, TigerGraph | social networks, recommendations, fraud, knowledge graphs |
| (also) Search / vector / time-series | inverted index, embeddings, time buckets | Elasticsearch, Pinecone, InfluxDB | search, semantic search, metrics |
## MongoDB - Concepts
- Stores **documents** (JSON-like **BSON**) in **collections** inside **databases**. Each document has a unique `_id` (ObjectId by default: timestamp + random + counter).
- Schema-flexible: documents in a collection may have different fields (validate with JSON Schema when needed).
| SQL | MongoDB |
|---|---|
| database | database |
| table | collection |
| row | document |
| column | field |
| primary key | _id |
| join | $lookup / embedding |
| index | index |
```json
{
  "_id": "65f1c2...",
  "name": "Asha",
  "email": "asha@x.com",
  "address": { "city": "Pune", "pin": "411001" },
  "skills": ["python", "sql"],
  "orders": [ { "item": "Laptop", "price": 55000 }, { "item": "Mouse", "price": 500 } ],
  "createdAt": { "$date": "2026-01-05T10:00:00Z" }
}
```
## MongoDB Basic Commands (mongosh)
```js
// connect
mongosh "mongodb://localhost:27017"                       // local
mongosh "mongodb+srv://cluster0.abcd.mongodb.net/" --username asha   // Atlas
// databases
show dbs                         // list databases
use shop                         // switch (created on first insert)
db                               // current database name
db.stats()                       // size, collections, indexes
db.dropDatabase()                // delete current database
// collections
show collections
db.createCollection("users")
db.createCollection("logs", { capped: true, size: 1048576, max: 1000 })   // fixed-size, insertion order
db.users.renameCollection("customers")
db.customers.drop()
// quick inspection
db.users.findOne()
db.users.find().pretty()
db.users.find().limit(5)
db.users.countDocuments()
db.users.estimatedDocumentCount()
db.users.distinct("city")
db.users.getIndexes()
// help and admin
help; db.help(); db.users.help()
db.serverStatus().connections
db.currentOp(); db.killOp(opId)
db.createUser({ user: "app", pwd: passwordPrompt(), roles: [{ role: "readWrite", db: "shop" }] })
db.getUsers()
// schema validation
db.createCollection("products", { validator: { $jsonSchema: {
  bsonType: "object", required: ["name", "price"],
  properties: { name: { bsonType: "string" }, price: { bsonType: "number", minimum: 0 } } } } })
// bulk operations
db.users.bulkWrite([
  { insertOne: { document: { name: "Zoya" } } },
  { updateOne: { filter: { name: "Asha" }, update: { $set: { vip: true } } } },
  { deleteOne: { filter: { name: "Old" } } }
])
// import / export / backup (terminal, not mongosh)
// mongoimport --db shop --collection users --file users.json --jsonArray
// mongoexport --db shop --collection users --out users.json
// mongodump --db shop --out ./backup        mongorestore ./backup
```
| SQL | MongoDB |
|---|---|
| SHOW DATABASES | show dbs |
| USE shop | use shop |
| CREATE TABLE users | db.createCollection("users") |
| INSERT INTO users VALUES (...) | db.users.insertOne({...}) |
| SELECT * FROM users WHERE age > 21 | db.users.find({ age: { $gt: 21 } }) |
| SELECT name FROM users | db.users.find({}, { name: 1 }) |
| UPDATE users SET age = 22 WHERE name = 'Asha' | db.users.updateOne({ name: "Asha" }, { $set: { age: 22 } }) |
| DELETE FROM users WHERE age < 18 | db.users.deleteMany({ age: { $lt: 18 } }) |
| SELECT COUNT(*) FROM users | db.users.countDocuments() |
| ORDER BY age DESC LIMIT 5 | .sort({ age: -1 }).limit(5) |
| GROUP BY city | aggregate([{ $group: { _id: "$city", n: { $sum: 1 } } }]) |
| JOIN | aggregate([{ $lookup: ... }]) |
| DROP TABLE users | db.users.drop() |
## MongoDB CRUD (mongosh)
```js
use shop
db.users.insertOne({ name: "Asha", age: 21, city: "Pune", skills: ["python", "sql"] })
db.users.insertMany([{ name: "Ravi", age: 25, city: "Delhi" }, { name: "Meena", age: 30, city: "Pune" }])
db.users.find({ city: "Pune" })                                  // WHERE city = 'Pune'
db.users.find({ age: { $gte: 21, $lt: 30 } }, { name: 1, _id: 0 })   // projection
db.users.find({ $or: [{ city: "Pune" }, { age: { $gt: 28 } }] })
db.users.find({ skills: "python" })                              // matches array element
db.users.find({ "address.city": "Pune" })                        // nested field
db.users.find({ name: /^A/ }).sort({ age: -1 }).skip(0).limit(10)
db.users.countDocuments({ city: "Pune" })
db.users.updateOne({ name: "Asha" }, { $set: { age: 22 }, $push: { skills: "mongodb" } })
db.users.updateMany({ city: "Pune" }, { $inc: { visits: 1 } })
db.users.updateOne({ email: "new@x.com" }, { $set: { name: "New" } }, { upsert: true })
db.users.deleteOne({ name: "Ravi" })
db.users.deleteMany({ age: { $lt: 18 } })
```
| Operator group | Operators |
|---|---|
| comparison | $eq $ne $gt $gte $lt $lte $in $nin |
| logical | $and $or $not $nor |
| element | $exists $type |
| array | $all $elemMatch $size |
| update | $set $unset $inc $push $pull $addToSet $rename |
## Aggregation Pipeline
- Documents flow through stages, each transforming the stream - like a Unix pipe or SQL with many steps.
@chain $match -> $unwind -> $group -> $sort -> $limit -> $project :: Aggregation pipeline
```js
// revenue per city for delivered orders, top 5
db.orders.aggregate([
  { $match: { status: "DELIVERED" } },                               // WHERE
  { $unwind: "$items" },                                             // one doc per item
  { $group: { _id: "$city", revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }, orders: { $sum: 1 } } },
  { $sort: { revenue: -1 } },
  { $limit: 5 },
  { $project: { _id: 0, city: "$_id", revenue: 1, orders: 1 } }
])
// join users with their orders
db.users.aggregate([
  { $lookup: { from: "orders", localField: "_id", foreignField: "userId", as: "orders" } },
  { $addFields: { orderCount: { $size: "$orders" } } }
])
// monthly signups
db.users.aggregate([{ $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, n: { $sum: 1 } } }, { $sort: { _id: 1 } }])
```
## Data Modelling in MongoDB
- Design for **how the app reads data** (access patterns), not for normal forms.
| Embed (nested documents) | Reference (store ids) |
|---|---|
| data read together (user + address) | data used independently |
| one-to-few | one-to-many huge / many-to-many |
| atomic single-document updates | avoid unbounded arrays (16 MB doc limit) |
| fast reads, duplication | needs $lookup or 2 queries |
- Patterns: **Subset** (embed the 10 latest reviews, keep the rest in another collection), **Bucket** (group IoT readings per hour into one doc), **Computed** (store precomputed totals), **Extended reference** (copy the few fields you need), **Outlier**, **Polymorphic**.
@chain Product doc {name, price, top 10 reviews} -> reviews collection {productId, ...all reviews} :: Subset pattern
## Indexes in MongoDB
```js
db.users.createIndex({ email: 1 }, { unique: true })
db.orders.createIndex({ userId: 1, createdAt: -1 })          // compound: follows the ESR rule (Equality, Sort, Range)
db.products.createIndex({ name: "text", description: "text" }) // text search
db.places.createIndex({ location: "2dsphere" })              // geo queries
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })   // TTL: auto delete
db.orders.find({ userId: 7 }).sort({ createdAt: -1 }).explain("executionStats")   // IXSCAN good, COLLSCAN bad
```
- Indexes are B-trees. Multikey indexes index each array element. Wildcard indexes for unknown fields.
## Replication and Sharding
### Replica set (high availability)
- One **primary** takes writes; **secondaries** copy its operation log (oplog). If the primary dies, members **elect** a new primary (needs a majority).
- Write concern `w: "majority"` = durable on most nodes. Read preference: primary (consistent) or secondary (may be stale).
@layers Application | Primary (reads + writes) | Secondary 1, Secondary 2 (replicate oplog, can be elected) :: MongoDB replica set
### Sharding (horizontal scale)
- Data is split across **shards** by a **shard key**. `mongos` routers send each query to the right shard using metadata in **config servers**. Data is divided into chunks that the balancer moves.
- Shard key choice is critical: high cardinality, even distribution, matches common queries. **Hashed** shard key spreads writes; **ranged** key helps range queries but a monotonically increasing key (timestamp) creates a hot shard.
@layers App | mongos router (+ config servers) | Shard A (replica set), Shard B (replica set), Shard C (replica set) :: Sharded cluster
## Transactions and Consistency in MongoDB
- Single-document operations are atomic. Multi-document ACID transactions exist (4.0+ replica sets, 4.2+ sharded) but cost performance - design to keep related data in one document.
```js
const session = db.getMongo().startSession();
session.startTransaction();
try {
  session.getDatabase("bank").accounts.updateOne({ _id: 1 }, { $inc: { bal: -500 } });
  session.getDatabase("bank").accounts.updateOne({ _id: 2 }, { $inc: { bal: 500 } });
  session.commitTransaction();
} catch (e) { session.abortTransaction(); }
```
## MongoDB from Python and Node.js
```py
from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017")
db = client.shop
db.users.insert_one({"name": "Asha", "city": "Pune"})
for u in db.users.find({"city": "Pune"}, {"_id": 0, "name": 1}): print(u)
pipeline = [{"$group": {"_id": "$city", "n": {"$sum": 1}}}]
print(list(db.users.aggregate(pipeline)))
```
```js
import mongoose from "mongoose";
await mongoose.connect(process.env.MONGO_URL);
const User = mongoose.model("User", new mongoose.Schema({ name: { type: String, required: true }, email: { type: String, unique: true }, city: String }, { timestamps: true }));
await User.create({ name: "Asha", email: "asha@x.com", city: "Pune" });
const puneUsers = await User.find({ city: "Pune" }).select("name").lean();
```
## Graph Databases
### Concepts
- Data = **nodes** (entities, with labels and properties) + **relationships** (typed, directed, with properties). Relationships are stored as direct pointers (**index-free adjacency**), so following a connection is O(1) instead of a join.
- Best when the questions are about **connections**: friends of friends, shortest path, recommendations, fraud rings, knowledge graphs, network/IT dependency maps, GraphRAG for LLMs.
@graph Asha>Ravi Ravi>Meena Asha>Pune Meena>Pune Ravi>Python Meena>Python :: Property graph: people FOLLOW people, LIVE_IN cities, KNOW skills
| Relational | Graph |
|---|---|
| joins computed at query time (slow for deep hops) | relationships stored, traversal is fast |
| fixed schema | flexible labels and properties |
| good for aggregations | good for paths and patterns |
### Neo4j and Cypher
- Cypher draws patterns with ASCII art: `(node)-[:RELATIONSHIP]->(node)`.
```txt
// create
CREATE (a:Person {name: 'Asha', age: 21}), (r:Person {name: 'Ravi'}), (p:City {name: 'Pune'})
CREATE (a)-[:FOLLOWS {since: 2024}]->(r), (a)-[:LIVES_IN]->(p)
// match / read
MATCH (p:Person {name: 'Asha'})-[:FOLLOWS]->(friend) RETURN friend.name
// friends of friends I do not follow yet (recommendation)
MATCH (me:Person {name: 'Asha'})-[:FOLLOWS]->()-[:FOLLOWS]->(fof)
WHERE NOT (me)-[:FOLLOWS]->(fof) AND fof <> me
RETURN fof.name, count(*) AS mutual ORDER BY mutual DESC LIMIT 5
// shortest path
MATCH path = shortestPath((a:Person {name: 'Asha'})-[:FOLLOWS*..6]-(b:Person {name: 'Zoya'})) RETURN path
// merge = create if missing
MERGE (s:Skill {name: 'Python'})
// products bought by people who bought what I bought
MATCH (me:User {id: 7})-[:BOUGHT]->(:Product)<-[:BOUGHT]-(other)-[:BOUGHT]->(rec:Product)
WHERE NOT (me)-[:BOUGHT]->(rec) RETURN rec.name, count(*) AS score ORDER BY score DESC LIMIT 10
CREATE INDEX person_name FOR (p:Person) ON (p.name)
```
- Graph algorithms (Neo4j GDS): PageRank (influence), community detection (Louvain), centrality, similarity, shortest paths - see BFS/DFS/Dijkstra in notebooks 10-11.
- Other query languages: Gremlin (Apache TinkerPop, Neptune), SPARQL (RDF triples), GQL (ISO standard, 2024).
## Redis (Key-Value, In-Memory)
- In-memory data-structure server: sub-millisecond reads/writes. Single-threaded command execution (atomic commands) with I/O threads.
| Type | Commands | Use |
|---|---|---|
| String | SET, GET, INCR, SETEX | cache, counters, rate limits |
| Hash | HSET, HGETALL | objects (user session) |
| List | LPUSH, RPOP, LRANGE | queues, timelines |
| Set | SADD, SISMEMBER, SINTER | unique visitors, tags |
| Sorted set | ZADD, ZRANGE, ZREVRANK | leaderboards, priority queues |
| Stream | XADD, XREADGROUP | event log, consumer groups |
| Others | Bitmaps, HyperLogLog, Geo, Pub/Sub, JSON, vectors | analytics, real-time |
```sh
SET user:7:name "Asha" EX 3600       # expires in 1 hour
INCR page:home:views
HSET session:abc user_id 7 role admin
ZADD leaderboard 980 "asha" 1200 "ravi"
ZREVRANGE leaderboard 0 9 WITHSCORES   # top 10
SET lock:order:42 1 NX PX 5000         # simple distributed lock
```
- Persistence: RDB snapshots and/or AOF (append-only file). Eviction policies: allkeys-lru, volatile-ttl, etc. Scaling: replicas + Sentinel (failover) or Redis Cluster (16384 hash slots). More in notebook 12 (caching).
## Cassandra (Wide-Column)
- Masterless ring: every node is equal; data is placed by consistent hashing of the **partition key**; replicated to N nodes; tunable consistency (ONE, QUORUM, ALL).
- Writes go to a commit log + in-memory memtable, flushed to immutable **SSTables** (LSM tree) -> extremely fast writes; compaction merges files.
- Model **one table per query**: choose the partition key (which node) and clustering columns (sort order within the partition).
```sql
CREATE TABLE messages_by_chat (
  chat_id uuid, sent_at timeuuid, sender text, body text,
  PRIMARY KEY ((chat_id), sent_at)            -- partition key: chat_id; clustering: sent_at
) WITH CLUSTERING ORDER BY (sent_at DESC);
SELECT * FROM messages_by_chat WHERE chat_id = ? LIMIT 50;   -- latest 50 messages of one chat
```
@graph N1-N2 N2-N3 N3-N4 N4-N5 N5-N6 N6-N1 :: Cassandra ring: token ranges, each key stored on the next 3 nodes
## DynamoDB (Managed Key-Value / Document on AWS)
- Fully managed, serverless, single-digit-millisecond at any scale. Table items are found by a **partition key** (+ optional **sort key**). Secondary indexes: GSI (different partition key) and LSI.
- **Single-table design**: store several entity types in one table with generic keys (PK = "USER#7", SK = "ORDER#2026-01-05") so one query fetches a user and their orders.
- Capacity: on-demand or provisioned (RCU/WCU). Streams for change data capture, TTL, transactions (TransactWriteItems).
```py
import boto3
table = boto3.resource("dynamodb").Table("app")
table.put_item(Item={"PK": "USER#7", "SK": "PROFILE", "name": "Asha"})
table.put_item(Item={"PK": "USER#7", "SK": "ORDER#2026-01-05", "total": 55500})
resp = table.query(KeyConditionExpression="PK = :pk AND begins_with(SK, :o)", ExpressionAttributeValues={":pk": "USER#7", ":o": "ORDER#"})
```
## Choosing the Right Database
| Requirement | Pick |
|---|---|
| money, orders, strong relations | PostgreSQL / MySQL |
| flexible product catalog, content | MongoDB |
| cache, sessions, rate limiting, leaderboard | Redis |
| massive writes, time series, chat history | Cassandra / ScyllaDB |
| serverless key-value at any scale on AWS | DynamoDB |
| relationships, recommendations, fraud graphs | Neo4j / Neptune |
| full-text search, logs | Elasticsearch / OpenSearch |
| semantic search over embeddings | pgvector, Pinecone, Weaviate, Qdrant, Milvus |
| analytics on huge data | BigQuery, Snowflake, Redshift, ClickHouse |
- Real systems use several (**polyglot persistence**): orders in PostgreSQL, sessions in Redis, search in Elasticsearch, events in Kafka, analytics in a warehouse.
## Storage Engine Internals
| B-tree engines | LSM-tree engines |
|---|---|
| update in place, pages | append to memtable + SSTables, compaction |
| fast reads, slower random writes | very fast writes, reads may check several files (Bloom filters help) |
| PostgreSQL, MySQL InnoDB, MongoDB WiredTiger | Cassandra, RocksDB, LevelDB, HBase, ScyllaDB |
## NoSQL Interview Questions
Q: When would you choose NoSQL over SQL?
A: When you need horizontal scale, very high write throughput, flexible/evolving schemas, or a data model like documents or graphs that matches the access pattern - and can accept weaker joins/transactions.
Q: Explain the CAP theorem.
A: During a network partition a distributed store must choose between consistency and availability; partitions cannot be avoided, so systems are CP or AP.
Q: Is MongoDB ACID?
A: Single-document operations are atomic; multi-document transactions are supported since 4.0 with snapshot isolation, but cost performance.
Q: Embed vs reference in MongoDB?
A: Embed data that is read together and bounded in size; reference data that is shared, large, or grows without bound.
Q: How does MongoDB sharding work and how do you choose a shard key?
A: Documents are partitioned into chunks by shard key and distributed across shards behind mongos routers; choose a high-cardinality, evenly distributed key that matches query filters and avoids monotonically increasing hot spots.
Q: What is a replica set election?
A: When the primary is unreachable, secondaries vote; a node with a majority of votes and the freshest oplog becomes primary.
Q: Why are graph databases faster for deep relationships?
A: They store relationships as direct references (index-free adjacency), so each hop is a pointer follow instead of an index lookup + join.
Q: What is eventual consistency?
A: If no new writes happen, all replicas will eventually return the same value; reads in between may be stale.
Q: How does Cassandra achieve fast writes?
A: Writes are sequential appends to a commit log and an in-memory memtable, later flushed as immutable SSTables (LSM tree) - no random disk writes.
Q: What is consistent hashing?
A: Keys and nodes are placed on a hash ring; each key belongs to the next node clockwise, so adding/removing a node moves only a small fraction of keys (virtual nodes balance load).
Q: Redis vs Memcached?
A: Redis has rich data types, persistence, replication, Lua scripts, pub/sub and streams; Memcached is a simple multi-threaded string cache.
Q: What is the DynamoDB hot partition problem?
A: A partition key with skewed traffic overloads one partition; fix with high-cardinality keys or write sharding (key suffixes).
