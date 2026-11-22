import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  gfgUrl?: string | null;
  youtubeUrl?: string | null;
  duration?: string | null;
  completed: boolean;
};

export type SavedChecklist = {
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

export default function Checklists() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlId = searchParams.get("id");

  const [checklists, setChecklists] = useState<SavedChecklist[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>("Synced with cloud");

  // Inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");

  // Filters & search
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<"All" | "Pending" | "Completed">("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Add Custom Checklist Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("SDE / Software Engineer");
  const [isCreating, setIsCreating] = useState(false);

  // Add Item to active checklist Modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemTopic, setItemTopic] = useState("");
  const [itemCategory, setItemCategory] = useState("Problem Solving & DSA");
  const [itemPriority, setItemPriority] = useState<"High" | "Medium" | "Low">("High");
  const [itemWhy, setItemWhy] = useState("");

  useEffect(() => {
    loadChecklists();
  }, []);

  async function loadChecklists() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api<{ checklists: SavedChecklist[] }>("/jd");
      const list = data.checklists || [];
      setChecklists(list);

      // Select active checklist from URL or first in list
      if (list.length > 0) {
        if (urlId) {
          const match = list.find(c => c.id === Number(urlId));
          if (match) setActiveId(match.id);
          else setActiveId(list[0].id);
        } else {
          setActiveId(list[0].id);
        }
      } else {
        setActiveId(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load checklists from database.");
    } finally {
      setIsLoading(false);
    }
  }

  // Active checklist object
  const activeChecklist = useMemo(() => {
    return checklists.find(c => c.id === activeId) || null;
  }, [checklists, activeId]);

  // When active checklist changes, update edit title state
  useEffect(() => {
    if (activeChecklist) {
      setEditTitleValue(activeChecklist.title);
      setIsEditingTitle(false);
      setSearchParams({ id: String(activeChecklist.id) });
    }
  }, [activeChecklist?.id]);

  // Handle switching tabs
  function handleSelectTab(id: number) {
    setActiveId(id);
    setSearchParams({ id: String(id) });
  }

  // Toggle item completion and update DB
  async function handleToggleItem(itemId: string) {
    if (!activeChecklist) return;

    const updatedItems = activeChecklist.items.map(it =>
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );

    // Optimistic UI update
    setChecklists(prev =>
      prev.map(c => (c.id === activeChecklist.id ? { ...c, items: updatedItems } : c))
    );
    setSyncStatus("Saving progress...");

    try {
      await api(`/jd/${activeChecklist.id}`, "PUT", { items: updatedItems });
      setSyncStatus("Progress saved to cloud");
      setTimeout(() => setSyncStatus("Synced with cloud"), 2000);
    } catch (err: any) {
      setSyncStatus("Failed to sync progress");
      setError(err.message || "Failed to save checklist progress to database.");
    }
  }

  // Rename checklist title
  async function handleSaveTitle() {
    if (!activeChecklist || !editTitleValue.trim()) {
      setIsEditingTitle(false);
      return;
    }

    const trimmed = editTitleValue.trim();
    setChecklists(prev =>
      prev.map(c => (c.id === activeChecklist.id ? { ...c, title: trimmed } : c))
    );
    setIsEditingTitle(false);
    setSyncStatus("Updating title...");

    try {
      await api(`/jd/${activeChecklist.id}`, "PUT", { title: trimmed });
      setSyncStatus("Title updated");
      setTimeout(() => setSyncStatus("Synced with cloud"), 2000);
    } catch (err: any) {
      setSyncStatus("Failed to update title");
      setError(err.message || "Failed to update checklist title.");
    }
  }

  // Delete checklist
  async function handleDeleteChecklist(id: number, title: string) {
    const confirmed = window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api(`/jd/${id}`, "DELETE");
      const remaining = checklists.filter(c => c.id !== id);
      setChecklists(remaining);
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
        setSearchParams({ id: String(remaining[0].id) });
      } else {
        setActiveId(null);
        setSearchParams({});
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete checklist.");
    }
  }

  // Add custom checklist
  async function handleCreateChecklist(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      const res = await api<{ ok: boolean; id: number }>("/jd", "POST", {
        title: newTitle.trim(),
        company: newCompany.trim(),
        raw_text: `Custom checklist for ${newTitle.trim()}`,
        role_detected: newRole,
        match_score: 90,
        skills: ["Problem Solving & Data Structures (DSA)", "Technical Interview Foundations"],
        items: [
          {
            id: "item_custom_1",
            topic: "Complexity Analysis (Big-O)",
            subject_slug: "10-dsa-basics-data-structures",
            subject_title: "DSA Basics: Data Structures",
            page: 1,
            master_page: 1,
            priority: "High",
            category: "Problem Solving & DSA",
            why: "Foundational complexity analysis required for all coding rounds.",
            completed: false
          },
          {
            id: "item_custom_2",
            topic: "Two Sum",
            subject_slug: "11-dsa-a2z-solutions",
            subject_title: "DSA A2Z Sheet Solutions",
            page: 54,
            master_page: 54,
            priority: "High",
            category: "Problem Solving & DSA",
            why: "Essential hash map problem pattern.",
            tufUrl: "https://takeuforward.org/practice/dsa/two-sum",
            leetcodeUrl: "https://leetcode.com/problems/two-sum/",
            youtubeUrl: "https://youtu.be/UXDSeD9mN-k",
            completed: false
          }
        ]
      });

      setShowAddModal(false);
      setNewTitle("");
      setNewCompany("");
      await loadChecklists();
      if (res.id) {
        setActiveId(res.id);
        setSearchParams({ id: String(res.id) });
      }
    } catch (err: any) {
      setError(err.message || "Failed to create new checklist.");
    } finally {
      setIsCreating(false);
    }
  }

  // Add custom item to active checklist
  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChecklist || !itemTopic.trim()) return;

    const newItem: ChecklistItem = {
      id: `item_manual_${Date.now()}`,
      topic: itemTopic.trim(),
      subject_slug: "11-dsa-a2z-solutions",
      subject_title: "Custom Study Item",
      page: 1,
      master_page: 1,
      priority: itemPriority,
      category: itemCategory,
      why: itemWhy.trim() || "User added topic for targeted preparation.",
      completed: false
    };

    const updatedItems = [...activeChecklist.items, newItem];
    setChecklists(prev =>
      prev.map(c => (c.id === activeChecklist.id ? { ...c, items: updatedItems } : c))
    );

    setShowAddItemModal(false);
    setItemTopic("");
    setItemWhy("");

    try {
      await api(`/jd/${activeChecklist.id}`, "PUT", { items: updatedItems });
      setSyncStatus("New item saved to cloud");
      setTimeout(() => setSyncStatus("Synced with cloud"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to add item to checklist.");
    }
  }

  // Delete single item from active checklist
  async function handleDeleteItem(itemId: string) {
    if (!activeChecklist) return;
    const updatedItems = activeChecklist.items.filter(it => it.id !== itemId);
    setChecklists(prev =>
      prev.map(c => (c.id === activeChecklist.id ? { ...c, items: updatedItems } : c))
    );

    try {
      await api(`/jd/${activeChecklist.id}`, "PUT", { items: updatedItems });
      setSyncStatus("Item removed");
      setTimeout(() => setSyncStatus("Synced with cloud"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to remove item.");
    }
  }

  // Export checklist to Markdown
  function handleExportMarkdown() {
    if (!activeChecklist) return;
    let md = `# Study Checklist: ${activeChecklist.title}\n`;
    if (activeChecklist.company) md += `**Company:** ${activeChecklist.company}\n`;
    md += `**Target Role:** ${activeChecklist.role_detected}\n`;
    md += `**Match Score:** ${activeChecklist.match_score}%\n\n`;
    md += `## Checklist Topics\n\n`;

    activeChecklist.items.forEach(it => {
      const check = it.completed ? "[x]" : "[ ]";
      md += `- ${check} **${it.topic}** [${it.priority} Priority - ${it.category}]\n`;
      md += `  - Resource: ${it.subject_title} (Page ${it.page})\n`;
      if (it.why) md += `  - Note: ${it.why}\n`;
      if (it.tufUrl) md += `  - Practice: ${it.tufUrl}\n`;
      if (it.leetcodeUrl) md += `  - LeetCode: ${it.leetcodeUrl}\n`;
      if (it.gfgUrl) md += `  - GFG: ${it.gfgUrl}\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeChecklist.title.replace(/[^a-zA-Z0-9]/g, "_")}_Checklist.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Unique categories for active checklist
  const categories = useMemo(() => {
    if (!activeChecklist) return [];
    const set = new Set<string>();
    activeChecklist.items.forEach(it => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [activeChecklist]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!activeChecklist) return [];
    return activeChecklist.items.filter(it => {
      if (selectedCategory !== "All" && it.category !== selectedCategory) return false;
      if (selectedStatus === "Completed" && !it.completed) return false;
      if (selectedStatus === "Pending" && it.completed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTopic = it.topic.toLowerCase().includes(q);
        const matchSubject = it.subject_title.toLowerCase().includes(q);
        const matchWhy = it.why.toLowerCase().includes(q);
        if (!matchTopic && !matchSubject && !matchWhy) return false;
      }
      return true;
    });
  }, [activeChecklist, selectedCategory, selectedStatus, searchQuery]);

  // Stats for active checklist
  const totalCount = activeChecklist?.items.length || 0;
  const completedCount = activeChecklist?.items.filter(i => i.completed).length || 0;
  const percentCompleted = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="checklists-container">
      {/* Top Header */}
      <div className="checklists-header">
        <div className="checklists-title-group">
          <h1>My Preparation Checklists</h1>
          <p className="subtext">
            Track and master interview competencies customized from Job Descriptions and curriculum roadmaps.
          </p>
        </div>
        <div className="checklists-header-actions">
          <Link to="/jd" className="btn-secondary">
            + Generate from JD Analyzer
          </Link>
          <button className="btn-save" onClick={() => setShowAddModal(true)}>
            + New Checklist
          </button>
        </div>
      </div>

      {error && (
        <div className="jd-error-box" style={{ margin: "16px 0" }}>
          <span>{error}</span>
          <button className="sm" style={{ marginLeft: "10px" }} onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Horizontal Tabs: Each checklist has its own tab with its checklist name */}
      {checklists.length > 0 && (
        <div className="checklists-tab-bar">
          <div className="checklists-tabs-scroll">
            {checklists.map(c => {
              const cTotal = c.items.length;
              const cDone = c.items.filter(i => i.completed).length;
              const cPct = cTotal > 0 ? Math.round((cDone / cTotal) * 100) : 0;
              const isActive = c.id === activeId;

              return (
                <div
                  key={c.id}
                  className={`checklist-tab-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectTab(c.id)}
                >
                  <span className="tab-title-text" title={c.title}>
                    {c.title}
                  </span>
                  <span className={`tab-pct-badge ${cPct === 100 ? "complete" : ""}`}>
                    {cPct}%
                  </span>
                  <button
                    className="tab-delete-btn"
                    title={`Delete "${c.title}"`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChecklist(c.id, c.title);
                    }}
                  >
                    x
                  </button>
                </div>
              );
            })}
            <button
              className="checklists-add-tab-btn"
              onClick={() => setShowAddModal(true)}
              title="Create a new checklist tab"
            >
              + New Tab
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="checklists-empty-state">
          <p>Loading your saved checklists from database...</p>
        </div>
      ) : checklists.length === 0 ? (
        <div className="checklists-empty-state">
          <div className="empty-icon-text">[ ]</div>
          <h2>No Saved Checklists Yet</h2>
          <p>
            You can generate a precision curriculum checklist from any Job Description in the JD Prep tab,
            or create a customized study checklist from scratch.
          </p>
          <div className="empty-actions">
            <Link to="/jd" className="btn-save">
              Open JD Analyzer
            </Link>
            <button className="btn-secondary" onClick={() => setShowAddModal(true)}>
              Create Custom Checklist
            </button>
          </div>
        </div>
      ) : activeChecklist ? (
        <div className="checklist-detail-view">
          {/* Active Checklist Info Card */}
          <div className="checklist-info-card">
            <div className="info-top-row">
              <div className="title-edit-area">
                {isEditingTitle ? (
                  <div className="title-edit-form">
                    <input
                      type="text"
                      className="edit-title-input"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle();
                        if (e.key === "Escape") setIsEditingTitle(false);
                      }}
                      autoFocus
                    />
                    <button className="btn-save sm" onClick={handleSaveTitle}>
                      Save
                    </button>
                    <button className="btn-secondary sm" onClick={() => setIsEditingTitle(false)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="title-display">
                    <h2>{activeChecklist.title}</h2>
                    <button
                      className="btn-edit-title"
                      title="Rename checklist"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      Rename
                    </button>
                  </div>
                )}
                <div className="meta-tags-row">
                  {activeChecklist.company && (
                    <span className="meta-tag company-tag">{activeChecklist.company}</span>
                  )}
                  <span className="meta-tag role-tag">{activeChecklist.role_detected}</span>
                  <span className="meta-tag match-tag">{activeChecklist.match_score}% Curriculum Alignment</span>
                  <span className="meta-tag sync-tag">{syncStatus}</span>
                </div>
              </div>

              <div className="info-action-buttons">
                <button
                  className="btn-secondary sm"
                  onClick={() => setShowAddItemModal(true)}
                >
                  + Add Topic
                </button>
                <button
                  className="btn-secondary sm"
                  onClick={handleExportMarkdown}
                >
                  Export Markdown
                </button>
                <button
                  className="btn-delete-checklist sm"
                  onClick={() => handleDeleteChecklist(activeChecklist.id, activeChecklist.title)}
                >
                  Delete Checklist
                </button>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="checklist-progress-bar-container">
              <div className="progress-header-labels">
                <span className="progress-stat-text">
                  Overall Mastery: <strong>{completedCount}</strong> of <strong>{totalCount}</strong> topics completed
                </span>
                <span className="progress-percentage-text">{percentCompleted}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${percentCompleted}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="checklist-filter-bar">
            <div className="filter-tabs">
              <span className="filter-label">Category:</span>
              <button
                className={`filter-tab ${selectedCategory === "All" ? "active" : ""}`}
                onClick={() => setSelectedCategory("All")}
              >
                All ({activeChecklist.items.length})
              </button>
              {categories.map(cat => {
                const count = activeChecklist.items.filter(i => i.category === cat).length;
                return (
                  <button
                    key={cat}
                    className={`filter-tab ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <div className="filter-right">
              <select
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
              >
                <option value="All">All Status ({totalCount})</option>
                <option value="Pending">Pending ({totalCount - completedCount})</option>
                <option value="Completed">Completed ({completedCount})</option>
              </select>

              <input
                type="text"
                className="search-input"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Checklist Items List */}
          <div className="checklist-items-list">
            {filteredItems.length === 0 ? (
              <div className="no-items">
                No checklist topics match your selected category or search filters.
              </div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`checklist-item-card ${item.completed ? "is-completed" : ""}`}
                >
                  <div className="item-checkbox-col">
                    <input
                      type="checkbox"
                      id={`chk_${item.id}`}
                      checked={item.completed}
                      onChange={() => handleToggleItem(item.id)}
                    />
                  </div>

                  <div className="item-content-col">
                    <div className="item-top-row">
                      <label htmlFor={`chk_${item.id}`} className="item-title">
                        {item.topic}
                      </label>
                      <div className="item-pills">
                        <span className={`priority-pill priority-${item.priority.toLowerCase()}`}>
                          {item.priority} Priority
                        </span>
                        <span className="category-pill">{item.category}</span>
                      </div>
                    </div>

                    {item.why && (
                      <div className="item-why">
                        {item.why}
                      </div>
                    )}

                    <div className="item-bottom-row">
                      <div className="source-info">
                        Resource: <strong>{item.subject_title}</strong>
                        {item.master_page ? ` · Page ${item.master_page}` : item.page ? ` · Page ${item.page}` : ""}
                        {item.duration ? ` · ${item.duration}` : ""}
                      </div>

                      <div className="item-actions-group">
                        {item.subject_slug && (
                          <Link
                            to={`/library?doc=${encodeURIComponent(item.subject_slug)}&page=${item.master_page || item.page || 1}`}
                            className="reader-link-btn"
                          >
                            Notes · p.{item.master_page || item.page || 1}
                          </Link>
                        )}
                        {item.tufUrl && (
                          <a
                            href={item.tufUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="reader-link-btn tuf-link"
                          >
                            TUF Practice ↗
                          </a>
                        )}
                        {item.leetcodeUrl && (
                          <a
                            href={item.leetcodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="reader-link-btn leetcode-link"
                          >
                            LeetCode ↗
                          </a>
                        )}
                        {item.gfgUrl && (
                          <a
                            href={item.gfgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="reader-link-btn gfg-link"
                            style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }}
                          >
                            GFG ↗
                          </a>
                        )}
                        {item.youtubeUrl && (
                          <a
                            href={item.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="reader-link-btn youtube-link"
                          >
                            Video ↗
                          </a>
                        )}
                        <button
                          className="item-remove-btn"
                          title="Remove topic from checklist"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          x
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* Modal: Create New Checklist */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Checklist Tab</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>x</button>
            </div>
            <form onSubmit={handleCreateChecklist} className="modal-body">
              <div className="form-field">
                <label>Checklist Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Google SDE Prep / Amazon OA / Sprint 1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label>Target Company (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Google, Amazon, Microsoft, Gartner"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Target Engineering Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="SDE / Software Engineer">SDE / Software Engineer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="AI Engineer (GenAI / LLMs)">AI Engineer (GenAI / LLMs)</option>
                  <option value="ML Engineer">ML Engineer</option>
                  <option value="Data Scientist / Data Analyst">Data Scientist / Data Analyst</option>
                  <option value="DevOps / Cloud Engineer">DevOps / Cloud Engineer</option>
                  <option value="Cyber Security Engineer">Cyber Security Engineer</option>
                  <option value="Salesforce Developer">Salesforce Developer</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={isCreating || !newTitle.trim()}
                >
                  {isCreating ? "Creating..." : "Create Checklist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Topic */}
      {showAddItemModal && (
        <div className="modal-backdrop" onClick={() => setShowAddItemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Topic to Checklist</h3>
              <button className="modal-close" onClick={() => setShowAddItemModal(false)}>x</button>
            </div>
            <form onSubmit={handleAddItem} className="modal-body">
              <div className="form-field">
                <label>Topic / Problem Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Binary Search in Rotated Sorted Array"
                  value={itemTopic}
                  onChange={(e) => setItemTopic(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                  >
                    <option value="Problem Solving & DSA">Problem Solving & DSA</option>
                    <option value="Backend Engineering">Backend Engineering</option>
                    <option value="Frontend & Full Stack">Frontend & Full Stack</option>
                    <option value="System Design & Architecture">System Design & Architecture</option>
                    <option value="Databases & Storage">Databases & Storage</option>
                    <option value="DevOps & Cloud">DevOps & Cloud</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Interview Strategy">Interview Strategy</option>
                  </select>
                </div>

                <div className="form-field" style={{ width: "130px" }}>
                  <label>Priority</label>
                  <select
                    value={itemPriority}
                    onChange={(e) => setItemPriority(e.target.value as any)}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Why this topic is needed (Optional)</label>
                <textarea
                  placeholder="Reason for study (e.g. Frequently asked in technical round 1)"
                  value={itemWhy}
                  onChange={(e) => setItemWhy(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddItemModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={!itemTopic.trim()}
                >
                  Add to Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
