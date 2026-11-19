# Full Stack Web Architecture: Client to Database
A comprehensive engineering manual covering full-stack web architecture, API protocols (REST, GraphQL, WebSockets, gRPC), database caching patterns, security headers, and production deployment.

## The Full Stack Architecture Overview
- **The Modern 3-Tier Web Application:**
  - **Tier 1: Presentation (Client):** Single Page Apps (React/Vue), Server-Side Rendered apps (Next.js), Mobile clients.
  - **Tier 2: Business Logic (Application Server):** API Gateways, Node.js/Go microservices, background job workers.
  - **Tier 3: Persistence (Data & Cache):** Relational databases (PostgreSQL/MySQL), In-memory cache (Redis), Object storage (S3/ImageKit).
- **Non-Technical Real-Life Analogy (The 3-Star Michelin Restaurant):**
  - **The Dining Room & Waitstaff (Frontend & API Gateway):** Guests sit in a pleasant dining room, look at the menu (UI), and give their order to the waiter (HTTP Request).
  - **The Kitchen Pass & Chefs (Backend Application Server):** The head chef receives tickets, verifies ingredient availability (business rules & auth), and instructs line cooks to prepare dishes.
  - **The Cold Room & Pantry (Database & Redis Cache):** Ingredients stored systematically on shelves. The chef keeps pre-sliced butter and garnishes on the immediate prep counter (Redis cache) so they don't walk into the walk-in freezer (Disk DB) for every single plate!

@layers Client Tier: React, Next.js, Mobile UI, Tailwind CSS | Gateway Tier: Cloudflare Edge, Nginx Reverse Proxy, Rate Limiting | App Server Tier: Node.js / Go REST & GraphQL Microservices | Data Tier: PostgreSQL ACID Storage, Redis In-Memory Cache :: The 4-Tier Modern Full Stack Web Architecture

## API Communication Protocols: When to Use What
| Protocol | Transport | Latency | Data Format | Ideal Use Case |
|---|---|---|---|---|
| **REST (HTTP/1.1 & HTTP/2)** | TCP / TLS | Medium (~50-150ms) | JSON | Standard CRUD APIs, public partner integrations |
| **GraphQL** | HTTP POST | Medium | JSON (Flexible query schema) | Complex frontend dashboards requiring custom field selection without over-fetching |
| **WebSockets** | TCP (Bi-directional persistent socket) | Ultra-low (~5-20ms) | Text / Binary | Real-time chat, collaborative docs (Figma/Docs), live market feeds |
| **gRPC** | HTTP/2 (Multiplexed streaming) | Ultra-low (~2-10ms) | Protocol Buffers (Binary) | Internal backend-to-backend microservice communication |
| **Server-Sent Events (SSE)** | HTTP streaming (Unidirectional server-to-client) | Low (~20ms) | Text / Event stream | LLM streaming text tokens (ChatGPT/Claude), live sports score tickers |

### Cache-Aside (Lazy Loading) Architecture in Node.js
```typescript
import { createClient } from "redis";
import { Pool } from "pg";

const redis = createClient({ url: process.env.REDIS_URL });
const pg = new Pool({ connectionString: process.env.DATABASE_URL });

export async function getUserProfile(userId: string) {
    const cacheKey = `user:${userId}`;

    // 1. Try reading from ultra-fast in-memory Redis cache (~1ms)
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    // 2. Cache miss: Query relational PostgreSQL database (~15-30ms)
    const { rows } = await pg.query("SELECT id, name, email, plan FROM users WHERE id = $1", [userId]);
    const user = rows[0] || null;

    if (user) {
        // 3. Write to Redis with a 15-minute Time-To-Live (TTL) to prevent stale cache
        await redis.setEx(cacheKey, 900, JSON.stringify(user));
    }

    return user;
}
```
- **Time Complexity:** $O(1)$ cache hit time complexity.
- **Space Complexity:** $O(1)$ memory per active cached user record.

## Essential Production Web Security Headers
```http
# Prevent clickjacking in hidden iframes
X-Frame-Options: DENY

# Prevent MIME-type sniffing
X-Content-Type-Options: nosniff

# Strict Transport Security: Force HTTPS for 1 year
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Restrict browser resource loading
Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; script-src 'self'
```
