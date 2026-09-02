#!/usr/bin/env node
/** Push .env.local to the linked Vercel project (production + preview). Skips setup-only keys. */
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const SKIP = new Set(["SUPABASE_ACCESS_TOKEN", "SUPABASE_PROJECT_REF"]);
const lines = fs.readFileSync(".env.local", "utf8").split("\n");
for (const line of lines) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m || SKIP.has(m[1]) || m[2] === "") continue;
  for (const target of ["production", "preview"]) {
    try { execFileSync("npx", ["vercel", "env", "rm", m[1], target, "--yes"], { stdio: "ignore" }); } catch {}
    execFileSync("npx", ["vercel", "env", "add", m[1], target, "--force"], { input: m[2], stdio: ["pipe", "ignore", "inherit"] });
  }
  console.log("set", m[1]);
}
