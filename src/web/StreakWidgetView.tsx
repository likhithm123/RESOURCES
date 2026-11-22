import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

type WidgetPayload = {
  ok: boolean;
  user_name: string;
  streak: number;
  longest: number;
  today_done: boolean;
  topics_done_today: number;
  status: "active" | "at_risk" | "broken";
  week: { name: string; date: string; done: boolean; isToday: boolean }[];
  message: string;
  error?: string;
};

export default function StreakWidgetView() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const [data, setData] = useState<WidgetPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const fetchWidget = async () => {
    try {
      const url = token ? `/api/widget/streak?token=${encodeURIComponent(token)}` : "/api/widget/streak";
      const res = await fetch(url, { headers: { "X-Requested-With": "portal" } });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load streak");
      setData(json);
      setError("");

      // Update app badge if available
      if ("setAppBadge" in navigator) {
        try {
          if (json.streak > 0) (navigator as any).setAppBadge(json.streak);
          else (navigator as any).clearAppBadge();
        } catch {}
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidget();
    // Auto-refresh every 60 seconds to stay synchronized with daily midnight resets
    const timer = setInterval(fetchWidget, 60000);
    return () => clearInterval(timer);
  }, [token]);

  const handleQuickDone = async () => {
    setActionBusy(true);
    try {
      const res = await fetch("/api/widget/quick-done", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "portal" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update");
      await fetchWidget();
    } catch (e: any) {
      alert(e.message || "Could not log study");
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="android-widget-container loading">
        <div className="widget-spinner" />
        <div className="small muted">Syncing streak...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="android-widget-container error">
        <div style={{ fontSize: 24 }}>⚡</div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Streak Widget</div>
        <div className="small muted" style={{ marginTop: 4 }}>
          {error || "Please log in on website to connect widget"}
        </div>
        <a href="/" className="btn sm primary" style={{ marginTop: 10 }}>
          Open Portal
        </a>
      </div>
    );
  }

  const { streak, longest, today_done, topics_done_today, status, week, user_name } = data;
  const isAtRisk = streak > 0 && !today_done;

  return (
    <div className={`android-widget-container ${today_done ? "state-done" : isAtRisk ? "state-risk" : "state-idle"}`}>
      {/* Widget Header */}
      <div className="widget-header-row">
        <div className="widget-brand">
          <span className="brand-dot" />
          <span className="brand-text">RP · {user_name}</span>
        </div>
        <div className={`widget-status-badge ${today_done ? "done" : isAtRisk ? "risk" : "idle"}`}>
          {today_done ? "DONE TODAY" : isAtRisk ? "AT RISK" : "0 / 1 TODAY"}
        </div>
      </div>

      {/* Main Flame and Streak Display */}
      <div className="widget-main-counter">
        <span className="widget-flame-icon">{streak > 0 ? "🔥" : "⚡"}</span>
        <div className="widget-count-box">
          <div className="widget-number">{streak}</div>
          <div className="widget-day-label">
            DAY STREAK {longest > 0 && <span className="widget-best">(BEST: {longest}D)</span>}
          </div>
        </div>
      </div>

      {/* 7-Day Rolling Progress Dots */}
      <div className="widget-week-row">
        {week.map((w, idx) => (
          <div key={idx} className={`widget-week-dot ${w.done ? "active" : w.isToday ? "today-target" : ""}`}>
            <span className="dot-circle">{w.done ? "✓" : ""}</span>
            <span className="dot-day">{w.name[0]}</span>
          </div>
        ))}
      </div>

      {/* Contextual Status / Action */}
      <div className="widget-action-footer">
        {today_done ? (
          <div className="widget-success-msg">
            <span>✓ {topics_done_today} topic{topics_done_today === 1 ? "" : "s"} studied today</span>
          </div>
        ) : (
          <button
            type="button"
            className="widget-quick-btn"
            onClick={handleQuickDone}
            disabled={actionBusy}
          >
            {actionBusy ? "Saving..." : "⚡ Quick Check-in (1 Topic Done)"}
          </button>
        )}
        <a href="/" className="widget-open-app" title="Open Resources Portal">
          Open App →
        </a>
      </div>
    </div>
  );
}
