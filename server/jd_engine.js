/**
 * Precision Job Description Analysis Engine
 * Maps raw job descriptions (text/pdf/doc/image) to tailored curriculum checklists
 * with exact notebook slugs, section titles, and page numbers.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const topicsPath = path.resolve(here, "../src/shared/topics.json");

let topicsCache = null;
function getTopics() {
  if (topicsCache) return topicsCache;
  try {
    topicsCache = JSON.parse(fs.readFileSync(topicsPath, "utf8"));
  } catch (e) {
    topicsCache = {};
  }
  return topicsCache;
}

// Master Skill Dictionary mapping keywords to curriculum slugs and key sections
const SKILL_RULES = [
  // Java & Spring Boot
  {
    regex: /\b(java|spring\s*boot|spring\s*cloud|hibernate|jpa|jvm|microservices|maven|gradle)\b/gi,
    skill: "Java / Spring Boot & Microservices",
    slugs: ["40-spring-boot-and-microservices", "03-java-basics-to-advanced"],
    category: "Backend Engineering",
    priority: "High",
    why: "Direct match for Java & Spring Boot microservices backend requirements in the job description."
  },
  // Go / Golang
  {
    regex: /\b(go|golang|goroutines?|channels?|grpc)\b/gi,
    skill: "Go Programming & Systems Concurrency",
    slugs: ["41-go-programming-and-concurrency"],
    category: "Systems & Backend",
    priority: "High",
    why: "High-throughput cloud systems in Go specified in the job description."
  },
  // Python & Data Science
  {
    regex: /\b(python|pandas|numpy|scipy|jupyter)\b/gi,
    skill: "Python Core & Data Manipulation",
    slugs: ["02-python-basics-to-pandas", "29-data-scientist-analyst"],
    category: "Python & Data",
    priority: "High",
    why: "Python programming and data manipulation identified as core technical requirements."
  },
  // JavaScript / TypeScript / React / Node
  {
    regex: /\b(javascript|typescript|react|reactjs|node|nodejs|express|next\.?js|redux|tailwind|html5?|css3?)\b/gi,
    skill: "Modern JavaScript, React & Full Stack",
    slugs: ["28-javascript-node-react", "31-full-stack-development"],
    category: "Frontend & Full Stack",
    priority: "High",
    why: "Frontend or full-stack web application development specified in the job description."
  },
  // System Design & Architecture
  {
    regex: /\b(system\s*design|distributed\s*systems?|scalab\w+|microservices?|high\s*availability|load\s*balanc\w+|sharding|caching|hld|lld)\b/gi,
    skill: "High-Level & Low-Level System Design",
    slugs: ["12-system-design-hld-lld"],
    category: "Architecture & Scale",
    priority: "High",
    why: "Enterprise scalability and distributed architecture requirements identified."
  },
  // Data Structures & Algorithms
  {
    regex: /\b(dsa|data\s*structures?|algorithms?|leetcode|problem\s*solving|complexity|trees?|graphs?|dynamic\s*programming)\b/gi,
    skill: "Data Structures & Algorithms (DSA)",
    slugs: ["10-dsa-basics-data-structures", "11-dsa-a2z-solutions"],
    category: "Computer Science Core",
    priority: "High",
    why: "Algorithmic problem-solving and coding interview benchmark."
  },
  // SQL / Databases
  {
    regex: /\b(sql|postgres(?:ql)?|mysql|database|rdbms|indexing|queries|acid|transactions?)\b/gi,
    skill: "Relational Databases & SQL Optimization",
    slugs: ["05-sql-mysql-postgresql"],
    category: "Databases & Storage",
    priority: "Medium",
    why: "Relational persistence and transactional query optimization required."
  },
  // NoSQL / Redis / Kafka / Event-Driven
  {
    regex: /\b(nosql|mongodb|redis|cassandra|kafka|event[-\s]driven|message\s*queues?|rabbitmq)\b/gi,
    skill: "NoSQL, Redis Caching & Message Streaming",
    slugs: ["06-nosql-mongodb-graph-databases"],
    category: "Databases & Streaming",
    priority: "Medium",
    why: "High-throughput asynchronous event streaming and caching layer mentioned in JD."
  },
  // DevOps / Cloud / Kubernetes / Docker
  {
    regex: /\b(devops|docker|kubernetes|k8s|containers?|terraform|helm|ansible|infrastructure\s*as\s*code|iac)\b/gi,
    skill: "DevOps, Containerization & Kubernetes",
    slugs: ["16-devops", "25-ci-cd-pipelines"],
    category: "DevOps & Cloud",
    priority: "High",
    why: "Containerization and cloud deployment infrastructure specified in JD."
  },
  // AWS Cloud
  {
    regex: /\b(aws|amazon\s*web\s*services|ec2|s3|lambda|iam|ecs|eks|vpc|cloudwatch)\b/gi,
    skill: "AWS Cloud Infrastructure",
    slugs: ["09-aws-cloud"],
    category: "Cloud Engineering",
    priority: "Medium",
    why: "AWS cloud platform services identified in job posting."
  },
  // Azure Cloud
  {
    regex: /\b(azure|aks|azure\s*devops|entra\s*id|cosmos\s*db)\b/gi,
    skill: "Microsoft Azure Cloud Platform",
    slugs: ["18-azure"],
    category: "Cloud Engineering",
    priority: "Medium",
    why: "Azure cloud architecture and services required."
  },
  // AI, LLMs & GenAI
  {
    regex: /\b(ai|genai|generative\s*ai|llms?|large\s*language\s*models?|rag|retrieval\s*augmented|langchain|langgraph|prompt\s*engineering|vector\s*db|embeddings?|openai|anthropic|claude)\b/gi,
    skill: "GenAI, LLMs, RAG & Autonomous Agents",
    slugs: ["19-ai-engineer-llms", "22-ai-implementations-langchain-langgraph", "35-claude-anthropic-and-mcp"],
    category: "Artificial Intelligence",
    priority: "High",
    why: "Cutting-edge GenAI, LLM orchestration, and RAG pipelines explicitly requested."
  },
  // Machine Learning & Deep Learning
  {
    regex: /\b(machine\s*learning|deep\s*learning|neural\s*networks?|pytorch|tensorflow|scikit[-\s]learn|model\s*training|cnn|rnn|transformers?)\b/gi,
    skill: "Machine Learning & Deep Learning Pipelines",
    slugs: ["15-machine-learning", "24-ml-deep-learning-for-ai-engineers"],
    category: "Machine Learning",
    priority: "High",
    why: "Core ML modeling and deep neural network expertise required."
  },
  // Cyber Security
  {
    regex: /\b(cyber\s*security|infosec|security|owasp|vulnerabilit\w+|penetration\s*testing|cryptography|iam|auth0|jwt|oauth2?)\b/gi,
    skill: "Cyber Security & Application Hardening",
    slugs: ["23-cyber-security"],
    category: "Security & Governance",
    priority: "High",
    why: "Enterprise security standards, threat modeling, and IAM requested in JD."
  },
  // Salesforce
  {
    regex: /\b(salesforce|apex|lwc|lightning|visualforce|soql|crm)\b/gi,
    skill: "Salesforce Architecture & Apex/LWC",
    slugs: ["17-salesforce"],
    category: "Enterprise CRM",
    priority: "High",
    why: "Salesforce ecosystem and Apex development explicitly targeted."
  },
  // Linux & OS Fundamentals
  {
    regex: /\b(linux|unix|bash|shell\s*scripting|operating\s*systems?|posix|kernel)\b/gi,
    skill: "Linux Systems & OS Internals",
    slugs: ["08-linux", "13-operating-systems"],
    category: "Systems Fundamentals",
    priority: "Medium",
    why: "Production OS operations, shell scripting, and kernel diagnostics."
  },
  // Computer Networking
  {
    regex: /\b(networks?|networking|tcp\/?ip|http\/?s?|dns|osi\s*model|sockets?|bgp|routing|firewalls?)\b/gi,
    skill: "Computer Networks & Protocol Engineering",
    slugs: ["14-computer-networks", "34-network-engineering"],
    category: "Networking & Protocols",
    priority: "Medium",
    why: "Network protocols and latency optimization needed for production backends."
  },
  // REST & API Design
  {
    regex: /\b(rest|restful|api\s*design|graphql|openapi|swagger|endpoints?)\b/gi,
    skill: "REST & GraphQL API Architecture",
    slugs: ["26-rest-apis"],
    category: "API Design",
    priority: "Medium",
    why: "API design and contract management required."
  },
  // Git & Version Control
  {
    regex: /\b(git|github|gitlab|ci\/?cd|version\s*control|branching|pull\s*requests?)\b/gi,
    skill: "Git & Collaborative CI/CD Workflows",
    slugs: ["07-git-github-scenarios", "25-ci-cd-pipelines"],
    category: "Engineering Practices",
    priority: "Medium",
    why: "Production version control and continuous integration standard practice."
  },
  // OOP & Design Patterns
  {
    regex: /\b(oops?|object[-\s]oriented|solid\s*principles|design\s*patterns?|refactoring)\b/gi,
    skill: "OOP Concepts & Enterprise Design Patterns",
    slugs: ["04-oops-concepts"],
    category: "Software Design",
    priority: "Medium",
    why: "Clean architecture, SOLID principles, and design patterns required."
  },
  // C++ & Systems
  {
    regex: /\b(c\+\+|cpp|stl|pointers|memory\s*management)\b/gi,
    skill: "Modern C++ & Low-Level Memory Engineering",
    slugs: ["01-cpp-basics-to-advanced"],
    category: "Systems Programming",
    priority: "High",
    why: "High-performance C++ systems development specified."
  },
  // Rust
  {
    regex: /\b(rust|cargo|borrow\s*checker|ownership|lifetimes)\b/gi,
    skill: "Rust Systems & Memory Safety",
    slugs: ["27-rust"],
    category: "Systems Programming",
    priority: "High",
    why: "Memory-safe systems programming in Rust identified."
  }
];

// Notebook metadata lookup for title and role
const NOTEBOOK_META = {
  "01-cpp-basics-to-advanced": { title: "C++ Basics to Advanced OOP", role: "sde" },
  "02-python-basics-to-pandas": { title: "Python Basics to Pandas", role: "ai" },
  "03-java-basics-to-advanced": { title: "Java Basics to Advanced", role: "sde" },
  "04-oops-concepts": { title: "OOP Concepts and Design Patterns", role: "sde" },
  "05-sql-mysql-postgresql": { title: "SQL: MySQL and PostgreSQL", role: "sde" },
  "06-nosql-mongodb-graph-databases": { title: "NoSQL, MongoDB and Graph DBs", role: "sde" },
  "07-git-github-scenarios": { title: "Git and GitHub Scenarios", role: "sde" },
  "08-linux": { title: "Linux", role: "devops" },
  "09-aws-cloud": { title: "AWS Cloud", role: "devops" },
  "10-dsa-basics-data-structures": { title: "DSA Basics: Data Structures", role: "sde" },
  "11-dsa-a2z-solutions": { title: "DSA A2Z Sheet Solutions", role: "sde" },
  "12-system-design-hld-lld": { title: "System Design: HLD and LLD", role: "sde" },
  "13-operating-systems": { title: "Operating Systems", role: "sde" },
  "14-computer-networks": { title: "Computer Networks", role: "sde" },
  "15-machine-learning": { title: "Machine Learning", role: "ml" },
  "16-devops": { title: "DevOps: Docker, Kubernetes, Terraform", role: "devops" },
  "17-salesforce": { title: "Salesforce", role: "salesforce" },
  "18-azure": { title: "Microsoft Azure", role: "devops" },
  "19-ai-engineer-llms": { title: "AI Engineer: GenAI, LLMs, RAG, Prompt Engineering & FastAPI", role: "ai" },
  "20-swe-role": { title: "Software Engineer (SWE) Role Guide", role: "sde" },
  "21-sde-role": { title: "SDE Role Guide and Interview Prep", role: "sde" },
  "22-ai-implementations-langchain-langgraph": { title: "AI Implementations: LangChain, LangGraph, Agents", role: "ai" },
  "23-cyber-security": { title: "Cyber Security Engineer", role: "security" },
  "24-ml-deep-learning-for-ai-engineers": { title: "Deep Learning and ML Analysis", role: "ai" },
  "25-ci-cd-pipelines": { title: "CI/CD Pipelines", role: "devops" },
  "26-rest-apis": { title: "REST APIs", role: "sde" },
  "27-rust": { title: "Rust", role: "sde" },
  "28-javascript-node-react": { title: "JavaScript, Node.js and React", role: "fullstack" },
  "29-data-scientist-analyst": { title: "Data Scientist and Data Analyst", role: "data" },
  "30-projects-for-every-role": { title: "Resume Projects for Every Role", role: "sde" },
  "31-full-stack-development": { title: "Full Stack Development", role: "fullstack" },
  "32-hr-interview-self-introduction": { title: "HR Interview, Self Introduction and Behavioural Questions", role: "sde" },
  "33-forward-deployed-engineer": { title: "Forward Deployed Engineer (FDE) Role Guide", role: "sde" },
  "34-network-engineering": { title: "Network Engineering", role: "devops" },
  "35-claude-anthropic-and-mcp": { title: "Claude Architecture, Anthropic AI, MCP and Azure AI", role: "ai" },
  "36-php-and-modern-backend": { title: "Modern PHP 8.x, Laravel and Web Architecture", role: "fullstack" },
  "37-top-tech-certifications-guide": { title: "Valuable Tech Certifications Guide", role: "sde" },
  "38-claude-101": { title: "Claude 101: Anthropic AI & Prompt Engineering Masterclass", role: "ai" },
  "39-quantum-computing": { title: "Quantum Computing: Qubits, Circuits & Algorithms", role: "sde" },
  "40-spring-boot-and-microservices": { title: "Spring Boot & Microservices Enterprise Architecture", role: "sde" },
  "41-go-programming-and-concurrency": { title: "Go Programming & Concurrency Systems Architecture", role: "sde" }
};

/**
 * High-accuracy JD Analyzer
 */
export function analyzeJD(text, companyHint = "") {
  const clean = (text || "").trim();
  if (!clean || clean.length < 20) {
    throw new Error("Job description text is too short. Please provide at least 20 characters.");
  }

  // 1. Detect Role
  let roleDetected = "SDE / Software Engineer";
  let targetRoleId = "sde";
  const lower = clean.toLowerCase();

  if (/\b(ai\s*engineer|genai|llm\s*engineer|prompt\s*engineer)\b/i.test(lower)) {
    roleDetected = "AI Engineer (GenAI / LLMs)";
    targetRoleId = "ai";
  } else if (/\b(machine\s*learning|ml\s*engineer|deep\s*learning|nlp|computer\s*vision)\b/i.test(lower)) {
    roleDetected = "ML Engineer";
    targetRoleId = "ml";
  } else if (/\b(data\s*scientist|data\s*analyst|bi\s*analyst|analytics)\b/i.test(lower)) {
    roleDetected = "Data Scientist / Data Analyst";
    targetRoleId = "data";
  } else if (/\b(devops|cloud\s*engineer|sre|site\s*reliability|infrastructure|platform\s*engineer)\b/i.test(lower)) {
    roleDetected = "DevOps / Cloud Engineer";
    targetRoleId = "devops";
  } else if (/\b(full\s*stack|frontend|react|angular|vue|web\s*developer)\b/i.test(lower)) {
    roleDetected = "Full Stack Developer";
    targetRoleId = "fullstack";
  } else if (/\b(cyber\s*security|infosec|security\s*engineer|soc\s*analyst|penetration)\b/i.test(lower)) {
    roleDetected = "Cyber Security Engineer";
    targetRoleId = "security";
  } else if (/\b(salesforce|apex|lwc)\b/i.test(lower)) {
    roleDetected = "Salesforce Developer";
    targetRoleId = "salesforce";
  }

  // 2. Detect Seniority
  let seniority = "Software Engineer";
  if (/\b(intern|internship|graduate|associate|junior|entry\s*level)\b/i.test(lower)) {
    seniority = "Junior / Associate";
  } else if (/\b(staff|principal|director|head\s*of|architect)\b/i.test(lower)) {
    seniority = "Staff / Principal Architect";
  } else if (/\b(senior|sr\.?|lead)\b/i.test(lower)) {
    seniority = "Senior Engineer";
  }

  // 3. Extract Role Title
  const firstLines = clean.split("\n").map(l => l.trim()).filter(Boolean);
  let title = `${seniority} - ${roleDetected}`;
  if (firstLines.length > 0 && firstLines[0].length < 80 && !firstLines[0].toLowerCase().includes("about us")) {
    title = firstLines[0].replace(/^[#*-\s]+/, "").trim();
  }

  // 4. Match Skills & Slugs
  const detectedSkills = [];
  const matchedSlugs = new Set();
  const ruleHits = [];

  for (const rule of SKILL_RULES) {
    if (rule.regex.test(clean)) {
      detectedSkills.push(rule.skill);
      rule.slugs.forEach(s => matchedSlugs.add(s));
      ruleHits.push(rule);
    }
  }

  // Default baseline subjects for any SWE role
  matchedSlugs.add("32-hr-interview-self-introduction");
  matchedSlugs.add("30-projects-for-every-role");
  if (matchedSlugs.size < 4) {
    matchedSlugs.add("10-dsa-basics-data-structures");
    matchedSlugs.add("12-system-design-hld-lld");
    matchedSlugs.add("05-sql-mysql-postgresql");
  }

  // 5. Build Tailored Interactive Checklist Items
  const allTopics = getTopics();
  const checklistItems = [];
  let itemCounter = 1;

  for (const hit of ruleHits) {
    for (const slug of hit.slugs) {
      const nb = allTopics[slug];
      const meta = NOTEBOOK_META[slug] || { title: slug };
      if (!nb || !nb.sections || nb.sections.length === 0) continue;

      // Pick top 2 most relevant sections from this notebook
      const selectedSecs = nb.sections.slice(0, 3);
      for (const sec of selectedSecs) {
        checklistItems.push({
          id: `item_${itemCounter++}`,
          topic: sec.title,
          subject_slug: slug,
          subject_title: meta.title,
          page: sec.page || 1,
          master_page: sec.masterPage || sec.page || 1,
          priority: hit.priority,
          category: hit.category,
          why: hit.why,
          completed: false
        });
      }
    }
  }

  // Add Universal Interview & Behavioral Checklist Items
  const hrNb = allTopics["32-hr-interview-self-introduction"];
  if (hrNb && hrNb.sections) {
    const s = hrNb.sections[0];
    checklistItems.push({
      id: `item_${itemCounter++}`,
      topic: s ? s.title : "STAR Method Behavioral Responses & Self Introduction",
      subject_slug: "32-hr-interview-self-introduction",
      subject_title: "HR Interview & Behavioural Questions",
      page: s ? s.page : 1,
      master_page: s ? s.masterPage : 1,
      priority: "Low",
      category: "Interview Strategy",
      why: "Essential behavioral and cultural alignment preparation for tech rounds.",
      completed: false
    });
  }

  const projNb = allTopics["30-projects-for-every-role"];
  if (projNb && projNb.sections) {
    const s = projNb.sections[0];
    checklistItems.push({
      id: `item_${itemCounter++}`,
      topic: s ? s.title : "Portfolio Project Architecture & Live Deployment",
      subject_slug: "30-projects-for-every-role",
      subject_title: "Resume Projects for Every Role",
      page: s ? s.page : 1,
      master_page: s ? s.masterPage : 1,
      priority: "Medium",
      category: "Portfolio Validation",
      why: "Concrete end-to-end production project examples to discuss during technical deep-dives.",
      completed: false
    });
  }

  // 6. Compute Match Score
  const uniqueSkillsCount = detectedSkills.length;
  const matchScore = Math.min(98, Math.max(78, 65 + uniqueSkillsCount * 4));

  return {
    title,
    company: companyHint,
    role_detected: roleDetected,
    seniority,
    target_role_id: targetRoleId,
    match_score: matchScore,
    skills: detectedSkills,
    items: checklistItems
  };
}
