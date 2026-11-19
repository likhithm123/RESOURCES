# Relational Databases - SQL, MySQL and PostgreSQL
Every software, data and AI role uses SQL. This notebook teaches databases from zero: tables and keys, every SQL clause with examples on one sample database, joins, subqueries, window functions, normalisation, indexes (B+ tree), transactions and ACID, isolation levels, query plans, MySQL vs PostgreSQL, scaling, and 40+ interview questions.
## What is a Database
- A **database** is an organised collection of data. A **DBMS** (Database Management System) is the software that stores it safely, lets many users query it, and keeps it consistent (MySQL, PostgreSQL, Oracle, SQL Server, SQLite).
- **Relational** database (RDBMS): data in **tables** (relations) of rows and columns, linked by keys, queried with **SQL** (Structured Query Language).
- Why not plain files? Concurrent access, crash recovery, integrity rules, fast search (indexes), security, query language.
@layers Application | SQL queries | Query parser, Optimizer, Executor | Buffer pool (cache), Transaction + lock manager, Log (WAL) | Data files on disk :: Inside an RDBMS
## Core Terms
| Term | Meaning |
|---|---|
| Table (relation) | set of rows with the same columns |
| Row (tuple / record) | one entity, e.g. one customer |
| Column (attribute) | one property, with a data type |
| Schema | structure: tables, columns, types, constraints |
| Primary key | uniquely identifies a row; not null |
| Foreign key | column referencing another table's primary key |
| Candidate key | any minimal unique column set |
| Super key | any unique column set (may be non-minimal) |
| Composite key | primary key made of several columns |
| Surrogate key | artificial id (auto increment, UUID) |
| Natural key | real-world unique value (email, PAN) |
## Sample Database Used in This Notebook
@chain customers (id) -> orders (customer_id) -> order_items (order_id, product_id) <- products (id) :: E-commerce schema
```sql
CREATE TABLE customers (
    id          SERIAL PRIMARY KEY,               -- MySQL: INT AUTO_INCREMENT PRIMARY KEY
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    city        VARCHAR(50),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE products (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price    NUMERIC(10,2) CHECK (price >= 0)
);
CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    status      VARCHAR(20) DEFAULT 'PLACED',
    order_date  DATE NOT NULL
);
CREATE TABLE order_items (
    order_id   INT REFERENCES orders(id),
    product_id INT REFERENCES products(id),
    qty        INT CHECK (qty > 0),
    PRIMARY KEY (order_id, product_id)              -- composite key
);
INSERT INTO customers (name, email, city) VALUES
 ('Asha', 'asha@x.com', 'Pune'), ('Ravi', 'ravi@x.com', 'Delhi'), ('Meena', 'meena@x.com', 'Pune'), ('John', 'john@x.com', NULL);
INSERT INTO products (name, category, price) VALUES
 ('Laptop', 'Electronics', 55000), ('Mouse', 'Electronics', 500), ('Book', 'Books', 400), ('Pen', 'Stationery', 20);
INSERT INTO orders (customer_id, status, order_date) VALUES (1, 'DELIVERED', '2026-01-05'), (1, 'PLACED', '2026-02-10'), (2, 'DELIVERED', '2026-02-11');
INSERT INTO order_items VALUES (1, 1, 1), (1, 2, 2), (2, 3, 3), (3, 4, 10);
```
## SQL Command Categories
| Category | Commands | Purpose |
|---|---|---|
| DDL (definition) | CREATE, ALTER, DROP, TRUNCATE, RENAME | structure |
| DML (manipulation) | INSERT, UPDATE, DELETE, MERGE | data |
| DQL (query) | SELECT | read |
| DCL (control) | GRANT, REVOKE | permissions |
| TCL (transaction) | COMMIT, ROLLBACK, SAVEPOINT | transactions |
```sql
ALTER TABLE customers ADD COLUMN phone VARCHAR(15);
ALTER TABLE customers ALTER COLUMN city SET DEFAULT 'Unknown';      -- MySQL: MODIFY COLUMN
UPDATE products SET price = price * 1.10 WHERE category = 'Books';
DELETE FROM orders WHERE status = 'CANCELLED';
TRUNCATE TABLE logs;          -- removes all rows fast, resets identity, minimal logging
DROP TABLE IF EXISTS temp_data;
GRANT SELECT, INSERT ON orders TO analyst;
```
| DELETE | TRUNCATE | DROP |
|---|---|---|
| removes chosen rows (WHERE) | removes all rows | removes the table itself |
| logged row by row, slower | minimal logging, fast | structure gone |
| can roll back | rollback in PostgreSQL (in a transaction) | gone |
| fires triggers | no triggers | - |
## Data Types
| Kind | PostgreSQL | MySQL |
|---|---|---|
| integers | SMALLINT, INT, BIGINT, SERIAL | TINYINT, INT, BIGINT, AUTO_INCREMENT |
| exact decimal (money) | NUMERIC(p,s) | DECIMAL(p,s) |
| floating | REAL, DOUBLE PRECISION | FLOAT, DOUBLE |
| text | VARCHAR(n), TEXT | VARCHAR(n), TEXT |
| date/time | DATE, TIMESTAMP, TIMESTAMPTZ, INTERVAL | DATE, DATETIME, TIMESTAMP |
| boolean | BOOLEAN | TINYINT(1) |
| JSON | JSON, JSONB (indexed binary) | JSON |
| others | UUID, ARRAY, ENUM, INET, tsvector | ENUM, SET |
> Never store money as FLOAT - rounding errors. Use NUMERIC/DECIMAL or integer paise.
## Constraints
- **NOT NULL**, **UNIQUE**, **PRIMARY KEY** (unique + not null), **FOREIGN KEY** (referential integrity), **CHECK** (rule), **DEFAULT**.
- Foreign key actions: ON DELETE CASCADE (delete children), SET NULL, RESTRICT / NO ACTION (block).
## SELECT - Reading Data
### Logical order of execution
@chain FROM / JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> DISTINCT -> ORDER BY -> LIMIT / OFFSET :: SQL runs in this order, not the written order
> That is why you cannot use a SELECT alias inside WHERE, but you can in ORDER BY.
```sql
SELECT name, city FROM customers;
SELECT DISTINCT city FROM customers;
SELECT * FROM products WHERE price BETWEEN 300 AND 1000 AND category <> 'Books';
SELECT * FROM customers WHERE city IN ('Pune', 'Delhi');
SELECT * FROM customers WHERE name LIKE 'A%';          -- starts with A; '_' = one char; ILIKE = case-insensitive (PG)
SELECT * FROM customers WHERE city IS NULL;            -- never "= NULL"
SELECT name, price, price * 0.18 AS gst FROM products ORDER BY price DESC LIMIT 2 OFFSET 0;
SELECT name, COALESCE(city, 'Unknown') AS city FROM customers;       -- first non-null
SELECT name, CASE WHEN price > 10000 THEN 'premium' WHEN price > 300 THEN 'standard' ELSE 'budget' END AS tier FROM products;
```
- NULL means "unknown": NULL = NULL is not true; any arithmetic with NULL is NULL; aggregates ignore NULLs (except COUNT(*)).
## Aggregation - GROUP BY and HAVING
```sql
SELECT COUNT(*), COUNT(city), AVG(price), MIN(price), MAX(price), SUM(price) FROM products;
SELECT city, COUNT(*) AS customers FROM customers GROUP BY city;
SELECT category, AVG(price) AS avg_price
FROM products
GROUP BY category
HAVING AVG(price) > 300            -- HAVING filters groups, WHERE filters rows
ORDER BY avg_price DESC;
```
| WHERE | HAVING |
|---|---|
| filters rows before grouping | filters groups after grouping |
| cannot use aggregates | uses aggregates |
## Joins
@grid A only / A and B / B only :: INNER = middle; LEFT = A only + middle; RIGHT = middle + B only; FULL = all three
| Join | Returns |
|---|---|
| INNER JOIN | rows with a match in both tables |
| LEFT JOIN | all left rows + matches (NULL if none) |
| RIGHT JOIN | all right rows + matches |
| FULL OUTER JOIN | all rows from both (MySQL: LEFT UNION RIGHT) |
| CROSS JOIN | every combination (cartesian product) |
| SELF JOIN | table joined with itself (employee - manager) |
```sql
-- customers with their orders (only those who ordered)
SELECT c.name, o.id AS order_id, o.order_date
FROM customers c
INNER JOIN orders o ON o.customer_id = c.id;
-- all customers, even without orders
SELECT c.name, COUNT(o.id) AS orders
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name;                                  -- Meena and John show 0
-- customers who never ordered (anti-join)
SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL;
-- revenue per customer: three tables
SELECT c.name, SUM(oi.qty * p.price) AS revenue
FROM customers c
JOIN orders o       ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p     ON p.id = oi.product_id
GROUP BY c.name ORDER BY revenue DESC;
-- self join: employee and manager
SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id;
```
### How databases execute joins
| Algorithm | Best when |
|---|---|
| Nested loop | one side tiny, or index on the inner side |
| Hash join | large unsorted tables, equality join |
| Merge join | both inputs sorted on the join key |
## Subqueries and CTEs
```sql
-- products costlier than average (scalar subquery)
SELECT name FROM products WHERE price > (SELECT AVG(price) FROM products);
-- customers who ordered (IN / EXISTS)
SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders);
SELECT name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
-- correlated subquery: most expensive product in each category
SELECT name, category, price FROM products p
WHERE price = (SELECT MAX(price) FROM products WHERE category = p.category);
-- CTE (WITH): readable named sub-results
WITH revenue AS (
    SELECT o.customer_id, SUM(oi.qty * p.price) AS total
    FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id
    GROUP BY o.customer_id
)
SELECT c.name, r.total FROM revenue r JOIN customers c ON c.id = r.customer_id WHERE r.total > 1000;
-- recursive CTE: org chart / numbers 1..10
WITH RECURSIVE nums(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM nums WHERE n < 10) SELECT * FROM nums;
```
- `NOT IN` with a NULL in the subquery returns nothing - prefer `NOT EXISTS`.
## Set Operations
```sql
SELECT city FROM customers UNION SELECT city FROM suppliers;       -- distinct rows
SELECT city FROM customers UNION ALL SELECT city FROM suppliers;   -- keeps duplicates, faster
SELECT id FROM customers INTERSECT SELECT customer_id FROM orders;
SELECT id FROM customers EXCEPT SELECT customer_id FROM orders;    -- MySQL 8.0.31+ ; Oracle: MINUS
```
## Window Functions (most asked in interviews)
- A window function computes over a set of rows **related to the current row** without collapsing them (unlike GROUP BY). Syntax: `func() OVER (PARTITION BY ... ORDER BY ... ROWS ...)`.
@grid dept salary ROW_NUMBER RANK DENSE_RANK / IT 900 1 1 1 / IT 800 2 2 2 / IT 800 3 2 2 / IT 700 4 4 3 :: Ranking functions on ties
```sql
SELECT name, dept, salary,
       ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn,
       RANK()       OVER (PARTITION BY dept ORDER BY salary DESC) AS rnk,
       DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS drnk,
       AVG(salary)  OVER (PARTITION BY dept)                       AS dept_avg,
       salary - LAG(salary) OVER (ORDER BY hire_date)              AS diff_prev,
       LEAD(salary, 1) OVER (ORDER BY hire_date)                   AS next_salary,
       SUM(salary)  OVER (ORDER BY hire_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
       NTILE(4)     OVER (ORDER BY salary)                         AS quartile
FROM employees;
-- Nth highest salary (classic): 2nd highest per department
SELECT * FROM (
  SELECT name, dept, salary, DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS r FROM employees
) t WHERE r = 2;
-- 7-day moving average of sales
SELECT day, amount, AVG(amount) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS ma7 FROM daily_sales;
```
## Classic SQL Interview Queries
```sql
-- 1. second highest salary
SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);
-- 2. duplicate emails
SELECT email, COUNT(*) FROM customers GROUP BY email HAVING COUNT(*) > 1;
-- 3. delete duplicates keeping the smallest id (PostgreSQL)
DELETE FROM customers a USING customers b WHERE a.email = b.email AND a.id > b.id;
-- 4. employees earning more than their manager
SELECT e.name FROM employees e JOIN employees m ON e.manager_id = m.id WHERE e.salary > m.salary;
-- 5. department with highest average salary
SELECT dept FROM employees GROUP BY dept ORDER BY AVG(salary) DESC LIMIT 1;
-- 6. top 3 products per category by revenue
SELECT * FROM (SELECT category, name, revenue, ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC) rn FROM product_revenue) t WHERE rn <= 3;
-- 7. consecutive login days (gaps and islands)
SELECT user_id, MIN(day) AS start_day, MAX(day) AS end_day, COUNT(*) AS streak
FROM (SELECT user_id, day, day - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day))::int AS grp FROM logins) t
GROUP BY user_id, grp HAVING COUNT(*) >= 3;
-- 8. month-over-month growth
SELECT month, revenue, ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month), 2) AS growth_pct FROM monthly_revenue;
-- 9. customers who bought every product (relational division)
SELECT customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY customer_id HAVING COUNT(DISTINCT product_id) = (SELECT COUNT(*) FROM products);
-- 10. pivot: orders per status per month
SELECT DATE_TRUNC('month', order_date) AS m, COUNT(*) FILTER (WHERE status = 'PLACED') AS placed, COUNT(*) FILTER (WHERE status = 'DELIVERED') AS delivered FROM orders GROUP BY 1;
```
## Views, Stored Procedures, Functions and Triggers
```sql
CREATE VIEW customer_revenue AS
SELECT c.id, c.name, COALESCE(SUM(oi.qty * p.price), 0) AS revenue
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
LEFT JOIN order_items oi ON oi.order_id = o.id LEFT JOIN products p ON p.id = oi.product_id GROUP BY c.id, c.name;
CREATE MATERIALIZED VIEW mv_revenue AS SELECT * FROM customer_revenue;   -- stored result (PG)
REFRESH MATERIALIZED VIEW mv_revenue;
-- PostgreSQL function
CREATE OR REPLACE FUNCTION order_total(oid INT) RETURNS NUMERIC AS $$
    SELECT COALESCE(SUM(oi.qty * p.price), 0) FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = oid;
$$ LANGUAGE sql STABLE;
-- trigger: keep updated_at fresh
CREATE OR REPLACE FUNCTION touch() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_touch BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION touch();
-- MySQL stored procedure
DELIMITER //
CREATE PROCEDURE place_order(IN cid INT) BEGIN INSERT INTO orders(customer_id, order_date) VALUES (cid, CURDATE()); END //
DELIMITER ;
CALL place_order(1);
```
## Database Design and Normalisation
### ER modelling
- Entities (Customer, Order), attributes, relationships with **cardinality**: 1:1 (user - profile), 1:N (customer - orders: foreign key on the N side), M:N (orders - products: a **junction table** order_items).
@chain Customer 1 -> N Order N -> M Product (via order_items) :: ER cardinalities
### Normal forms
- Goal: remove redundancy and **anomalies** (insert, update, delete anomalies).
| Form | Rule | Fix |
|---|---|---|
| 1NF | atomic values, no repeating groups | one value per cell; separate rows |
| 2NF | 1NF + no partial dependency on part of a composite key | move columns depending on part of the key |
| 3NF | 2NF + no transitive dependency (non-key -> non-key) | move to a new table |
| BCNF | every determinant is a candidate key | decompose further |
| 4NF | no multi-valued dependencies | split independent multi-valued facts |
Example: order_items(order_id, product_id, qty, product_name) - product_name depends only on product_id (part of the key) -> 2NF violation -> keep product_name in products only.
Example: employees(id, dept_id, dept_name) - dept_name depends on dept_id, not on id -> transitive -> 3NF violation -> departments table.
- **Denormalisation**: deliberately duplicate data (e.g. store order_total) to speed up reads in analytics or high-read systems; costs extra writes and consistency work.
- **Functional dependency** X -> Y: X determines Y.
## Indexes
- Without an index, a query scans every row (**full table scan**, O(n)). An index is a separate sorted structure (usually a **B+ tree**) mapping key -> row location: lookups O(log n), range scans fast.
@tree [40](  [10 25]( [5 8] , [12 20] , [30 35] ) , [60 80]( [45 50] , [65 70] , [85 90] ) ) :: B+ tree index: internal nodes route, leaves hold keys + row pointers and are linked
| Index type | Use |
|---|---|
| B-tree (default) | equality and range, ORDER BY |
| Hash | equality only |
| Composite (a, b) | filters on a, or a + b (leftmost prefix rule) |
| Unique | enforce uniqueness |
| Clustered | table rows stored in index order (InnoDB primary key) |
| Non-clustered / secondary | separate structure pointing to rows |
| Covering | index contains all columns the query needs (no table lookup) |
| Partial (PG) | index only rows matching a WHERE |
| Expression (PG) | index on LOWER(email) |
| GIN / GiST (PG) | JSONB, arrays, full-text, geospatial |
| Full-text | text search |
```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_cust_date ON orders(customer_id, order_date);      -- serves WHERE customer_id = ? ORDER BY order_date
CREATE UNIQUE INDEX idx_email_lower ON customers (LOWER(email));
CREATE INDEX idx_active ON orders(order_date) WHERE status = 'PLACED';    -- partial
CREATE INDEX idx_doc ON events USING GIN (payload jsonb_path_ops);
```
- Costs: extra storage and slower INSERT/UPDATE/DELETE (every index must be updated). Index columns used in WHERE, JOIN, ORDER BY with high selectivity.
- Index is NOT used when: wrapping the column in a function (`WHERE YEAR(order_date) = 2026`), leading wildcard (`LIKE '%abc'`), implicit type casts, low selectivity, skipping the leftmost column of a composite index.
## Query Optimisation and EXPLAIN
```sql
EXPLAIN ANALYZE
SELECT c.name, COUNT(*) FROM customers c JOIN orders o ON o.customer_id = c.id
WHERE o.order_date >= '2026-01-01' GROUP BY c.name;
```
- Read the plan: Seq Scan vs Index Scan / Index Only Scan, join type, estimated vs actual rows, sort spills to disk.
- Checklist: select only needed columns (no SELECT *), index filter/join columns, avoid N+1 queries from the application (use JOINs or IN batches), paginate with **keyset pagination** (`WHERE id > last_id LIMIT 20`) instead of large OFFSETs, keep statistics fresh (ANALYZE), use connection pooling (PgBouncer / HikariCP), cache hot reads (Redis).
## Transactions and ACID
- A **transaction** is a group of operations that succeed or fail together. Bank transfer: debit A and credit B must both happen or neither.
| Property | Meaning | How achieved |
|---|---|---|
| Atomicity | all or nothing | undo log, rollback |
| Consistency | constraints always hold | constraints, triggers, app rules |
| Isolation | concurrent transactions do not interfere | locks / MVCC |
| Durability | committed data survives crashes | write-ahead log (WAL / redo log) flushed on commit |
```sql
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
SAVEPOINT after_transfer;
INSERT INTO audit(msg) VALUES ('transfer 1->2');
-- ROLLBACK TO after_transfer;   (undo only the audit insert)
COMMIT;                          -- or ROLLBACK;
```
@flow (BEGIN) | debit account 1 | credit account 2 | <any error? ~ COMMIT: changes durable> | (ROLLBACK: nothing changed) :: Transaction life cycle
### Concurrency problems and isolation levels
| Problem | What happens |
|---|---|
| Dirty read | read uncommitted data of another transaction |
| Non-repeatable read | same row read twice gives different values |
| Phantom read | same query returns new rows inserted by others |
| Lost update | two transactions overwrite each other's update |
| Isolation level | Dirty | Non-repeatable | Phantom |
|---|---|---|---|
| Read Uncommitted | possible | possible | possible |
| Read Committed (PG default) | no | possible | possible |
| Repeatable Read (MySQL default) | no | no | possible (prevented by InnoDB gap locks / PG snapshot) |
| Serializable | no | no | no |
- **MVCC** (Multi-Version Concurrency Control): writers create new row versions; readers see a consistent **snapshot**, so reads do not block writes. PostgreSQL keeps old versions in the table (cleaned by VACUUM); MySQL InnoDB uses undo logs.
- **Locks**: shared (read) vs exclusive (write), row vs table locks, `SELECT ... FOR UPDATE` (pessimistic). **Optimistic locking**: a version column checked on update.
- **Deadlock**: T1 locks row A then wants B, T2 locks B then wants A. The DB detects it and aborts one; prevent by locking rows in a consistent order.
```sql
-- optimistic locking: update succeeds only if nobody changed the row
UPDATE products SET price = 450, version = version + 1 WHERE id = 3 AND version = 7;
-- pessimistic: lock the seat row until commit (ticket booking)
BEGIN; SELECT * FROM seats WHERE id = 42 FOR UPDATE; UPDATE seats SET booked_by = 9 WHERE id = 42; COMMIT;
```
## Concurrency Control (DBMS)
- **Concurrency control** lets many transactions run at the same time while the final result is as correct as if they had run one after another. Without it: lost updates, dirty reads, inconsistent reads.
### Schedules and serializability
- A **schedule** is the order in which operations (read R, write W) of several transactions are interleaved. **Serial schedule**: one transaction completes before the next starts (always correct, slow).
- A schedule is **serializable** if its result equals some serial schedule. Two operations **conflict** if they belong to different transactions, touch the same item, and at least one is a write (R-W, W-R, W-W).
- **Conflict serializable**: we can swap non-conflicting operations to reach a serial schedule. Test: build a **precedence graph** (edge Ti -> Tj if an operation of Ti conflicts with and comes before one of Tj). **Cycle = not serializable**.
| Time | T1 | T2 |
|---|---|---|
| 1 | R(A) | |
| 2 | | R(A) |
| 3 | W(A) | |
| 4 | | W(A) |
@graph T1>T2 T2>T1 :: Precedence graph has a cycle: not conflict serializable (this is the lost update)
- **View serializable** is a weaker (bigger) class; checking it is NP-complete, so databases use protocols that guarantee conflict serializability.
- **Recoverable schedule**: a transaction commits only after every transaction it read from has committed. **Cascadeless**: read only committed data (avoids cascading rollbacks). **Strict**: no read or write of an item until the last writer commits or aborts.
### Lock-based protocols
| Lock | Others may also take | Used for |
|---|---|---|
| Shared (S) | S | reading |
| Exclusive (X) | nothing | writing |
| Intention (IS, IX, SIX) | depends on compatibility matrix | announcing finer locks below (multi-granularity) |
| S | X |
|---|---|
| S + S compatible | S + X conflict |
| X + S conflict | X + X conflict |
- **Two-Phase Locking (2PL)**: a transaction has a **growing phase** (only acquires locks) then a **shrinking phase** (only releases). Guarantees conflict serializability, but can deadlock and cascade rollbacks.
- **Strict 2PL**: hold all **exclusive** locks until commit/abort -> strict, cascadeless schedules (used by most databases). **Rigorous 2PL**: hold **all** locks until commit.
@chain acquire S(A) -> acquire X(B) -> lock point -> release S(A) -> release X(B) at commit :: Two-phase locking: grow, then shrink
- **Lock granularity**: database > table > page > row > field. Fine locks = more concurrency, more overhead. **Lock escalation**: many row locks turned into one table lock. **Intention locks** let the DB check table-level conflicts quickly.
- **Gap / next-key locks** (MySQL InnoDB): lock the gap between index records to stop phantom inserts under REPEATABLE READ.
### Deadlock handling
- **Detection**: a **wait-for graph** (Ti -> Tj if Ti waits for a lock Tj holds); a cycle = deadlock; abort a victim (youngest / least work) and roll it back. MySQL and PostgreSQL do this automatically and return a deadlock error - the application must retry.
- **Prevention with timestamps** (older = smaller timestamp):
| Scheme | Older Ti wants lock held by younger Tj | Younger Ti wants lock held by older Tj |
|---|---|---|
| Wait-Die (non-preemptive) | Ti waits | Ti dies (aborts, restarts with same timestamp) |
| Wound-Wait (preemptive) | Ti wounds Tj (Tj aborts) | Ti waits |
- **Avoidance in practice**: lock rows in a fixed order (e.g. lower account id first), keep transactions short, use lock timeouts (`lock_timeout`, `innodb_lock_wait_timeout`), `NOWAIT` / `SKIP LOCKED`.
- **Starvation**: a transaction keeps getting aborted or waiting; solved by keeping the original timestamp (ages) or fair lock queues.
### Timestamp ordering protocol
- Each transaction gets a timestamp TS(T). Each item keeps W-TS (largest writer timestamp) and R-TS (largest reader timestamp).
- Read(X) by T: if TS(T) < W-TS(X) the value was overwritten by a younger transaction -> abort T; else read and set R-TS = max(R-TS, TS(T)).
- Write(X) by T: if TS(T) < R-TS(X) or TS(T) < W-TS(X) -> abort T (Thomas write rule: if only TS(T) < W-TS(X), simply ignore the obsolete write); else write and set W-TS = TS(T).
- No locks so **no deadlocks**, but more aborts under contention.
### Optimistic concurrency control (validation-based)
- Three phases: **Read** (work on private copies), **Validate** (check that no conflicting transaction committed meanwhile), **Write** (apply if valid, else restart).
- Best when conflicts are rare (read-heavy web apps). Application-level form: a `version` column checked in the UPDATE's WHERE clause; zero rows updated = someone else changed it -> retry or show "data changed".
### Multi-Version Concurrency Control (MVCC)
- Every update creates a **new version** of the row with the creating transaction id; old versions stay for transactions that started earlier. Each transaction reads the **snapshot** valid at its start (or statement start for READ COMMITTED).
- **Readers never block writers and writers never block readers**; writers still lock against other writers on the same row.
@chain row v1 (xmin=100) -> UPDATE by tx 120 -> row v2 (xmin=120), v1 marked xmax=120 -> tx 110 still sees v1, tx 130 sees v2 :: MVCC: snapshots pick the visible version
- PostgreSQL stores versions in the table (dead tuples removed by **VACUUM**; long transactions cause bloat). MySQL InnoDB keeps the latest version in place and older ones in **undo logs** (purged later). Oracle uses undo segments.
- **Snapshot isolation** can still allow **write skew** (two doctors both go off call because each saw the other on call). PostgreSQL SERIALIZABLE uses **SSI** (Serializable Snapshot Isolation) to detect and abort such cases; MySQL SERIALIZABLE turns reads into locking reads.
### Concurrency control in practice (SQL)
```sql
-- pessimistic: lock the row while deciding (flash sale stock)
BEGIN;
SELECT stock FROM products WHERE id = 7 FOR UPDATE;          -- other buyers wait here
UPDATE products SET stock = stock - 1 WHERE id = 7 AND stock > 0;
COMMIT;
-- better: single atomic conditional update (no read-then-write race)
UPDATE products SET stock = stock - 1 WHERE id = 7 AND stock > 0;   -- check affected rows = 1
-- job queue: many workers, no double processing
SELECT id FROM jobs WHERE status = 'NEW' ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED;
-- fail fast instead of waiting
SELECT * FROM seats WHERE id = 42 FOR UPDATE NOWAIT;
-- shared lock: allow other readers, block writers (PG: FOR SHARE, MySQL 8: FOR SHARE)
SELECT * FROM accounts WHERE id = 1 FOR SHARE;
-- explicit table lock (rare)
LOCK TABLE ledger IN EXCLUSIVE MODE;
-- application-level lock in PostgreSQL
SELECT pg_advisory_xact_lock(42);
-- choose the isolation level
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- see who blocks whom
SELECT pid, wait_event_type, query FROM pg_stat_activity WHERE wait_event_type = 'Lock';    -- PostgreSQL
SHOW ENGINE INNODB STATUS;                                                                   -- MySQL: latest deadlock
```
| Technique | Blocks? | Best for |
|---|---|---|
| Strict 2PL | yes (waits) | high-contention writes, correctness first |
| MVCC + snapshot | readers never block | mixed read/write OLTP (default in PG, MySQL) |
| Optimistic / version column | no locks | low contention, web forms, REST APIs (ETag / If-Match) |
| Timestamp ordering | no locks, aborts | distributed / research systems |
| SKIP LOCKED queues | skips locked rows | work queues |
| Advisory / distributed locks | application decides | cron jobs, singletons (Redis, ZooKeeper) |
### Concurrency control on AWS RDS / Aurora
- RDS MySQL and Aurora MySQL use InnoDB (MVCC + row locks, default REPEATABLE READ). RDS PostgreSQL / Aurora PostgreSQL use PostgreSQL MVCC (default READ COMMITTED).
- Read replicas are **asynchronous**: a read right after a write may be stale (replica lag metric `ReplicaLag` / `AuroraReplicaLag`); route read-after-write to the writer endpoint.
- Long transactions hold locks and block VACUUM/purge; monitor with Performance Insights (top wait events like `Lock:transactionid`, `row lock waits`) and set statement/lock timeouts in the parameter group.
- RDS Proxy pools connections so thousands of Lambda invocations do not exhaust connections; it pins sessions that use locks or temp tables.
## MySQL vs PostgreSQL
| Area | MySQL (InnoDB) | PostgreSQL |
|---|---|---|
| philosophy | simple, fast reads, web scale | standards-compliant, feature-rich |
| storage | clustered primary key index | heap table + separate indexes |
| MVCC cleanup | undo logs, purge thread | VACUUM / autovacuum |
| JSON | JSON type, functional indexes | JSONB with GIN indexes, rich operators |
| extras | - | arrays, CTE materialisation control, extensions (PostGIS, pgvector, TimescaleDB), partial and expression indexes |
| replication | async / semi-sync, Group Replication | streaming (physical) + logical replication |
| auto id | AUTO_INCREMENT | SERIAL / IDENTITY |
| upsert | INSERT ... ON DUPLICATE KEY UPDATE | INSERT ... ON CONFLICT DO UPDATE |
| limit | LIMIT n OFFSET m | same + FETCH FIRST n ROWS |
```sql
-- upsert
INSERT INTO products (id, name, price) VALUES (5, 'Bag', 900) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;      -- PostgreSQL
INSERT INTO products (id, name, price) VALUES (5, 'Bag', 900) ON DUPLICATE KEY UPDATE price = VALUES(price);              -- MySQL
-- JSONB in PostgreSQL
SELECT payload->>'device' AS device FROM events WHERE payload @> '{"type": "click"}';
-- pgvector for AI similarity search (see notebook 19)
CREATE EXTENSION vector; CREATE TABLE docs (id serial, embedding vector(768));
SELECT id FROM docs ORDER BY embedding <-> '[0.1, 0.2]'::vector LIMIT 5;
```
## Scaling Relational Databases
@layers App servers | Connection pool (PgBouncer) | Primary (writes), Read replica 1, Read replica 2 | Shards by customer_id range or hash :: Scaling path
- **Vertical scaling**: bigger machine. **Read replicas**: copy data asynchronously; send reads there (replication lag!).
- **Partitioning** (one server): split a big table by range (order_date by month), list or hash - queries touch fewer partitions.
- **Sharding** (many servers): split rows by a shard key across databases. Hard parts: cross-shard joins, re-sharding, global unique IDs (Snowflake IDs), distributed transactions (2PC / Saga).
- **Replication**: synchronous (safe, slow) vs asynchronous (fast, may lose recent writes on failover). Failover with Patroni / RDS Multi-AZ.
- **CAP**: see notebook 06 and 12. Backups: logical (pg_dump / mysqldump), physical + WAL archiving for point-in-time recovery.
## Using SQL from Code (safe)
```py
import psycopg
with psycopg.connect("postgresql://app@localhost/shop") as con:
    rows = con.execute("SELECT name FROM customers WHERE city = %s", ("Pune",)).fetchall()   # parameters, not f-strings
```
```java
PreparedStatement ps = con.prepareStatement("SELECT name FROM customers WHERE city = ?");
ps.setString(1, city);       // prevents SQL injection
```
> **SQL injection**: building SQL with string concatenation lets an attacker send `' OR 1=1 --`. Always use parameterised queries / ORMs.
## SQL Interview Questions
Q: Primary key vs unique key?
A: Both enforce uniqueness; a table has one primary key which cannot be NULL and is often the clustered index; it can have many unique keys which may allow NULLs.
Q: What is a foreign key?
A: A column whose values must exist in the referenced table's key, enforcing referential integrity.
Q: Difference between WHERE and HAVING?
A: WHERE filters rows before grouping and cannot use aggregates; HAVING filters groups after GROUP BY.
Q: INNER vs LEFT JOIN?
A: Inner keeps only matching rows; left keeps all rows of the left table with NULLs where no match exists.
Q: What is normalisation? Explain 1NF, 2NF, 3NF.
A: Organising tables to remove redundancy: atomic values; no partial dependency on a composite key; no transitive dependency between non-key columns.
Q: When would you denormalise?
A: For read-heavy/analytics workloads where join cost matters more than duplicate writes, e.g. storing order totals or using star schemas.
Q: Clustered vs non-clustered index?
A: Clustered determines the physical order of rows (one per table); non-clustered is a separate structure with pointers to rows (many allowed).
Q: Why are B+ trees used for indexes?
A: High fan-out keeps the tree shallow (few disk reads), all data in leaves gives predictable lookups, linked leaves make range scans efficient.
Q: What are ACID properties?
A: Atomicity, Consistency, Isolation, Durability - guarantees that transactions are all-or-nothing, valid, isolated from each other and permanent.
Q: Explain isolation levels and anomalies.
A: Read uncommitted allows dirty reads; read committed prevents them; repeatable read also prevents non-repeatable reads; serializable prevents phantoms too.
Q: What is MVCC?
A: Keeping multiple row versions so readers get a consistent snapshot without blocking writers.
Q: How do you find the Nth highest salary?
A: DENSE_RANK() OVER (ORDER BY salary DESC) and filter rank = N, or LIMIT 1 OFFSET N-1 on distinct salaries.
Q: RANK vs DENSE_RANK vs ROW_NUMBER?
A: ROW_NUMBER is always unique; RANK gives ties the same rank and skips (1,2,2,4); DENSE_RANK does not skip (1,2,2,3).
Q: UNION vs UNION ALL?
A: UNION removes duplicates (extra sort/hash); UNION ALL keeps all rows and is faster.
Q: What is a view vs materialised view?
A: A view is a saved query run every time; a materialised view stores the result and must be refreshed.
Q: What causes a slow query and how do you fix it?
A: Missing indexes, functions on indexed columns, SELECT *, large OFFSET, bad joins, stale statistics; inspect EXPLAIN ANALYZE, add the right index, rewrite, cache.
Q: What is a deadlock and how do you prevent it?
A: Two transactions waiting on each other's locks; acquire locks in a consistent order, keep transactions short, retry on deadlock errors.
Q: Optimistic vs pessimistic locking?
A: Pessimistic locks the row before editing (SELECT FOR UPDATE); optimistic checks a version at update time and retries on conflict - better for low contention.
Q: How would you scale a database for 10x traffic?
A: Indexes and query tuning, caching, connection pooling, read replicas, partitioning, then sharding with a good shard key; move analytics to a warehouse.
Q: SQL vs NoSQL - when to choose which?
A: SQL for structured data, relations, transactions and complex queries; NoSQL for flexible schemas, massive scale, high write throughput or specific models (documents, key-value, graphs). Details in notebook 06.
Q: What is two-phase locking and why is strict 2PL used?
A: Transactions acquire locks in a growing phase and release in a shrinking phase, guaranteeing conflict serializability; strict 2PL holds write locks until commit so other transactions never read uncommitted data (no cascading aborts).
Q: How do you test whether a schedule is conflict serializable?
A: Draw the precedence graph with an edge for each conflicting pair in time order; the schedule is conflict serializable iff the graph has no cycle.
Q: Wait-die vs wound-wait?
A: Both prevent deadlock using timestamps. Wait-die: an older transaction waits, a younger one aborts. Wound-wait: an older transaction forces the younger holder to abort, a younger one waits.
Q: MVCC vs locking?
A: MVCC keeps multiple versions so reads use snapshots and never block writes; locking makes readers and writers wait for each other. Most databases combine MVCC for reads with row locks for writes.
Q: What is write skew?
A: Two transactions read overlapping data, make disjoint updates based on it, and together break a rule that each alone respected; snapshot isolation allows it, serializable (SSI) prevents it.
Q: How would you prevent overselling in a flash sale?
A: An atomic conditional update (stock = stock - 1 WHERE stock > 0), or SELECT FOR UPDATE inside a short transaction, plus idempotent order creation; at very high scale pre-allocate stock in Redis with atomic DECR.
