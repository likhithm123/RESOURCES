import React, { createContext, useContext, useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api, type User } from "./api";
import { CAREER_ROLES } from "../shared/catalog";
import Track from "./Track";
import Reader from "./Reader";
import Admin from "./Admin";
import { Library, Links, Connect } from "./Pages";

type AuthCtx = { user: User | null; setUser: (u: User | null) => void; refresh: () => Promise<void> };
const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export const Msg = ({ kind = "err", children }: { kind?: "err" | "ok" | "info"; children: React.ReactNode }) =>
  children ? <div className={`msg ${kind}`} role={kind === "err" ? "alert" : "status"}>{children}</div> : null;

export function RoleChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return <div className="chips">{CAREER_ROLES.map(r =>
    <span key={r.id} role="checkbox" aria-checked={value.includes(r.id)} tabIndex={0} className={`chip ${value.includes(r.id) ? "on" : ""}`}
      onClick={() => onChange(value.includes(r.id) ? value.filter(x => x !== r.id) : [...value, r.id])}
      onKeyDown={e => e.key === "Enter" && (e.currentTarget as HTMLElement).click()}>{r.label}</span>)}</div>;
}

/* ---------------- Sign in / sign up / reset (all confirmed with an emailed code) ---------------- */
function AuthPage({ mode }: { mode: "login" | "signup" | "forgot" }) {
  const { setUser } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", code: "", phone: "", roles: [] as string[] });
  const [step, setStep] = useState<"form" | "code">("form");
  const [purpose, setPurpose] = useState("login");
  const [err, setErr] = useState(""); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { setStep("form"); setErr(""); setInfo(""); }, [mode]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (step === "form") {
        if (mode === "signup") { await api("/auth/signup", "POST", { name: f.name, email: f.email, password: f.password, phone: f.phone, career_roles: f.roles }); setPurpose("verify"); }
        else if (mode === "login") {
          const r = await api("/auth/login", "POST", { email: f.email, password: f.password });
          if (r.user) { setUser(r.user); nav(r.user.career_roles.length ? "/" : "/plan"); return; }
          setPurpose(r.purpose);                         // account not verified yet: a code was emailed
        }
        else { await api("/auth/forgot", "POST", { email: f.email }); setPurpose("reset"); }
        setStep("code"); setInfo(`We sent a 6-digit code to ${f.email}.`);
      } else if (purpose === "reset") {
        await api("/auth/reset", "POST", { email: f.email, code: f.code, password: f.password });
        nav("/login"); setStep("form"); setInfo("Password changed. Sign in with your new password.");
      } else {
        const r = await api(purpose === "verify" ? "/auth/verify" : "/auth/login/verify", "POST", { email: f.email, code: f.code });
        setUser(r.user); nav(r.user.career_roles.length ? "/" : "/plan");
      }
    } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }
  const title = mode === "signup" ? "Create your account" : mode === "login" ? "Sign in" : "Reset your password";
  return <div className="auth card">
    <h1>{title}</h1>
    <p className="muted small">Handwritten-style notes, a track sheet that remembers your progress, and interview prep for every role.</p>
    <Msg>{err}</Msg><Msg kind="info">{info}</Msg>
    <form onSubmit={submit}>
      {step === "form" ? <>
        {mode === "signup" && <label className="f"><span>Full name</span><input value={f.name} onChange={set("name")} required autoComplete="name" /></label>}
        {mode === "signup" && <label className="f"><span>Contact number</span><input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="e.g. 9876543210" /></label>}
        <label className="f"><span>Email</span><input type="email" value={f.email} onChange={set("email")} required autoComplete="email" /></label>
        {mode !== "forgot" && <label className="f"><span>Password {mode === "signup" && "(8+ characters, letters and numbers)"}</span>
          <input type="password" value={f.password} onChange={set("password")} required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>}
        {mode === "signup" && <label className="f"><span>Which roles are you preparing for? (you can change this later)</span><RoleChips value={f.roles} onChange={roles => setF({ ...f, roles })} /></label>}
        <button className="primary" disabled={busy}>{busy ? "Please wait..." : mode === "signup" ? "Send verification code" : mode === "login" ? "Continue" : "Send reset code"}</button>
      </> : <>
        <label className="f"><span>6-digit code from your email</span>
          <input value={f.code} onChange={set("code")} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoFocus autoComplete="one-time-code" style={{ letterSpacing: 6, fontSize: 20 }} /></label>
        <p className="muted small">The code is valid for 10 minutes. <b>Not in your inbox? Check your Spam / Junk folder too</b> and mark the email as "Not spam".</p>
        {purpose === "reset" && <label className="f"><span>New password</span><input type="password" value={f.password} onChange={set("password")} required minLength={8} autoComplete="new-password" /></label>}
        <div className="row"><button className="primary" disabled={busy}>{busy ? "Checking..." : purpose === "reset" ? "Change password" : "Verify and continue"}</button>
          <button type="button" className="link" onClick={() => { setStep("form"); setInfo(""); }}>Use a different email / resend</button></div>
      </>}
    </form>
    <p className="small" style={{ marginTop: 16 }}>
      {mode === "login" ? <>New here? <Link to="/signup">Create an account</Link> · <Link to="/forgot">Forgot password?</Link></> : <>Already have an account? <Link to="/login">Sign in</Link></>}
    </p>
  </div>;
}

/* ---------------- Choose roles: tunes the track sheet ---------------- */
function Plan() {
  const { user, refresh } = useAuth(); const nav = useNavigate();
  const [roles, setRoles] = useState<string[]>(user!.career_roles); const [name, setName] = useState(user!.name); const [msg, setMsg] = useState("");
  async function save() { await api("/me", "PUT", { name, career_roles: roles, plan: user!.plan }); await refresh(); setMsg("Saved."); nav("/"); }
  return <div className="card" style={{ maxWidth: 640, margin: "auto" }}>
    <h1>Your preparation plan</h1>
    <p className="muted">Pick the roles you want. Your track sheet shows the notebooks for those roles; you can add or hide individual notebooks on the track sheet.</p>
    <Msg kind="ok">{msg}</Msg>
    <label className="f"><span>Name</span><input value={name} onChange={e => setName(e.target.value)} /></label>
    <label className="f"><span>Target roles</span><RoleChips value={roles} onChange={setRoles} /></label>
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
    <div>Built for students preparing for software, AI, data, cloud and security roles.</div>
    <div className="team">
      <Link to="/webteam" style={{ fontWeight: 600 }}>Brought to you by</Link>
    </div>
  </footer>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null); const [ready, setReady] = useState(false);
  const refresh = async () => { setUser((await api("/me")).user); };
  useEffect(() => { refresh().catch(() => {}).finally(() => setReady(true)); }, []);
  const nav = useNavigate();
  if (!ready) return <div className="wrap muted">Loading...</div>;
  const tab = ({ isActive }: { isActive: boolean }) => `tab ${isActive ? "active" : ""}`;
  const guard = (el: React.ReactElement) => (user ? el : <Navigate to="/login" replace />);
  return <Ctx.Provider value={{ user, setUser, refresh }}>
    <header className="nav"><div className="nav-in">
      <Link to="/" className="brand">Resources Portal</Link>
      {user && <>
        <NavLink to="/" end className={tab}>Track sheet</NavLink>
        <NavLink to="/library" className={tab}>Notes</NavLink>
        <NavLink to="/resources" className={tab}>Resources</NavLink>
        <NavLink to="/projects" className={tab}>Projects</NavLink>
        <NavLink to="/connect" className={tab}>Connect</NavLink>
        {user.role === "admin" && <NavLink to="/admin" className={tab}>Admin</NavLink>}
        <span className="right small muted">{user.name}</span>
        <NavLink to="/plan" className={tab}>My plan</NavLink>
        <button className="sm" onClick={async () => { await api("/auth/logout", "POST", {}); setUser(null); nav("/login"); }}>Sign out</button>
      </>}
    </div></header>
    <Routes>
      <Route path="/read/:slug" element={guard(<Reader />)} />
      <Route path="*" element={<main className="wrap"><Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" />} />
        <Route path="/forgot" element={<AuthPage mode="forgot" />} />
        <Route path="/" element={guard(user && !user.career_roles.length ? <Navigate to="/plan" replace /> : <Track />)} />
        <Route path="/plan" element={guard(<Plan />)} />
        <Route path="/library" element={guard(<Library />)} />
        <Route path="/resources" element={guard(<Links kind="resource" />)} />
        <Route path="/projects" element={guard(<Links kind="project" />)} />
        <Route path="/connect" element={guard(<Connect />)} />
        <Route path="/admin/*" element={guard(user?.role === "admin" ? <Admin /> : <Navigate to="/" replace />)} />
        <Route path="/webteam" element={<WebTeam />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></main>} />
    </Routes>
    <Footer />
  </Ctx.Provider>;
}
