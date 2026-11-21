import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./api";

export type ChecklistItem = {
  id: string;
  topic: string;
  subject_slug: string;
  subject_title: string;
  page: number;
  master_page?: number;
  priority: "High" | "Medium" | "Low";
  category: string;
  why: string;
  tufUrl?: string | null;
  leetcodeUrl?: string | null;
  youtubeUrl?: string | null;
  duration?: string | null;
  completed: boolean;
};

export type SavedJD = {
  id: number;
  title: string;
  company: string;
  raw_text: string;
  role_detected: string;
  match_score: number;
  skills: string[];
  items: ChecklistItem[];
  created_at: string;
  updated_at: string;
};

const SAMPLE_JDS = [
  {
    title: "Senior Backend Engineer (Java / Spring Boot)",
    company: "Stripe",
    text: `Job Description: Senior Backend Engineer
Location: Remote
About the Role:
We are seeking a Senior Backend Engineer to join our high-volume Core Ledger and Payment Infrastructure team.
Key Responsibilities:
- Design, build, and maintain mission-critical distributed services handling thousands of transactions per second.
- Implement robust microservices architecture using Java 17+, Spring Boot 3.x, Spring Cloud, and Hibernate JPA.
- Architect high-throughput event-driven messaging pipelines utilizing Apache Kafka and Redis distributed locks.
- Optimize relational database queries, schema designs, and indexing strategies in PostgreSQL.
- Write extensive integration tests using Testcontainers and Docker.
- Participate in high-level system design, distributed transaction handling (Saga pattern), and fault tolerance engineering using Resilience4j.
Requirements:
- 5+ years of experience building enterprise backend systems in Java and Spring Boot.
- Deep understanding of JVM memory mechanics, multithreading, and concurrency.
- Strong proficiency with PostgreSQL, SQL optimization, and NoSQL datastores.
- Familiarity with Kubernetes, Docker, and CI/CD pipelines.`
  },
  {
    title: "Full Stack Developer (React & Node.js)",
    company: "Vercel",
    text: `Job Description: Full Stack Developer
About the Role:
Looking for a product-focused Full Stack Developer to build next-generation web applications.
Responsibilities:
- Build highly responsive, modern frontends using React, TypeScript, Next.js, and Tailwind CSS.
- Design resilient REST and GraphQL APIs using Node.js and Express.
- Manage client and server-side state, caching, and SSR performance tuning.
- Work with relational databases (PostgreSQL/MySQL) and document databases (MongoDB).
- Write comprehensive unit and end-to-end test suites.
Requirements:
- 3+ years of professional full-stack web development experience.
- Strong proficiency in modern JavaScript/TypeScript, async programming, and React component design.
- Solid knowledge of Git branching workflows, GitHub Actions CI/CD, and cloud deployments.`
  },
  {
    title: "AI Engineer (GenAI / LLMs & RAG)",
    company: "Anthropic",
    text: `Job Description: AI & GenAI Systems Engineer
About the Role:
Join our AI Systems team building production LLM applications, autonomous agents, and RAG architectures.
Responsibilities:
- Design and deploy production-grade GenAI pipelines using LangChain, LangGraph, and OpenAI / Claude APIs.
- Build high-precision Retrieval-Augmented Generation (RAG) systems with vector databases (Pinecone/Chroma/pgvector) and dense embeddings.
- Develop low-latency inference microservices with Python and FastAPI.
- Implement Model Context Protocol (MCP) servers and dynamic tool-calling workflows.
- Monitor hallucination rates, token usage, and latency metrics in production.
Requirements:
- 2+ years working with LLMs, prompt engineering, vector search, and agentic workflows.
- Strong Python programming fundamentals and data manipulation experience (Pandas, NumPy).
- Understanding of deep learning basics, transformers, and model evaluation metrics.`
  },
  {
    title: "DevOps & Cloud Infrastructure Engineer",
    company: "Datadog",
    text: `Job Description: DevOps / Cloud Platform Engineer
About the Role:
We need an infrastructure specialist to manage scalable Kubernetes clusters and cloud resources across AWS and Azure.
Responsibilities:
- Provision and maintain Infrastructure as Code (IaC) using Terraform and Ansible.
- Deploy, scale, and monitor containerized microservices on Kubernetes (EKS / AKS).
- Configure automated continuous integration and continuous deployment (CI/CD) pipelines in GitHub Actions.
- Ensure system reliability, zero-downtime rolling updates, and disaster recovery.
- Configure Prometheus, Grafana, and OpenTelemetry for end-to-end observability.
Requirements:
- 3+ years in DevOps, SRE, or Cloud Engineering roles.
- Expert knowledge of Linux internals, shell scripting (Bash), and networking (TCP/IP, DNS, TLS).
- Hands-on expertise with Docker, Kubernetes, AWS (EC2, S3, IAM, VPC), and Terraform.`
  }
];

export default function JDAnalyzer() {
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState<"text" | "file" | "image">("text");
  const [jdText, setJdText] = useState("");
  const [company, setCompany] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [parseStatus, setParseStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Analysis result
  const [result, setResult] = useState<{
    title: string;
    company: string;
    role_detected: string;
    seniority: string;
    match_score: number;
    skills: string[];
    key_focus_areas?: string[];
    study_strategy?: string[];
    estimated_prep_hours?: number;
    items: ChecklistItem[];
  } | null>(null);

  // Saved Checklists
  const [savedChecklists, setSavedChecklists] = useState<SavedJD[]>([]);
  const [activeChecklistId, setActiveChecklistId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Checklist filters
  const [priorityFilter, setPriorityFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Completed">("All");
  const [searchFilter, setSearchFilter] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Load saved checklists on mount
  useEffect(() => {
    loadSaved();
  }, []);

  async function loadSaved() {
    try {
      const data = await api<{ checklists: SavedJD[] }>("/jd");
      setSavedChecklists(data.checklists || []);
    } catch (e: any) {
      console.error("Failed to load saved checklists:", e);
    }
  }

  // Server-side fallback parsing for PDF, DOCX, and images
  async function parseFileViaServer(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/jd/parse-file", {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-Requested-With": "portal" },
      body: fd
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server file parsing failed (${res.status})`);
    return data.text || "";
  }

  // Analyze text
  async function handleAnalyze(textToAnalyze = jdText, companyName = company) {
    if (!textToAnalyze.trim()) {
      setError("Please paste, type, or upload a job description.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    try {
      const res = await api<{
        ok: boolean;
        title: string;
        company: string;
        role_detected: string;
        seniority: string;
        match_score: number;
        skills: string[];
        items: ChecklistItem[];
      }>("/jd/analyze", "POST", { text: textToAnalyze, company: companyName });

      setResult({
        title: res.title,
        company: res.company || companyName,
        role_detected: res.role_detected,
        seniority: res.seniority,
        match_score: res.match_score,
        skills: res.skills,
        items: res.items
      });
      setActiveChecklistId(null);
    } catch (e: any) {
      setError(e.message || "Failed to analyze job description.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Load sample JD
  function loadSample(sample: typeof SAMPLE_JDS[0]) {
    setJdText(sample.text);
    setCompany(sample.company);
    setInputMode("text");
    handleAnalyze(sample.text, sample.company);
  }

  // Process uploaded document (PDF / DOCX / TXT)
  async function processDocument(file: File) {
    setError(null);
    setParsingFile(true);
    setParseStatus(`Processing ${file.name}...`);

    try {
      const name = file.name.toLowerCase();
      let extracted = "";

      if (name.endsWith(".pdf")) {
        setParseStatus("Extracting text from PDF via PDF.js engine...");
        try {
          const pdfjsLib = await import("pdfjs-dist");
          try {
            const workerUrl = new URL("/pdf.worker.min.mjs", window.location.origin).toString();
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
          } catch {}
          const ab = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: ab, isEvalSupported: false } as any).promise;
          const pageTexts: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            setParseStatus(`Parsing PDF page ${i} of ${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map((it: any) => it.str || "");
            pageTexts.push(strings.join(" "));
          }
          extracted = pageTexts.join("\n\n");
        } catch (clientErr: any) {
          console.warn("Client PDF extraction failed, using server fallback:", clientErr);
          setParseStatus("Extracting PDF text via server engine...");
          try {
            extracted = await parseFileViaServer(file);
          } catch (serverErr: any) {
            console.error("Server PDF fallback failed:", serverErr);
            throw new Error("Could not extract readable text from this PDF. Please copy and paste the job description text into the text box.");
          }
        }
      } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
        setParseStatus("Parsing Word document...");
        try {
          const mammoth = await import("mammoth");
          const ab = await file.arrayBuffer();
          const res = await mammoth.extractRawText({ arrayBuffer: ab });
          extracted = res.value;
        } catch (docxErr: any) {
          console.warn("Client DOCX extraction failed, using server fallback:", docxErr);
          setParseStatus("Parsing Word document via server engine...");
          try {
            extracted = await parseFileViaServer(file);
          } catch (serverErr: any) {
            console.error("Server Word fallback failed:", serverErr);
            throw new Error("Could not extract readable text from this Word document. Please copy and paste the job description text into the text box.");
          }
        }
      } else {
        // Plain text / markdown
        setParseStatus("Reading text file...");
        extracted = await file.text();
      }

      if (!extracted.trim()) {
        throw new Error("No readable text found in this file. Try pasting the text directly.");
      }

      setJdText(extracted);
      setParseStatus("Analyzing extracted job description...");
      await handleAnalyze(extracted, company);
    } catch (err: any) {
      const msg = err.message || String(err);
      if (msg.includes("fake worker") || msg.includes("dynamically imported module") || msg.includes("PDF.js") || msg.includes("Worker")) {
        // Transparent fallback to server-side parser
        try {
          setParseStatus("Extracting document text via server engine...");
          const serverExtracted = await parseFileViaServer(file);
          if (serverExtracted && serverExtracted.trim()) {
            setJdText(serverExtracted);
            setParseStatus("Analyzing extracted job description...");
            await handleAnalyze(serverExtracted, company);
            return;
          }
        } catch (fallbackErr: any) {
          setError("Could not extract readable text from this document. Please copy and paste the job description text directly.");
          return;
        }
      }
      setError(err.message || "Could not extract text from this file.");
    } finally {
      setParsingFile(false);
      setParseStatus("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Process uploaded image (PNG / JPG / WEBP)
  async function processImage(file: File) {
    setError(null);
    setParsingFile(true);
    setParseStatus("Analyzing image with OCR engine...");

    try {
      let text = "";
      try {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");
        setParseStatus("Recognizing text from image...");
        const ret = await worker.recognize(file);
        await worker.terminate();
        text = ret.data.text.trim();
      } catch (ocrClientErr: any) {
        console.warn("Client OCR failed, trying server OCR fallback:", ocrClientErr);
        setParseStatus("Recognizing text via server OCR engine...");
        try {
          text = await parseFileViaServer(file);
        } catch (serverOcrErr: any) {
          console.error("Server OCR failed:", serverOcrErr);
          throw new Error("Could not extract readable text from this image. Please provide a clear screenshot or paste text directly.");
        }
      }

      if (!text || text.length < 20) {
        throw new Error("Could not detect sufficient text in image. Please provide a clear screenshot or paste text directly.");
      }

      setJdText(text);
      setParseStatus("Analyzing job description extracted from image...");
      await handleAnalyze(text, company);
    } catch (err: any) {
      setError(err.message || "Failed to process image. Try pasting the text directly.");
    } finally {
      setParsingFile(false);
      setParseStatus("");
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  }

  // Universal file dispatcher (handles any file type dropped or selected)
  function handleAnyFile(file: File) {
    const name = file.name.toLowerCase();
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|gif)$/i.test(name);
    if (isImage) {
      processImage(file);
    } else {
      processDocument(file);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleAnyFile(file);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleAnyFile(file);
  }

  // Toggle item completion
  async function toggleItem(itemId: string) {
    if (!result) return;
    const updated = result.items.map(it => it.id === itemId ? { ...it, completed: !it.completed } : it);
    setResult({ ...result, items: updated });

    // If currently viewing a saved checklist, persist to DB in background
    if (activeChecklistId) {
      try {
        await api(`/jd/${activeChecklistId}`, "PUT", { items: updated });
        // Update local saved list
        setSavedChecklists(prev => prev.map(s => s.id === activeChecklistId ? { ...s, items: updated } : s));
      } catch (e) {
        console.error("Background sync failed:", e);
      }
    }
  }

  // Save checklist to database
  async function handleSave(openTab = false) {
    if (!result) return;
    setIsSaving(true);
    try {
      let targetId = activeChecklistId;
      if (activeChecklistId) {
        await api(`/jd/${activeChecklistId}`, "PUT", {
          title: result.title,
          company: result.company,
          items: result.items
        });
      } else {
        const res = await api<{ ok: boolean; id: number }>("/jd", "POST", {
          title: result.title,
          company: result.company,
          raw_text: jdText,
          role_detected: result.role_detected,
          match_score: result.match_score,
          skills: result.skills,
          items: result.items
        });
        targetId = res.id;
        setActiveChecklistId(res.id);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadSaved();
      if (openTab && targetId) {
        navigate(`/checklists?id=${targetId}`);
      }
    } catch (e: any) {
      setError(e.message || "Failed to save checklist.");
    } finally {
      setIsSaving(false);
    }
  }

  // Load a previously saved checklist
  function openSaved(saved: SavedJD) {
    setResult({
      title: saved.title,
      company: saved.company,
      role_detected: saved.role_detected,
      seniority: "Saved Role",
      match_score: saved.match_score,
      skills: saved.skills,
      items: saved.items
    });
    setJdText(saved.raw_text);
    setCompany(saved.company);
    setActiveChecklistId(saved.id);
  }

  // Delete saved checklist
  async function handleDeleteSaved(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("Delete this saved checklist?")) return;
    try {
      await api(`/jd/${id}`, "DELETE");
      setSavedChecklists(prev => prev.filter(s => s.id !== id));
      if (activeChecklistId === id) {
        setActiveChecklistId(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete checklist.");
    }
  }

  // Export checklist as Markdown
  function exportMarkdown() {
    if (!result) return;
    let md = `# Job Preparation Checklist: ${result.title}\n`;
    if (result.company) md += `**Company:** ${result.company}\n`;
    md += `**Role:** ${result.role_detected} | **Match Score:** ${result.match_score}%\n\n`;
    md += `## Detected Core Skills\n${result.skills.map(s => `- ${s}`).join("\n")}\n\n`;
    md += `## Study Checklist\n`;
    result.items.forEach(it => {
      const check = it.completed ? "[x]" : "[ ]";
      md += `- ${check} **[${it.priority}]** ${it.topic} (${it.subject_title}, Page ${it.page})\n  *Why:* ${it.why}\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title.replace(/[^a-zA-Z0-9]/g, "_")}_Checklist.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Filter checklist items
  const filteredItems = (result?.items || []).filter(it => {
    if (priorityFilter !== "All" && it.priority !== priorityFilter) return false;
    if (statusFilter === "Completed" && !it.completed) return false;
    if (statusFilter === "Pending" && it.completed) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        it.topic.toLowerCase().includes(q) ||
        it.subject_title.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const completedCount = (result?.items || []).filter(it => it.completed).length;
  const totalCount = result?.items.length || 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="jd-analyzer-container">
      {/* Header */}
      <div className="jd-header">
        <div className="jd-title-group">
          <h1>Job Description (JD) Skill Analyzer</h1>
          <p className="subtext">
            Upload or paste any tech job description (PDF, DOCX, TXT, Image, or plain text).
            Our precision curriculum engine detects required competencies and generates an interactive, prioritized study checklist mapped to exact notebook pages.
          </p>
        </div>
        {savedChecklists.length > 0 && (
          <div className="jd-saved-counter">
            <span className="badge-pill">{savedChecklists.length} Saved JD Checklists</span>
          </div>
        )}
      </div>

      {/* Main Grid: Input / Saved drawer on left/top, results on right/main */}
      <div className="jd-layout">
        {/* Left Column: Input Form & Saved Lists */}
        <div className="jd-input-card">
          <div className="jd-mode-tabs">
            <button
              type="button"
              className={`mode-btn ${inputMode === "text" ? "active" : ""}`}
              onClick={() => setInputMode("text")}
            >
              Paste / Type Text
            </button>
            <button
              type="button"
              className={`mode-btn ${inputMode === "file" ? "active" : ""}`}
              onClick={() => setInputMode("file")}
            >
              Upload Document (PDF / DOCX)
            </button>
            <button
              type="button"
              className={`mode-btn ${inputMode === "image" ? "active" : ""}`}
              onClick={() => setInputMode("image")}
            >
              Upload Image / Screenshot
            </button>
          </div>

          <div className="jd-form-body">
            <div className="jd-field">
              <label htmlFor="company-name">Target Company (Optional):</label>
              <input
                id="company-name"
                type="text"
                className="input-text"
                placeholder="e.g. Google, Stripe, Meta, Amazon"
                value={company}
                onChange={e => setCompany(e.target.value)}
              />
            </div>

            {inputMode === "text" && (
              <div className="jd-field">
                <label htmlFor="jd-textarea">Job Description Text:</label>
                <textarea
                  id="jd-textarea"
                  className="input-textarea"
                  rows={8}
                  placeholder="Paste the full job description or requirements here..."
                  value={jdText}
                  onChange={e => setJdText(e.target.value)}
                />
              </div>
            )}

            {inputMode === "file" && (
              <div
                className={`jd-upload-dropzone ${isDragging ? "dragging" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleAnyFile(file);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md,image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
                <div className="dropzone-inner">
                  <div className="dropzone-icon">DOC</div>
                  <p className="dropzone-text">Click or drag & drop a PDF, DOCX, or TXT file</p>
                  <span className="dropzone-hint">Client-side zero-latency text extraction</span>
                </div>
              </div>
            )}

            {inputMode === "image" && (
              <div
                className={`jd-upload-dropzone ${isDragging ? "dragging" : ""}`}
                onClick={() => imgInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleAnyFile(file);
                }}
              >
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.pdf,.docx,.doc,.txt,.md"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                <div className="dropzone-inner">
                  <div className="dropzone-icon">IMG</div>
                  <p className="dropzone-text">Click or drag & drop a job posting screenshot</p>
                  <span className="dropzone-hint">Automatic Optical Character Recognition (OCR)</span>
                </div>
              </div>
            )}

            {parsingFile && (
              <div className="jd-status-box">
                <div className="spinner-inline" />
                <span>{parseStatus}</span>
              </div>
            )}

            {error && <div className="jd-error-box">{error}</div>}

            <div className="jd-action-bar">
              <button
                type="button"
                className="btn-primary"
                disabled={isAnalyzing || parsingFile || !jdText.trim()}
                onClick={() => handleAnalyze()}
              >
                {isAnalyzing ? "Analyzing Job Requirements..." : "Analyze & Generate Checklist"}
              </button>
            </div>

            {/* Quick Demo Samples */}
            <div className="jd-samples-section">
              <div className="samples-label">Or try a sample job description:</div>
              <div className="samples-pills">
                {SAMPLE_JDS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="sample-pill"
                    onClick={() => loadSample(s)}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Saved Checklists List */}
          {savedChecklists.length > 0 && (
            <div className="jd-saved-box">
              <h3>Saved Job Checklists ({savedChecklists.length})</h3>
              <div className="saved-list">
                {savedChecklists.map(s => {
                  const done = s.items.filter(i => i.completed).length;
                  const total = s.items.length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  const isActive = activeChecklistId === s.id;

                  return (
                    <div
                      key={s.id}
                      className={`saved-item ${isActive ? "active" : ""}`}
                      onClick={() => openSaved(s)}
                    >
                      <div className="saved-meta">
                        <div className="saved-title">{s.title}</div>
                        <div className="saved-sub">
                          {s.company ? `${s.company} • ` : ""}{s.role_detected} • {done}/{total} done ({pct}%)
                        </div>
                      </div>
                      <div className="saved-item-actions" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <Link
                          to={`/checklists?id=${s.id}`}
                          className="reader-link-btn"
                          style={{ fontSize: "11px", padding: "3px 8px" }}
                          onClick={e => e.stopPropagation()}
                        >
                          Tab ↗
                        </Link>
                        <button
                          type="button"
                          className="btn-del"
                          title="Delete checklist"
                          onClick={e => handleDeleteSaved(s.id, e)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Analysis Results & Interactive Checklist */}
        <div className="jd-results-panel">
          {!result && !isAnalyzing && (
            <div className="jd-empty-state">
              <div className="empty-box">
                <h2>No Job Description Analyzed Yet</h2>
                <p>
                  Paste job text, upload a resume/JD document, or select one of the sample engineering roles to generate a customized, prioritized preparation checklist mapped to our 41 curriculum notebooks.
                </p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="jd-empty-state">
              <div className="empty-box">
                <div className="spinner-large" />
                <h2>Analyzing Job Description...</h2>
                <p>Parsing requirements, identifying technology stacks, and matching topics against 41 master editions.</p>
              </div>
            </div>
          )}

          {result && !isAnalyzing && (
            <div className="jd-results-content">
              {/* Role Header Banner */}
              <div className="jd-role-banner">
                <div className="role-main">
                  <div className="role-badges">
                    <span className="badge-role">{result.role_detected}</span>
                    <span className="badge-seniority">{result.seniority}</span>
                    {result.company && <span className="badge-company">{result.company}</span>}
                  </div>
                  <h2>{result.title}</h2>
                </div>

                <div className="match-score-badge">
                  <div className="score-number">{result.match_score}%</div>
                  <div className="score-label">Curriculum Match</div>
                </div>
              </div>

              {/* Detected Skills Chips */}
              <div className="jd-skills-section">
                <div className="skills-heading">Detected Core Technologies & Competencies:</div>
                <div className="skills-chips">
                  {result.skills.map((sk, idx) => (
                    <span key={idx} className="skill-chip">{sk}</span>
                  ))}
                </div>
              </div>

              {/* Key Technical Pillars & Strategy */}
              {result.key_focus_areas && result.key_focus_areas.length > 0 && (
                <div className="jd-strategy-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>Core Technical Interview Pillars:</div>
                    {result.estimated_prep_hours && (
                      <span className="badge-pill" style={{ background: "#eff6ff", color: "#1d4ed8", fontWeight: "700" }}>
                        Est. Preparation: ~{result.estimated_prep_hours} Hours
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {result.key_focus_areas.map((pillar, i) => (
                      <span key={i} style={{ fontSize: "12px", background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", padding: "3px 10px", borderRadius: "6px", fontWeight: "600" }}>
                        {pillar}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress & Persistence Control Bar */}
              <div className="jd-controls-bar">
                <div className="progress-group">
                  <div className="progress-label">
                    <span>Preparation Progress:</span>
                    <strong>{completedCount} of {totalCount} topics mastered ({progressPct}%)</strong>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <div className="btn-group">
                  <button
                    type="button"
                    className="btn-save"
                    disabled={isSaving}
                    onClick={() => handleSave(false)}
                  >
                    {isSaving ? "Saving..." : saveSuccess ? "Saved to Profile!" : activeChecklistId ? "Sync to Cloud" : "Save Checklist"}
                  </button>
                  <button
                    type="button"
                    className="btn-save"
                    style={{ background: "#2563eb" }}
                    disabled={isSaving}
                    onClick={() => handleSave(true)}
                  >
                    Save & Open in Tab ↗
                  </button>
                  {activeChecklistId && (
                    <Link
                      to={`/checklists?id=${activeChecklistId}`}
                      className="btn-secondary"
                      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                    >
                      View in Checklists Tab -&gt;
                    </Link>
                  )}
                  <button type="button" className="btn-secondary" onClick={exportMarkdown}>
                    Export Markdown
                  </button>
                </div>
              </div>

              {/* Checklist Filters */}
              <div className="checklist-filter-bar">
                <div className="filter-tabs">
                  <span className="filter-label">Priority:</span>
                  {(["All", "High", "Medium", "Low"] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`filter-tab ${priorityFilter === p ? "active" : ""}`}
                      onClick={() => setPriorityFilter(p)}
                    >
                      {p === "All" ? "All Priorities" : `${p} Priority`}
                    </button>
                  ))}
                </div>

                <div className="filter-right">
                  <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending Only</option>
                    <option value="Completed">Completed Only</option>
                  </select>

                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search topics..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Checklist Items List */}
              <div className="checklist-items-list">
                {filteredItems.length === 0 ? (
                  <div className="no-items">No checklist items match the current filters.</div>
                ) : (
                  filteredItems.map(item => (
                    <div
                      key={item.id}
                      className={`checklist-item-card ${item.completed ? "is-completed" : ""}`}
                    >
                      <div className="item-checkbox-col">
                        <input
                          type="checkbox"
                          id={item.id}
                          checked={item.completed}
                          onChange={() => toggleItem(item.id)}
                        />
                      </div>

                      <div className="item-content-col">
                        <div className="item-top-row">
                          <label htmlFor={item.id} className="item-title">
                            {item.topic}
                          </label>
                          <div className="item-pills">
                            <span className={`priority-pill priority-${item.priority.toLowerCase()}`}>
                              {item.priority}
                            </span>
                            <span className="category-pill">{item.category}</span>
                          </div>
                        </div>

                        <div className="item-why">{item.why}</div>

                        <div className="item-bottom-row">
                          <span className="source-info">
                            Source: <strong>{item.subject_title}</strong> (Page {item.master_page || item.page || 1})
                            {item.duration ? ` · ${item.duration}` : ""}
                          </span>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                            <Link
                              to={`/library?doc=${encodeURIComponent(item.subject_slug)}&page=${item.master_page || item.page || 1}`}
                              className="reader-link-btn"
                            >
                              Notes · p.{item.master_page || item.page || 1}
                            </Link>
                            {item.tufUrl && (
                              <a
                                href={item.tufUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="reader-link-btn"
                                style={{ background: "#ecfdf5", color: "#065f46" }}
                              >
                                TUF Practice ↗
                              </a>
                            )}
                            {item.leetcodeUrl && (
                              <a
                                href={item.leetcodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="reader-link-btn"
                                style={{ background: "#fffbeb", color: "#92400e" }}
                              >
                                LeetCode ↗
                              </a>
                            )}
                            {item.youtubeUrl && (
                              <a
                                href={item.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="reader-link-btn"
                                style={{ background: "#fef2f2", color: "#991b1b" }}
                              >
                                Video ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
