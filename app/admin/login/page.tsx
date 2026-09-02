import type { Metadata } from "next";
import { sendMagicLink } from "../actions";

export const metadata: Metadata = { title: "log in", robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ sent?: string; e?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="legal" style={{ maxWidth: 520 }}>
      <div className="win">
        <div className="tb">LOG ON TO RAYID.EXE</div>
        <div className="body">
          {sp.sent ? (
            <p>Check your inbox. The link signs you in and drops you on the admin desk.</p>
          ) : (
            <form action={sendMagicLink} style={{ display: "grid", gap: 10 }}>
              <label style={{ fontFamily: "var(--font-vt)", fontSize: 19 }}>user name</label>
              <input name="email" type="email" required placeholder="you@…" className="field" style={{ width: "100%" }} />
              {sp.e === "nope" && <p style={{ color: "#d43a3a" }}>That user is not on this machine.</p>}
              {sp.e === "send" && <p style={{ color: "#d43a3a" }}>Could not send the link. Check the Supabase auth settings.</p>}
              {sp.e === "unconfigured" && <p style={{ color: "#d43a3a" }}>Supabase is not configured.</p>}
              <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="btn blue" type="submit">send magic link</button></div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
