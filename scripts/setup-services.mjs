#!/usr/bin/env node
/**
 * One-time provisioning for rayidali.com. Reads .env.local, then:
 *   1. Supabase: makes sure the portfolio tables exist (applies supabase/schema.sql
 *      through the Management API if not) and registers the admin auth redirect.
 *   2. PostHog: creates a dedicated "rayidali.com" project (so portfolio data is not
 *      mixed with Cinechrony's) and writes its ingest key + id back to .env.local.
 *   3. Sentry: creates a dedicated "rayidali-com" project and writes its DSN back.
 * Prints only ids and masked values. Re-runnable.
 */
import fs from "node:fs";
import path from "node:path";

const ENV = path.join(process.cwd(), ".env.local");
const SCHEMA = path.join(process.cwd(), "supabase", "schema.sql");
const env = {};
for (const line of fs.readFileSync(ENV, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const mask = (s) => (s ? s.slice(0, 6) + "…" + s.slice(-3) : "(unset)");
function setEnv(key, value) {
  let text = fs.readFileSync(ENV, "utf8");
  if (new RegExp(`^${key}=`, "m").test(text)) text = text.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${value}`);
  else text += `\n${key}=${value}\n`;
  fs.writeFileSync(ENV, text);
  env[key] = value;
}
async function api(url, opts = {}) {
  const r = await fetch(url, opts);
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { ok: r.ok, status: r.status, body };
}
const SITE = env.NEXT_PUBLIC_SITE_URL || "https://rayidali.com";

/* ---------------- 1. Supabase ---------------- */
async function supabase() {
  const ref = env.SUPABASE_PROJECT_REF, tok = env.SUPABASE_ACCESS_TOKEN;
  const H = { Authorization: `Bearer ${tok}`, "content-type": "application/json" };
  const q = (query) => api(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: "POST", headers: H, body: JSON.stringify({ query }) });
  console.log(`\n[supabase] project ${ref}`);
  const check = await q("select to_regclass('public.ref_codes') as t, to_regclass('public.events') as e, to_regclass('public.resumes') as r");
  if (!check.ok) { console.log("  ! cannot reach the Management API:", check.status, JSON.stringify(check.body).slice(0, 200)); return; }
  const row = Array.isArray(check.body) ? check.body[0] : {};
  const missing = ["t", "e", "r"].filter((k) => !row[k]);
  if (missing.length) {
    console.log("  tables missing, applying supabase/schema.sql …");
    const res = await q(fs.readFileSync(SCHEMA, "utf8"));
    console.log(res.ok ? "  schema applied" : `  ! schema failed: ${JSON.stringify(res.body).slice(0, 300)}`);
  } else console.log("  tables already there (you ran the schema)");
  const bucket = await q("select id from storage.buckets where id='resumes'");
  console.log(`  storage bucket resumes: ${Array.isArray(bucket.body) && bucket.body.length ? "ok" : "MISSING"}`);
  const auth = await api(`https://api.supabase.com/v1/projects/${ref}/config/auth`, { headers: H });
  if (auth.ok) {
    const current = (auth.body.uri_allow_list || "").split(",").map((s) => s.trim()).filter(Boolean);
    const want = [`${SITE}/admin/auth/callback`, "http://localhost:3000/admin/auth/callback"];
    const merged = Array.from(new Set([...current, ...want]));
    const patch = await api(`https://api.supabase.com/v1/projects/${ref}/config/auth`, { method: "PATCH", headers: H, body: JSON.stringify({ uri_allow_list: merged.join(","), site_url: auth.body.site_url || SITE }) });
    console.log(`  auth redirect URLs: ${patch.ok ? "ok (" + merged.length + " entries)" : "! " + patch.status}`);
  } else console.log("  ! could not read auth config:", auth.status);
}

/* ---------------- 2. PostHog ---------------- */
async function posthog() {
  const key = env.POSTHOG_PERSONAL_API_KEY;
  const host = (env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(".i.posthog.com", ".posthog.com");
  const H = { Authorization: `Bearer ${key}`, "content-type": "application/json" };
  console.log(`\n[posthog] ${host}`);
  const orgs = await api(`${host}/api/organizations/`, { headers: H });
  if (!orgs.ok) { console.log("  ! personal key rejected:", orgs.status); return; }
  const org = orgs.body.results?.[0]; if (!org) { console.log("  ! no organization"); return; }
  const projects = await api(`${host}/api/organizations/${org.id}/projects/`, { headers: H });
  let proj = (projects.body.results || []).find((p) => p.name === "rayidali.com");
  if (!proj) {
    const created = await api(`${host}/api/organizations/${org.id}/projects/`, { method: "POST", headers: H, body: JSON.stringify({ name: "rayidali.com" }) });
    if (!created.ok) { console.log(`  ! could not create a project (${created.status}); keeping the Cinechrony project`); return; }
    proj = created.body; console.log(`  created project "rayidali.com" (id ${proj.id})`);
  } else console.log(`  project "rayidali.com" exists (id ${proj.id})`);
  const full = await api(`${host}/api/projects/${proj.id}/`, { headers: H });
  const token = full.body?.api_token || proj.api_token;
  if (token) { setEnv("NEXT_PUBLIC_POSTHOG_KEY", token); setEnv("POSTHOG_PROJECT_ID", String(proj.id)); console.log(`  ingest key ${mask(token)} written to .env.local`); }
}

/* ---------------- 3. Sentry ---------------- */
async function sentry() {
  const tok = env.SENTRY_AUTH_TOKEN, org = env.SENTRY_ORG || "cinechrony", slug = "rayidali-com";
  const H = { Authorization: `Bearer ${tok}`, "content-type": "application/json" };
  console.log(`\n[sentry] org ${org}`);
  let exists = await api(`https://sentry.io/api/0/projects/${org}/${slug}/`, { headers: H });
  if (!exists.ok) {
    const teams = await api(`https://sentry.io/api/0/organizations/${org}/teams/`, { headers: H });
    const team = teams.body?.[0]?.slug;
    if (!team) { console.log("  ! no team visible to this token; keeping the existing DSN"); return; }
    const created = await api(`https://sentry.io/api/0/teams/${org}/${team}/projects/`, { method: "POST", headers: H, body: JSON.stringify({ name: slug, slug, platform: "javascript-nextjs" }) });
    if (!created.ok) { console.log(`  ! could not create project (${created.status}); keeping the existing DSN`); return; }
    console.log(`  created project ${slug} in team ${team}`);
  } else console.log(`  project ${slug} exists`);
  const keys = await api(`https://sentry.io/api/0/projects/${org}/${slug}/keys/`, { headers: H });
  const dsn = keys.body?.[0]?.dsn?.public;
  if (dsn) { setEnv("NEXT_PUBLIC_SENTRY_DSN", dsn); setEnv("SENTRY_PROJECT", slug); console.log(`  DSN ${mask(dsn)} written to .env.local`); }
}

await supabase();
await posthog();
await sentry();
console.log("\ndone. .env.local is the source of truth; push it to Vercel with `npm run env:push`.");
