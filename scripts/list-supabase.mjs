import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").map(l=>l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map(m=>[m[1],m[2]]));
const r = await fetch("https://api.supabase.com/v1/projects", { headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` } });
const list = await r.json();
for (const p of list) {
  const q = await fetch(`https://api.supabase.com/v1/projects/${p.id}/database/query`, { method:"POST", headers:{ Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "content-type":"application/json"}, body: JSON.stringify({ query: "select to_regclass('public.ref_codes') as t" }) });
  const j = await q.json().catch(()=>null);
  console.log(`${p.id}  ${p.name.padEnd(24)} ${p.region.padEnd(14)} ${p.status.padEnd(16)} ref_codes: ${Array.isArray(j)&&j[0]?.t ? "yes" : "no"}`);
}
