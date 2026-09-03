"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Scene3 } from "./scene";

/**
 * Everything that moves. The markup is server-rendered in lib/desktop.html; this
 * attaches behaviour to it. Every block is isolated with its own try/catch so one
 * failure can never blank the page, and three.js is loaded lazily after the boot
 * screen so the desktop is interactive before the 3D world exists.
 */
export default function Desktop() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const on = (t: EventTarget, ev: string, fn: any, o?: any) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };
    const safe = (name: string, fn: () => void) => { try { fn(); } catch (err) { console.error("desktop:" + name, err); try { (window as any).__sentry?.captureException(err, { tags: { block: name } }); } catch { /* ignore */ } } };
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 760;

    /* ---------- terminal typing ---------- */
    let termStarted = false;
    const startTerm = () => safe("terminal", () => {
      if (termStarted) return;
      termStarted = true;
      const term = document.getElementById("term");
      if (!term) return;
      const script: Array<[string, string]> = [
        ["p", "> whoami"], ["o", "rayid. ai engineer. builds, ships, repeats."],
        ["p", "> ls ~/shipped"], ["o", "cinechrony/   iedit/   pdf2video/"],
        ["p", "> cat status.txt"], ["o", "building. always."],
        ["p", "> _"],
      ];
      term.textContent = "";
      let i = 0;
      const typeLine = () => {
        if (i >= script.length) return;
        const [kind, text] = script[i];
        const el = document.createElement("div");
        el.className = kind;
        term.appendChild(el);
        let j = 0;
        const tick = () => {
          el.textContent = text.slice(0, j);
          j++;
          if (j <= text.length) window.setTimeout(tick, reduce ? 0 : kind === "p" ? 55 : 18);
          else { i++; window.setTimeout(typeLine, 320); }
        };
        tick();
      };
      typeLine();
    });

    /* ---------- boot screen ---------- */
    let booted = false;
    const afterBoot: Array<() => void> = [];
    const endBoot = () => safe("boot-end", () => {
      if (booted) return;
      booted = true;
      document.getElementById("boot")?.classList.add("off");
      startTerm();
      afterBoot.forEach((f) => f());
    });
    safe("boot", () => {
      const log = document.getElementById("bootlog");
      const lines = ["> loading portfolio ........ OK", "> mounting projects ........ OK", "> ascii art ................ OK", "> coffee ................... LOW", "> press any key to continue"];
      let li = 0;
      const nextLine = () => {
        if (booted || !log) return;
        if (li < lines.length) { log.textContent += lines[li] + "\n"; li++; window.setTimeout(nextLine, li === lines.length ? 420 : 170); }
        else endBoot();
      };
      let seen = false;
      try { seen = sessionStorage.getItem("rayid.booted") === "1"; sessionStorage.setItem("rayid.booted", "1"); } catch { /* ignore */ }
      if (seen || reduce) window.setTimeout(endBoot, 0);
      else { window.setTimeout(nextLine, 200); window.setTimeout(endBoot, 2400); }
      on(window, "keydown", endBoot, { once: true });
      on(window, "pointerdown", endBoot, { once: true });
    });
    /* belt and braces: nothing may ever leave the boot screen up */
    window.setTimeout(endBoot, 3500);

    /* ---------- reveals ---------- */
    safe("reveals", () => {
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      document.querySelectorAll(".rev").forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
      /* if an observer ever misbehaves, reveal everything anyway */
      window.setTimeout(() => document.querySelectorAll(".rev:not(.in)").forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in"); }), 2500);
    });

    /* ---------- taskbar tabs, clock, scroll progress ---------- */
    let scrollP = 0;
    safe("taskbar", () => {
      const secs = ["top", "story", "work", "paper", "mail"];
      const tabs = document.querySelectorAll(".tab");
      const tio = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = secs.indexOf((e.target as HTMLElement).id);
          if (idx >= 0) tabs.forEach((t, k) => t.classList.toggle("on", k === idx));
        });
      }, { threshold: 0.25 });
      secs.forEach((id) => { const s = document.getElementById(id); if (s) tio.observe(s); });
      cleanups.push(() => tio.disconnect());
      const pct = document.getElementById("pct");
      const depthHit = new Set<number>();
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          scrollP = Math.min(1, window.scrollY / docH);
          if (pct) pct.textContent = "page " + Math.round(scrollP * 100) + "%";
          [25, 50, 75, 100].forEach((d) => { if (scrollP * 100 >= d && !depthHit.has(d)) { depthHit.add(d); track("scroll_depth", { depth: d }); } });
        });
      };
      on(window, "scroll", onScroll, { passive: true });
      onScroll();
      const clockEl = document.getElementById("clock");
      const clock = () => { const d = new Date(); if (clockEl) clockEl.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
      clock();
      const t = window.setInterval(clock, 15000);
      cleanups.push(() => window.clearInterval(t));
    });

    /* ---------- section views + dwell ---------- */
    safe("dwell", () => {
      const dwell: Record<string, number> = {};
      const visibleSince: Record<string, number> = {};
      const sio = new IntersectionObserver((es) => {
        es.forEach((e) => {
          const id = (e.target as HTMLElement).id;
          if (e.isIntersecting) { visibleSince[id] = performance.now(); if (!(id in dwell)) { dwell[id] = 0; track("section_view", { section: id }); } }
          else if (visibleSince[id]) { dwell[id] = (dwell[id] || 0) + (performance.now() - visibleSince[id]); delete visibleSince[id]; }
        });
      }, { threshold: 0.4 });
      ["top", "story", "work", "paper", "play", "mail"].forEach((id) => { const s = document.getElementById(id); if (s) sio.observe(s); });
      cleanups.push(() => sio.disconnect());
      const flush = () => {
        const now = performance.now();
        Object.keys(visibleSince).forEach((id) => { dwell[id] = (dwell[id] || 0) + (now - visibleSince[id]); visibleSince[id] = now; });
        const out: Record<string, number> = {};
        Object.keys(dwell).forEach((k) => { out[k] = Math.round(dwell[k]); });
        track("section_dwell", { dwell: out, total_ms: Math.round(performance.now()) }, { beacon: true });
      };
      on(window, "pagehide", flush);
      on(document, "visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
    });

    /* ---------- outbound + mail clicks ---------- */
    safe("clicks", () => {
      on(document, "click", (e: MouseEvent) => {
        const a = (e.target as HTMLElement).closest("a[data-out]") as HTMLAnchorElement | null;
        if (a) track("outbound_click", { target: a.getAttribute("data-out"), href: a.href });
      });
      const send = document.getElementById("sendbtn");
      if (send) on(send, "click", (e: Event) => {
        e.preventDefault();
        const who = ["rayidali3", "gmail", "com"];
        const to = who[0] + "@" + who[1] + "." + who[2];
        const subj = (document.getElementById("subj")?.textContent || "Hello Rayid").trim();
        const body = (document.getElementById("bodytxt") as HTMLTextAreaElement | null)?.value || "";
        track("mail_click");
        window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
      });
    });

    /* ---------- draggable windows (desktop) ---------- */
    if (fine) safe("drag", () => {
      let zTop = 20, dragged = false;
      document.querySelectorAll<HTMLElement>(".win > .tb").forEach((tb) => {
        const win = tb.parentNode as HTMLElement;
        if (win.closest(".proj") || win.id === "consent") return;
        let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
        on(tb, "pointerdown", (e: PointerEvent) => {
          if ((e.target as HTMLElement).closest(".b")) return;
          dragging = true; sx = e.clientX - ox; sy = e.clientY - oy;
          win.style.zIndex = String(++zTop); win.classList.add("drag");
          tb.setPointerCapture(e.pointerId); e.preventDefault();
        });
        on(tb, "pointermove", (e: PointerEvent) => {
          if (!dragging) return;
          ox = e.clientX - sx; oy = e.clientY - sy;
          win.style.transform = "translate(" + ox + "px," + oy + "px)";
          if (!dragged) { dragged = true; track("window_drag"); }
        });
        ["pointerup", "pointercancel"].forEach((ev) => on(tb, ev, () => { dragging = false; win.classList.remove("drag"); }));
      });
    });

    /* ---------- word search ---------- */
    safe("puzzle", () => {
      const cells = document.querySelectorAll<HTMLElement>("#xg i[data-w]");
      const has = (c: HTMLElement, name: string) => ("," + c.getAttribute("data-w") + ",").indexOf("," + name + ",") >= 0;
      document.querySelectorAll<HTMLElement>("#wl span").forEach((w) => {
        const name = w.getAttribute("data-w") || "";
        on(w, "mouseenter", () => { w.classList.add("on"); cells.forEach((c) => { if (has(c, name)) c.classList.add("hi"); }); });
        on(w, "mouseleave", () => { w.classList.remove("on"); cells.forEach((c) => c.classList.remove("hi")); });
        on(w, "click", () => { cells.forEach((c) => { if (has(c, name)) c.classList.toggle("found"); }); track("puzzle_word", { word: name }); });
      });
    });

    /* ---------- pointer parallax (foreground layers + camera) ---------- */
    const layers = Array.from(document.querySelectorAll<HTMLElement>(".px"));
    let mx = 0, my = 0, tx = 0, ty = 0;
    if (fine) on(window, "pointermove", (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    /* ---------- three.js, loaded after boot (and after idle on phones) ---------- */
    let scene3: Scene3 | null = null;
    const canvas = document.getElementById("bg") as HTMLCanvasElement | null;
    const nav = navigator as any;
    /* privacy tools (DuckDuckGo extension, Firefox RFP, Tor, Brave) report exactly 2 cores on any machine, so only a single core counts as weak */
    const lowEnd = Boolean(nav.connection?.saveData) || (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) || (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 2);
    const startThree = () => {
      if (!canvas || reduce || lowEnd) { canvas?.classList.add("fallback"); return; }
      const go = () => import("./scene")
        .then(({ buildScene }) => { safe("three", () => { scene3 = buildScene(canvas, small); }); if (!scene3) canvas.classList.add("fallback"); })
        .catch((err) => { canvas.classList.add("fallback"); console.error(err); });
      if (small && "requestIdleCallback" in window) (window as any).requestIdleCallback(go, { timeout: 3000 });
      else if (small) window.setTimeout(go, 1500);
      else go();
    };
    if (booted) startThree(); else afterBoot.push(startThree);
    on(window, "resize", () => scene3?.resize(), { passive: true });

    /* ---------- one animation loop, paused when the tab is hidden ---------- */
    let raf = 0, running = true;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
      if (fine && !reduce) for (let i = 0; i < layers.length; i++) {
        const d = parseFloat(layers[i].getAttribute("data-depth") || "10");
        layers[i].style.transform = "translate3d(" + (-mx * d) + "px," + (-my * d) + "px,0)";
      }
      scene3?.render(t * 0.001, scrollP, mx, my, !reduce);
    };
    raf = requestAnimationFrame(frame);
    on(document, "visibilitychange", () => { running = document.visibilityState === "visible"; });
    cleanups.push(() => cancelAnimationFrame(raf));
    cleanups.push(() => scene3?.dispose());

    safe("page_view", () => track("page_view", { ref: (window as any).__ref ?? null, w: window.innerWidth, h: window.innerHeight, referrer: document.referrer || null }));

    return () => { cleanups.forEach((f) => { try { f(); } catch { /* ignore */ } }); };
  }, []);

  return null;
}
