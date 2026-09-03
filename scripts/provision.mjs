#!/usr/bin/env node
/**
 * Provisioning for rayidali.com (re-runnable, creates only, never deletes):
 *   1. Telegram: find your chat id from the bot's updates and send a hello.
 *   2. PostHog: resolve the project id behind NEXT_PUBLIC_POSTHOG_KEY (for the weekly digest).
 *   3. Supabase: create a dedicated "rayidali-com" project, apply supabase/schema.sql,
 *      set the admin auth redirect, and point .env.local at it.
 */
import fs from "node:fs";
import crypto from "node:crypto";

const ENV = ".env.local";
const env = Object.fromEntries(fs.readFileSync(ENV, "utf8").split("\n").map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^"(.*)"$/, "$1")]));
const mask = (s) => (s ? s.slice(0, 6) + "…" + s.slice(-3) : "(unset)");
function setEnv(k, v) {
  let t = fs.readFileSync(ENV, "utf8");
  t = new RegExp(`^${k}=`, "m").test(t) ? t.replace(new RegExp(`^${k}=.*$`, "m"), `${k}=${v}`) : t + `\n${k}=${v}\n`;
  fs.writeFileSync(ENV, t); env[k] = v;
}
const J = async (url, o = {}) => { const r = await fetch(url, o); const t = await r.text(); let b; try { b = JSON.parse(t); } catch { b = t; } return { ok: r.ok, status: r.status, body: b }; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- 1. Telegram ---------------- */
console.log("[telegram]");
if (env.TELEGRAM_BOT_TOKEN) {
  const u = await J(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates`);
  const chats = (u.body?.result || []).map((x) => (x.message || x.my_chat_member || x.edited_message || {}).chat).filter((c) => c && c.type === "private");
  const chat = chats.pop();
  if (chat) {
    setEnv("TELEGRAM_CHAT_ID", String(chat.id));
    console.log(`  chat id ${chat.id} (@${chat.username || chat.first_name || "?"}) written`);
    const s = await J(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chat.id, text: "RAYID.EXE connected.\n\nEvery Monday morning you get the weekly report here. You also get an instant ping when someone opens a tracked link or the résumé." }) });
    console.log(`  hello message: ${s.ok ? "sent" : "failed " + s.status}`);
  } else console.log("  no message from you yet. In Telegram open @rayidportfolio_bot, press Start (or send hi), then rerun: node scripts/provision.mjs");
}

/* ---------------- 2. PostHog ---------------- */
console.log("[posthog]");
if (env.POSTHOG_PERSONAL_API_KEY && env.NEXT_PUBLIC_POSTHOG_KEY) {
  const H = { Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}` };
  const host = "https://us.posthog.com";
  const orgs = await J(`${host}/api/organizations/`, { headers: H });
  let found = null;
  for (const org of orgs.body?.results || []) {
    const ps = await J(`${host}/api/organizations/${org.id}/projects/`, { headers: H });
    for (const p of ps.body?.results || []) {
      const full = await J(`${host}/api/projects/${p.id}/`, { headers: H });
      if (full.body?.api_token === env.NEXT_PUBLIC_POSTHOG_KEY) found = { org: org.name, id: p.id, name: p.name };
    }
  }
  if (found) { setEnv("POSTHOG_PROJECT_ID", String(found.id)); console.log(`  ingest key belongs to "${found.name}" in org "${found.org}" (project id ${found.id}) written`); }
  else console.log(`  the personal API key cannot see the org behind ${mask(env.NEXT_PUBLIC_POSTHOG_KEY)}. Ingest works regardless. For the weekly digest: PostHog → the "my portfolio" org → Settings → Personal API keys → create one (read scope) and paste it to me.`);
}

/* ---------------- 3. Supabase ---------------- */
console.log("[supabase]");
{
  const H = { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "content-type": "application/json" };
  const api = "https://api.supabase.com/v1";
  const list = await J(`${api}/projects`, { headers: H });
  let proj = (list.body || []).find((p) => p.name === "rayidali-com");
  if (!proj) {
    const orgs = await J(`${api}/organizations`, { headers: H });
    const org = orgs.body?.[0];
    if (!org) { console.log("  ! no organization visible to this token"); process.exit(1); }
    const pass = crypto.randomBytes(24).toString("base64url");
    const c = await J(`${api}/projects`, { method: "POST", headers: H, body: JSON.stringify({ name: "rayidali-com", organization_id: org.id, db_pass: pass, region: "us-east-1" }) });
    if (!c.ok) { console.log("  ! create failed:", c.status, JSON.stringify(c.body).slice(0, 300)); process.exit(1); }
    proj = c.body; setEnv("SUPABASE_DB_PASSWORD", pass);
    console.log(`  created project rayidali-com (${proj.id}) in org "${org.name}"`);
  } else console.log(`  project rayidali-com exists (${proj.id})`);
  const ref = proj.id;
  for (let i = 0; i < 50; i++) {
    const s = await J(`${api}/projects/${ref}`, { headers: H });
    if (s.body?.status === "ACTIVE_HEALTHY") break;
    process.stdout.write(`  waiting for the database… ${s.body?.status}      \r`);
    await sleep(6000);
  }
  console.log("  database ACTIVE_HEALTHY".padEnd(60));
  const keys = await J(`${api}/projects/${ref}/api-keys?reveal=true`, { headers: H });
  const anon = (keys.body || []).find((k) => k.name === "anon")?.api_key;
  const svc = (keys.body || []).find((k) => k.name === "service_role")?.api_key;
  if (!anon || !svc) { console.log("  ! could not read api keys", keys.status, JSON.stringify(keys.body).slice(0, 200)); process.exit(1); }
  const q = (query) => J(`${api}/projects/${ref}/database/query`, { method: "POST", headers: H, body: JSON.stringify({ query }) });
  let applied = null;
  for (let i = 0; i < 12; i++) { applied = await q(fs.readFileSync("supabase/schema.sql", "utf8")); if (applied.ok) break; await sleep(6000); }
  console.log(`  schema: ${applied.ok ? "applied" : "! " + JSON.stringify(applied.body).slice(0, 200)}`);
  const auth = await J(`${api}/projects/${ref}/config/auth`, { method: "PATCH", headers: H, body: JSON.stringify({ site_url: env.NEXT_PUBLIC_SITE_URL, uri_allow_list: `${env.NEXT_PUBLIC_SITE_URL}/admin/auth/callback,http://localhost:3000/admin/auth/callback` }) });
  console.log(`  auth redirects: ${auth.ok ? "ok" : "! " + auth.status}`);
  setEnv("NEXT_PUBLIC_SUPABASE_URL", `https://${ref}.supabase.co`);
  setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", svc);
  setEnv("SUPABASE_PROJECT_REF", ref);
  console.log(`  .env.local now points at ${ref} (anon ${mask(anon)}, service ${mask(svc)})`);
}
console.log("done");
