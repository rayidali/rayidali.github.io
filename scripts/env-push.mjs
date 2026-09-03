#!/usr/bin/env node
/** Push .env.local to the linked Vercel project (production + preview). Skips setup-only keys. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const SKIP = new Set(["SUPABASE_ACCESS_TOKEN", "SUPABASE_PROJECT_REF", "SUPABASE_DB_PASSWORD", "VERCEL_OIDC_TOKEN"]);
let ok = 0, bad = 0;
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m || SKIP.has(m[1])) continue;
  const value = m[2].replace(/^"(.*)"$/, "$1");
  if (value === "") continue;
  for (const target of ["production", "preview"]) {
    const r = spawnSync("npx", ["vercel", "env", "add", m[1], target, "--force"], { input: value, encoding: "utf8" });
    if (r.status === 0) ok++; else { bad++; console.log(`! ${m[1]} ${target}: ${(r.stderr || r.stdout || "").split("\n").filter(Boolean).slice(-2).join(" | ")}`); }
  }
  console.log("set", m[1]);
}
console.log(`done: ${ok} set, ${bad} failed`);
