# Resources Portal

[![Live Demo](https://img.shields.io/badge/Live%20Site-resourcescse.vercel.app-1b3fae?style=for-the-badge&logo=vercel)](https://resourcescse.vercel.app/)
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite%208-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare%20D1-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/d1/)

**Resources Portal** is a production-grade interview-preparation platform featuring handwritten-style comprehensive notebooks, a role-based interactive track sheet that saves completion progress, daily study streaks, curated resources, project recommendations, a networking Connect hub, and an administrative CMS with audit logs.

🌐 **Production Site:** [https://resourcescse.vercel.app](https://resourcescse.vercel.app)

---

## ✨ Key Features

- **31+ Comprehensive Notebooks:** Handwritten-style notebooks covering fundamental to advanced topics:
  - C++, Python, Java, OOP & Design Patterns
  - SQL (MySQL/PostgreSQL), NoSQL, MongoDB & Graph DBs
  - Git, Linux, AWS Cloud, Microsoft Azure
  - DSA Basics & Complete Strivers A2Z Sheet Solutions
  - System Design (HLD & LLD), Operating Systems, Computer Networks
  - Machine Learning, Deep Learning, GenAI & LLMs (LangChain, LangGraph, Agents, FastAPI)
  - DevOps (Docker, Kubernetes, Terraform, CI/CD Pipelines), Cyber Security, REST APIs, Rust, and Full Stack Development.
- **Track Sheet & Day-Wise Streaks:**
  - Real-time syllabus tracker tailored to selected career roles (SDE, Full Stack, AI, ML, Data Science, DevOps, Security, Salesforce).
  - Tracks individual subtopic completion percentage and records daily study streaks.
- **Protected Document Reader:**
  - Zero raw PDF exposure; documents are stored as private ImageKit page images.
  - On-the-fly watermarking stamped with the authenticated user's email address.
  - Per-view AES-GCM encryption, rendered on HTML5 canvas with right-click, selection, print, and copy protections.
- **Admin CMS & Audit Logs:**
  - Upload documents and convert PDF pages to encrypted images.
  - Manage team profiles displayed on the "Brought to you by" showcase.
  - Inspect user progress, target career roles, contact details, and view access audit logs.
- **Modern Technical SEO & Discoverability:**
  - XML sitemap (`/sitemap.xml`) covering all public sections and reader routes.
  - Crawl rules in `/robots.txt` protecting admin/API routes while indexing public learning resources.
  - Open Graph and Twitter Card preview tags with custom branded banner (`og-image.png`).
  - Google Search Console site verification and Web App Manifest (`site.webmanifest`).

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, React Router 7, Vite |
| **Backend / API** | Hono running on Vercel Serverless Functions (`api/index.js`) |
| **Database** | Cloudflare D1 over HTTP API (prefixed `rp_`), with local SQLite fallback |
| **Asset Storage** | Private ImageKit with page-level encryption & signed URL generation |
| **Authentication** | Password authentication + SMTP email codes for signup verification & password reset |
| **Hosting & CDN** | Vercel (Edge routing, serverless execution, SPA fallbacks, and security headers) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** `>= 22`
- **pnpm** (or `npm`)

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/likhithm123/RESOURCES.git
cd RESOURCES

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env.local
```

### 3. Environment Configuration (`.env.local`)
Fill in `.env.local` with your configuration:
```ini
APP_NAME="Resources Portal"
SESSION_SECRET="your-32-byte-hex-random-string"
ADMIN_EMAILS="admin@example.com"

# Cloudflare D1 Database (optional for local SQLite development)
CF_ACCOUNT_ID=
CF_D1_DATABASE_ID=
CF_API_TOKEN=

# ImageKit Storage
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
IMAGEKIT_FOLDER=/resources-portal

# SMTP (Gmail App Password or custom SMTP provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

> **Tip for Local Testing:**  
> If Cloudflare D1 keys are omitted, the API automatically falls back to local SQLite at `.data/portal.db`.  
> Set `DEV_LOG_OTP=1` and `DEV_NO_MAIL=1` to print verification codes directly in the terminal console without needing an active SMTP connection.

### 4. Database Migration & Running Locally
```bash
# Apply database schema (safe to re-run anytime)
pnpm db:migrate

# Start both API server (:8799) and Vite client (:5173)
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Generates topics & sitemap, starts local API server and Vite dev server |
| `pnpm build` | Generates topics checklist, builds sitemap, and compiles production assets to `dist/` |
| `pnpm sitemap` | Regenerates `public/sitemap.xml` and `public/robots.txt` based on the notebook catalog |
| `pnpm topics` | Compiles `src/shared/topics.json` checklist from markdown notes |
| `pnpm db:migrate` | Runs D1/SQLite schema migrations to ensure all tables exist |
| `pnpm pdfs:upload` | Batch converts and uploads local PDF pages to ImageKit |

---

## 🚢 Deploying to Vercel

1. Import this repository in [Vercel](https://vercel.com).
2. Framework Preset: **Vite** (Build output: `dist`).
3. Add the environment variables from `.env.example` in **Project Settings -> Environment Variables**.
4. Run `pnpm db:migrate` once from your machine to initialize the Cloudflare D1 database.
5. Create an account using one of the emails defined in `ADMIN_EMAILS` to gain access to the **Admin** dashboard.

---

## 🛡️ Document Security Model

- **No Public PDF Files:** Original PDFs are never uploaded or served to users. Each page is processed into a private image.
- **Authenticated Proxying:** The server signs short-lived URLs and watermarks each page image with the logged-in user's email address and timestamp.
- **Client Shielding:** Reader disables right-click, keyboard copy/print shortcuts, text selection, and automatically hides content when the browser tab loses focus.

---

## 🤝 Contributing & Team

Built for students and professionals preparing for software engineering, AI, data science, cloud, and cybersecurity careers.

- **Developer:** [Likhith Medarametla](https://github.com/likhithm123)
- **LinkedIn:** [likhith-medarametla](https://www.linkedin.com/in/likhith-medarametla-0039b6320)
- **Email:** liki123456m@gmail.com
