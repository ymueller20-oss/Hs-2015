/* Spielfelder: Farbstimmung, Rand-Dekor, animierte Atmosphäre. Bilder (arena/<id>.jpg) werden genutzt, sobald vorhanden. */
(function () {
  'use strict';
  const HS = window.HS;

  HS.ARENAS = [
    { id: 'swamp', name: 'Nebelsumpf', fx: 'fog', fx2: 'bubbles', c: ['#2d3a24', '#1c2616', '#0b0f08'], line: '#9fd36a', glow: '#b8ff7a' },
    { id: 'volcano', name: 'Vulkanschlund', fx: 'embers', c: ['#5a1e0c', '#2a0e06', '#0d0402'], line: '#ff7a2a', glow: '#ffb050' },
    { id: 'forest', name: 'Uralter Wald', fx: 'fireflies', fx2: 'leaves', c: ['#3a4a22', '#22300f', '#0c1306'], line: '#d6c27a', glow: '#e8ff9a' },
    { id: 'market', name: 'Marktplatz', fx: 'dust', c: ['#7a5a36', '#4a3420', '#1c120a'], line: '#ffd27a', glow: '#ffe2a0' },
    { id: 'castle', name: 'Burghof', fx: 'torches', c: ['#5a5650', '#33302c', '#121110'], line: '#e4bd63', glow: '#ffcf7a' },
    { id: 'ice', name: 'Eiszitadelle', fx: 'snow', c: ['#4a6a88', '#243a52', '#0a1420'], line: '#bfe8ff', glow: '#e0f6ff' },
    { id: 'crypt', name: 'Vergessene Gruft', fx: 'wisps', c: ['#2a3030', '#161c1c', '#060808'], line: '#7affc0', glow: '#9affd8' },
    { id: 'desert', name: 'Wüstenruinen', fx: 'sand', c: ['#a67a42', '#6a4a22', '#2a1a0a'], line: '#ffe0a0', glow: '#fff0c0' },
    { id: 'forge', name: 'Zwergenschmiede', fx: 'sparks', c: ['#4a3a30', '#2a201a', '#0e0a08'], line: '#ff9a3a', glow: '#ffc070' },
    { id: 'grove', name: 'Mondhain', fx: 'motes', fx2: 'fireflies', c: ['#2a3450', '#161c30', '#070a14'], line: '#c8d8ff', glow: '#e0e8ff' },
  ];
  HS.ARENA_IMGS = ['swamp', 'volcano', 'forest', 'market', 'castle', 'ice', 'crypt', 'desert', 'forge', 'grove'];
  HS.arena = (id) => HS.ARENAS.find((a) => a.id === id) || HS.ARENAS[0];
  // Gemalte Böden: quer für Desktop, hochkant (_p) fürs Handy
  HS.arenaImg = (id, portrait) => (HS.ARENA_IMGS.includes(id) ? 'arena/' + id + (portrait ? '_p' : '') + '.jpg' : null);

  /* ---------- Partikel-Atmosphäre ---------- */
  const FX = {
    embers: { n: 60, make: (W, H, r) => ({ x: r() * W, y: H + r() * H, vx: (r() - 0.5) * 0.3, vy: -(0.4 + r() * 1.1), s: 1 + r() * 2.5, c: r() < 0.5 ? '#ff8a2a' : '#ffd060', life: 1 }), glow: true },
    sparks: { n: 45, make: (W, H, r) => ({ x: W * (0.1 + r() * 0.8), y: H + r() * 40, vx: (r() - 0.5) * 2, vy: -(1.5 + r() * 2.5), s: 0.8 + r() * 1.6, c: '#ffc070', grav: 0.03 }), glow: true },
    snow: { n: 90, make: (W, H, r) => ({ x: r() * W, y: -r() * H, vx: (r() - 0.5) * 0.4, vy: 0.4 + r() * 0.9, s: 1 + r() * 2.8, c: '#ffffff', sway: r() * 6 }) },
    leaves: { n: 18, make: (W, H, r) => ({ x: r() * W, y: -r() * H, vx: 0.2 + r() * 0.5, vy: 0.5 + r() * 0.7, s: 3 + r() * 3, c: r() < 0.5 ? '#c8902a' : '#8aa83a', sway: r() * 6, leaf: true }) },
    fireflies: { n: 32, make: (W, H, r) => ({ x: r() * W, y: r() * H, vx: 0, vy: 0, s: 1.5 + r() * 2, c: '#e8ff7a', wander: true, ph: r() * 6 }), glow: true },
    motes: { n: 40, make: (W, H, r) => ({ x: r() * W, y: r() * H, vx: 0, vy: -(0.1 + r() * 0.3), s: 0.8 + r() * 1.8, c: '#d8e4ff', wander: true, ph: r() * 6 }), glow: true },
    wisps: { n: 16, make: (W, H, r) => ({ x: r() * W, y: r() * H, vx: 0, vy: -0.15, s: 3 + r() * 4, c: '#7affc0', wander: true, ph: r() * 6 }), glow: true },
    dust: { n: 50, make: (W, H, r) => ({ x: r() * W, y: r() * H, vx: 0.2 + r() * 0.4, vy: (r() - 0.5) * 0.15, s: 0.8 + r() * 1.5, c: '#ffe2b0' }) },
    sand: { n: 110, make: (W, H, r) => ({ x: -r() * W, y: r() * H, vx: 1.5 + r() * 2.5, vy: (r() - 0.5) * 0.4, s: 0.6 + r() * 1.4, c: '#f0d090' }) },
    bubbles: { n: 14, make: (W, H, r) => ({ x: r() * W, y: H + r() * H, vx: 0, vy: -(0.3 + r() * 0.5), s: 2 + r() * 4, c: '#b8ff7a', ring: true }) },
    fog: { n: 10, make: (W, H, r) => ({ x: r() * W, y: r() * H, vx: 0.15 + r() * 0.25, vy: 0, s: 120 + r() * 160, c: '#c8e0b0', fog: true }) },
    torches: { n: 30, make: (W, H, r) => { const left = r() < 0.5; return { x: left ? 30 + r() * 40 : W - 30 - r() * 40, y: H * (0.2 + r() * 0.6), vx: (r() - 0.5) * 0.3, vy: -(0.5 + r()), s: 1 + r() * 2, c: '#ffb050', life: 1, decay: 0.012 }; }, glow: true },
  };

  let anim = null;
  /* vorgezeichnete Leuchtpunkte: einmal erzeugen, danach nur kopieren (schnell) */
  const sprites = new Map();
  function sprite(color, kind) {
    const key = color + kind;
    if (sprites.has(key)) return sprites.get(key);
    const S = kind === 'fog' ? 128 : 32;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    if (kind === 'fog') { g.addColorStop(0, hexA(color, 0.14)); g.addColorStop(1, hexA(color, 0)); }
    else if (kind === 'glow') { g.addColorStop(0, hexA(color, 0.95)); g.addColorStop(0.25, hexA(color, 0.5)); g.addColorStop(1, hexA(color, 0)); }
    else { g.addColorStop(0, hexA(color, 0.9)); g.addColorStop(0.6, hexA(color, 0.7)); g.addColorStop(1, hexA(color, 0)); }
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    sprites.set(key, c);
    return c;
  }
  HS.startAmbience = function (canvas, arenaId) {
    HS.stopAmbience();
    if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = HS.arena(arenaId);
    const K = 0.5; /* halbe Auflösung */
    const W = canvas.width, H = canvas.height;
    canvas.width = Math.round(W * K); canvas.height = Math.round(H * K);
    const ctx = canvas.getContext('2d');
    ctx.scale(K, K);
    let seed = 7;
    const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const layers = [a.fx, a.fx2].filter(Boolean).map((k) => ({ k, def: FX[k], ps: [] }));
    for (const L of layers) for (let i = 0; i < L.def.n; i++) { const p = L.def.make(W, H, r); if (L.k === 'snow' || L.k === 'leaves') p.y = r() * H; if (L.k === 'sand') p.x = r() * W; L.ps.push(p); }
    let t = 0, last = 0;
    const step = (now) => {
      anim = requestAnimationFrame(step);
      if (now - last < 30) return; /* ~30 Bilder/s reichen für Atmosphäre */
      last = now;
      t += 2;
      ctx.clearRect(0, 0, W, H);
      for (const L of layers) {
        ctx.globalCompositeOperation = L.def.glow ? 'lighter' : 'source-over';
        for (const p of L.ps) {
          if (p.wander) { p.vx = Math.cos(t * 0.01 + p.ph) * 0.7; p.vy = (p.vy * 0.98) + Math.sin(t * 0.013 + p.ph * 2) * 0.02; }
          if (p.sway) p.x += Math.sin(t * 0.02 + p.sway) * 0.6;
          if (p.grav) p.vy += p.grav * 2;
          p.x += p.vx * 2; p.y += p.vy * 2;
          if (p.decay) p.life -= p.decay * 2;
          const out = p.y < -60 || p.y > H + 60 || p.x < -260 || p.x > W + 260 || (p.life != null && p.life <= 0);
          if (out) Object.assign(p, L.def.make(W, H, r));
          const alpha = p.life != null ? Math.max(0, Math.min(1, p.life)) : 1;
          if (p.fog) { ctx.drawImage(sprite(p.c, 'fog'), p.x - p.s, p.y - p.s, p.s * 2, p.s * 2); continue; }
          if (p.ring) { ctx.strokeStyle = hexA(p.c, 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.stroke(); continue; }
          if (p.leaf) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t * 0.02 + p.sway); ctx.fillStyle = hexA(p.c, 0.85); ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, 7); ctx.fill(); ctx.restore(); continue; }
          const flick = L.def.glow ? 0.55 + 0.45 * Math.sin(t * 0.08 + (p.ph || p.x)) : 0.85;
          ctx.globalAlpha = alpha * flick;
          const R = L.def.glow ? p.s * 4 : p.s * 1.4;
          ctx.drawImage(sprite(p.c, L.def.glow ? 'glow' : 'dot'), p.x - R, p.y - R, R * 2, R * 2);
          ctx.globalAlpha = 1;
        }
      }
    };
    anim = requestAnimationFrame(step);
  };
  HS.stopAmbience = function () { if (anim) cancelAnimationFrame(anim); anim = null; };
  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
})();
