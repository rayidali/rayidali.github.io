import type { Metadata } from "next";

export const metadata: Metadata = { title: "terms", description: "Terms of use for rayidali.com.", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <div className="legal">
      <div className="win">
        <div className="tb">TERMS.TXT</div>
        <div className="body">
          <p><b>Last updated: September 2026.</b> Short, because there is not much to say.</p>
          <h2>What this is</h2>
          <p>rayidali.com is the personal portfolio of Rayid Ali. It exists to show work and make it easy to get in touch. It is not a product and nothing on it is professional advice.</p>
          <h2>Content</h2>
          <p>Text, drawings, code and design on this site are mine unless noted. You are welcome to link to it, quote it with credit, and take inspiration from it. Please do not republish it wholesale or pass it off as your own. Project names belong to their projects; the IEEE paper is published under IEEE's terms.</p>
          <h2>Links</h2>
          <p>Links lead to sites I do not control (GitHub, LinkedIn, IEEE Xplore, the project sites). Their terms apply there.</p>
          <h2>No warranty</h2>
          <p>The site is provided as is. It may be down, broken, or mid-redesign at any time. The boot screen is decorative. No floppy disks were harmed.</p>
          <h2>Privacy</h2>
          <p>See <a href="/privacy" style={{ textDecoration: "underline" }}>privacy</a> for what is collected and how to opt out.</p>
          <h2>Contact</h2>
          <p>Use the mail button on the home page.</p>
        </div>
      </div>
      <p style={{ marginTop: 18 }}><a href="/" className="btn">← back to the desktop</a></p>
    </div>
  );
}
