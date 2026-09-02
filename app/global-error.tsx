"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html lang="en"><body style={{ background: "#000a5c", color: "#fff", fontFamily: "monospace", padding: 48 }}>
      <pre>{"RAYID.EXE has stopped responding.\n\n> a fatal exception has occurred.\n> press F5 to restart, or email me and I'll fix it."}</pre>
    </body></html>
  );
}
