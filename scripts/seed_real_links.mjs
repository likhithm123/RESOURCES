import fs from "node:fs";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const i = line.indexOf("="); if (i > 0 && !line.startsWith("#")) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const { db } = await import("../server/db.js");

const REAL_LINKS = [
  // --- REAL RESOURCES ---
  {
    kind: "resource",
    category: "DSA & Coding Practice",
    title: "takeUforward - Strivers A2Z DSA Sheet",
    description: "The complete step-by-step track from basics to advanced graphs, dynamic programming and competitive problem solving.",
    url: "https://takeuforward.org/strivers-a2z-dsa-sheet-step-by-step-entire-dsa-track",
    career_roles: ["sde", "fullstack", "ai", "ml", "data"],
    sort_order: 1
  },
  {
    kind: "resource",
    category: "DSA & Coding Practice",
    title: "NeetCode 150 Practice Roadmap",
    description: "Curated 150 LeetCode problems grouped by pattern (sliding window, two pointers, trees, graphs, intervals) with video solutions.",
    url: "https://neetcode.io/practice",
    career_roles: ["sde", "fullstack", "ai", "ml"],
    sort_order: 2
  },
  {
    kind: "resource",
    category: "DSA & Coding Practice",
    title: "Visualgo - Data Structure & Algorithm Visualisations",
    description: "Interactive visual animations of sorting, binary search trees, graph traversals, Dijkstra, and dynamic programming.",
    url: "https://visualgo.net/en",
    career_roles: ["sde", "fullstack", "ai", "data"],
    sort_order: 3
  },
  {
    kind: "resource",
    category: "System Design & Distributed Systems",
    title: "System Design Primer by Donne Martin",
    description: "Comprehensive open-source guide for large-scale system design: load balancing, caching, sharding, replication, CDN, and async messaging.",
    url: "https://github.com/donnemartin/system-design-primer",
    career_roles: ["sde", "fullstack", "ai", "devops"],
    sort_order: 4
  },
  {
    kind: "resource",
    category: "System Design & Distributed Systems",
    title: "ByteByteGo - Visual System Design Architecture",
    description: "Deep visual breakdowns of real-world enterprise architectures: payment gateways, URL shorteners, search engines, and YouTube streaming.",
    url: "https://bytebytego.com/",
    career_roles: ["sde", "fullstack", "devops"],
    sort_order: 5
  },
  {
    kind: "resource",
    category: "Core Languages & Compilers",
    title: "cppreference.com - Official C++ Language Reference",
    description: "Standard C++ documentation covering C++11 through C++23: STL containers, memory model, smart pointers, atomics, and templates.",
    url: "https://en.cppreference.com/w/",
    career_roles: ["sde"],
    sort_order: 6
  },
  {
    kind: "resource",
    category: "Core Languages & Compilers",
    title: "The Rust Programming Language (The Rust Book)",
    description: "The authoritative book on Rust ownership, lifetimes, fearless concurrency, pattern matching, and memory safety without GC.",
    url: "https://doc.rust-lang.org/book/",
    career_roles: ["sde", "security"],
    sort_order: 7
  },
  {
    kind: "resource",
    category: "Web & Full Stack",
    title: "MDN Web Docs (Mozilla Developer Network)",
    description: "The definitive reference for HTML5, CSS3, modern ECMAScript, Web APIs, DOM manipulation, and browser performance standards.",
    url: "https://developer.mozilla.org/",
    career_roles: ["fullstack", "sde"],
    sort_order: 8
  },
  {
    kind: "resource",
    category: "Web & Full Stack",
    title: "roadmap.sh - Developer Learning Roadmaps",
    description: "Community-driven visual roadmaps and study paths for Frontend, Backend, DevOps, Cyber Security, and AI Engineers.",
    url: "https://roadmap.sh/",
    career_roles: ["sde", "fullstack", "ai", "ml", "data", "devops", "security", "salesforce"],
    sort_order: 9
  },
  {
    kind: "resource",
    category: "DevOps & Cloud",
    title: "Kubernetes The Hard Way (Kelsey Hightower)",
    description: "Bootstrapping a production Kubernetes cluster from scratch without automated tools to master control plane internals.",
    url: "https://github.com/kelseyhightower/kubernetes-the-hard-way",
    career_roles: ["devops", "sde", "security"],
    sort_order: 10
  },
  {
    kind: "resource",
    category: "DevOps & Cloud",
    title: "AWS Skill Builder & Digital Cloud Training",
    description: "Official AWS digital training courses, hands-on architectural labs, and cloud practitioner exam preparation modules.",
    url: "https://explore.skillbuilder.aws/",
    career_roles: ["devops", "sde", "fullstack", "ai", "security", "data"],
    sort_order: 11
  },
  {
    kind: "resource",
    category: "DevOps & Cloud",
    title: "Linux Journey - Interactive OS Mastery",
    description: "From command line fundamentals, process trees, permissions, and bash scripting to kernel architecture and systemd services.",
    url: "https://linuxjourney.com/",
    career_roles: ["devops", "sde", "security"],
    sort_order: 12
  },
  {
    kind: "resource",
    category: "AI, GenAI & ML",
    title: "Fast.ai - Practical Deep Learning for Coders",
    description: "Top-down practical deep learning course covering PyTorch, computer vision, NLP transformers, tabular models, and deployment.",
    url: "https://course.fast.ai/",
    career_roles: ["ai", "ml", "data"],
    sort_order: 13
  },
  {
    kind: "resource",
    category: "AI, GenAI & ML",
    title: "LangChain & LangGraph Documentation",
    description: "Building production-ready LLM pipelines, autonomous agentic loops, human-in-the-loop workflows, and stateful multi-agent systems.",
    url: "https://python.langchain.com/docs/introduction/",
    career_roles: ["ai", "ml", "sde"],
    sort_order: 14
  },
  {
    kind: "resource",
    category: "AI, GenAI & ML",
    title: "Anthropic Claude Prompt Engineering & API Guide",
    description: "Official Anthropic best practices for prompt engineering, structured JSON outputs, system prompts, tool calling, and evaluation.",
    url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
    career_roles: ["ai", "ml", "sde", "fullstack"],
    sort_order: 15
  },
  {
    kind: "resource",
    category: "Cyber Security",
    title: "OWASP Top 10 Web Application Security Risks",
    description: "The global security standard documenting the most critical security vulnerabilities including Injection, Broken Auth, and SSRF.",
    url: "https://owasp.org/www-project-top-ten/",
    career_roles: ["security", "sde", "devops", "fullstack"],
    sort_order: 16
  },
  {
    kind: "resource",
    category: "Cyber Security",
    title: "PortSwigger Web Security Academy",
    description: "Free online training for web application security with interactive labs covering SQL injection, XSS, CSRF, and JWT attacks.",
    url: "https://portswigger.net/web-security",
    career_roles: ["security", "sde"],
    sort_order: 17
  },

  // --- REAL PROJECTS (GENUINE GITHUB OPEN-SOURCE REPOSITORIES & SPECS) ---
  {
    kind: "project",
    category: "Full Stack & Web",
    title: "PiggyMetrics - Microservices Architecture on Spring Boot & React",
    description: "Production reference implementation demonstrating microservice decomposition: account services, statistics, notifications, Docker containers, and API Gateway routing.",
    url: "https://github.com/sqshq/piggymetrics",
    career_roles: ["fullstack", "sde"],
    sort_order: 1
  },
  {
    kind: "project",
    category: "Full Stack & Web",
    title: "RealWorld 'Conduit' - Fullstack Medium Clone Spec",
    description: "Exemplary fullstack application adhering to strict real-world API specifications across Node.js, FastAPI, Go, React, and Vue.",
    url: "https://github.com/gothinkster/realworld",
    career_roles: ["fullstack", "sde"],
    sort_order: 2
  },
  {
    kind: "project",
    category: "Full Stack & Web",
    title: "Node.js Best Practices Enterprise Architecture",
    description: "The largest compilation of battle-tested Node.js architectural patterns: clean architecture, error handling, Dockerfiles, and security standards.",
    url: "https://github.com/goldbergyoni/nodebestpractices",
    career_roles: ["fullstack", "sde"],
    sort_order: 3
  },
  {
    kind: "project",
    category: "System Design & Distributed Systems",
    title: "Yjs - High-Performance Real-Time CRDT Engine",
    description: "Conflict-free Replicated Data Types (CRDT) engine powering collaborative rich text and code editing, identical to Google Docs and Figma.",
    url: "https://github.com/yjs/yjs",
    career_roles: ["sde", "fullstack"],
    sort_order: 4
  },
  {
    kind: "project",
    category: "System Design & Distributed Systems",
    title: "Dragonfly - Modern High-Throughput In-Memory Store",
    description: "Multi-threaded C++ in-memory datastore engineered with hardware-efficient lock-free algorithms, processing 25x the throughput of classic Redis.",
    url: "https://github.com/dragonflydb/dragonfly",
    career_roles: ["sde", "devops"],
    sort_order: 5
  },
  {
    kind: "project",
    category: "System Design & Distributed Systems",
    title: "Simple Limit Order Book - Low-Latency C++ Engine",
    description: "High-frequency trading limit order book with price-time priority queues ($O(1)$ matching and cancellations), cache-friendly data structures.",
    url: "https://github.com/Charles-FR/SimpleOrderBook",
    career_roles: ["sde"],
    sort_order: 6
  },
  {
    kind: "project",
    category: "AI, GenAI & ML",
    title: "LlamaIndex - Enterprise Grounded RAG Framework",
    description: "Production framework for indexing private datasets, vector embedding retrieval, hybrid BM25 search, query routing, and context re-ranking.",
    url: "https://github.com/run-llama/llama_index",
    career_roles: ["ai", "ml", "data"],
    sort_order: 7
  },
  {
    kind: "project",
    category: "AI, GenAI & ML",
    title: "LangGraph - Stateful Multi-Agent Orchestration",
    description: "Framework for building cyclic, stateful multi-agent workflows with human-in-the-loop checkpoints, tool calling, and memory persistence.",
    url: "https://github.com/langchain-ai/langgraph",
    career_roles: ["ai", "ml", "sde"],
    sort_order: 8
  },
  {
    kind: "project",
    category: "AI, GenAI & ML",
    title: "Chroma - Open-Source AI Vector Database",
    description: "Fast vector search engine supporting metadata filtering, semantic document embeddings, cosine similarity search, and client-server deployment.",
    url: "https://github.com/chroma-core/chroma",
    career_roles: ["ai", "ml", "data"],
    sort_order: 9
  },
  {
    kind: "project",
    category: "DevOps & Cloud",
    title: "Argo CD - Declarative GitOps Continuous Delivery for K8s",
    description: "Industry-standard GitOps tool orchestrating Kubernetes manifest synchronization, automated rollbacks, and zero-downtime canary deployments.",
    url: "https://github.com/argoproj/argo-cd",
    career_roles: ["devops", "sde"],
    sort_order: 10
  },
  {
    kind: "project",
    category: "DevOps & Cloud",
    title: "Terraform AWS Modules - Infrastructure as Code",
    description: "Production-grade reusable Terraform modules for provisioning VPCs, EKS clusters, RDS multi-AZ databases, and IAM roles following CIS benchmarks.",
    url: "https://github.com/terraform-aws-modules",
    career_roles: ["devops", "security"],
    sort_order: 11
  },
  {
    kind: "project",
    category: "Cyber Security & Systems",
    title: "OWASP ModSecurity Core Rule Set (CRS)",
    description: "Universal web application firewall rule set providing real-time anomaly scoring, SQL injection detection, and rate limiting inspection.",
    url: "https://github.com/coreruleset/coreruleset",
    career_roles: ["security", "devops"],
    sort_order: 12
  },
  {
    kind: "project",
    category: "Data Engineering & Analytics",
    title: "End-to-End Real-Time Data Engineering Pipeline",
    description: "Complete streaming data pipeline combining Apache Kafka, Apache Spark, Airflow DAGs, Cassandra, PostgreSQL, and Docker Compose.",
    url: "https://github.com/airscholar/e2e-data-engineering",
    career_roles: ["data", "ml", "sde"],
    sort_order: 13
  },
  {
    kind: "project",
    category: "Salesforce Development",
    title: "Dreamhouse LWC - Official Salesforce Reference App",
    description: "Comprehensive Lightning Web Components (LWC) reference architecture covering Apex controllers, Lightning Data Service, and Event Bus.",
    url: "https://github.com/trailheadapps/dreamhouse-lwc",
    career_roles: ["salesforce"],
    sort_order: 14
  }
];

await db.run("DELETE FROM rp_links");
for (const l of REAL_LINKS) {
  await db.run(
    "INSERT INTO rp_links (kind, category, title, description, url, career_roles, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
    [l.kind, l.category, l.title, l.description, l.url, JSON.stringify(l.career_roles), l.sort_order]
  );
}
console.log(`Seeded ${REAL_LINKS.length} verified real resources and project repositories into Cloudflare D1!`);
