"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { track } from "@/lib/track";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function Desktop() {
  useEffect(() => {
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];
    const on = (t: EventTarget, ev: string, fn: any, o?: any) => {
      t.addEventListener(ev, fn, o);
      cleanups.push(() => t.removeEventListener(ev, fn, o));
    };

    /* ---------- boot ---------- */
    const boot = document.getElementById("boot")!;
    const log = document.getElementById("bootlog")!;
    const lines = ["> loading portfolio ........ OK", "> mounting projects ........ OK", "> ascii art ................ OK", "> coffee ................... LOW", "> press any key to continue"];
    let li = 0;
    let booted = false;
    const endBoot = () => {
      if (booted) return;
      booted = true;
      boot.classList.add("off");
      startTerm();
    };
    const nextLine = () => {
      if (booted) return;
      if (li < lines.length) {
        log.textContent += lines[li] + "\n";
        li++;
        window.setTimeout(nextLine, li === lines.length ? 700 : 260);
      } else endBoot();
    };
    const seen = (() => { try { return sessionStorage.getItem("rayid.booted") === "1"; } catch { return false; } })();
    if (seen || reduce) endBoot();
    else {
      window.setTimeout(nextLine, 350);
      window.setTimeout(endBoot, 4200);
      try { sessionStorage.setItem("rayid.booted", "1"); } catch { /* ignore */ }
    }
    on(window, "keydown", endBoot, { once: true });
    on(window, "pointerdown", endBoot, { once: true });

    /* ---------- terminal typing ---------- */
    const term = document.getElementById("term")!;
    const script: Array<[string, string]> = [
      ["p", "> whoami"], ["o", "rayid. ai engineer. builds, ships, repeats."],
      ["p", "> ls ~/shipped"], ["o", "cinechrony/   iedit/   pdf2video/"],
      ["p", "> cat status.txt"], ["o", "building. always."],
      ["p", "> _"],
    ];
    let termStarted = false;
    function startTerm() {
      if (termStarted) return;
      termStarted = true;
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
    }

    /* ---------- reveals ---------- */
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".rev").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    /* ---------- taskbar tabs, clock, scroll progress ---------- */
    const secs = ["top", "story", "work", "paper", "mail"];
    const tabs = document.querySelectorAll(".tab");
    const tio = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const idx = secs.indexOf((e.target as HTMLElement).id);
        if (idx < 0) return;
        tabs.forEach((t, k) => t.classList.toggle("on", k === idx));
      });
    }, { threshold: 0.25 });
    secs.forEach((id) => { const s = document.getElementById(id); if (s) tio.observe(s); });
    cleanups.push(() => tio.disconnect());
    const pct = document.getElementById("pct");
    const depthHit = new Set<number>();
    const onScroll = () => {
      const docH = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const p = Math.min(1, window.scrollY / docH);
      if (pct) pct.textContent = "page " + Math.round(p * 100) + "%";
      [25, 50, 75, 100].forEach((d) => { if (p * 100 >= d && !depthHit.has(d)) { depthHit.add(d); track("scroll_depth", { depth: d }); } });
    };
    on(window, "scroll", onScroll, { passive: true });
    onScroll();
    const clockEl = document.getElementById("clock");
    const clock = () => { const d = new Date(); if (clockEl) clockEl.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
    clock();
    const clockTimer = window.setInterval(clock, 15000);
    cleanups.push(() => window.clearInterval(clockTimer));

    /* ---------- section views + dwell ---------- */
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

    /* ---------- outbound + mail clicks ---------- */
    on(document, "click", (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[data-out]") as HTMLAnchorElement | null;
      if (a) track("outbound_click", { target: a.getAttribute("data-out"), href: a.href });
    });

    /* ---------- draggable windows (desktop) ---------- */
    if (fine) {
      let zTop = 20;
      let dragged = false;
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
    }

    /* ---------- word search ---------- */
    const cells = document.querySelectorAll<HTMLElement>("#xg i[data-w]");
    const has = (c: HTMLElement, name: string) => ("," + c.getAttribute("data-w") + ",").indexOf("," + name + ",") >= 0;
    document.querySelectorAll<HTMLElement>("#wl span").forEach((w) => {
      const name = w.getAttribute("data-w") || "";
      on(w, "mouseenter", () => { w.classList.add("on"); cells.forEach((c) => { if (has(c, name)) c.classList.add("hi"); }); });
      on(w, "mouseleave", () => { w.classList.remove("on"); cells.forEach((c) => c.classList.remove("hi")); });
      on(w, "click", () => { cells.forEach((c) => { if (has(c, name)) c.classList.toggle("found"); }); track("puzzle_word", { word: name }); });
    });

    /* ---------- mail: address assembled here, never printed ---------- */
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

    /* ---------- parallax layers ---------- */
    const layers = Array.from(document.querySelectorAll<HTMLElement>(".px"));
    let mx = 0, my = 0, tx = 0, ty = 0;
    on(window, "pointermove", (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    /* ---------- three.js: globe, New York, dust ---------- */
    const canvas = document.getElementById("bg") as HTMLCanvasElement;
    let three = true;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, globe: THREE.LineSegments, pts: THREE.Points, ring: THREE.LineSegments, dust: THREE.Points;
    const cubes: THREE.LineSegments[] = [];
    const beacons: THREE.PointsMaterial[] = [];
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x070c22, 1);
    } catch {
      three = false;
      canvas.classList.add("fallback");
    }

    if (three && renderer) {
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x070c22, 0.02);
      camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
      camera.position.set(0, 2, 40);

      const G = new THREE.Group();
      globe = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(15, 28, 20)), new THREE.LineBasicMaterial({ color: 0x2f5cff, transparent: true, opacity: 0.32 }));
      G.add(globe);
      {
        const N = 2600, p = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
          const u = Math.random() * 6.283, v = Math.acos(2 * Math.random() - 1), r = 15.15;
          p[i * 3] = r * Math.sin(v) * Math.cos(u); p[i * 3 + 1] = r * Math.cos(v); p[i * 3 + 2] = r * Math.sin(v) * Math.sin(u);
        }
        const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
        pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xefe8d6, size: 0.16, transparent: true, opacity: 0.85, sizeAttenuation: true }));
        G.add(pts);
      }
      ring = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.TorusGeometry(22, 0.05, 4, 120)), new THREE.LineBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.35 }));
      ring.rotation.x = 1.25; G.add(ring);
      G.position.set(12, 2, -6);
      scene.add(G);

      /* ---------- New York, in wire and light ---------- */
      {
        const BASE = -16, city = new THREE.Group();
        const lineA = new THREE.LineBasicMaterial({ color: 0x2f5cff, transparent: true, opacity: 0.55 });
        const lineB = new THREE.LineBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.42 });
        const lineC = new THREE.LineBasicMaterial({ color: 0xefe8d6, transparent: true, opacity: 0.5 });
        const winMat = new THREE.PointsMaterial({ color: 0xf4d35e, size: 0.16, transparent: true, opacity: 0.85, sizeAttenuation: true });
        let seed = 17;
        const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
        const unit = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
        const box = (w: number, h: number, d: number, mat: THREE.LineBasicMaterial = lineA) => { const m = new THREE.LineSegments(unit, mat); m.scale.set(w, h, d); return m; };
        const frustum = (rt: number, rb: number, h: number, seg: number, mat: THREE.LineBasicMaterial = lineB) => new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(rt, rb, h, seg)), mat);
        const windows = (w: number, h: number, d: number, x: number, y0: number, z: number, density: number) => {
          const p: number[] = [];
          for (let yy = y0 + 0.8; yy < y0 + h - 0.6; yy += 1.15) {
            for (let xx = -w / 2 + 0.5; xx < w / 2 - 0.3; xx += 0.9) if (rnd() < density) p.push(x + xx, yy, z + d / 2 + 0.02);
            for (let zz = -d / 2 + 0.5; zz < d / 2 - 0.3; zz += 0.9) if (rnd() < density * 0.7) p.push(x + w / 2 + 0.02, yy, z + zz);
          }
          if (!p.length) return;
          const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
          city.add(new THREE.Points(g, winMat));
        };
        const tower = (x: number, z: number, w: number, d: number, h: number, setbacks: number, light: number) => {
          let y = BASE, cw = w, cd = d;
          const parts = Math.max(1, setbacks | 0), each = h / parts;
          for (let i = 0; i < parts; i++) {
            const b = box(cw, each, cd); b.position.set(x, y + each / 2, z); city.add(b);
            windows(cw, each, cd, x, y, z, light);
            y += each; cw *= 0.72; cd *= 0.72;
          }
          return y;
        };
        const waterTower = (x: number, y: number, z: number) => {
          const t1 = frustum(0.55, 0.55, 1.3, 8, lineC); t1.position.set(x, y + 1.2, z); city.add(t1);
          const t2 = frustum(0.02, 0.55, 0.6, 8, lineC); t2.position.set(x, y + 2.15, z); city.add(t2);
          const legs = box(0.9, 0.6, 0.9, lineC); legs.position.set(x, y + 0.3, z); city.add(legs);
        };
        const spire = (x: number, y: number, z: number, h: number, r: number) => { const s = frustum(0.0, r, h, 6, lineC); s.position.set(x, y + h / 2, z); city.add(s); return y + h; };
        const beacon = (x: number, y: number, z: number) => {
          const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([x, y, z], 3));
          const m = new THREE.PointsMaterial({ color: 0xff4040, size: 0.5, transparent: true, opacity: 1 });
          city.add(new THREE.Points(g, m)); beacons.push(m);
        };

        let top = tower(-38, -72, 9, 9, 24, 3, 0.6); top = spire(-38, top, -72, 3.2, 1.1);
        const mast = box(0.35, 7, 0.35, lineC); mast.position.set(-38, top + 3.5, -72); city.add(mast); beacon(-38, top + 7.2, -72);
        let cy = tower(-14, -80, 6.5, 6.5, 19, 1, 0.65);
        for (let tier = 0; tier < 7; tier++) { const r = 3.4 - tier * 0.42, hh = 1.15; const f = frustum(r * 0.78, r, hh, 8, lineC); f.position.set(-14, cy + hh / 2, -80); city.add(f); cy += hh; }
        cy = spire(-14, cy, -80, 5, 0.5); beacon(-14, cy, -80);
        const wtc = frustum(2.6, 4.6, 34, 4, lineA); wtc.rotation.y = Math.PI / 4; wtc.position.set(28, BASE + 17, -78); city.add(wtc);
        windows(6.4, 34, 6.4, 28, BASE, -78, 0.35);
        const wtcTop = spire(28, BASE + 34, -78, 8, 0.5); beacon(28, wtcTop, -78);
        const flat = frustum(3.2, 3.2, 10, 3, lineB); flat.position.set(-58, BASE + 5, -60); city.add(flat); windows(4, 10, 4, -58, BASE, -60, 0.5);
        tower(50, -84, 3.2, 3.2, 30, 1, 0.5);
        const slots = [-84, -72, -50, -30, -22, -6, 4, 12, 20, 38, 44, 62, 72, 84, 96, -96, -108, 108, 120, -120];
        for (let s = 0; s < slots.length; s++) {
          const w = 3 + rnd() * 5, d = 3 + rnd() * 5, h = 5 + Math.pow(rnd(), 1.6) * 16, z = -56 - rnd() * 34, x = slots[s] + (rnd() - 0.5) * 4;
          const y = tower(x, z, w, d, h, rnd() < 0.45 ? 2 : 1, 0.5);
          if (rnd() < 0.6) waterTower(x + (rnd() - 0.5) * (w * 0.5), y, z + (rnd() - 0.5) * (d * 0.5));
        }
        for (let f2 = 0; f2 < 70; f2++) {
          const bw = 2.5 + rnd() * 4, bh = 3 + Math.pow(rnd(), 2) * 22, bx = -150 + rnd() * 300, bz = -98 - rnd() * 30;
          const bb = box(bw, bh, bw, lineB); bb.position.set(bx, BASE + bh / 2, bz); city.add(bb);
          if (bh > 10 && rnd() < 0.5) windows(bw, bh, bw, bx, BASE, bz, 0.25);
        }
        {
          const deckY = BASE + 3.2, z = -42, x0 = 34, x1 = 118, tA = 56, tB = 96, th = 15;
          const pierce = (x: number) => {
            const leg1 = box(1.4, th, 2.2, lineC); leg1.position.set(x - 1.6, BASE + th / 2, z); city.add(leg1);
            const leg2 = box(1.4, th, 2.2, lineC); leg2.position.set(x + 1.6, BASE + th / 2, z); city.add(leg2);
            const cap = box(4.8, 1.2, 2.4, lineC); cap.position.set(x, BASE + th + 0.6, z); city.add(cap);
            const arch = frustum(1.2, 1.2, 2.3, 3, lineC); arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI; arch.position.set(x, BASE + th - 2.2, z); city.add(arch);
          };
          pierce(tA); pierce(tB);
          const p: number[] = [];
          const cable = (xa: number, xb: number, ya: number, yb: number, sag: number) => {
            let prev: [number, number] | null = null;
            for (let i = 0; i <= 24; i++) {
              const u = i / 24, x = xa + (xb - xa) * u, y = ya + (yb - ya) * u - sag * Math.sin(u * Math.PI);
              if (prev) p.push(prev[0], prev[1], z, x, y, z);
              if (i % 2 === 0 && y > deckY + 0.3) p.push(x, y, z, x, deckY, z);
              prev = [x, y];
            }
          };
          cable(x0, tA, deckY + 0.4, BASE + th + 1, -2.5); cable(tA, tB, BASE + th + 1, BASE + th + 1, 7.5); cable(tB, x1, BASE + th + 1, deckY + 0.4, -2.5);
          p.push(x0, deckY, z, x1, deckY, z, x0, deckY - 0.5, z, x1, deckY - 0.5, z);
          const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
          city.add(new THREE.LineSegments(g, lineC));
        }
        scene.add(city);
        const refl = city.clone(true);
        refl.traverse((o: any) => { if (o.material) { o.material = o.material.clone(); o.material.opacity *= 0.28; } });
        refl.scale.y = -1; refl.position.y = BASE * 2; scene.add(refl);
        const wl: number[] = [];
        for (let r2 = 0; r2 < 26; r2++) { const wz = -30 - r2 * 3.2; wl.push(-160, BASE - 0.02, wz, 160, BASE - 0.02, wz); }
        const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(wl, 3));
        scene.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x2f5cff, transparent: true, opacity: 0.08 })));
      }

      const ce = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
      const cols = [0x2f5cff, 0xefe8d6, 0x9fb4ff, 0xf4d35e];
      for (let c = 0; c < 24; c++) {
        const cube = new THREE.LineSegments(ce, new THREE.LineBasicMaterial({ color: cols[c % 4], transparent: true, opacity: 0.55 }));
        const s = 0.6 + Math.random() * 2.2; cube.scale.set(s, s, s);
        cube.position.set((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 60, -90 + Math.random() * 110);
        cube.userData = { rx: (Math.random() - 0.5) * 0.01, ry: (Math.random() - 0.5) * 0.01, vy: 0.005 + Math.random() * 0.01 };
        scene.add(cube); cubes.push(cube);
      }
      {
        const N = 1500, p = new Float32Array(N * 3);
        for (let k = 0; k < N; k++) { p[k * 3] = (Math.random() - 0.5) * 180; p[k * 3 + 1] = (Math.random() - 0.5) * 80; p[k * 3 + 2] = -160 + Math.random() * 200; }
        const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
        dust = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fb4ff, size: 0.13, transparent: true, opacity: 0.5 }));
        scene.add(dust);
      }
      on(window, "resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer!.setSize(window.innerWidth, window.innerHeight);
      }, { passive: true });
    }

    let cmx = 0, cmy = 0, raf = 0;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const time = t * 0.001;
      mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
      if (fine && !reduce) {
        for (let i = 0; i < layers.length; i++) {
          const d = parseFloat(layers[i].getAttribute("data-depth") || "10");
          layers[i].style.transform = "translate3d(" + (-mx * d) + "px," + (-my * d) + "px,0)";
        }
      }
      if (three && renderer) {
        const docH = Math.max(1, document.body.scrollHeight - window.innerHeight);
        const p = Math.min(1, window.scrollY / docH);
        cmx += (mx - cmx) * 0.05; cmy += (my - cmy) * 0.05;
        globe.rotation.y = time * 0.08 + p * 2.2; pts.rotation.y = globe.rotation.y;
        globe.rotation.x = 0.35 + cmy * 0.2; pts.rotation.x = globe.rotation.x;
        ring.rotation.z = time * 0.05;
        camera.position.z = 40 - p * 70;
        camera.position.y = 2 + p * 18 - cmy * 2;
        camera.position.x = cmx * 3;
        camera.lookAt(4 - p * 8, -2 + p * 6, -40);
        if (!reduce) {
          for (let k = 0; k < cubes.length; k++) {
            const cb = cubes[k], u = cb.userData as any;
            cb.rotation.x += u.rx; cb.rotation.y += u.ry; cb.position.y += u.vy;
            if (cb.position.y > 32) cb.position.y = -32;
          }
          dust.rotation.y = time * 0.012;
          for (let bk = 0; bk < beacons.length; bk++) beacons[bk].opacity = 0.35 + 0.65 * (Math.sin(time * 2.4 + bk) > 0 ? 1 : 0);
        }
        renderer.render(scene, camera);
      }
    };
    raf = requestAnimationFrame(frame);
    cleanups.push(() => cancelAnimationFrame(raf));
    cleanups.push(() => { renderer?.dispose(); });

    track("page_view", { ref: (window as any).__ref ?? null, w: window.innerWidth, h: window.innerHeight, referrer: document.referrer || null });

    return () => { cleanups.forEach((f) => f()); };
  }, []);

  return null;
}
