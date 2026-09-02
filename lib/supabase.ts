import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(URL && ANON);

/** Service-role client for server-side writes (events, ref codes, resumes). Null when not configured. */
export function adminClient(): SupabaseClient | null {
  if (!URL || !SERVICE) return null;
  return createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Cookie-aware client for the admin login session. Null when not configured. */
export async function sessionClient() {
  if (!URL || !ANON) return null;
  const store = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* read-only context */ }
      },
    },
  });
}

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "rayidali3@gmail.com").toLowerCase();
