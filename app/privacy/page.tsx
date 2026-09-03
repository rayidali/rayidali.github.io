import type { Metadata } from "next";

export const metadata: Metadata = { title: "privacy", description: "What rayidali.com collects, why, and how to opt out.", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <div className="legal">
      <div className="win">
        <div className="tb">PRIVACY.TXT</div>
        <div className="body">
          <p><b>Last updated: September 2026.</b> This is a personal portfolio. Here is everything it does with your data, in plain words.</p>

          <h2>What is collected without asking</h2>
          <ul>
            <li><b>Cookieless analytics (PostHog).</b> Page views, which sections you scroll to, how long you stay, and which links you click. Held in memory only, so no cookie is set and nothing follows you across sites. Requests go through this domain, not a third party domain.</li>
            <li><b>A first-party visit log.</b> The same events are stored in a database I run (Supabase), with your approximate city and country (derived from your IP by the hosting provider), your browser's user agent, and a one-way hash of your IP that I use only to tell visits apart. The IP itself is not stored.</li>
            <li><b>Tracked links.</b> If you arrived through a link like <code>/r/abc12</code>, that code is stored in a cookie for a year so I know which application or conversation a visit came from, and which résumé variant to show you. The code is opaque and maps to a label only I can see.</li>
            <li><b>Errors.</b> If something breaks, a technical error report goes to Sentry with no personal data.</li>
            <li><b>Résumé.</b> Opening the résumé page, viewing the PDF, and downloading it are each logged (with the tracked-link code if you have one), because knowing who read it is the point of this site.</li>
          </ul>

          <h2>What you can switch off</h2>
          <ul>
            <li><b>Session replay (Microsoft Clarity).</b> On by default. It records anonymous replays and heatmaps (no keystrokes, no form contents) and sets its own cookies (<code>_clck</code>, <code>_clsk</code>). Press "turn replays off" in the dialog, or "cookie settings" at the bottom of the page, and it stops. Microsoft's terms: <a href="https://privacy.microsoft.com/privacystatement" rel="noopener" style={{ textDecoration: "underline" }}>privacy.microsoft.com</a>.</li>
          </ul>

          <h2>What is not collected</h2>
          <p>No account, no email address unless you write to me, nothing typed into the mail window (it opens your own mail app and never leaves your device until you press send there), no ads, no selling or sharing of data.</p>

          <h2>Retention</h2>
          <p>Visit logs are kept for up to 12 months and then deleted. Analytics providers keep aggregate data under their own policies.</p>

          <h2>Your rights</h2>
          <p>Ask me to delete anything tied to you and I will. Since I do not know who you are, tell me roughly when you visited and from where. Use the mail button on the home page.</p>

          <h2>Providers</h2>
          <p>Vercel (hosting), Supabase (database), PostHog (analytics), Microsoft Clarity (session replay, with consent), Sentry (error reporting), Google Fonts (typefaces).</p>
        </div>
      </div>
      <p style={{ marginTop: 18 }}><a href="/" className="btn">← back to the desktop</a></p>
    </div>
  );
}
