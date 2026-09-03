"use client";

/**
 * Client-side event tracking.
 * Every event goes two places: PostHog (if configured) and our own
 * first-party /api/track endpoint (Supabase). Neither is required.
 */

type Props = Record<string, unknown>;

declare global {
  interface Window {
    posthog?: { capture: (e: string, p?: Props) => void };
    clarity?: (...args: unknown[]) => void;
    __ref?: string | null;
  }
}

const SID_KEY = "rayid.sid";

export function sessionId(): string {
  try {
    let s = sessionStorage.getItem(SID_KEY);
    if (!s) {
      s = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(SID_KEY, s);
    }
    return s;
  } catch {
    return "nosession";
  }
}

export function refCode(): string | null {
  try {
    const m = document.cookie.match(/(?:^|;\s*)ref=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
    return localStorage.getItem("rayid.ref");
  } catch {
    return null;
  }
}

export function isOwner(): boolean { try { return /(?:^|;\s*)owner=1/.test(document.cookie); } catch { return false; } }

export function track(event: string, props: Props = {}, opts: { beacon?: boolean } = {}) {
  if (isOwner()) return;
  const payload = {
    event,
    props,
    sid: sessionId(),
    ref: refCode(),
    path: location.pathname + location.search,
    ts: Date.now(),
  };
  try {
    window.posthog?.capture(event, { ...props, ref: payload.ref });
  } catch {
    /* ignore */
  }
  try {
    const body = JSON.stringify(payload);
    if (opts.beacon && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}
