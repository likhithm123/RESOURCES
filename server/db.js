/**
 * Database adapter.
 *  - Production / when configured: Cloudflare D1 over its HTTP API.
 *      CF_ACCOUNT_ID + CF_D1_DATABASE_ID and either CF_API_TOKEN (Bearer token with D1 Edit)
 *      or CF_API_EMAIL + CF_API_KEY (global API key).
 *  - Local development without those: a SQLite file (.data/portal.db) via node:sqlite - same SQL dialect.
 */
import fs from "node:fs";
import path from "node:path";

const e = process.env;
export const usingD1 = () => !!(e.CF_ACCOUNT_ID && e.CF_D1_DATABASE_ID && (e.CF_API_TOKEN || (e.CF_API_EMAIL && e.CF_API_KEY)));
const norm = p => (p || []).map(v => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v));

async function d1(sql, params = []) {
  const headers = { "Content-Type": "application/json" };
  if (e.CF_API_TOKEN) headers.Authorization = `Bearer ${e.CF_API_TOKEN}`;
  else { headers["X-Auth-Email"] = e.CF_API_EMAIL; headers["X-Auth-Key"] = e.CF_API_KEY; }
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${e.CF_ACCOUNT_ID}/d1/database/${e.CF_D1_DATABASE_ID}/query`,
    { method: "POST", headers, body: JSON.stringify({ sql, params: norm(params) }) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(body.errors?.map(x => x.message).join("; ") || `D1 HTTP ${res.status}`);
  return body.result?.[0] || {};
}

let local;
async function sqlite() {
  if (local) return local;
  const { DatabaseSync } = await import("node:sqlite");
  const file = e.LOCAL_DB_FILE || path.resolve(process.cwd(), ".data/portal.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  local = new DatabaseSync(file);
  return local;
}

export const db = {
  async all(sql, params) {
    if (usingD1()) return (await d1(sql, params)).results || [];
    return (await sqlite()).prepare(sql).all(...norm(params)).map(r => ({ ...r }));
  },
  async first(sql, params) { return (await this.all(sql, params))[0] || null; },
  async run(sql, params) {
    if (usingD1()) { const r = await d1(sql, params); return { changes: r.meta?.changes || 0, lastId: r.meta?.last_row_id || null }; }
    const r = (await sqlite()).prepare(sql).run(...norm(params));
    return { changes: Number(r.changes), lastId: Number(r.lastInsertRowid) };
  },
  /** Runs every statement of the schema file (idempotent). */
  async migrate() {
    const sql = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8").replace(/^--.*$/gm, "");
    for (const stmt of sql.split(";").map(s => s.trim()).filter(Boolean)) await this.run(stmt, []);
    // Safe column additions (ignored if already present)
    const safeAlters = [
      "ALTER TABLE rp_users ADD COLUMN phone TEXT NOT NULL DEFAULT ''"
    ];
    for (const alt of safeAlters) {
      try { await this.run(alt, []); } catch { /* column already exists */ }
    }

    // Seed default legal settings if missing
    const hasDisclaimer = await this.first("SELECT key FROM rp_site_settings WHERE key = 'disclaimer'");
    if (!hasDisclaimer) {
      await this.run("INSERT OR REPLACE INTO rp_site_settings (key, value) VALUES ('disclaimer', ?)", [
        "This platform is an independent student & developer preparation resource. We are not affiliated with, endorsed by, or representing any company, official certification provider, or institution. We do not hold any legal responsibility for the content; while we ensure maximum accuracy and rigor, content is provided as-is for educational prep."
      ]);
      await this.run("INSERT OR REPLACE INTO rp_site_settings (key, value) VALUES ('terms', ?)", [
        "Terms and Conditions\n\n1. Purpose: This platform is designed solely as an educational preparation portal for software engineering, cloud, security, and data careers.\n\n2. Independent Resource: None of the materials here constitute an official guarantee of employment, exam passing, or company endorsement.\n\n3. Limitation of Liability: Under no circumstances will the creators or maintainers be held liable for any inaccuracies, system downtimes, or consequences resulting from the use of this portal.\n\n4. Content & Copyright: All original study materials and handwritten notes are shared under fair educational use for self-study purposes."
      ]);
      await this.run("INSERT OR REPLACE INTO rp_site_settings (key, value) VALUES ('privacy', ?)", [
        "Privacy Policy\n\n1. Information Collection: We only collect your name, email, contact number, and selected career roles strictly to personalize your track sheet and progress tracking.\n\n2. Data Security: Your authentication is guarded with one-time verification codes and hashed credentials. We never sell, rent, or share your contact data with third parties or advertisers.\n\n3. Progress Tracking: Your topic completion and daily streaks are saved in your account to help you measure preparation milestones.\n\n4. Data Deletion: You may contact the team or administrators at any time to request complete erasure of your progress and account data."
      ]);
    }

    // Seed valuable certifications if empty
    const certCount = await this.first("SELECT COUNT(*) as n FROM rp_certifications");
    if (!certCount || certCount.n === 0) {
      const defaultCerts = [
        { title: "AWS Solutions Architect - Associate (SAA-C03)", provider: "Amazon Web Services", tier: "paid", cost: "$150", role: "cloud", url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/", resources_url: "https://aws.amazon.com/skillbuilder/", description: "The industry gold-standard cloud architecture certification testing multi-tier compute, VPC networking, S3/EBS storage, IAM security, and resilient system design.", sort_order: 1 },
        { title: "Certified Kubernetes Administrator (CKA)", provider: "CNCF / Linux Foundation", tier: "paid", cost: "$395", role: "devops", url: "https://www.cncf.io/certification/cka/", resources_url: "https://kubernetes.io/docs/home/", description: "100% hands-on performance exam testing Kubernetes cluster architecture, workload deployment, networking, troubleshooting, and storage.", sort_order: 2 },
        { title: "HashiCorp Certified: Terraform Associate", provider: "HashiCorp", tier: "paid", cost: "$70", role: "devops", url: "https://www.hashicorp.com/certification/terraform-associate", resources_url: "https://developer.hashicorp.com/terraform/tutorials", description: "Tests Infrastructure as Code (IaC) principles, remote state management with S3/DynamoDB, module authoring, and Terraform Cloud.", sort_order: 3 },
        { title: "CompTIA Security+ (SY0-701)", provider: "CompTIA", tier: "paid", cost: "$392", role: "security", url: "https://www.comptia.org/certifications/security", resources_url: "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/", description: "Baseline cybersecurity credential covering zero trust, threat analysis, cryptography, PKI, network attacks, and compliance frameworks.", sort_order: 4 },
        { title: "Microsoft Certified: Azure Administrator (AZ-104)", provider: "Microsoft", tier: "paid", cost: "$165", role: "cloud", url: "https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/", resources_url: "https://learn.microsoft.com/en-us/training/courses/az-104t00", description: "Comprehensive Azure infrastructure validation: Entra ID, virtual networks, compute (VMs/AKS), and storage governance.", sort_order: 5 },
        { title: "freeCodeCamp Certified Full Stack Developer", provider: "freeCodeCamp", tier: "free", cost: "Free ($0)", role: "sde", url: "https://www.freecodecamp.org/learn", resources_url: "https://www.freecodecamp.org/news/", description: "Rigorous 300+ hour project-driven curriculum covering responsive web design, JavaScript algorithms, frontend libraries, backend APIs, and databases.", sort_order: 6 },
        { title: "CS50: Introduction to Computer Science", provider: "Harvard University / edX", tier: "free", cost: "Free ($0)", role: "sde", url: "https://cs50.harvard.edu/x/", resources_url: "https://cs50.harvard.edu/x/2024/weeks/", description: "World-renowned foundational computer science course covering algorithms, memory pointers, data structures in C, Python, SQL, and web development.", sort_order: 7 },
        { title: "Introduction to Linux (LFS101x)", provider: "The Linux Foundation / edX", tier: "free", cost: "Free ($0)", role: "devops", url: "https://www.edx.org/learn/linux/the-linux-foundation-introduction-to-linux", resources_url: "https://training.linuxfoundation.org/resources/", description: "Official Linux Foundation course on Linux kernel architecture, command line, process manipulation, shell scripting, and network configuration.", sort_order: 8 },
        { title: "AWS Educate & Cloud Badges", provider: "Amazon Web Services", tier: "free", cost: "Free ($0)", role: "cloud", url: "https://aws.amazon.com/education/awseducate/", resources_url: "https://aws.amazon.com/skillbuilder/", description: "Official free hands-on cloud labs and verifiable digital badges directly from AWS covering compute, storage, databases, and generative AI.", sort_order: 9 },
        { title: "Google Cloud Computing Foundations", provider: "Google Cloud", tier: "free", cost: "Free ($0)", role: "cloud", url: "https://cloud.google.com/training/foundations", resources_url: "https://www.cloudskillsboost.google/", description: "Free digital courses covering Google Cloud infrastructure, BigQuery data analytics, networking, and machine learning fundamentals.", sort_order: 10 }
      ];
      for (const c of defaultCerts) {
        await this.run(
          "INSERT INTO rp_certifications (title, provider, tier, cost, role, url, resources_url, description, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
          [c.title, c.provider, c.tier, c.cost, c.role, c.url, c.resources_url, c.description, c.sort_order]
        );
      }
    }
  },
};
