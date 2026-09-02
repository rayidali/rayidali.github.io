/** Optional instant ping. No-op unless TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set. */
export async function ping(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    });
  } catch { /* never block a request on a ping */ }
}
