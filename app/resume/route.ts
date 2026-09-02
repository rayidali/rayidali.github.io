import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase";
import { ping } from "@/lib/telegram";

export const runtime = "nodejs";

/** Tracked résumé: picks the variant tied to the visitor's ref code, logs the open, redirects to the PDF. */
export async function GET(req: NextRequest) {
  const ref = req.cookies.get("ref")?.value || null;
  let url = "/resume.pdf";
  let label = "default";
  const db = adminClient();
  if (db) {
    let variant = "default";
    if (ref) {
      const { data: rc } = await db.from("ref_codes").select("resume_variant,company,label").eq("code", ref).maybeSingle();
      if (rc?.resume_variant) variant = rc.resume_variant;
      label = rc?.company || rc?.label || ref;
    }
    let { data: r } = await db.from("resumes").select("file_url,variant").eq("active", true).eq("variant", variant).maybeSingle();
    if (!r && variant !== "default") ({ data: r } = await db.from("resumes").select("file_url,variant").eq("active", true).eq("variant", "default").maybeSingle());
    if (r?.file_url) url = r.file_url;
    const h = req.headers;
    await db.from("events").insert({
      event: "resume_open", path: "/resume", ref, sid: null, props: { variant: r?.variant || "fallback", url },
      ua: h.get("user-agent"), referrer: h.get("referer"), country: h.get("x-vercel-ip-country"), city: h.get("x-vercel-ip-city"),
    });
    void ping(`📄 résumé opened by ${label} · ${h.get("x-vercel-ip-city") || "?"}, ${h.get("x-vercel-ip-country") || "?"}`);
  }
  return NextResponse.redirect(url.startsWith("http") ? url : new URL(url, req.nextUrl.origin), 302);
}
