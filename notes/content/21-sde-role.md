# SDE Role Guide & Technical Interview Playbook
An exhaustive career strategy guide detailing Software Development Engineer (SDE) leveling across tech tiers, the end-to-end interview loop, behavioral frameworks (STAR), and salary negotiation strategies.

## SDE Engineering Levels & Expectations
Companies evaluate candidates along well-defined engineering competencies:

| Level | Common Titles | Scope of Ownership | Ambiguity Handled | Typical Years of Experience |
|---|---|---|---|---|
| **L3 / SDE-1** | Associate Engineer, Software Engineer | Individual tasks and sub-features within a well-defined architecture. | Low: Clear requirements provided by seniors. | 0 – 2 years |
| **L4 / SDE-2** | Mid-Level Software Engineer | Entire features and services end-to-end; mentors interns; leads on-call rotations. | Medium: Can turn loose product specs into working microservices. | 2 – 5 years |
| **L5 / Senior SDE** | Senior Software Engineer | Cross-team systems architecture; sets testing standards; designs distributed systems. | High: Clarifies vague business goals into technical roadmaps. | 5 – 9 years |
| **L6 / Staff SDE** | Staff Engineer, Principal Engineer | Multi-organization strategy; sets multi-year technology directions for the company. | Very High: Identifies business problems before executives do. | 8+ years |

- **Non-Technical Real-Life Analogy (The Restaurant Kitchen Hierarchy):**
  - **SDE-1 (Apprentice Cook):** Chops vegetables and cooks specific dishes strictly according to the chef's written recipe.
  - **SDE-2 (Station Lead / Chef de Partie):** Runs the entire grill station, coordinates ticket orders, and ensures all steaks leave the kitchen cooked to perfection.
  - **Senior SDE (Head / Executive Chef):** Designs the complete seasonal menu, sources ingredient suppliers, creates standard kitchen recipes, and prevents food waste.
  - **Staff SDE (Restaurant Group Director):** Opens new restaurant branches, negotiates city supplier contracts, and designs kitchen floor plans.

## The 4 Pillars of the SDE Technical Interview Loop
@layers Coding Round: Data Structures & Algorithms (LeetCode Medium/Hard) | Low-Level Design (LLD): OOP, Design Patterns & Clean Schemas | High-Level Design (HLD): Scalability, Caching, Databases & Sharding | Behavioral & Culture Round: Leadership Principles & STAR Framework :: The Complete SDE Interview Loop

## Mastering the STAR Method for Behavioral Rounds
Every behavioral question (*"Tell me about a time you had a technical disagreement with a peer"*) must follow the **STAR framework**:
1. **Situation (15%):** Set the business context, company scale, and the technical obstacle.
2. **Task (15%):** Clearly articulate what you specifically owned (avoid saying "we"; say "I was responsible for...").
3. **Action (50%):** The deep technical and communication steps you took. Highlight technical tradeoffs, prototypes, data gathering, and collaboration.
4. **Result (20%):** The measurable, quantifiable business impact (*"reduced latency by 42%, saved \$12,000 monthly on cloud compute, zero customer incidents"*).

### Concrete STAR Example
- *Question:* "Tell me about a high-severity production outage you resolved under pressure."
- *Situation:* During Black Friday at an e-commerce platform, checkout latency spiked from 120ms to 4.8 seconds, causing a 30% drop in completed purchases.
- *Task:* As the on-call SDE-2, I had to diagnose the root cause, mitigate the immediate customer impact, and deploy a permanent fix within our 30-minute SLA window.
- *Action:* I inspected Datadog APM traces and noticed 8,000 requests/sec blocking on Postgres row-level locks on the `inventory_items` table. I immediately provisioned an automated Redis cache-aside cluster for stock counts, updated our feature flag to route non-mutating inventory checks to Redis, and queued database writes through BullMQ.
- *Result:* Checkout response times dropped back down to 95ms in under 18 minutes, recovering \$180,000 in saved transactions. I then authored the blameless post-mortem and added automated load-testing benchmarks.

## Total Compensation (TC) & Negotiation Strategy
- Tech compensation consists of three distinct components:
  $$\text{Total Compensation (Year 1)} = \text{Base Salary} + \text{Annual Cash Bonus} + \frac{\text{Equity (RSUs)}}{4} + \text{Sign-on Bonus}$$
- Never reveal your current salary or expectations first. Always let the recruiter give their salary band.
- Leverage competing offers: Companies match based on level and candidate leverage, not on prior compensation.
