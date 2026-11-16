// Career roles and which notebooks belong to each. Shared by the API and the web app.
export const CAREER_ROLES = [
  { id: "sde", label: "SDE / Software Engineer" },
  { id: "fullstack", label: "Full Stack Developer" },
  { id: "ai", label: "AI Engineer (GenAI / LLMs)" },
  { id: "ml", label: "ML Engineer" },
  { id: "data", label: "Data Scientist / Data Analyst" },
  { id: "devops", label: "DevOps / Cloud Engineer" },
  { id: "security", label: "Cyber Security Engineer" },
  { id: "salesforce", label: "Salesforce Developer" },
] as const;

export type Notebook = { slug: string; title: string; roles: string[] };

const ALL = ["sde", "fullstack", "ai", "ml", "data", "devops", "security", "salesforce"];
export const NOTEBOOKS: Notebook[] = [
  { slug: "01-cpp-basics-to-advanced", title: "C++ Basics to Advanced OOP", roles: ["sde"] },
  { slug: "02-python-basics-to-pandas", title: "Python Basics to Pandas", roles: ["sde", "ai", "ml", "data", "devops", "security"] },
  { slug: "03-java-basics-to-advanced", title: "Java Basics to Advanced", roles: ["sde", "fullstack", "salesforce"] },
  { slug: "04-oops-concepts", title: "OOP Concepts and Design Patterns", roles: ["sde", "fullstack", "salesforce", "ai"] },
  { slug: "05-sql-mysql-postgresql", title: "SQL: MySQL and PostgreSQL", roles: ALL },
  { slug: "06-nosql-mongodb-graph-databases", title: "NoSQL, MongoDB and Graph DBs", roles: ["sde", "fullstack", "ai", "data", "devops"] },
  { slug: "07-git-github-scenarios", title: "Git and GitHub Scenarios", roles: ALL },
  { slug: "08-linux", title: "Linux", roles: ["sde", "devops", "security", "ai", "ml"] },
  { slug: "09-aws-cloud", title: "AWS Cloud", roles: ["sde", "fullstack", "ai", "ml", "devops", "security", "data"] },
  { slug: "10-dsa-basics-data-structures", title: "DSA Basics: Data Structures", roles: ["sde", "fullstack", "ai", "ml", "data"] },
  { slug: "11-dsa-a2z-solutions", title: "DSA A2Z Sheet Solutions (C++ and Python)", roles: ["sde", "fullstack", "ai", "ml"] },
  { slug: "12-system-design-hld-lld", title: "System Design: HLD and LLD", roles: ["sde", "fullstack", "ai", "devops"] },
  { slug: "13-operating-systems", title: "Operating Systems", roles: ["sde", "devops", "security"] },
  { slug: "14-computer-networks", title: "Computer Networks", roles: ["sde", "devops", "security", "fullstack"] },
  { slug: "15-machine-learning", title: "Machine Learning", roles: ["ai", "ml", "data"] },
  { slug: "16-devops", title: "DevOps: Docker, Kubernetes, Terraform", roles: ["devops", "sde", "ai", "ml", "fullstack"] },
  { slug: "17-salesforce", title: "Salesforce", roles: ["salesforce"] },
  { slug: "18-azure", title: "Microsoft Azure", roles: ["devops", "ai", "data"] },
  { slug: "19-ai-engineer-llms", title: "AI Engineer: GenAI, LLMs, RAG, FastAPI", roles: ["ai", "ml"] },
  { slug: "20-swe-role", title: "Software Engineer (SWE) Role Guide", roles: ["sde", "fullstack"] },
  { slug: "21-sde-role", title: "SDE Role Guide and Interview Prep", roles: ["sde"] },
  { slug: "22-ai-implementations-langchain-langgraph", title: "AI Implementations: LangChain, LangGraph, Agents", roles: ["ai"] },
  { slug: "23-cyber-security", title: "Cyber Security Engineer", roles: ["security", "devops"] },
  { slug: "24-ml-deep-learning-for-ai-engineers", title: "Deep Learning and ML Analysis", roles: ["ai", "ml", "data"] },
  { slug: "25-ci-cd-pipelines", title: "CI/CD Pipelines", roles: ["devops", "sde", "fullstack", "ai"] },
  { slug: "26-rest-apis", title: "REST APIs", roles: ["sde", "fullstack", "ai", "salesforce"] },
  { slug: "27-rust", title: "Rust", roles: ["sde"] },
  { slug: "28-javascript-node-react", title: "JavaScript, Node.js and React", roles: ["fullstack", "sde"] },
  { slug: "29-data-scientist-analyst", title: "Data Scientist and Data Analyst", roles: ["data", "ml"] },
  { slug: "30-projects-for-every-role", title: "Resume Projects for Every Role", roles: ALL },
  { slug: "31-full-stack-development", title: "Full Stack Development", roles: ["fullstack", "sde"] },
];

export const roleLabel = (id: string) => CAREER_ROLES.find(r => r.id === id)?.label || id;
