/* gpu-die-badge.js v2 — the RTX 4090 (AD102) die as a small badge that computes.
 *
 * Usage (THREE 0.160.0 UMD must already be loaded as a global):
 *   const badge = window.gpuDieBadge.mount(container, { theme: "light" });
 *   badge.setTheme("dark"); badge.snapshot(); badge.destroy();
 *
 * Same geometry and colour tokens as rtx4090-die-atlas.html (12 GPC tiles with
 * their TPC blocks — GPC 11 off, two TPCs cut, hatched; L2 at 72 of 96 MB; 12
 * memory controllers and GDDR6X packages; the PCIe tab). In a fixed pose (no
 * orbit: Joon's choice, 2026-10-14) a deterministic 8 s "kernel" loops: launch (PCIe pulse),
 * load (packages, then controllers, then L2), compute (a wavefront across the
 * GPCs, then TPC blocks flicker as warps retire — seeded, so every visitor sees
 * the same choreography), store (L2, packages in reverse, PCIe flash), idle.
 * Disabled parts never light. Reduced motion: one static mid-compute pose.
 */
(function () {
  'use strict';
  const TOKENS = {
    light: { die: '#d9dee5', gpc: '#8fa6c2', sm: '#2f9e94', mem: '#d9a441', cache: '#7c6fcf', ctrl: '#6d7a8c', off: '#a6adb8', hatch: '#3a4250' },
    dark: { die: '#1d232c', gpc: '#3b4f6b', sm: '#3fb3a7', mem: '#e0ad4a', cache: '#8f82e0', ctrl: '#5a6678', off: '#2b313b', hatch: '#9aa3b2' },
  };
  const OFF_GPC = 11, CUT_TPCS = { 5: 5, 10: 5 }, L2_FRAC = 72 / 96;
  const KERNEL_S = 8, STATIC_T = 4.2, POLAR = 0.74, FOV = 36, SEED = 0x4090;
  const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  // 0 → 1 → 0 over [a, b] with eased edges of width r: never a binary flip.
  const win = (t, a, b, r) => { r = r || 0.15; if (t <= a - r || t >= b + r) return 0; return Math.min(1, smooth((t - (a - r)) / r), smooth((b + r - t) / r)); };
  function mulberry32(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function mount(container, opts) {
    const THREE = window.THREE;
    if (!THREE) throw new Error('gpuDieBadge: THREE is not loaded');
    let theme = (opts && opts.theme) === 'dark' ? 'dark' : 'light';
    const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display = 'block';
    container.appendChild(canvas);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.95));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(6, 14, 8); scene.add(sun);

    // Shared materials (die, GPC tiles, off parts) and per-mesh "live" units.
    const shared = {}, geos = [], live = [], WHITE = new THREE.Color(0xffffff);
    const sharedMat = (token) => shared[token] || (shared[token] = new THREE.MeshStandardMaterial({ color: new THREE.Color(TOKENS[theme][token]), roughness: 0.55, metalness: 0.05 }));
    const hatchCanvas = document.createElement('canvas'); hatchCanvas.width = hatchCanvas.height = 64;
    const hatchTex = new THREE.CanvasTexture(hatchCanvas); hatchTex.wrapS = hatchTex.wrapT = THREE.RepeatWrapping;
    function drawHatch() { const ctx = hatchCanvas.getContext('2d'); ctx.clearRect(0, 0, 64, 64); ctx.strokeStyle = TOKENS[theme].hatch; ctx.lineWidth = 5; ctx.globalAlpha = 0.85; for (let i = -64; i < 128; i += 16) { ctx.beginPath(); ctx.moveTo(i, 64); ctx.lineTo(i + 64, 0); ctx.stroke(); } hatchTex.needsUpdate = true; }
    drawHatch();
    const hatchMat = new THREE.MeshBasicMaterial({ map: hatchTex, transparent: true, depthWrite: false });
    const group = new THREE.Group(); scene.add(group);
    function box(x, z, w, d, h, y, material) { const g = new THREE.BoxGeometry(w, h, d); geos.push(g); const m = new THREE.Mesh(g, material); m.position.set(x, y + h / 2, z); group.add(m); return m; }
    // A unit that lights up: its own material, preallocated colours, a target function of kernel time.
    function liveBox(x, z, w, d, h, y, token, target) {
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(TOKENS[theme][token]), roughness: 0.5, metalness: 0.05 });
      const u = { mat, token, base: new THREE.Color(), bright: new THREE.Color(), hue: new THREE.Color(), a: 0, target };
      live.push(u); box(x, z, w, d, h, y, mat); return u;
    }
    function tint(u) { u.base.set(TOKENS[theme][u.token]); u.bright.copy(u.base).lerp(WHITE, 0.45); u.hue.copy(u.base); }
    function apply(u) { u.mat.color.copy(u.base).lerp(u.bright, u.a); u.mat.emissive.copy(u.hue).multiplyScalar(u.a * 0.6); }

    // --- the choreography (times in seconds of the 8 s kernel)
    const rnd = mulberry32(SEED);
    const pcie = (t) => Math.max(win(t, 0.08, 0.4), win(t, 7.15, 7.35, 0.1));
    const loadOn = (k, lag) => 0.5 + k * 0.18 + lag, storeOn = (k, lag) => 6.0 + (5 - k) * 0.18 + lag;
    const memory = (k, lag) => (t) => Math.max(win(t, loadOn(k, lag), 2.3), 0.9 * win(t, storeOn(k, lag), 7.4));
    const l2 = (t) => Math.max(win(t, 1.2, 2.5), 0.45 * win(t, 2.5, 6.0, 0.4), win(t, 6.0, 7.25));
    function tpcTarget(g, t) {
      const onset = 2.0 + (g % 6) * 0.2 + (g < 6 ? 0 : 0.12) + (t % 2) * 0.05;
      const events = []; // 2 retiring-warp flashes per block, seeded
      for (let i = 0; i < 2; i++) { const s = 3.0 + rnd() * 2.7, d = 0.1 + rnd() * 0.3; events.push([s, s + d]); }
      return (tk) => { let v = win(tk, onset, onset + 0.45); for (let i = 0; i < events.length; i++) { const e = events[i]; const w = win(tk, e[0], e[1], 0.06); if (w > v) v = w; } return v; };
    }

    // --- the AD102 die as shipped in the RTX 4090 (same layout as the atlas page)
    box(0, 0, 15.2, 9.6, 0.18, -0.18, sharedMat('die'));
    box(0, 0, 10.4, 1.05, 0.12, 0, sharedMat('off'));                               // L2, full 96 MB
    liveBox(-5.2 + (10.4 * L2_FRAC) / 2, 0, 10.4 * L2_FRAC, 1.05, 0.2, 0, 'cache', l2); // L2 enabled 72 MB
    const tileW = 1.62, tileD = 2.55;
    for (let g = 0; g < 12; g++) {
      const cx = (g % 6 - 2.5) * (tileW + 0.1), cz = (g < 6 ? -1 : 1) * 2.45, on = g !== OFF_GPC;
      box(cx, cz, tileW, tileD, 0.16, 0, sharedMat(on ? 'gpc' : 'off'));
      for (let t = 0; t < 6; t++) {
        const tx = cx + ((t % 2) - 0.5) * 0.72, tz = cz + (Math.floor(t / 2) - 1) * 0.78, cut = on && CUT_TPCS[g] === t;
        if (on && !cut) liveBox(tx, tz, 0.62, 0.66, 0.12, 0.16, 'sm', tpcTarget(g, t));
        else { box(tx, tz, 0.62, 0.66, 0.12, 0.16, sharedMat('off')); if (cut) { const pg = new THREE.PlaneGeometry(0.62 * 0.96, 0.66 * 0.96); geos.push(pg); const p = new THREE.Mesh(pg, hatchMat); p.rotation.x = -Math.PI / 2; p.position.set(tx, 0.285, tz); group.add(p); } }
      }
    }
    for (let i = 0; i < 12; i++) {
      const side = i < 6 ? -1 : 1, k = i % 6, z = (k - 2.5) * 1.5;
      liveBox(side * 7.05, z, 0.6, 1.25, 0.16, 0, 'mem', memory(k, 0.12)); // memory controller, follows its package
      liveBox(side * 8.75, z, 1.0, 1.25, 0.3, 0, 'mem', memory(k, 0));     // GDDR6X package
    }
    liveBox(0, 4.72, 3.2, 0.32, 0.14, 0, 'ctrl', pcie);                     // PCIe 4.0 x16
    for (let i = 0; i < live.length; i++) tint(live[i]);

    // --- camera, size
    const target = new THREE.Vector3(0, 0, 0);
    let az = -0.35, size = 0, tk = STATIC_T;
    const dist = (19.5 / 2) / Math.tan((FOV * Math.PI / 180) / 2) * 0.98;
    function applyCamera() { camera.position.set(dist * Math.sin(POLAR) * Math.sin(az), dist * Math.cos(POLAR), dist * Math.sin(POLAR) * Math.cos(az)); camera.lookAt(target); }
    function resize() { const w = Math.max(1, Math.min(container.clientWidth || 0, container.clientHeight || container.clientWidth || 0) || container.clientWidth || 96); if (w === size) return; size = w; renderer.setSize(w, w, false); camera.aspect = 1; camera.updateProjectionMatrix(); }
    const ro = window.ResizeObserver ? new ResizeObserver(() => { resize(); if (!running) render(); }) : null;
    if (ro) ro.observe(container);
    resize(); applyCamera();
    function render() { renderer.render(scene, camera); }
    // Set every unit straight to its target at kernel time t (static poses; no easing).
    function pose(t) { tk = t; for (let i = 0; i < live.length; i++) { const u = live[i]; u.a = u.target(t); apply(u); } }
    function step(dt) {
      tk = (tk + dt) % KERNEL_S;
      for (let i = 0; i < live.length; i++) { const u = live[i]; const g = u.target(tk); u.a += (g - u.a) * (g > u.a ? 1 - Math.exp(-dt / 0.08) : 1 - Math.exp(-dt / 0.18)); apply(u); }
    }

    // --- loop: only while visible, never under reduced motion
    let running = false, raf = 0, last = 0, visible = true, destroyed = false;
    function frame(now) {
      if (!running) return;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
      step(dt); render();
      raf = requestAnimationFrame(frame);
    }
    function start() { if (destroyed || reduced || running || !visible) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    const io = window.IntersectionObserver ? new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); if (visible) start(); else stop(); }, { threshold: 0.01 }) : null;
    if (io) io.observe(canvas);
    pose(STATIC_T); render(); start();

    function setTheme(next) {
      theme = next === 'dark' ? 'dark' : 'light';
      for (const token in shared) shared[token].color.set(TOKENS[theme][token]);
      for (let i = 0; i < live.length; i++) { tint(live[i]); apply(live[i]); }
      drawHatch(); if (!running) render();
    }
    function destroy() {
      destroyed = true; stop();
      if (io) io.disconnect(); if (ro) ro.disconnect();
      for (let i = 0; i < geos.length; i++) geos[i].dispose();
      for (const t in shared) shared[t].dispose();
      for (let i = 0; i < live.length; i++) live[i].mat.dispose();
      hatchMat.dispose(); hatchTex.dispose(); renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
    // Same-task readback of the static mid-compute pose (used to produce the PNG fallback).
    function snapshot() { const keepAz = az; az = -0.35; pose(STATIC_T); applyCamera(); render(); const url = canvas.toDataURL('image/png'); az = keepAz; applyCamera(); return url; }
    return { setTheme, destroy, snapshot };
  }
  window.gpuDieBadge = { mount };
})();
