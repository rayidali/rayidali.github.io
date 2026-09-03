import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase";
import { ping } from "@/lib/telegram";

export const runtime = "nodejs";

/** Tracked entry link: /r/CODE sets a ref cookie, logs the hit, then redirects. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code: raw } = await ctx.params;
  const code = (raw || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  const to = req.nextUrl.searchParams.get("to");
  const dest = to === "resume" ? "/resume" : "/";
  const res = NextResponse.redirect(new URL(dest, req.nextUrl.origin), 302);
  if (!code) return res;
  if (code === "me") {
    /* the owner: mark this browser so none of its visits are logged */
    res.cookies.set("owner", "1", { maxAge: 60 * 60 * 24 * 365, path: "/", sameSite: "lax" });
    res.cookies.set("ref", "", { maxAge: 0, path: "/" });
    return res;
  }
  if (req.cookies.get("owner")?.value === "1") return res;
  res.cookies.set("ref", code, { maxAge: 60 * 60 * 24 * 365, path: "/", sameSite: "lax" });

  const db = adminClient();
  if (db) {
    const h = req.headers;
    const [{ data: rc }] = await Promise.all([
      db.from("ref_codes").select("code,label,company").eq("code", code).maybeSingle(),
      db.from("events").insert({
        event: "ref_hit", path: "/r/" + code, ref: code, sid: null,
        props: { to: dest }, ua: h.get("user-agent"), referrer: h.get("referer"),
        country: h.get("x-vercel-ip-country"), city: h.get("x-vercel-ip-city"),
      }),
    ]);
    if (rc) await db.rpc("bump_ref_hits", { p_code: code }).then(() => undefined, () => undefined);
    void ping(`👀 ${rc?.company || rc?.label || code} just opened your portfolio${dest === "/resume" ? " (résumé link)" : ""} · ${h.get("x-vercel-ip-city") || "?"}, ${h.get("x-vercel-ip-country") || "?"}`);
  }
  return res;
}
