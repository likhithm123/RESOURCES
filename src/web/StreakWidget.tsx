import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, type StreakData } from "./api";

// Sync app badge on Android PWA launcher icon
export function updateAndroidAppBadge(count: number) {
  if ("setAppBadge" in navigator) {
    try {
      if (count > 0) {
        (navigator as any).setAppBadge(count);
      } else {
        (navigator as any).clearAppBadge();
      }
    } catch {}
  }
}

// Request and schedule daily Android reminder notifications
export async function scheduleAndroidReminder(timeStr: string = "20:00"): Promise<boolean> {
  if (!("Notification" in window)) {
    alert("Notifications are not supported by this browser on your device.");
    return false;
  }

  let permission = Notification.permission;
  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    alert("Notification permission was denied. Please allow notifications in your Android browser settings.");
    return false;
  }

  localStorage.setItem("rp_streak_reminder_enabled", "true");
  localStorage.setItem("rp_streak_reminder_time", timeStr);

  // Send immediate test reminder so user confirms it works on their Android phone
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SCHEDULE_REMINDER",
      title: "Resources Portal: Study Reminder Active",
      body: `Daily study reminder set for ${timeStr}. Keep your streak alive!`,
      delayMs: 1200,
      url: "/"
    });
  } else {
    try {
      new Notification("Resources Portal: Study Reminder Active", {
        body: `Daily study reminder set for ${timeStr}. Keep your streak alive!`,
        icon: "/icon-192.png",
      });
    } catch {}
  }

  return true;
}

export function StreakNavPill({
  streak,
  todayDone,
  onClick,
}: {
  streak: StreakData | null;
  todayDone: boolean;
  onClick: () => void;
}) {
  const current = streak?.current || 0;
  const isAtRisk = current > 0 && !todayDone;

  return (
    <button
      type="button"
      className={`streak-nav-pill ${todayDone ? "done" : isAtRisk ? "at-risk" : "idle"}`}
      onClick={onClick}
      title={
        todayDone
          ? `Streak: ${current} days! (Studied today)`
          : current > 0
          ? `Streak: ${current} days at risk! Complete 1 topic today to keep it.`
          : "Start a study streak today!"
      }
    >
      <span className="streak-flame" aria-hidden="true">
        {current > 0 ? "🔥" : "⚡"}
      </span>
      <span className="streak-count">{current}</span>
      {isAtRisk && <span className="streak-pulse-dot" title="Pending study today" />}
    </button>
  );
}

export function StreakDashboardCard({
  streak,
  todayDone,
  topicsDoneToday,
  onOpenModal,
}: {
  streak: StreakData | null;
  todayDone: boolean;
  topicsDoneToday: number;
  onOpenModal: () => void;
}) {
  const current = streak?.current || 0;
  const longest = streak?.longest || 0;
  const week = streak?.week || [];

  return (
    <div className={`streak-hero-card ${todayDone ? "done" : current > 0 ? "at-risk" : "idle"}`}>
      <div className="streak-hero-left">
        <div className="streak-badge-container">
          <div className="streak-flame-large">{current > 0 ? "🔥" : "⚡"}</div>
          <div className="streak-numbers">
            <div className="streak-current-number">{current}</div>
            <div className="streak-sub-label">
              Day Streak {longest > 0 && <span className="streak-best-tag">(Best: {longest}d)</span>}
            </div>
          </div>
        </div>

        <div className="streak-hero-status-message">
          {todayDone ? (
            <div className="streak-status-pill success">
              <span className="status-check">✓</span>
              <span>Today Completed ({topicsDoneToday} {topicsDoneToday === 1 ? "topic" : "topics"} studied)</span>
            </div>
          ) : current > 0 ? (
            <div className="streak-status-pill warning">
              <span className="status-warning">!</span>
              <span>Streak at Risk: Complete 1 topic before midnight to keep your streak!</span>
            </div>
          ) : (
            <div className="streak-status-pill neutral">
              <span>Study 1 topic today to start your Day 1 streak!</span>
            </div>
          )}
          <p className="streak-rule-note">
            Rule: Must study at least one topic daily. Resets to 0 if missed!
          </p>
        </div>
      </div>

      <div className="streak-hero-right">
        {/* Rolling 7-day mini tracker */}
        <div className="streak-week-circles">
          {week.map((w, idx) => (
            <div key={idx} className={`week-circle-item ${w.done ? "done" : w.isToday ? "today-pending" : ""}`}>
              <div className="week-circle-dot">
                {w.done ? "✓" : w.isToday ? "•" : ""}
              </div>
              <span className="week-circle-label">{w.name}</span>
            </div>
          ))}
        </div>

        <div className="streak-card-actions">
          <button
            type="button"
            className="btn sm primary"
            onClick={onOpenModal}
          >
            <span>Streak Details & Reminders</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function StreakModal({
  streak,
  todayDone,
  topicsDoneToday,
  onClose,
  onRefresh,
}: {
  streak: StreakData | null;
  todayDone: boolean;
  topicsDoneToday: number;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const current = streak?.current || 0;
  const longest = streak?.longest || 0;
  const [reminderTime, setReminderTime] = useState(
    localStorage.getItem("rp_streak_reminder_time") || "20:00"
  );
  const [reminderActive, setReminderActive] = useState(
    localStorage.getItem("rp_streak_reminder_enabled") === "true"
  );
  const [testingNotification, setTestingNotification] = useState(false);

  const handleToggleReminder = async () => {
    if (!reminderActive) {
      const ok = await scheduleAndroidReminder(reminderTime);
      if (ok) setReminderActive(true);
    } else {
      localStorage.setItem("rp_streak_reminder_enabled", "false");
      setReminderActive(false);
    }
  };

  const handleTestReminder = async () => {
    setTestingNotification(true);
    await scheduleAndroidReminder(reminderTime);
    setTimeout(() => setTestingNotification(false), 1500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content streak-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="row" style={{ alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }} aria-hidden="true">🔥</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Daily Study Streak</h3>
              <div className="small muted">Resets to 0 if a day is missed</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        <div className="modal-body" style={{ gap: 14 }}>
          {/* Main Streak Counter Card */}
          <div style={{
            background: todayDone ? "#f0fdf4" : (current > 0 ? "#fff7ed" : "#f8fafc"),
            border: `1px solid ${todayDone ? "#bbf7d0" : (current > 0 ? "#fed7aa" : "var(--line)")}`,
            borderRadius: 10,
            padding: "16px",
            textAlign: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 36 }} aria-hidden="true">{current > 0 ? "🔥" : "⚡"}</span>
              <span style={{ fontSize: 40, fontWeight: 800, color: current > 0 ? "#d9480f" : "var(--ink2)", lineHeight: 1 }}>
                {current}
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--muted)", alignSelf: "flex-end", marginBottom: 4 }}>
                Days
              </span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginTop: 10,
              padding: "10px",
              background: "#ffffff",
              borderRadius: 8,
              border: "1px solid var(--line)"
            }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{longest}d</div>
                <div className="small muted">Best Streak</div>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: todayDone ? "#16a34a" : "#d97706" }}>
                  {todayDone ? "Done" : "0 / 1"}
                </div>
                <div className="small muted">Today's Goal</div>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{streak?.days.length || 0}</div>
                <div className="small muted">Active Days</div>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              {todayDone ? (
                <div className="streak-status-pill success" style={{ display: "inline-flex" }}>
                  ✓ Today Completed! You studied {topicsDoneToday} topic{topicsDoneToday === 1 ? "" : "s"}.
                </div>
              ) : current > 0 ? (
                <div className="streak-status-pill warning" style={{ display: "inline-flex" }}>
                  ! Streak at risk: complete 1 topic before midnight.
                </div>
              ) : (
                <div className="streak-status-pill neutral" style={{ display: "inline-flex" }}>
                  Study 1 topic today in your track sheet to start Day 1!
                </div>
              )}
            </div>
          </div>

          {/* Authentic Rule Notice */}
          <div className="small muted" style={{
            padding: "10px 14px",
            background: "#f8fafc",
            border: "1px solid var(--line)",
            borderRadius: 8,
            lineHeight: 1.5,
            textAlign: "center"
          }}>
            <strong>Authentic Study Rule:</strong> Your streak updates automatically only when you mark topics completed in your track sheet or JD checklists. There is no manual override.
          </div>

          {/* Daily Study Reminder Notification */}
          <div style={{
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "14px 16px",
            background: "#ffffff"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <strong style={{ fontSize: 14 }}>Daily Study Reminder</strong>
                <div className="small muted">Receive an alert before midnight if you haven't studied yet.</div>
              </div>
              <label className="switch-toggle" title="Toggle daily reminder">
                <input
                  type="checkbox"
                  checked={reminderActive}
                  onChange={handleToggleReminder}
                />
                <span className="slider round"></span>
              </label>
            </div>

            {reminderActive && (
              <div className="row" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", gap: 10, alignItems: "center" }}>
                <label className="small" style={{ fontWeight: 600 }}>Alert Time:</label>
                <input
                  type="time"
                  className="time-picker-input"
                  value={reminderTime}
                  onChange={e => {
                    setReminderTime(e.target.value);
                    scheduleAndroidReminder(e.target.value);
                  }}
                />
                <button
                  type="button"
                  className="btn sm"
                  onClick={handleTestReminder}
                  disabled={testingNotification}
                >
                  {testingNotification ? "Testing..." : "Test on Phone"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", background: "#f8fafc", margin: 0, justifyContent: "flex-end" }}>
          <button type="button" className="btn primary sm" onClick={onClose} style={{ minWidth: 90 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
