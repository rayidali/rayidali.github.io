import fs from "node:fs";
const ENV = ".env.local";
const env = Object.fromEntries(fs.readFileSync(ENV,"utf8").split("\n").map(l=>l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map(m=>[m[1],m[2]]));
const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates`).then(r=>r.json());
const chats = (r.result||[]).map(x=>(x.message||x.edited_message||x.my_chat_member||{}).chat).filter(c=>c&&c.type==="private");
const chat = chats.pop();
if (!chat) { console.log("no private message found yet (updates: " + (r.result||[]).length + ")"); process.exit(1); }
let t = fs.readFileSync(ENV,"utf8"); t = t.replace(/^TELEGRAM_CHAT_ID=.*$/m, `TELEGRAM_CHAT_ID=${chat.id}`); fs.writeFileSync(ENV,t);
console.log(`chat id ${chat.id} (@${chat.username||chat.first_name||"?"}) written to .env.local`);
const s = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ chat_id: chat.id, text: "RAYID.EXE connected.\n\nEvery Monday morning the weekly report lands here. You also get an instant ping when someone opens a tracked link or the résumé." }) }).then(r=>r.json());
console.log("hello:", s.ok ? "sent" : JSON.stringify(s).slice(0,120));
