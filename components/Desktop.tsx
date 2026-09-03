"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { track } from "@/lib/track";

/* eslint-disable @typescript-eslint/no-explicit-any */

type ThreeNS = typeof import("three");
type Scene3 = { render: (time: number, p: number, mx: number, my: number, animate: boolean) => void; resize: () => void; dispose: () => void };

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
    const safe = (name: string, fn: () => void) => { try { fn(); } catch (err) { console.error("desktop:" + name, err); try { Sentry.captureException(err, { tags: { block: name } }); } catch { /* ignore */ } } };
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
        if (li < lines.length) { log.textContent += lines[li] + "\n"; li++; window.setTimeout(nextLine, li === lines.length ? 700 : 260); }
        else endBoot();
      };
      let seen = false;
      try { seen = sessionStorage.getItem("rayid.booted") === "1"; sessionStorage.setItem("rayid.booted", "1"); } catch { /* ignore */ }
      if (seen || reduce) window.setTimeout(endBoot, 0);
      else { window.setTimeout(nextLine, 350); window.setTimeout(endBoot, 4200); }
      on(window, "keydown", endBoot, { once: true });
      on(window, "pointerdown", endBoot, { once: true });
    });
    /* belt and braces: nothing may ever leave the boot screen up */
    window.setTimeout(endBoot, 6000);

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

    /* ---------- three.js, loaded after boot ---------- */
    let scene3: Scene3 | null = null;
    const canvas = document.getElementById("bg") as HTMLCanvasElement | null;
    const startThree = () => {
      if (!canvas || reduce) { canvas?.classList.add("fallback"); return; }
      import("three").then((THREE) => { safe("three", () => { scene3 = buildScene(THREE, canvas, small); }); if (!scene3) canvas.classList.add("fallback"); })
        .catch((err) => { canvas.classList.add("fallback"); console.error(err); });
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

/**
 * The world: a wireframe globe, New York in wire and light, drifting cubes, dust.
 * Every static thing is merged into a handful of buffers (a few draw calls total)
 * instead of one object per building face, which is what made the first version crawl.
 */
function buildScene(THREE: ThreeNS, canvas: HTMLCanvasElement, small: boolean): Scene3 {
  const dpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: dpr < 1.5, powerPreference: "high-performance" });
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x070c22, 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070c22, 0.02);
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 2, 40);

  const disposables: Array<{ dispose: () => void }> = [renderer];
  const lines = (arr: number[], color: number, opacity: number) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    disposables.push(g, m);
    return new THREE.LineSegments(g, m);
  };
  const points = (arr: number[] | Float32Array, color: number, size: number, opacity: number) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    const m = new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true });
    disposables.push(g, m);
    return new THREE.Points(g, m);
  };

  /* ---- globe ---- */
  const G = new THREE.Group();
  const sphere = new THREE.WireframeGeometry(new THREE.SphereGeometry(15, small ? 20 : 28, small ? 14 : 20));
  const globeMat = new THREE.LineBasicMaterial({ color: 0x2f5cff, transparent: true, opacity: 0.32 });
  disposables.push(sphere, globeMat);
  const globe = new THREE.LineSegments(sphere, globeMat);
  G.add(globe);
  const N = small ? 1200 : 2200, sp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 6.283, v = Math.acos(2 * Math.random() - 1), r = 15.15;
    sp[i * 3] = r * Math.sin(v) * Math.cos(u); sp[i * 3 + 1] = r * Math.cos(v); sp[i * 3 + 2] = r * Math.sin(v) * Math.sin(u);
  }
  const pts = points(sp, 0xefe8d6, 0.16, 0.85);
  G.add(pts);
  const ringGeo = new THREE.WireframeGeometry(new THREE.TorusGeometry(22, 0.05, 4, 120));
  const ringMat = new THREE.LineBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.35 });
  disposables.push(ringGeo, ringMat);
  const ring = new THREE.LineSegments(ringGeo, ringMat);
  ring.rotation.x = 1.25;
  G.add(ring);
  G.position.set(12, 2, -6);
  scene.add(G);

  /* ---- New York, merged ---- */
  const BASE = -16;
  const blue: number[] = [], cream: number[] = [], faint: number[] = [], win: number[] = [], beacon: number[] = [];
  let seed = 17;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const unit = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  disposables.push(unit);
  const M = new THREE.Matrix4(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3();
  const pushEdges = (geo: InstanceType<ThreeNS["BufferGeometry"]>, into: number[], pos: [number, number, number], scale: [number, number, number] = [1, 1, 1], rot: [number, number, number] = [0, 0, 0]) => {
    M.compose(V.set(pos[0], pos[1], pos[2]), Q.setFromEuler(E.set(rot[0], rot[1], rot[2])), S.set(scale[0], scale[1], scale[2]));
    const a = (geo.getAttribute("position") as InstanceType<ThreeNS["BufferAttribute"]>).array as ArrayLike<number>;
    for (let i = 0; i < a.length; i += 3) { V.set(a[i], a[i + 1], a[i + 2]).applyMatrix4(M); into.push(V.x, V.y, V.z); }
  };
  const box = (into: number[], w: number, h: number, d: number, x: number, y: number, z: number) => pushEdges(unit, into, [x, y, z], [w, h, d]);
  const frustum = (into: number[], rt: number, rb: number, h: number, seg: number, x: number, y: number, z: number, rot: [number, number, number] = [0, 0, 0]) => {
    const g = new THREE.EdgesGeometry(new THREE.CylinderGeometry(rt, rb, h, seg));
    pushEdges(g, into, [x, y, z], [1, 1, 1], rot); g.dispose();
  };
  const windows = (w: number, h: number, d: number, x: number, y0: number, z: number, density: number) => {
    for (let yy = y0 + 0.8; yy < y0 + h - 0.6; yy += 1.15) {
      for (let xx = -w / 2 + 0.5; xx < w / 2 - 0.3; xx += 0.9) if (rnd() < density) win.push(x + xx, yy, z + d / 2 + 0.02);
      for (let zz = -d / 2 + 0.5; zz < d / 2 - 0.3; zz += 0.9) if (rnd() < density * 0.7) win.push(x + w / 2 + 0.02, yy, z + zz);
    }
  };
  const tower = (x: number, z: number, w: number, d: number, h: number, setbacks: number, light: number) => {
    let y = BASE, cw = w, cd = d;
    const parts = Math.max(1, setbacks | 0), each = h / parts;
    for (let i = 0; i < parts; i++) { box(blue, cw, each, cd, x, y + each / 2, z); windows(cw, each, cd, x, y, z, light); y += each; cw *= 0.72; cd *= 0.72; }
    return y;
  };
  const waterTower = (x: number, y: number, z: number) => {
    frustum(cream, 0.55, 0.55, 1.3, 8, x, y + 1.2, z); frustum(cream, 0.02, 0.55, 0.6, 8, x, y + 2.15, z); box(cream, 0.9, 0.6, 0.9, x, y + 0.3, z);
  };
  const spire = (x: number, y: number, z: number, h: number, r: number) => { frustum(cream, 0, r, h, 6, x, y + h / 2, z); return y + h; };

  let top = tower(-38, -72, 9, 9, 24, 3, 0.6); top = spire(-38, top, -72, 3.2, 1.1);
  box(cream, 0.35, 7, 0.35, -38, top + 3.5, -72); beacon.push(-38, top + 7.2, -72);
  let cy = tower(-14, -80, 6.5, 6.5, 19, 1, 0.65);
  for (let tier = 0; tier < 7; tier++) { const r = 3.4 - tier * 0.42, hh = 1.15; frustum(cream, r * 0.78, r, hh, 8, -14, cy + hh / 2, -80); cy += hh; }
  cy = spire(-14, cy, -80, 5, 0.5); beacon.push(-14, cy, -80);
  frustum(blue, 2.6, 4.6, 34, 4, 28, BASE + 17, -78, [0, Math.PI / 4, 0]); windows(6.4, 34, 6.4, 28, BASE, -78, 0.35);
  const wtcTop = spire(28, BASE + 34, -78, 8, 0.5); beacon.push(28, wtcTop, -78);
  frustum(blue, 3.2, 3.2, 10, 3, -58, BASE + 5, -60); windows(4, 10, 4, -58, BASE, -60, 0.5);
  tower(50, -84, 3.2, 3.2, 30, 1, 0.5);
  const slots = [-84, -72, -50, -30, -22, -6, 4, 12, 20, 38, 44, 62, 72, 84, 96, -96, -108, 108, 120, -120];
  for (let s = 0; s < slots.length; s++) {
    const w = 3 + rnd() * 5, d = 3 + rnd() * 5, h = 5 + Math.pow(rnd(), 1.6) * 16, z = -56 - rnd() * 34, x = slots[s] + (rnd() - 0.5) * 4;
    const y = tower(x, z, w, d, h, rnd() < 0.45 ? 2 : 1, 0.5);
    if (rnd() < 0.6) waterTower(x + (rnd() - 0.5) * (w * 0.5), y, z + (rnd() - 0.5) * (d * 0.5));
  }
  for (let f2 = 0; f2 < (small ? 40 : 70); f2++) {
    const bw = 2.5 + rnd() * 4, bh = 3 + Math.pow(rnd(), 2) * 22, bx = -150 + rnd() * 300, bz = -98 - rnd() * 30;
    box(faint, bw, bh, bw, bx, BASE + bh / 2, bz);
    if (bh > 10 && rnd() < 0.5) windows(bw, bh, bw, bx, BASE, bz, 0.25);
  }
  {
    const deckY = BASE + 3.2, z = -42, x0 = 34, x1 = 118, tA = 56, tB = 96, th = 15;
    const pierce = (x: number) => {
      box(cream, 1.4, th, 2.2, x - 1.6, BASE + th / 2, z); box(cream, 1.4, th, 2.2, x + 1.6, BASE + th / 2, z); box(cream, 4.8, 1.2, 2.4, x, BASE + th + 0.6, z);
      frustum(cream, 1.2, 1.2, 2.3, 3, x, BASE + th - 2.2, z, [Math.PI / 2, 0, Math.PI]);
    };
    pierce(tA); pierce(tB);
    const cable = (xa: number, xb: number, ya: number, yb: number, sag: number) => {
      let prev: [number, number] | null = null;
      for (let i = 0; i <= 24; i++) {
        const u = i / 24, x = xa + (xb - xa) * u, y = ya + (yb - ya) * u - sag * Math.sin(u * Math.PI);
        if (prev) cream.push(prev[0], prev[1], z, x, y, z);
        if (i % 2 === 0 && y > deckY + 0.3) cream.push(x, y, z, x, deckY, z);
        prev = [x, y];
      }
    };
    cable(x0, tA, deckY + 0.4, BASE + th + 1, -2.5); cable(tA, tB, BASE + th + 1, BASE + th + 1, 7.5); cable(tB, x1, BASE + th + 1, deckY + 0.4, -2.5);
    cream.push(x0, deckY, z, x1, deckY, z, x0, deckY - 0.5, z, x1, deckY - 0.5, z);
  }
  for (let r2 = 0; r2 < 26; r2++) { const wz = -30 - r2 * 3.2; faint.push(-160, BASE - 0.02, wz, 160, BASE - 0.02, wz); }

  const mirror = (a: number[]) => { const out = new Array(a.length); for (let i = 0; i < a.length; i += 3) { out[i] = a[i]; out[i + 1] = 2 * BASE - a[i + 1]; out[i + 2] = a[i + 2]; } return out; };
  scene.add(lines(blue, 0x2f5cff, 0.55), lines(cream, 0xefe8d6, 0.5), lines(faint, 0x9fb4ff, 0.14));
  scene.add(lines(mirror(blue), 0x2f5cff, 0.14), lines(mirror(cream), 0xefe8d6, 0.12));
  scene.add(points(win, 0xf4d35e, 0.16, 0.85), points(mirror(win), 0xf4d35e, 0.14, 0.22));
  const beacons = points(beacon, 0xff4040, 0.5, 1);
  scene.add(beacons);

  /* ---- drifting cubes + dust ---- */
  const cubes: Array<InstanceType<ThreeNS["LineSegments"]>> = [];
  const cols = [0x2f5cff, 0xefe8d6, 0x9fb4ff, 0xf4d35e];
  for (let c = 0; c < (small ? 10 : 20); c++) {
    const m = new THREE.LineBasicMaterial({ color: cols[c % 4], transparent: true, opacity: 0.55 });
    disposables.push(m);
    const cube = new THREE.LineSegments(unit, m);
    const s = 0.6 + Math.random() * 2.2; cube.scale.set(s, s, s);
    cube.position.set((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 60, -90 + Math.random() * 110);
    cube.userData = { rx: (Math.random() - 0.5) * 0.01, ry: (Math.random() - 0.5) * 0.01, vy: 0.005 + Math.random() * 0.01 };
    scene.add(cube); cubes.push(cube);
  }
  const ND = small ? 600 : 1200, dp = new Float32Array(ND * 3);
  for (let k = 0; k < ND; k++) { dp[k * 3] = (Math.random() - 0.5) * 180; dp[k * 3 + 1] = (Math.random() - 0.5) * 80; dp[k * 3 + 2] = -160 + Math.random() * 200; }
  const dust = points(dp, 0x9fb4ff, 0.13, 0.5);
  scene.add(dust);

  let cmx = 0, cmy = 0;
  return {
    render(time, p, mx, my, animate) {
      cmx += (mx - cmx) * 0.05; cmy += (my - cmy) * 0.05;
      globe.rotation.y = time * 0.08 + p * 2.2; pts.rotation.y = globe.rotation.y;
      globe.rotation.x = 0.35 + cmy * 0.2; pts.rotation.x = globe.rotation.x;
      ring.rotation.z = time * 0.05;
      camera.position.z = 40 - p * 70;
      camera.position.y = 2 + p * 18 - cmy * 2;
      camera.position.x = cmx * 3;
      camera.lookAt(4 - p * 8, -2 + p * 6, -40);
      if (animate) {
        for (let k = 0; k < cubes.length; k++) {
          const cb = cubes[k], u = cb.userData as any;
          cb.rotation.x += u.rx; cb.rotation.y += u.ry; cb.position.y += u.vy;
          if (cb.position.y > 32) cb.position.y = -32;
        }
        dust.rotation.y = time * 0.012;
        (beacons.material as any).opacity = Math.sin(time * 2.4) > 0 ? 1 : 0.35;
      }
      renderer.render(scene, camera);
    },
    resize() {
      camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    dispose() { disposables.forEach((d) => { try { d.dispose(); } catch { /* ignore */ } }); },
  };
}
