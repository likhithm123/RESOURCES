import React, { createContext, useContext, useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api, type User } from "./api";
import { CAREER_ROLES } from "../shared/catalog";
import Track from "./Track";
import Reader from "./Reader";
import Admin from "./Admin";
import { Library, Links, Connect, Certifications, Feedback, Legal } from "./Pages";

type AuthCtx = { user: User | null; setUser: (u: User | null) => void; refresh: () => Promise<void> };
const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export const Msg = ({ kind = "err", children }: { kind?: "err" | "ok" | "info"; children: React.ReactNode }) =>
  children ? <div className={`msg ${kind}`} role={kind === "err" ? "alert" : "status"}>{children}</div> : null;

export const ALL_ROLES = CAREER_ROLES.map(r => r.id);

export function RoleChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const allSelected = CAREER_ROLES.length > 0 && CAREER_ROLES.every(r => value.includes(r.id));
  const toggle = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (value.includes(id)) {
      onChange(value.filter(x => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return <div>
    <div className="row" style={{ marginBottom: 8, gap: 8 }}>
      <button
        type="button"
        className="btn sm"
        onClick={e => { e.preventDefault(); e.stopPropagation(); onChange(ALL_ROLES); }}
        disabled={allSelected}
      >
        Select all
      </button>
      <button
        type="button"
        className="btn sm"
        onClick={e => { e.preventDefault(); e.stopPropagation(); onChange([]); }}
        disabled={!value.length}
      >
        Clear all
      </button>
      <span className="small muted">({value.length} of {CAREER_ROLES.length} selected)</span>
    </div>
    <div className="chips">
      {CAREER_ROLES.map(r => {
        const selected = value.includes(r.id);
        return (
          <button
            key={r.id}
            type="button"
            role="checkbox"
            aria-checked={selected}
            className={`chip ${selected ? "on" : ""}`}
            onClick={e => toggle(r.id, e)}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  </div>;
}

/* ---------------- Sign in / sign up / reset (all confirmed with an emailed code) ---------------- */
function AuthPage({ mode }: { mode: "login" | "signup" | "forgot" }) {
  const { setUser } = useAuth(); const nav = useNavigate(); const [sp] = useSearchParams(); const loc = useLocation();
  const next = sp.get("next") || (loc.pathname !== "/" && loc.pathname !== "/login" && loc.pathname !== "/signup" && loc.pathname !== "/forgot" ? loc.pathname + loc.search : null);
  const [f, setF] = useState<{ name: string; email: string; password: string; code: string; phone: string; roles: string[] }>({ name: "", email: "", password: "", code: "", phone: "", roles: ALL_ROLES });
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<"form" | "code">("form");
  const [purpose, setPurpose] = useState("login");
  const [err, setErr] = useState(""); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false);

  const afterAuth = (u: User) => {
    if (next && next.startsWith("/")) {
      nav(next);
    } else {
      nav(u.career_roles.length ? "/" : "/plan");
    }
  };

  useEffect(() => {
    setStep("form");
    setErr("");
    setInfo("");
    setConsent(false);
    if (mode === "signup") setF(prev => ({ ...prev, roles: ALL_ROLES }));
  }, [mode]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function resendCode() {
    setErr(""); setBusy(true);
    try {
      if (mode === "signup" && f.name && f.password && f.phone) {
        await api("/auth/signup", "POST", { name: f.name, email: f.email, password: f.password, phone: f.phone, career_roles: f.roles });
      } else if (purpose === "reset") {
        await api("/auth/forgot", "POST", { email: f.email });
      } else {
        await api("/auth/resend", "POST", { email: f.email, purpose });
      }
      setInfo(`A new 6-digit code was sent to ${f.email}.`);
    } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (step === "form") {
        if (mode === "signup") { await api("/auth/signup", "POST", { name: f.name, email: f.email, password: f.password, phone: f.phone, career_roles: f.roles }); setPurpose("verify"); }
        else if (mode === "login") {
          const r = await api("/auth/login", "POST", { email: f.email, password: f.password });
          if (r.user) { setUser(r.user); afterAuth(r.user); return; }
          setPurpose(r.purpose);                         // account not verified yet: a code was emailed
        }
        else { await api("/auth/forgot", "POST", { email: f.email }); setPurpose("reset"); }
        setStep("code"); setInfo(`We sent a 6-digit code to ${f.email}.`);
      } else if (purpose === "reset") {
        await api("/auth/reset", "POST", { email: f.email, code: f.code, password: f.password });
        nav(next ? `/login?next=${encodeURIComponent(next)}` : "/login"); setStep("form"); setInfo("Password changed. Sign in with your new password.");
      } else {
        const r = await api(purpose === "verify" ? "/auth/verify" : "/auth/login/verify", "POST", { email: f.email, code: f.code });
        setUser(r.user); afterAuth(r.user);
      }
    } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }
  const title = mode === "signup" ? "Create your account" : mode === "login" ? "Sign in" : "Reset your password";
  return <div className="auth card">
    {mode !== "forgot" && step === "form" && (
      <div className="auth-nav-tabs" style={{ display: "flex", borderBottom: "1px solid var(--line)", marginBottom: 18 }}>
        <Link
          to={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "8px 0",
            fontWeight: mode === "login" ? 700 : 500,
            color: mode === "login" ? "var(--ink)" : "var(--muted)",
            borderBottom: mode === "login" ? "2px solid var(--ink)" : "2px solid transparent",
            textDecoration: "none"
          }}
        >
          Sign in
        </Link>
        <Link
          to={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "8px 0",
            fontWeight: mode === "signup" ? 700 : 500,
            color: mode === "signup" ? "var(--ink)" : "var(--muted)",
            borderBottom: mode === "signup" ? "2px solid var(--ink)" : "2px solid transparent",
            textDecoration: "none"
          }}
        >
          Create account
        </Link>
      </div>
    )}
    <h1 style={{ marginTop: mode !== "forgot" && step === "form" ? 0 : undefined }}>{title}</h1>
    <p className="muted small">Handwritten-style notes, a track sheet that remembers your progress, and interview prep for every role.</p>
    {next && <Msg kind="info">Sign in required to access and view notes. Please sign in or create an account to continue.</Msg>}
    <Msg>{err}</Msg><Msg kind="info">{info}</Msg>
    <form onSubmit={submit}>
      {step === "form" ? <>
        {mode === "signup" && <label className="f"><span>Full name</span><input value={f.name} onChange={set("name")} required autoComplete="name" /></label>}
        {mode === "signup" && <label className="f"><span>Contact number</span><input type="tel" value={f.phone} onChange={set("phone")} required autoComplete="tel" placeholder="e.g. 9876543210" /></label>}
        <label className="f"><span>Email</span><input type="email" value={f.email} onChange={set("email")} required autoComplete="email" /></label>
        {mode !== "forgot" && <label className="f"><span>Password {mode === "signup" && "(8+ characters, letters and numbers)"}</span>
          <input type="password" value={f.password} onChange={set("password")} required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>}
        {mode === "signup" && <div className="f"><span>Which topics & roles are you preparing for? (all selected by default — click to remove any you don't need)</span><RoleChips value={f.roles} onChange={roles => setF({ ...f, roles })} /></div>}
        {mode === "signup" && <label className="row small" style={{ marginTop: 14, alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required style={{ marginTop: 2 }} />
          <span>I understand this is an independent study preparation resource (not affiliated with any company or certification body, with no legal liability for content accuracy). I agree to the <Link to="/terms" target="_blank" style={{ textDecoration: "underline" }}>Terms & Conditions</Link> and <Link to="/privacy" target="_blank" style={{ textDecoration: "underline" }}>Privacy Policy</Link>.</span>
        </label>}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <button className={mode === "signup" ? "btn-signup" : "primary"} disabled={busy || (mode === "signup" && !consent)} style={mode === "signup" ? { minWidth: 240 } : undefined}>
            {busy ? "Please wait..." : mode === "signup" ? "Send verification code" : mode === "login" ? "Continue" : "Send reset code"}
          </button>
        </div>
      </> : <>
        <label className="f"><span>6-digit code from your email</span>
          <input value={f.code} onChange={set("code")} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoFocus autoComplete="one-time-code" style={{ letterSpacing: 6, fontSize: 20 }} /></label>
        <p className="muted small">The code is valid for 10 minutes. <b>Not in your inbox? Check your Spam / Junk folder too</b> and mark the email as "Not spam".</p>
        {purpose === "reset" && <label className="f"><span>New password</span><input type="password" value={f.password} onChange={set("password")} required minLength={8} autoComplete="new-password" /></label>}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          <button className={purpose === "verify" ? "btn-signup" : "primary"} disabled={busy} style={purpose === "verify" ? { minWidth: 220 } : undefined}>
            {busy ? "Checking..." : purpose === "reset" ? "Change password" : "Verify and continue"}
          </button>
        </div>
        <div className="row" style={{ justifyContent: "center", gap: 12, marginTop: 14 }}>
          <button type="button" className="btn sm" onClick={resendCode} disabled={busy}>Resend code</button>
          <button type="button" className="btn sm" onClick={() => { setStep("form"); setInfo(""); setErr(""); }} disabled={busy}>Use a different email</button>
        </div>
      </>}
    </form>
    <p className="small" style={{ marginTop: 16 }}>
      {mode === "login" ? (
        <>New here? <Link to={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}>Create an account</Link> · <Link to="/forgot">Forgot password?</Link></>
      ) : (
        <>Already have an account? <Link to={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>Sign in</Link></>
      )}
    </p>
  </div>;
}

/* ---------------- Choose roles: tunes the track sheet ---------------- */
function Plan() {
  const { user, refresh } = useAuth(); const nav = useNavigate();
  const [roles, setRoles] = useState<string[]>(user!.career_roles.length ? user!.career_roles : ALL_ROLES); const [name, setName] = useState(user!.name); const [msg, setMsg] = useState("");
  async function save() { await api("/me", "PUT", { name, career_roles: roles, plan: user!.plan }); await refresh(); setMsg("Saved."); nav("/"); }
  return <div className="card" style={{ maxWidth: 640, margin: "auto" }}>
    <h1>Your preparation plan</h1>
    <p className="muted">Pick the roles you want. Your track sheet shows the notebooks for those roles; you can add or hide individual notebooks on the track sheet.</p>
    <Msg kind="ok">{msg}</Msg>
    <label className="f"><span>Name</span><input value={name} onChange={e => setName(e.target.value)} /></label>
    <div className="f"><span>Target roles</span><RoleChips value={roles} onChange={setRoles} /></div>
    <button className="primary" onClick={save} disabled={!roles.length}>Save and open my track sheet</button>
  </div>;
}

function WebTeam() {
  const [members, setMembers] = useState<any[]>([]);
  useEffect(() => { api("/team").then(r => setMembers(r.members)).catch(() => {}); }, []);
  return <div style={{ maxWidth: 720, margin: "auto" }}>
    <h1>Brought to you by</h1>
    {!members.length && <div className="card muted">No team members added yet.</div>}
    <div className="grid">
      {members.map(m => <div className="card" key={m.id} style={{ marginBottom: 0 }}>
        <div className="team" style={{ flexDirection: "column", alignItems: "center", gap: 12, padding: "24px 0" }}>
          {m.photo_url
            ? <img src={m.photo_url} alt={m.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }} />
            : <div className="avatar" aria-hidden style={{ width: 56, height: 56, fontSize: 24, lineHeight: "56px" }}>{m.name.charAt(0)}</div>}
          <div style={{ textAlign: "center" }}>
            <b style={{ fontSize: 18 }}>{m.name}</b>
            {m.role_title && <div className="small muted" style={{ marginTop: 4 }}>{m.role_title}</div>}
          </div>
          <div className="row" style={{ gap: 12 }}>
            {m.linkedin && <a className="btn sm primary" href={m.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>}
            {m.github && <a className="btn sm" href={m.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
          </div>
        </div>
      </div>)}
    </div>
  </div>;
}

function Footer() {
  return <footer className="footer">
    <div className="small muted" style={{ maxWidth: 760, margin: "0 auto 12px", lineHeight: 1.5, textAlign: "center" }}>
      <b>Disclaimer:</b> Resources Portal is an independent educational prep resource and is not affiliated with, endorsed by, or representing any company, official certification provider, or institution. We do not hold any legal responsibility for the content; materials are provided as-is for self-study and interview preparation.
    </div>
    <div className="row" style={{ justifyContent: "center", gap: 18, flexWrap: "wrap", marginBottom: 8 }}>
      <Link to="/terms">Terms & Conditions</Link>
      <Link to="/privacy">Privacy Policy</Link>
      <Link to="/feedback">Suggestions & Feedback</Link>
      <Link to="/certifications">Certifications</Link>
      <Link to="/webteam" style={{ fontWeight: 600 }}>Brought to you by</Link>
    </div>
    <div className="small muted" style={{ textAlign: "center" }}>Built for students preparing for software, AI, data, cloud and security roles.</div>
  </footer>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null); const [ready, setReady] = useState(false);
  const refresh = async () => { setUser((await api("/me")).user); };
  useEffect(() => { refresh().catch(() => {}).finally(() => setReady(true)); }, []);
  const nav = useNavigate();
  if (!ready) return <div className="wrap muted" style={{ textAlign: "center", padding: "80px 20px" }}>Loading...</div>;

  // Unauthenticated: show only sign-in / sign-up page without navbar
  if (!user) {
    return (
      <Ctx.Provider value={{ user, setUser, refresh }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 16px", background: "var(--bg, #f4f6fb)", boxSizing: "border-box" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h1 style={{ fontSize: 28, margin: "0 0 6px", color: "var(--ink, #0f172a)", letterSpacing: -0.5 }}>Resources Portal</h1>
            <p className="muted small" style={{ margin: 0 }}>Computer Science, Tech Roles & Interview Preparation</p>
          </div>
          <main style={{ width: "100%", maxWidth: 500 }}>
            <Routes>
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/forgot" element={<AuthPage mode="forgot" />} />
              <Route path="/terms" element={<div className="card"><Legal type="terms" /><div style={{ marginTop: 16 }}><Link to="/signup" className="btn sm">Back to Sign up</Link></div></div>} />
              <Route path="/privacy" element={<div className="card"><Legal type="privacy" /><div style={{ marginTop: 16 }}><Link to="/signup" className="btn sm">Back to Sign up</Link></div></div>} />
              <Route path="*" element={<AuthPage mode="login" />} />
            </Routes>
          </main>
          <div className="small muted" style={{ marginTop: 24, textAlign: "center", lineHeight: 1.6 }}>
            <div style={{ marginBottom: 6 }}>
              <Link to="/terms" style={{ color: "var(--muted)" }}>Terms & Conditions</Link> · <Link to="/privacy" style={{ color: "var(--muted)" }}>Privacy Policy</Link>
            </div>
            Sign in or create an account to access all curriculum notes, track sheets, and interview prep.
          </div>
        </div>
      </Ctx.Provider>
    );
  }

  // Authenticated: full portal with navigation bar, track sheet home page, and all content unlocked
  const tab = ({ isActive }: { isActive: boolean }) => `tab ${isActive ? "active" : ""}`;
  return (
    <Ctx.Provider value={{ user, setUser, refresh }}>
      <header className="nav">
        <div className="nav-in">
          <Link to="/" className="brand">Resources Portal</Link>
          <NavLink to="/" end className={tab}>Track sheet</NavLink>
          <NavLink to="/library" className={tab}>Notes</NavLink>
          <NavLink to="/certifications" className={tab}>Certifications</NavLink>
          <NavLink to="/resources" className={tab}>Resources</NavLink>
          <NavLink to="/projects" className={tab}>Projects</NavLink>
          <NavLink to="/connect" className={tab}>Connect</NavLink>
          {user.role === "admin" && <NavLink to="/admin" className={tab}>Admin</NavLink>}
          <span className="right small muted">{user.name}</span>
          <NavLink to="/plan" className={tab}>My plan</NavLink>
          <button className="sm" onClick={async () => { await api("/auth/logout", "POST", {}); setUser(null); nav("/login"); }}>Sign out</button>
        </div>
      </header>
      <Routes>
        <Route path="/read/:slug" element={<Reader />} />
        <Route path="*" element={
          <main className="wrap">
            <Routes>
              <Route path="/" element={<Track />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/library" element={<Library />} />
              <Route path="/certifications" element={<Certifications />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/terms" element={<Legal type="terms" />} />
              <Route path="/privacy" element={<Legal type="privacy" />} />
              <Route path="/resources" element={<Links kind="resource" />} />
              <Route path="/projects" element={<Links kind="project" />} />
              <Route path="/connect" element={<Connect />} />
              <Route path="/admin/*" element={user.role === "admin" ? <Admin /> : <Navigate to="/" replace />} />
              <Route path="/webteam" element={<WebTeam />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/signup" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        } />
      </Routes>
      <Footer />
    </Ctx.Provider>
  );
}
