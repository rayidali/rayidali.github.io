"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { isOwner } from "@/lib/track";

const CONSENT_KEY = "rayid.consent";

/** Microsoft Clarity. Loads by default; the tag CDN is flaky, so it retries. "no thanks" revokes consent. */
function loadClarity(id: string, ref: string | null, attempt = 0) {
  if (!id || (window as any).clarity?.v) return;
  const w = window as any;
  w.clarity = w.clarity || function () { (w.clarity.q = w.clarity.q || []).push(arguments); };
  const t = document.createElement("script");
  t.async = true;
  t.src = "https://www.clarity.ms/tag/" + id + (attempt ? "?r=" + attempt : "");
  t.onerror = () => { t.remove(); if (attempt < 3) window.setTimeout(() => loadClarity(id, ref, attempt + 1), [2000, 5000, 12000][attempt]); };
  t.onload = () => {
    try {
      w.clarity("consent");
      if (ref) { w.clarity("set", "ref", ref); w.clarity("identify", "ref:" + ref); }
    } catch { /* ignore */ }
  };
  document.head.appendChild(t);
}

export default function Analytics() {
  useEffect(() => {
    /* ---- ref code capture: /?r=CODE or the cookie set by /r/CODE ---- */
    let ref: string | null = null;
    try {
      const q = new URLSearchParams(location.search).get("r");
      if (q && /^[a-z0-9_-]{2,40}$/i.test(q)) {
        ref = q.toLowerCase();
        document.cookie = "ref=" + encodeURIComponent(ref) + "; max-age=31536000; path=/; samesite=lax";
        localStorage.setItem("rayid.ref", ref);
        const url = new URL(location.href); url.searchParams.delete("r");
        history.replaceState(null, "", url.pathname + (url.search || "") + url.hash);
      } else {
        const m = document.cookie.match(/(?:^|;\s*)ref=([^;]+)/);
        ref = m ? decodeURIComponent(m[1]) : localStorage.getItem("rayid.ref");
      }
    } catch { /* ignore */ }
    (window as any).__ref = ref;
    if (isOwner()) { document.getElementById("consent")?.classList.add("hidden"); return; }

    /* ---- PostHog, cookieless, proxied through /ingest ---- */
    try {
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (key) {
        posthog.init(key, {
          api_host: "/ingest",
          ui_host: "https://us.posthog.com",
          persistence: "memory",
          person_profiles: "identified_only",
          capture_pageview: true,
          capture_pageleave: true,
          disable_session_recording: true,
          autocapture: true,
        });
        if (ref) { posthog.register({ ref }); posthog.identify("ref:" + ref, { ref }); }
        (window as any).posthog = posthog;
      }
    } catch (e) { console.error("posthog", e); }

    /* ---- Clarity by default, with a visible way out ---- */
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "";
    const box = document.getElementById("consent");
    const show = () => box?.classList.remove("hidden");
    const hide = () => box?.classList.add("hidden");
    let stored: string | null = null;
    try { stored = localStorage.getItem(CONSENT_KEY); } catch { /* ignore */ }
    if (stored !== "no") loadClarity(clarityId, ref);
    if (stored === null) window.setTimeout(show, 3000);

    const ok = (e: Event) => { e.preventDefault(); try { localStorage.setItem(CONSENT_KEY, "yes"); } catch {} hide(); (window as any).posthog?.capture("consent", { value: "yes" }); };
    const no = (e: Event) => {
      e.preventDefault();
      try { localStorage.setItem(CONSENT_KEY, "no"); } catch {}
      try { (window as any).clarity?.("consent", false); } catch {}
      hide();
      (window as any).posthog?.capture("consent", { value: "no" });
    };
    const reopen = (e: Event) => { e.preventDefault(); show(); };
    const bind = (id: string, fn: (e: Event) => void) => { const el = document.getElementById(id); el?.addEventListener("click", fn); return () => el?.removeEventListener("click", fn); };
    const offs = [bind("consentok", ok), bind("consentno", no), bind("consentx", ok), bind("cookiebtn", reopen)];
    return () => offs.forEach((f) => f());
  }, []);
  return null;
}
