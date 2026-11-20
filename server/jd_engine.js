/**
 * Precision Job Description Analysis Engine
 * Maps raw job descriptions (text/pdf/doc/image) to tailored curriculum checklists
 * with exact notebook slugs, section titles, master page numbers, and TUF/LeetCode practice links.
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
  // Problem Solving & Data Structures & Algorithms (MANDATORY FOR ALL TECH ROLES)
  {
    regex: /\b(problem\s*solving|problem\s*solver|analytical\s*skills?|troubleshoot\w*|logic(?:al)?\s*reasoning|critical\s*thinking|coding|programming|dsa|data\s*structures?|algorithms?|algorithmic|leetcode|hackerrank|codeforces|competitive\s*programming|complexity|time\s*complexity|space\s*complexity|big[- ]?o|arrays?|linked\s*lists?|trees?|graphs?|dynamic\s*programming|recursion|sorting|searching|binary\s*search)\b/gi,
    skill: "Problem Solving & Data Structures (DSA)",
    slugs: ["10-dsa-basics-data-structures", "11-dsa-a2z-solutions"],
    category: "Problem Solving & DSA",
    priority: "High",
    why: "Core algorithmic problem-solving and coding interview benchmark mandatory for technical rounds."
  },
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
    regex: /\b(ai\s*engineer|genai\s*engineer|llm\s*engineer|large\s*language\s*models?|rag|retrieval\s*augmented|langchain|langgraph|prompt\s*engineering|vector\s*db|embeddings?|openai|anthropic|claude)\b/gi,
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
    regex: /\b(cyber\s*security|infosec|security\s*engineer|owasp|vulnerabilit\w+|penetration\s*testing|cryptography|iam|auth0|jwt|oauth2?)\b/gi,
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

// Core high-frequency coding interview problem titles from 11-dsa-a2z-solutions
const CORE_DSA_TARGETS = [
  "Two Sum",
  "Longest Consecutive Sequence in an Array",
  "Detect a loop in LL",
  "Reverse a LinkedList",
  "Merge Intervals",
  "Trapping Rainwater",
  "Level Order Traversal",
  "Number of islands",
  "Climbing stairs",
  "Binary Search"
];

/**
 * High-accuracy Multi-Factor Role Scorer & JD Analyzer
 */
export function analyzeJD(text, companyHint = "") {
  const clean = (text || "").trim();
  if (!clean || clean.length < 20) {
    throw new Error("Job description text is too short. Please provide at least 20 characters.");
  }

  const lines = clean.split("\n").map(l => l.trim()).filter(Boolean);
  const headerText = lines.slice(0, 4).join(" ").toLowerCase();
  const lower = clean.toLowerCase();

  // 1. Role Scoring Map
  const scores = {
    sde: 0,
    fullstack: 0,
    ai: 0,
    ml: 0,
    data: 0,
    devops: 0,
    security: 0,
    salesforce: 0,
  };

  // Header / Job Title carries highest weight (+15 to +20)
  if (/\b(full\s*stack|frontend|front\s*end|web\s*developer|react|angular)\b/i.test(headerText)) scores.fullstack += 18;
  if (/\b(software\s*(?:engineer|developer)|sde|backend|software\s*development|java\s*developer|systems?\s*engineer)\b/i.test(headerText)) scores.sde += 16;
  if (/\b(ai\s*engineer|genai\s*engineer|llm\s*engineer|prompt\s*engineer)\b/i.test(headerText)) scores.ai += 20;
  if (/\b(machine\s*learning|ml\s*engineer|deep\s*learning|nlp|computer\s*vision)\b/i.test(headerText)) scores.ml += 18;
  if (/\b(data\s*(?:scientist|analyst)|bi\s*analyst|analytics\s*engineer)\b/i.test(headerText)) scores.data += 18;
  if (/\b(devops|cloud\s*engineer|sre|site\s*reliability|infrastructure|platform\s*engineer)\b/i.test(headerText)) scores.devops += 18;
  if (/\b(cyber\s*security|infosec|security\s*engineer|soc\s*analyst|penetration\s*tester)\b/i.test(headerText)) scores.security += 18;
  if (/\b(salesforce|apex|lwc)\b/i.test(headerText)) scores.salesforce += 20;

  // Body keyword frequency scoring
  const count = (regex) => (lower.match(regex) || []).length;
  scores.sde += count(/\b(software\s*(?:engineer|development|developer)|sde|backend|java|c\+\+|golang|spring\s*boot|object[-\s]oriented|oops?|microservices?)\b/g) * 2;
  scores.fullstack += count(/\b(full\s*stack|frontend|front\s*end|react(?:\.js)?|vue|angular|node(?:\.js)?|express|html\/?css|javascript|typescript)\b/g) * 2;
  scores.ai += count(/\b(genai|llms?|rag|langchain|prompt\s*engineering|hugging\s*face|openai|fine[-\s]tuning|vector\s*db)\b/g) * 3;
  scores.ml += count(/\b(machine\s*learning|scikit[-\s]learn|tensorflow|pytorch|deep\s*learning|neural\s*network|supervised)\b/g) * 3;
  scores.data += count(/\b(data\s*(?:scientist|analysis|analyst)|pandas|tableau|power\s*bi|statistics|bi\s*analyst|data\s*warehouse)\b/g) * 3;
  scores.devops += count(/\b(devops|kubernetes|docker|terraform|ci\/?cd|jenkins|aws|cloud\s*infrastructure|sre)\b/g) * 3;
  scores.security += count(/\b(cyber\s*security|infosec|penetration|soc|owasp|cryptography|vulnerability|firewall)\b/g) * 3;
  scores.salesforce += count(/\b(salesforce|apex|lwc|visualforce|soql)\b/g) * 4;

  // De-weight "is a plus / nice to have" for peripheral skills so they do not overpower primary job title
  if (/exposure to (?:ai|ml|genai).*?(?:is a plus|nice to have|good to have)/i.test(lower)) {
    scores.ai = Math.max(0, scores.ai - 6);
    scores.ml = Math.max(0, scores.ml - 6);
  }

  // Determine top winning role
  let targetRoleId = "sde";
  let maxScore = -1;
  for (const [r, s] of Object.entries(scores)) {
    if (s > maxScore) {
      maxScore = s;
      targetRoleId = r;
    }
  }

  const roleNameMap = {
    sde: "SDE / Software Engineer",
    fullstack: "Full Stack Developer",
    ai: "AI Engineer (GenAI / LLMs)",
    ml: "ML Engineer",
    data: "Data Scientist / Data Analyst",
    devops: "DevOps / Cloud Engineer",
    security: "Cyber Security Engineer",
    salesforce: "Salesforce Developer"
  };
  const roleDetected = roleNameMap[targetRoleId] || "SDE / Software Engineer";

  // 2. Detect Seniority
  let seniority = "Software Engineer";
  if (/\b(intern|internship|graduate|associate|junior|entry\s*level|rotational)\b/i.test(lower)) {
    seniority = "Junior / Associate";
  } else if (/\b(staff|principal|director|head\s*of|architect)\b/i.test(lower)) {
    seniority = "Staff / Principal Architect";
  } else if (/\b(senior|sr\.?|lead)\b/i.test(lower)) {
    seniority = "Senior Engineer";
  }

  // 3. Extract Role Title
  let title = `${seniority} - ${roleDetected}`;
  if (lines.length > 0 && lines[0].length < 80 && !lines[0].toLowerCase().includes("about us") && !lines[0].toLowerCase().includes("http")) {
    title = lines[0].replace(/^[#*-\s]+/, "").trim();
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

  // DSA & Problem Solving is strictly mandatory for all tech roles in modern coding rounds
  if (!detectedSkills.includes("Problem Solving & Data Structures (DSA)")) {
    detectedSkills.unshift("Problem Solving & Data Structures (DSA)");
  }
  matchedSlugs.add("10-dsa-basics-data-structures");
  matchedSlugs.add("11-dsa-a2z-solutions");

  // Universal baseline subjects for tech interviews
  matchedSlugs.add("32-hr-interview-self-introduction");
  matchedSlugs.add("30-projects-for-every-role");
  if (matchedSlugs.size < 4) {
    matchedSlugs.add("12-system-design-hld-lld");
    matchedSlugs.add("05-sql-mysql-postgresql");
  }

  // 5. Build Tailored Interactive Checklist Items
  const allTopics = getTopics();
  const checklistItems = [];
  let itemCounter = 1;

  // A. Add Core High-Frequency DSA Interview Problems (from 11-dsa-a2z-solutions)
  const a2z = allTopics["11-dsa-a2z-solutions"];
  if (a2z && a2z.sections) {
    const flatItems = [];
    for (const sec of a2z.sections) {
      for (const it of (sec.items || [])) {
        flatItems.push({ secTitle: sec.title, ...it });
      }
    }

    // Select core DSA targets
    for (const target of CORE_DSA_TARGETS) {
      const found = flatItems.find(it => it.title && it.title.toLowerCase().includes(target.toLowerCase()));
      if (found) {
        checklistItems.push({
          id: `item_${itemCounter++}`,
          topic: found.title,
          subject_slug: "11-dsa-a2z-solutions",
          subject_title: "DSA A2Z Sheet Solutions",
          page: found.page || 1,
          master_page: found.masterPage || found.page || 1,
          priority: "High",
          category: "Problem Solving & DSA",
          why: "Essential algorithmic coding interview benchmark tested across top tech companies.",
          tufUrl: found.tufUrl || null,
          leetcodeUrl: found.leetcodeUrl || null,
          youtubeUrl: found.youtubeUrl || null,
          duration: found.duration || null,
          completed: false
        });
      }
    }
  }

  // B. Add DSA Foundations (from 10-dsa-basics-data-structures)
  const dsaBasics = allTopics["10-dsa-basics-data-structures"];
  if (dsaBasics && dsaBasics.sections) {
    const coreBasics = dsaBasics.sections.slice(0, 3);
    for (const sec of coreBasics) {
      checklistItems.push({
        id: `item_${itemCounter++}`,
        topic: sec.title,
        subject_slug: "10-dsa-basics-data-structures",
        subject_title: "DSA Basics: Data Structures",
        page: sec.page || 1,
        master_page: sec.masterPage || sec.page || 1,
        priority: "High",
        category: "Problem Solving & DSA",
        why: "Core data structure foundations and algorithmic complexity analysis.",
        tufUrl: null,
        leetcodeUrl: null,
        youtubeUrl: null,
        duration: null,
        completed: false
      });
    }
  }

  // C. Add Role-Specific Technical Skills (skipping duplicate DSA additions)
  for (const hit of ruleHits) {
    for (const slug of hit.slugs) {
      if (slug === "10-dsa-basics-data-structures" || slug === "11-dsa-a2z-solutions") continue;
      const nb = allTopics[slug];
      const meta = NOTEBOOK_META[slug] || { title: slug };
      if (!nb || !nb.sections || nb.sections.length === 0) continue;

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
          tufUrl: null,
          leetcodeUrl: null,
          youtubeUrl: null,
          duration: null,
          completed: false
        });
      }
    }
  }

  // D. Universal Interview & Behavioral Checklist Items
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
      tufUrl: null,
      leetcodeUrl: null,
      youtubeUrl: null,
      duration: null,
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
      tufUrl: null,
      leetcodeUrl: null,
      youtubeUrl: null,
      duration: null,
      completed: false
    });
  }

  // 6. Compute Match Score
  const uniqueSkillsCount = detectedSkills.length;
  const matchScore = Math.min(98, Math.max(80, 68 + uniqueSkillsCount * 4));

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
