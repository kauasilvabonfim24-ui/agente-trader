import { useSyncExternalStore } from "react";

// Sem dependência extra: fala direto com a API REST do Supabase.
// Só a URL e a chave PÚBLICA (publishable/anon) entram aqui. Nunca use service_role.
const ENV = import.meta.env as Record<string, string | undefined>;
const URL_ = ENV["VITE_SUPABASE_URL"];
const KEY = ENV["VITE_SUPABASE_PUBLISHABLE_KEY"];
export const supabaseConfigurado = !!(URL_ && KEY);

type Session = { access_token: string; refresh_token: string; expires_at: number; user_id: string };
const SK = "at.session";
let session: Session | null = null;
const subs = new Set<() => void>();

if (typeof window !== "undefined") {
  try { const r = localStorage.getItem(SK); session = r ? JSON.parse(r) : null; } catch { session = null; }
}
function setSession(s: Session | null) {
  session = s;
  try { if (s) localStorage.setItem(SK, JSON.stringify(s)); else localStorage.removeItem(SK); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
export function useSession() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => session, () => null);
}

async function pedirToken(body: Record<string, string>, grant: string) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=${grant}`, {
    method: "POST", headers: { apikey: KEY!, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || j.msg || "Falha no login");
  setSession({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in - 60) * 1000, user_id: j.user.id });
}
export const signIn = (email: string, password: string) => pedirToken({ email, password }, "password");
export const signOut = () => setSession(null);
export const userId = () => session?.user_id;

async function token() {
  if (!session) throw new Error("Sem sessão");
  if (Date.now() > session.expires_at) await pedirToken({ refresh_token: session.refresh_token }, "refresh_token");
  return session!.access_token;
}
async function api(path: string, init: RequestInit = {}) {
  const t = await token();
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init, headers: { apikey: KEY!, Authorization: `Bearer ${t}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.status === 204 ? null : r.json().catch(() => null);
}
export const dbSelect = <T,>(table: string): Promise<T[]> => api(`${table}?select=*`);
// Grava as linhas e apaga do banco as que sumiram da lista (RLS garante que só mexe nas suas).
export async function dbReplace(table: string, rows: Record<string, unknown>[], key = "id") {
  if (rows.length) await api(`${table}?on_conflict=${key}`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) });
  const ids = rows.map((r) => r[key]);
  await api(`${table}?${ids.length ? `${key}=not.in.(${ids.join(",")})` : `${key}=not.is.null`}`, { method: "DELETE" });
}
