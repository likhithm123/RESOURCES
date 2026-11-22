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
  widgetToken,
  onOpenModal,
}: {
  streak: StreakData | null;
  todayDone: boolean;
  topicsDoneToday: number;
  widgetToken?: string;
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
            <span>Android Phone Widget & Reminders</span>
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
  widgetToken,
  onClose,
  onRefresh,
}: {
  streak: StreakData | null;
  todayDone: boolean;
  topicsDoneToday: number;
  widgetToken?: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const current = streak?.current || 0;
  const longest = streak?.longest || 0;
  const [copied, setCopied] = useState(false);
  const [reminderTime, setReminderTime] = useState(
    localStorage.getItem("rp_streak_reminder_time") || "20:00"
  );
  const [reminderActive, setReminderActive] = useState(
    localStorage.getItem("rp_streak_reminder_enabled") === "true"
  );
  const [testingNotification, setTestingNotification] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [quickDoneBusy, setQuickDoneBusy] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const widgetUrl = `${window.location.origin}/widget?token=${widgetToken || ""}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(widgetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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

  const handleQuickMarkDone = async () => {
    setQuickDoneBusy(true);
    try {
      await api("/widget/quick-done", "POST", { token: widgetToken });
      await onRefresh();
    } catch (e: any) {
      alert(e.message || "Could not log study session");
    } finally {
      setQuickDoneBusy(false);
    }
  };

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
      }
    } else {
      alert("To install on Android: Tap the three dots menu (⋮) in Chrome and select 'Add to Home screen' or 'Install app'.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet streak-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-sheet-header">
          <div className="row" style={{ alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🔥</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Daily Study Streak & Android Widget</h2>
              <div className="small muted">Updates daily · Resets to 0 if not completed</div>
            </div>
          </div>
          <button className="btn sm" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        <div className="modal-sheet-body">
          {/* Main Streak Counter */}
          <div className="streak-modal-hero">
            <div className="streak-large-display">
              <span className="flame-icon">{current > 0 ? "🔥" : "⚡"}</span>
              <span className="count-number">{current}</span>
              <span className="day-text">Days</span>
            </div>
            <div className="streak-stats-row">
              <div className="stat-box">
                <div className="stat-num">{longest}</div>
                <div className="stat-desc">Best Streak</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{todayDone ? "Done" : "0 / 1"}</div>
                <div className="stat-desc">Today's Goal</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{streak?.days.length || 0}</div>
                <div className="stat-desc">Total Active Days</div>
              </div>
            </div>

            <div className={`streak-banner-alert ${todayDone ? "success" : current > 0 ? "warning" : "neutral"}`}>
              {todayDone ? (
                <span>Today's goal completed! You studied {topicsDoneToday} topic(s). Keep it going tomorrow!</span>
              ) : current > 0 ? (
                <span>Streak at risk! Complete at least 1 topic today to maintain your {current}-day streak.</span>
              ) : (
                <span>Complete 1 topic in the track sheet today to start your Day 1 streak!</span>
              )}
            </div>

            {!todayDone && (
              <button
                type="button"
                className="btn primary full"
                onClick={handleQuickMarkDone}
                disabled={quickDoneBusy}
                style={{ marginTop: 12 }}
              >
                {quickDoneBusy ? "Saving..." : "⚡ Quick Action: Mark 1 Topic Studied for Today"}
              </button>
            )}
          </div>

          {/* Section: Android Phone Widget & Reminders */}
          <div className="streak-section-box">
            <div className="section-title-row">
              <span className="section-icon" aria-hidden="true">⚙</span>
              <h3 style={{ margin: 0, fontSize: 16 }}>Android Phone Linked Widget & Reminders</h3>
            </div>
            <p className="small muted" style={{ marginTop: 4, marginBottom: 14 }}>
              Link your logged-in account to your Android phone home screen for live streak updates and daily study reminders.
            </p>

            {/* Feature 1: Daily Reminder Notification */}
            <div className="android-feature-card">
              <div className="feature-header">
                <div>
                  <strong>1. Daily Android Reminder Notification</strong>
                  <div className="small muted">Receive a push alert if you haven't completed your topic before midnight.</div>
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
                <div className="reminder-settings-row" style={{ marginTop: 10 }}>
                  <label className="small">Reminder Time:</label>
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
                    {testingNotification ? "Sending..." : "Test on Phone"}
                  </button>
                </div>
              )}
            </div>

            {/* Feature 2: Dedicated Home Screen Widget */}
            <div className="android-feature-card" style={{ marginTop: 12 }}>
              <div className="feature-header">
                <div>
                  <strong>2. Android Home Screen Live Widget</strong>
                  <div className="small muted">Embed a live streak widget card directly on your phone home screen.</div>
                </div>
                <Link to={`/widget?token=${widgetToken || ""}`} target="_blank" className="btn sm">
                  Preview Widget
                </Link>
              </div>

              <div className="widget-link-copy-box" style={{ marginTop: 10 }}>
                <input
                  type="text"
                  readOnly
                  value={widgetUrl}
                  className="widget-url-input"
                />
                <button
                  type="button"
                  className="btn sm primary"
                  onClick={handleCopyLink}
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              <div className="instructions-steps small muted" style={{ marginTop: 8 }}>
                <strong>How to add to Android Home Screen:</strong>
                <ol style={{ margin: "4px 0 0 16px", padding: 0 }}>
                  <li>Open the copied link in Chrome on your Android phone.</li>
                  <li>Tap the 3 dots menu (⋮) in Chrome &gt; select <strong>Add to Home screen</strong>.</li>
                  <li>Or paste the URL into any Android Widget app (such as <em>Web Widget</em> or <em>HTTP Widget</em>).</li>
                </ol>
              </div>
            </div>

            {/* Feature 3: PWA App Badging */}
            <div className="android-feature-card" style={{ marginTop: 12 }}>
              <div className="feature-header">
                <div>
                  <strong>3. App Icon Live Streak Badge</strong>
                  <div className="small muted">
                    Installing the PWA on Android displays your live streak count directly as a badge on the app icon.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn sm"
                  onClick={handleInstallApp}
                >
                  Install App
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-sheet-footer">
          <button className="btn primary full" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
