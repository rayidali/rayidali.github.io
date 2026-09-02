import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { adminClient } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED = new Set(["page_view", "section_view", "section_dwell", "scroll_depth", "outbound_click", "mail_click", "puzzle_word", "window_drag", "consent"]);
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegram|discord|slack|headless|lighthouse|pingdom|gtmetrix/i;

/** First-party event sink. Silent no-op when Supabase is not configured. */
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return new NextResponse(null, { status: 204 }); }
  const event = String(body?.event || "");
  if (!ALLOWED.has(event)) return new NextResponse(null, { status: 204 });
  const ua = req.headers.get("user-agent") || "";
  if (BOT.test(ua)) return new NextResponse(null, { status: 204 });
  const db = adminClient();
  if (!db) return new NextResponse(null, { status: 204 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  const ipHash = ip ? createHash("sha256").update(ip + (process.env.SUPABASE_SERVICE_ROLE_KEY || "").slice(0, 16)).digest("hex").slice(0, 24) : null;
  const ref = typeof body.ref === "string" ? body.ref.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || null : null;

  await db.from("events").insert({
    event,
    path: String(body.path || "/").slice(0, 300),
    sid: String(body.sid || "").slice(0, 64) || null,
    ref,
    props: typeof body.props === "object" && body.props ? body.props : {},
    ua: ua.slice(0, 300),
    referrer: (req.headers.get("referer") || (typeof body.props?.referrer === "string" ? body.props.referrer : "") || "").slice(0, 300) || null,
    country: req.headers.get("x-vercel-ip-country"),
    city: req.headers.get("x-vercel-ip-city"),
    ip_hash: ipHash,
  });
  return new NextResponse(null, { status: 204 });
}
