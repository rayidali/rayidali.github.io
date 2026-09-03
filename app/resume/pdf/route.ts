import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { adminClient } from "@/lib/supabase";
import { ping } from "@/lib/telegram";

export const runtime = "nodejs";

/**
 * The PDF itself. Picks the résumé variant tied to the visitor's ref code (falls back to
 * default, then to the file shipped with the site), streams it inline, or as a download
 * with ?dl=1. Both are logged as their own events so the digest can tell them apart.
 */
export async function GET(req: NextRequest) {
  const download = req.nextUrl.searchParams.get("dl") === "1";
  const ref = req.cookies.get("ref")?.value || null;
  const h = req.headers;
  let fileUrl = "/resume.pdf";
  let variant = "fallback";
  let who = ref || "someone";

  const db = adminClient();
  if (db) {
    try {
      let want = "default";
      if (ref) {
        const { data: rc } = await db.from("ref_codes").select("resume_variant,company,label").eq("code", ref).maybeSingle();
        if (rc?.resume_variant) want = rc.resume_variant;
        who = rc?.company || rc?.label || ref;
      }
      let { data: r } = await db.from("resumes").select("file_url,variant").eq("active", true).eq("variant", want).maybeSingle();
      if (!r && want !== "default") ({ data: r } = await db.from("resumes").select("file_url,variant").eq("active", true).eq("variant", "default").maybeSingle());
      if (r?.file_url) { fileUrl = r.file_url; variant = r.variant; }
      const ua = h.get("user-agent") || "";
      if (!/bot|crawl|spider|preview|headless/i.test(ua)) {
        await db.from("events").insert({
          event: download ? "resume_download" : "resume_pdf", path: "/resume/pdf", ref, props: { variant, url: fileUrl },
          ua: ua.slice(0, 300), referrer: h.get("referer"), country: h.get("x-vercel-ip-country"), city: h.get("x-vercel-ip-city"),
        });
        void ping(`${download ? "⤓" : "📄"} ${who} ${download ? "downloaded" : "opened"} your résumé PDF (${variant}) · ${h.get("x-vercel-ip-city") || "?"}, ${h.get("x-vercel-ip-country") || "?"}`);
      }
    } catch (e) { console.error("resume/pdf", e); }
  }

  let bytes: Uint8Array;
  try {
    if (fileUrl.startsWith("http")) {
      const r = await fetch(fileUrl, { cache: "no-store" });
      if (!r.ok) throw new Error("upstream " + r.status);
      bytes = new Uint8Array(await r.arrayBuffer());
    } else {
      bytes = new Uint8Array(await fs.readFile(path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""))));
    }
  } catch {
    return NextResponse.redirect(new URL("/resume.pdf", req.nextUrl.origin), 302);
  }
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-length": String(bytes.byteLength),
      "content-disposition": `${download ? "attachment" : "inline"}; filename="Rayid_Ali_Resume.pdf"`,
      "cache-control": "private, no-store",
      "x-resume-variant": variant,
    },
  });
}
