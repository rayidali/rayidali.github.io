import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Weekly digest. Vercel Cron calls this every Monday (see vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`. It pulls the last 7 days from Supabase,
 * PostHog and Sentry, asks a model to make sense of it, and sends the result to
 * Telegram (and email through Resend, if configured). Hit /api/digest?key=CRON_SECRET
 * to run it by hand.
 */
export async function GET(req: NextRequest) {
  try { return await run(req); } catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }); }
}

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!secret || (auth !== `Bearer ${secret}` && req.nextUrl.searchParams.get("key") !== secret)) return NextResponse.json({ error: "nope" }, { status: 401 });

  const since = new Date(Date.now() - 7 * 864e5);
  const prev = new Date(Date.now() - 14 * 864e5);
  const facts: Record<string, unknown> = { window: { from: since.toISOString(), to: new Date().toISOString() } };

  /* ---------- Supabase: our own event log ---------- */
  const db = adminClient();
  if (db) {
    const [{ data: ev }, { data: refs }, { count: prevViews }] = await Promise.all([
      db.from("events").select("ts,event,ref,props,country,city,referrer").gte("ts", since.toISOString()).order("ts", { ascending: false }).limit(5000),
      db.from("ref_codes").select("code,label,company,channel,hits"),
      db.from("events").select("id", { count: "exact", head: true }).eq("event", "page_view").gte("ts", prev.toISOString()).lt("ts", since.toISOString()),
    ]);
    const rows = ev || [];
    const count = (pred: (r: any) => boolean) => rows.filter(pred).length;
    const top = (pick: (r: any) => string | null | undefined, n = 8) => {
      const m = new Map<string, number>();
      rows.forEach((r) => { const k = pick(r); if (k) m.set(k, (m.get(k) || 0) + 1); });
      return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}: ${v}`);
    };
    const label = (code: string | null) => { const r = (refs || []).find((x) => x.code === code); return r ? `${r.company || r.label} (${r.channel || "link"})` : code || "direct"; };
    const dwell: Record<string, number[]> = {};
    rows.filter((r) => r.event === "section_dwell").forEach((r) => { Object.entries((r.props as any)?.dwell || {}).forEach(([k, v]) => { (dwell[k] ||= []).push(Number(v)); }); });
    facts.site = {
      page_views: count((r) => r.event === "page_view"),
      page_views_previous_week: prevViews ?? null,
      resume_opens: count((r) => r.event === "resume_open"),
      tracked_link_hits: count((r) => r.event === "ref_hit"),
      mail_clicks: count((r) => r.event === "mail_click"),
      outbound_clicks: top((r) => (r.event === "outbound_click" ? String((r.props as any)?.target) : null)),
      visits_by_ref: top((r) => (r.event === "page_view" ? label(r.ref) : null), 12),
      countries: top((r) => (r.event === "page_view" ? r.country : null)),
      cities: top((r) => (r.event === "page_view" ? r.city : null)),
      referrers: top((r) => { if (r.event !== "page_view" || !r.referrer) return null; try { return new URL(r.referrer).hostname; } catch { return String(r.referrer).slice(0, 60); } }),
      scroll_reached_100pct: count((r) => r.event === "scroll_depth" && (r.props as any)?.depth === 100),
      avg_seconds_per_section: Object.fromEntries(Object.entries(dwell).map(([k, v]) => [k, Math.round(v.reduce((a, b) => a + b, 0) / v.length / 1000)])),
      puzzle_words_found: count((r) => r.event === "puzzle_word"),
      windows_dragged: count((r) => r.event === "window_drag"),
    };
  }

  /* ---------- PostHog ---------- */
  const phKey = process.env.POSTHOG_PERSONAL_API_KEY, phId = process.env.POSTHOG_PROJECT_ID;
  if (phKey && phId) {
    const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(".i.posthog.com", ".posthog.com");
    const hogql = async (query: string) => {
      const r = await fetch(`${host}/api/projects/${phId}/query/`, { method: "POST", headers: { Authorization: `Bearer ${phKey}`, "content-type": "application/json" }, body: JSON.stringify({ query: { kind: "HogQLQuery", query } }) });
      const j: any = await r.json().catch(() => ({}));
      return j.results || j.error || null;
    };
    facts.posthog = {
      pageviews_and_unique_visitors: await hogql("select count(), count(distinct distinct_id) from events where event = '$pageview' and properties.$host like '%rayidali%' and timestamp > now() - interval 7 day"),
      previous_week: await hogql("select count(), count(distinct distinct_id) from events where event = '$pageview' and properties.$host like '%rayidali%' and timestamp > now() - interval 14 day and timestamp <= now() - interval 7 day"),
      top_referring_domains: await hogql("select properties.$referring_domain, count() from events where event = '$pageview' and properties.$host like '%rayidali%' and timestamp > now() - interval 7 day group by 1 order by 2 desc limit 8"),
      devices: await hogql("select properties.$device_type, count() from events where event = '$pageview' and properties.$host like '%rayidali%' and timestamp > now() - interval 7 day group by 1 order by 2 desc"),
      browsers: await hogql("select properties.$browser, count() from events where event = '$pageview' and properties.$host like '%rayidali%' and timestamp > now() - interval 7 day group by 1 order by 2 desc limit 5"),
      top_ref_codes: await hogql("select properties.ref, count(distinct distinct_id) from events where properties.$host like '%rayidali%' and timestamp > now() - interval 7 day and properties.ref is not null group by 1 order by 2 desc limit 10"),
    };
  }

  /* ---------- Sentry ---------- */
  const snTok = process.env.SENTRY_AUTH_TOKEN, snOrg = process.env.SENTRY_ORG, snProj = process.env.SENTRY_PROJECT;
  if (snTok && snOrg && snProj) {
    const r = await fetch(`https://sentry.io/api/0/projects/${snOrg}/${snProj}/issues/?statsPeriod=14d&query=is:unresolved&sort=freq`, { headers: { Authorization: `Bearer ${snTok}` } });
    const issues: any[] = await r.json().catch(() => []);
    facts.sentry_last_14d = Array.isArray(issues) ? issues.slice(0, 8).map((i) => ({ title: i.title, count: i.count, users: i.userCount, last: i.lastSeen, link: i.permalink })) : issues;
  }

  /* ---------- make sense of it ---------- */
  const prompt = `You are writing Rayid's weekly portfolio report. Rayid is an AI engineer in New York job hunting; his site rayidali.com is visited by recruiters and engineers, often through tracked links (one code per application). Below is raw data for the last 7 days from his own event log, PostHog and Sentry.

Write a short report for a Telegram message. Plain text only, no markdown symbols, no tables. Under 2500 characters. Structure:
1. One line headline with the vibe of the week.
2. Traffic: visits, unique people, change vs last week, where they came from (referrers, countries), devices.
3. Who: which tracked links (companies) visited, who opened the résumé, who clicked GitHub or LinkedIn or mail. Name companies when a label exists. This is the most important section.
4. Engagement: which sections people spend time in, how far they scroll, anything ignored.
5. Health: errors from Sentry, if any, in one or two lines.
6. Three concrete suggestions for next week (what to change on the site or who to follow up with).
Never use an em dash. Be direct and specific; if data is thin, say so in one line rather than padding.

DATA:
${JSON.stringify(facts, null, 1).slice(0, 60000)}`;

  let text = "";
  let model = "";
  const anth = process.env.ANTHROPIC_API_KEY;
  const gem = process.env.GEMINI_API_KEY;
  if (anth) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": anth, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 1500, messages: [{ role: "user", content: prompt }] }) });
      const j: any = await r.json().catch(() => ({}));
      text = j?.content?.[0]?.text || "";
      if (text) model = "claude-sonnet-5"; else facts.model_error = { claude: j?.error?.message || r.status };
    } catch (e) { facts.model_error = { claude: String(e) }; }
  }
  if (!text && gem) {
    const m = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${gem}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const j: any = await r.json().catch(() => ({}));
      text = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text) model = m; else facts.model_error = { ...(facts.model_error as object || {}), gemini: j?.error?.message || r.status };
    } catch (e) { facts.model_error = { ...(facts.model_error as object || {}), gemini: String(e) }; }
  }
  if (!text) text = "RAYID.EXE weekly report\n\nNo model configured, raw numbers:\n" + JSON.stringify(facts.site || facts, null, 1).slice(0, 3500);
  text = text.replace(/—/g, ",");

  /* ---------- deliver ---------- */
  const delivered: string[] = [];
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    for (let i = 0; i < text.length; i += 3900) {
      await fetch(`https://api.telegram.org/bot${tg}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: text.slice(i, i + 3900), disable_web_page_preview: true }) });
    }
    delivered.push("telegram");
  }
  const resend = process.env.RESEND_API_KEY, to = process.env.CONTACT_EMAIL;
  if (resend && to) {
    await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resend}`, "content-type": "application/json" }, body: JSON.stringify({ from: "RAYID.EXE <digest@rayidali.com>", to, subject: "rayidali.com · weekly report", text }) });
    delivered.push("email");
  }
  return NextResponse.json({ ok: true, model, delivered, chars: text.length, preview: text.slice(0, 600), facts });
}
