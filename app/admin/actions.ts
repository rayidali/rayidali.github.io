"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminClient, sessionClient, ADMIN_EMAIL } from "@/lib/supabase";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rayidali.com";

export async function requireAdmin() {
  const sb = await sessionClient();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  return email && email === ADMIN_EMAIL ? data.user : null;
}

export async function sendMagicLink(form: FormData) {
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (email !== ADMIN_EMAIL) redirect("/admin/login?e=nope");
  const sb = await sessionClient();
  if (!sb) redirect("/admin/login?e=unconfigured");
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${SITE}/admin/auth/callback` } });
  redirect(error ? "/admin/login?e=send" : "/admin/login?sent=1");
}

export async function signOut() {
  const sb = await sessionClient();
  await sb?.auth.signOut();
  redirect("/admin/login");
}

function slug(): string {
  const a = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

export async function createRef(form: FormData) {
  if (!(await requireAdmin())) redirect("/admin/login");
  const db = adminClient();
  if (!db) return;
  const label = String(form.get("label") || "").trim().slice(0, 120);
  if (!label) return;
  const company = String(form.get("company") || "").trim().slice(0, 120) || null;
  const channel = String(form.get("channel") || "").trim().slice(0, 60) || null;
  const resume_variant = String(form.get("variant") || "default").trim().slice(0, 40) || "default";
  let code = String(form.get("code") || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || slug();
  for (let i = 0; i < 5; i++) {
    const { error } = await db.from("ref_codes").insert({ code, label, company, channel, resume_variant });
    if (!error) break;
    code = slug();
  }
  revalidatePath("/admin");
}

export async function deleteRef(form: FormData) {
  if (!(await requireAdmin())) redirect("/admin/login");
  const db = adminClient();
  const code = String(form.get("code") || "");
  if (db && code) await db.from("ref_codes").delete().eq("code", code);
  revalidatePath("/admin");
}

export async function uploadResume(form: FormData) {
  if (!(await requireAdmin())) redirect("/admin/login");
  const db = adminClient();
  if (!db) return;
  const file = form.get("file") as File | null;
  const variant = String(form.get("variant") || "default").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "default";
  const label = String(form.get("label") || variant).trim().slice(0, 120);
  const makeActive = form.get("active") === "on";
  if (!file || file.size === 0 || file.type !== "application/pdf" || file.size > 8 * 1024 * 1024) return;
  const path = `${variant}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await db.storage.from("resumes").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: "application/pdf", upsert: false });
  if (error) return;
  const { data: pub } = db.storage.from("resumes").getPublicUrl(path);
  if (makeActive) await db.from("resumes").update({ active: false }).eq("variant", variant);
  await db.from("resumes").insert({ variant, label, file_url: pub.publicUrl, active: makeActive });
  revalidatePath("/admin");
}

export async function activateResume(form: FormData) {
  if (!(await requireAdmin())) redirect("/admin/login");
  const db = adminClient();
  const id = String(form.get("id") || "");
  const variant = String(form.get("variant") || "");
  if (db && id && variant) {
    await db.from("resumes").update({ active: false }).eq("variant", variant);
    await db.from("resumes").update({ active: true }).eq("id", id);
  }
  revalidatePath("/admin");
}

export async function deleteResume(form: FormData) {
  if (!(await requireAdmin())) redirect("/admin/login");
  const db = adminClient();
  const id = String(form.get("id") || "");
  if (db && id) await db.from("resumes").delete().eq("id", id);
  revalidatePath("/admin");
}
