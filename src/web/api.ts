// Tiny fetch wrapper. Every state-changing request carries the custom header the API requires (CSRF guard).
export async function api<T = any>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch("/api" + path, {
    method, credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Requested-With": "portal" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}
export type User = { id: number; name: string; email: string; role: "student" | "admin"; career_roles: string[]; plan: string[] };
export type Doc = { id: number; slug: string; title: string; description: string; career_roles: string[]; pages: number; sort_order: number; published: boolean };

export type StreakData = {
  current: number;
  longest: number;
  todayDone: boolean;
  status: "active" | "at_risk" | "broken";
  days: string[];
  week: { name: string; date: string; done: boolean; isToday: boolean }[];
  message: string;
};

export type ProgressResponse = {
  done: string[];
  streak: StreakData;
  today_done: boolean;
  topics_done_today: number;
};
