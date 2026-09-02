import type { MetadataRoute } from "next";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://rayidali.com";
const bots = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "CCBot", "Applebot", "Applebot-Extended", "Bytespider", "meta-externalagent", "Amazonbot", "DuckAssistBot", "cohere-ai", "MistralAI-User"];
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/api/", "/ingest/"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }, ...bots.map((userAgent) => ({ userAgent, allow: "/", disallow }))],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
