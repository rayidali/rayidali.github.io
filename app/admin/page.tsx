import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { adminClient, supabaseConfigured } from "@/lib/supabase";
import { requireAdmin, signOut, createRef, deleteRef, uploadResume, activateResume, deleteResume } from "./actions";

export const metadata: Metadata = { title: "admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rayidali.com";
const W = { border: "2px solid #000", boxShadow: "inset -2px -2px 0 #7a7a8a, inset 2px 2px 0 #fff, 8px 8px 0 rgba(0,0,0,.5)", background: "#f4efe2", color: "#0b0b0f", marginBottom: 26 } as const;
const TB = { display: "flex", alignItems: "center", padding: "4px 10px", margin: 2, background: "linear-gradient(90deg,#000a5c,#1b3ae6)", color: "#fff", fontFamily: "var(--font-vt)", fontSize: 21 } as const;
const BODY = { padding: 16, fontSize: 14 } as const;
const IN = { border: "2px solid #000", boxShadow: "inset 2px 2px 0 #7a7a8a", padding: "6px 8px", background: "#fff", fontFamily: "var(--font-mono)", fontSize: 14, color: "#000" } as const;
const TH = { textAlign: "left", fontFamily: "var(--font-vt)", fontSize: 18, borderBottom: "2px solid #000", padding: "4px 8px" } as const;
const TD = { padding: "5px 8px", borderBottom: "1px solid #d9d2bd", verticalAlign: "top" } as const;

export default async function Admin() {
  if (!supabaseConfigured) return <Shell><p>Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.</p></Shell>;
  const user = await requireAdmin();
  if (!user) redirect("/admin/login");
  const db = adminClient()!;

  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const [{ data: events }, { data: refs }, { data: resumes }, { count: week }, { count: resumeOpens }] = await Promise.all([
    db.from("events").select("id,ts,event,path,ref,props,country,city,referrer,ua").order("ts", { ascending: false }).limit(250),
    db.from("ref_codes").select("*").order("created_at", { ascending: false }),
    db.from("resumes").select("*").order("created_at", { ascending: false }),
    db.from("events").select("id", { count: "exact", head: true }).eq("event", "page_view").gte("ts", since),
    db.from("events").select("id", { count: "exact", head: true }).eq("event", "resume_open").gte("ts", since),
  ]);
  const byRef = new Map<string, number>();
  (events || []).forEach((e) => { if (e.ref) byRef.set(e.ref, (byRef.get(e.ref) || 0) + 1); });
  const label = (code: string | null) => { const r = (refs || []).find((x) => x.code === code); return r ? `${r.company || r.label}` : code || "direct"; };
  const variants = Array.from(new Set(["default", ...(resumes || []).map((r) => r.variant), ...(refs || []).map((r) => r.resume_variant)]));

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--font-vt)", fontSize: 26, color: "#efe8d6" }}>C:\RAYID\ADMIN &nbsp;·&nbsp; {user.email}</div>
        <form action={signOut}><button className="btn">log off</button></form>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 26 }}>
        <Stat n={week ?? 0} l="visits, last 7 days" /><Stat n={resumeOpens ?? 0} l="résumé opens, 7 days" /><Stat n={(refs || []).length} l="tracked links" />
      </div>

      <div style={W}>
        <div style={TB}>NEW_LINK.EXE</div>
        <div style={BODY}>
          <form action={createRef} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1fr 1fr .8fr auto", gap: 8, alignItems: "end" }}>
            <L t="label"><input name="label" required placeholder="Stripe, MLE, Sept 2" style={IN} /></L>
            <L t="company"><input name="company" placeholder="Stripe" style={IN} /></L>
            <L t="channel"><input name="channel" placeholder="application / email / linkedin" style={IN} /></L>
            <L t="résumé variant"><select name="variant" style={IN}>{variants.map((v) => <option key={v}>{v}</option>)}</select></L>
            <L t="code (blank = random)"><input name="code" placeholder="a7f3k" style={IN} /></L>
            <button className="btn blue" type="submit">create</button>
          </form>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
            <thead><tr><th style={TH}>link</th><th style={TH}>who</th><th style={TH}>channel</th><th style={TH}>variant</th><th style={TH}>hits</th><th style={TH}>events</th><th style={TH}></th></tr></thead>
            <tbody>{(refs || []).map((r) => (
              <tr key={r.code}>
                <td style={TD}><code>{SITE}/r/{r.code}</code><br /><small style={{ color: "#4a5080" }}>résumé: {SITE}/r/{r.code}?to=resume</small></td>
                <td style={TD}>{r.company || ""}<br /><small>{r.label}</small></td>
                <td style={TD}>{r.channel || ""}</td><td style={TD}>{r.resume_variant}</td><td style={TD}>{r.hits}</td><td style={TD}>{byRef.get(r.code) || 0}</td>
                <td style={TD}><form action={deleteRef}><input type="hidden" name="code" value={r.code} /><button className="btn" style={{ fontSize: 16, padding: "4px 10px" }}>delete</button></form></td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>

      <div style={W}>
        <div style={TB}>RESUMES.DIR</div>
        <div style={BODY}>
          <form action={uploadResume} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr auto auto", gap: 8, alignItems: "end" }}>
            <L t="variant (ai / product / fullstack)"><input name="variant" placeholder="default" style={IN} /></L>
            <L t="label"><input name="label" placeholder="AI engineer, v5" style={IN} /></L>
            <L t="pdf"><input name="file" type="file" accept="application/pdf" required style={{ ...IN, padding: 4 }} /></L>
            <label style={{ fontFamily: "var(--font-vt)", fontSize: 18 }}><input name="active" type="checkbox" defaultChecked /> make active</label>
            <button className="btn blue" type="submit">upload</button>
          </form>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
            <thead><tr><th style={TH}>variant</th><th style={TH}>label</th><th style={TH}>file</th><th style={TH}>active</th><th style={TH}></th></tr></thead>
            <tbody>{(resumes || []).map((r) => (
              <tr key={r.id}>
                <td style={TD}>{r.variant}</td><td style={TD}>{r.label}</td>
                <td style={TD}><a href={r.file_url} target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>open</a></td>
                <td style={TD}>{r.active ? "● active" : <form action={activateResume}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="variant" value={r.variant} /><button className="btn" style={{ fontSize: 16, padding: "4px 10px" }}>activate</button></form>}</td>
                <td style={TD}><form action={deleteResume}><input type="hidden" name="id" value={r.id} /><button className="btn" style={{ fontSize: 16, padding: "4px 10px" }}>delete</button></form></td>
              </tr>))}</tbody>
          </table>
          <p style={{ marginTop: 10, color: "#4a5080" }}>Visitors always hit <code>{SITE}/resume</code>. It serves the active file for their ref code's variant, falls back to default, and logs the open.</p>
        </div>
      </div>

      <div style={W}>
        <div style={TB}>VISITS.LOG &nbsp;(last 250 events)</div>
        <div style={{ ...BODY, maxHeight: 620, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr><th style={TH}>when</th><th style={TH}>event</th><th style={TH}>who</th><th style={TH}>where</th><th style={TH}>detail</th></tr></thead>
            <tbody>{(events || []).map((e) => (
              <tr key={e.id}>
                <td style={{ ...TD, whiteSpace: "nowrap" }}>{new Date(e.ts).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                <td style={TD}><b>{e.event}</b></td>
                <td style={TD}>{label(e.ref)}</td>
                <td style={TD}>{[e.city, e.country].filter(Boolean).join(", ")}</td>
                <td style={{ ...TD, maxWidth: 420, wordBreak: "break-word", color: "#4a5080" }}>{detail(e)}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}

function detail(e: any): string {
  const p = e.props || {};
  if (e.event === "section_dwell" && p.dwell) return Object.entries(p.dwell).map(([k, v]) => `${k} ${Math.round(Number(v) / 1000)}s`).join(" · ");
  if (e.event === "outbound_click") return `${p.target}`;
  if (e.event === "scroll_depth") return `${p.depth}%`;
  if (e.event === "section_view") return `${p.section}`;
  if (e.event === "page_view") return `${p.w}×${p.h}${e.referrer ? " · from " + e.referrer : ""}`;
  if (e.event === "resume_open") return `${p.variant}`;
  if (e.event === "puzzle_word") return `${p.word}`;
  return "";
}

function Stat({ n, l }: { n: number; l: string }) {
  return <div style={{ ...W, marginBottom: 0, padding: 16 }}><div style={{ fontFamily: "var(--font-vt)", fontSize: 46, lineHeight: 1 }}>{n}</div><div style={{ color: "#4a5080" }}>{l}</div></div>;
}
function L({ t, children }: { t: string; children: React.ReactNode }) {
  return <label style={{ display: "grid", gap: 4, fontFamily: "var(--font-vt)", fontSize: 17 }}>{t}{children}</label>;
}
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="legal" style={{ maxWidth: 1100 }}>{children}</div>;
}
