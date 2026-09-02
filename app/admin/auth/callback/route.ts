import { NextResponse, type NextRequest } from "next/server";
import { sessionClient } from "@/lib/supabase";
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const sb = await sessionClient();
  if (code && sb) await sb.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
}
