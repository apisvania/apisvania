// Plants and places of the later scenes, in the same ink-and-wash language:
// firs, acacias, rapeseed, wildflowers, raspberry canes, heather, rocks and
// the beekeeper's hut; plus the close-up "hero" plant of each honey.

import { rng, lerp, type Rng } from '../util';
import { panza, linie, pata, spalare, CERNEALA, HARTIE, type Ctx } from './panza';
import { floareMica } from './teren';
import { ton } from '../stil';

// ── Small helpers ───────────────────────────────────────────────────────

function cerc(g: Ctx, x: number, y: number, r: number) {
  const p = new Path2D();
  p.arc(x, y, r, 0, Math.PI * 2);
  return p;
}

/** A small flower of n rounded petals with an ink outline. */
function floareSimpla(g: Ctx, x: number, y: number, R: number, n: number, culoare: string, centru: string, r: Rng, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot + r.range(0, 1));
  for (let i = 0; i < n; i++) {
    g.save();
    g.rotate((i / n) * Math.PI * 2);
    const p = pata(R * 0.55, 0, R * 0.5, R * 0.36, 0.08, i + x);
    g.fillStyle = HARTIE;
    g.fill(p);
    spalare(g, p, culoare, 0.85, 1, 1);
    g.strokeStyle = CERNEALA;
    g.globalAlpha = 0.6;
    g.lineWidth = Math.max(1, R * 0.05);
    g.stroke(p);
    g.globalAlpha = 1;
    g.restore();
  }
  g.fillStyle = ton(centru);
  g.fill(cerc(g, 0, 0, R * 0.2));
  g.restore();
}

function frunzaSimpla(g: Ctx, x: number, y: number, L: number, rot: number, culoare: string, lat = 0.36) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const W = L * lat;
  const p = new Path2D();
  p.moveTo(0, 0);
  p.bezierCurveTo(L * 0.3, -W, L * 0.75, -W * 0.8, L, 0);
  p.bezierCurveTo(L * 0.75, W * 0.8, L * 0.3, W, 0, 0);
  spalare(g, p, culoare, 0.85, 3, 2);
  g.strokeStyle = CERNEALA;
  g.globalAlpha = 0.5;
  g.lineWidth = Math.max(1, L * 0.012);
  g.stroke(p);
  g.beginPath();
  g.moveTo(L * 0.05, 0);
  g.lineTo(L * 0.92, 0);
  g.globalAlpha = 0.3;
  g.stroke();
  g.restore();
}

// ── Trees ───────────────────────────────────────────────────────────────

/** A fir tree: stacked drooping tiers of dark wash on a thin trunk (256×512). */
export function brad(seed: number, culoare = '#405848', W = 256, H = 512) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  const k = W / 256;
  const baza = H * 0.97;
  const varf = H * 0.04;
  linie(g, [[W / 2, baza], [W / 2 + r.range(-3, 3), varf + 30 * k]], 2.6 * k, 0.75, 0.5, seed);
  const etaje = r.int(9, 12);
  for (let i = 0; i < etaje; i++) {
    const t = i / (etaje - 1);
    const y = lerp(baza - H * 0.12, varf + H * 0.06, t);
    const L = lerp(W * 0.46, W * 0.07, Math.pow(t, 0.9)) * r.range(0.85, 1.1);
    const cad = L * r.range(0.25, 0.4);
    const p = new Path2D();
    p.moveTo(W / 2 - L, y + cad);
    p.quadraticCurveTo(W / 2 - L * 0.4, y - cad * 0.6, W / 2, y - cad * 0.9);
    p.quadraticCurveTo(W / 2 + L * 0.4, y - cad * 0.6, W / 2 + L, y + cad);
    p.quadraticCurveTo(W / 2, y + cad * 0.5, W / 2 - L, y + cad);
    spalare(g, p, culoare, r.range(0.7, 0.9), 2, 1);
    if (r.chance(0.6)) linie(g, [[W / 2 - L * 0.9, y + cad * 0.9], [W / 2, y + cad * 0.35], [W / 2 + L * 0.9, y + cad * 0.9]], 1.2 * k, 0.35, 0.6, i);
  }
  return c;
}

/** A black locust (salcâm): an airy crown hung with white flower clusters (512×512). */
export function salcamPom(seed: number, W = 512, H = 512) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  const k = W / 512;
  const solY = H * 0.965;
  const coroana = { x: W / 2, y: H * 0.38, rx: W * 0.3, ry: H * 0.25 };
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + r.range(0, 1);
    spalare(g, pata(coroana.x + Math.cos(a) * coroana.rx * 0.45, coroana.y + Math.sin(a) * coroana.ry * 0.4, coroana.rx * r.range(0.45, 0.6), coroana.ry * r.range(0.4, 0.55), 0.2, seed + i), '#a6b97e', 0.7, 2, 2);
  }
  const vx = W / 2 + r.range(-15, 15) * k;
  linie(g, [[W / 2, solY], [vx, H * 0.55]], 3.2 * k, 0.8, 1.2, seed);
  for (let i = 0; i < 4; i++) {
    const ex = coroana.x + lerp(-0.7, 0.7, i / 3) * coroana.rx;
    linie(g, [[vx, H * 0.56], [lerp(vx, ex, 0.5) + r.range(-12, 12) * k, H * 0.45], [ex, coroana.y + r.range(-30, 20) * k]], 1.8 * k, 0.6, 1.2, seed + i);
  }
  // Hanging white racemes.
  for (let i = 0; i < 42; i++) {
    const a = r.range(0, Math.PI * 2);
    const d = Math.sqrt(r.next()) * 0.9;
    const x = coroana.x + Math.cos(a) * coroana.rx * d;
    const y = coroana.y + Math.sin(a) * coroana.ry * d;
    const L = r.range(14, 24) * k;
    const p = pata(x, y + L * 0.5, L * 0.22, L * 0.55, 0.1, i);
    g.fillStyle = HARTIE;
    g.fill(p);
    spalare(g, p, '#f3eedf', 0.9, 1, 1);
    g.strokeStyle = CERNEALA;
    g.globalAlpha = 0.35;
    g.lineWidth = 1.1 * k;
    g.stroke(p);
    g.globalAlpha = 1;
  }
  linie(g, [[W / 2 - 40 * k, solY + 2], [W / 2 + 46 * k, solY + 1]], 1.2 * k, 0.3, 0.6, seed);
  return c;
}

// ── Low plants (512×256, base on the bottom edge) ───────────────────────

/** A clump of flowering rapeseed: tall stems with dense yellow heads. */
export function tufaRapita(seed: number, W = 512, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  for (let i = 0; i < 9; i++) {
    const x = W / 2 + r.gauss() * W * 0.14;
    const h = r.range(0.55, 0.95) * H;
    const lean = r.range(-0.12, 0.12) * h;
    linie(g, [[x, H], [x + lean * 0.4, H - h * 0.5], [x + lean, H - h]], 1.6, 0.5, 0.6, i);
    if (r.chance(0.5)) frunzaSimpla(g, x, H - h * 0.3, r.range(30, 45), r.chance(0.5) ? -0.6 : -2.5, '#93ad86', 0.3);
    for (let j = 0; j < 9; j++) {
      const fx = x + lean + r.gauss() * 9;
      const fy = H - h + r.gauss() * 9;
      floareMica(g, fx, fy, '#efc93a', r.range(5, 7.5));
    }
  }
  return c;
}

/** A clump of mixed summer wildflowers. */
export function tufaPoliflora(seed: number, W = 512, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  const flori = [
    ['#c9463a', '#2b2622', 4], // poppy
    ['#5b7fd0', '#2b2622', 6], // cornflower
    ['#f4efe2', '#e8b93a', 8], // chamomile
    ['#c47fb6', '#7d4f78', 5], // clover / sage
    ['#e9c047', '#b8862a', 5], // st john's wort
  ] as const;
  for (let i = 0; i < 12; i++) {
    const x = W / 2 + r.gauss() * W * 0.15;
    const h = r.range(0.4, 0.9) * H;
    const lean = r.range(-0.15, 0.15) * h;
    linie(g, [[x, H], [x + lean * 0.4, H - h * 0.5], [x + lean, H - h]], 1.4, 0.45, 0.6, i);
    const [cul, centru, n] = r.pick(flori);
    floareSimpla(g, x + lean, H - h, r.range(9, 13), n, cul, centru, r);
  }
  return c;
}

/** A raspberry bush: arching canes, leaves, red berries and small white flowers. */
export function tufaZmeur(seed: number, W = 512, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  for (let i = 0; i < 7; i++) {
    const x = W / 2 + r.gauss() * W * 0.1;
    const h = r.range(0.6, 0.95) * H;
    const dir = r.chance(0.5) ? 1 : -1;
    const ex = x + dir * r.range(80, 160);
    const ey = H - h * r.range(0.4, 0.7);
    linie(g, [[x, H], [x + dir * 20, H - h], [ex, ey]], 1.8, 0.55, 0.6, i);
    for (let j = 0; j < 6; j++) {
      const t = r.range(0.2, 1);
      const lx = lerp(x + dir * 20, ex, t) + r.range(-6, 6);
      const ly = lerp(H - h, ey, t) + r.range(-6, 10);
      frunzaSimpla(g, lx, ly, r.range(22, 34), r.range(-Math.PI, Math.PI), '#7f9e62', 0.5);
    }
  }
  for (let i = 0; i < 16; i++) {
    const x = W / 2 + r.gauss() * W * 0.22;
    const y = H - r.range(0.3, 0.8) * H;
    if (r.chance(0.6)) {
      const p = cerc(g, x, y, r.range(5, 7));
      spalare(g, p, '#c2333f', 0.95, 1, 1);
      g.fillStyle = 'rgba(255,240,230,0.6)';
      g.fill(cerc(g, x - 2, y - 2, 1.6));
    } else floareSimpla(g, x, y, 7, 5, '#f4efe2', '#d9c56a', r);
  }
  return c;
}

/** A mound of flowering heather (Calluna vulgaris). */
export function tufaIarbaNeagra(seed: number, W = 512, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  spalare(g, pata(W / 2, H * 0.82, W * 0.38, H * 0.2, 0.25, seed), '#6f6a4f', 0.6, 2, 1);
  for (let i = 0; i < 30; i++) {
    const x = W / 2 + r.gauss() * W * 0.18;
    const h = r.range(0.25, 0.6) * H;
    const lean = r.range(-0.2, 0.2) * h;
    linie(g, [[x, H * 0.95], [x + lean, H - h]], 1.1, 0.4, 0.4, i);
    for (let j = 0; j < 7; j++) {
      const t = r.range(0.3, 1);
      floareMica(g, x + lean * t + r.range(-3, 3), H * 0.95 - (H * 0.95 - (H - h)) * t, r.chance(0.8) ? '#9a5fa3' : '#c590c4', r.range(3, 5));
    }
  }
  return c;
}

/** A grey boulder drawn with a few strong brush strokes (512×256). */
export function stanca(seed: number, W = 512, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  const pts: [number, number][] = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = lerp(W * 0.12, W * 0.88, t);
    const y = H * 0.95 - Math.sin(Math.PI * t) * H * r.range(0.5, 0.8);
    pts.push([x, y]);
  }
  const p = new Path2D();
  p.moveTo(pts[0][0], H);
  pts.forEach(([x, y]) => p.lineTo(x, y));
  p.lineTo(pts[n][0], H);
  p.closePath();
  g.fillStyle = HARTIE;
  g.fill(p);
  spalare(g, p, '#9a9a92', 0.75, 3, 2);
  linie(g, pts, 3, 0.75, 1.5, seed);
  for (let i = 0; i < 3; i++) {
    const x = r.range(W * 0.3, W * 0.7);
    linie(g, [[x, H * 0.5], [x + r.range(-30, 30), H * 0.9]], 1.6, 0.35, 1, i);
  }
  return c;
}

/** The beekeeper's wooden hut, with a lit window for the night (512×512). */
export function casuta(seed: number, W = 512, H = 512) {
  const { c, g } = panza(W, H);
  const k = W / 512;
  const x0 = 120 * k;
  const x1 = 360 * k;
  const y0 = 260 * k;
  const y1 = 480 * k;
  const zid = new Path2D();
  zid.rect(x0, y0, x1 - x0, y1 - y0);
  const acoperis = new Path2D();
  acoperis.moveTo(x0 - 40 * k, y0 + 10 * k);
  acoperis.lineTo((x0 + x1) / 2, 120 * k);
  acoperis.lineTo(x1 + 40 * k, y0 + 10 * k);
  acoperis.closePath();
  g.fillStyle = HARTIE;
  g.fill(zid);
  spalare(g, zid, '#9a7a5c', 0.8, 3, 2);
  g.fill(acoperis);
  spalare(g, acoperis, '#5c4a40', 0.85, 3, 2);
  linie(g, [[x0, y1], [x0, y0], [x1, y0], [x1, y1]], 2.4 * k, 0.75, 1, seed);
  linie(g, [[x0 - 40 * k, y0 + 10 * k], [(x0 + x1) / 2, 120 * k], [x1 + 40 * k, y0 + 10 * k]], 3 * k, 0.8, 1, seed + 1);
  for (let y = y0 + 30 * k; y < y1; y += 30 * k) linie(g, [[x0, y], [x1, y]], 1 * k, 0.25, 0.8, y);
  // Window (warm light) and door.
  const fereastra = new Path2D();
  fereastra.rect(x0 + 40 * k, y0 + 60 * k, 60 * k, 60 * k);
  g.fillStyle = '#f2c35a';
  g.fill(fereastra);
  linie(g, [[x0 + 40 * k, y0 + 60 * k], [x0 + 100 * k, y0 + 60 * k], [x0 + 100 * k, y0 + 120 * k], [x0 + 40 * k, y0 + 120 * k], [x0 + 40 * k, y0 + 60 * k]], 2 * k, 0.7, 0.6, seed + 2);
  linie(g, [[x0 + 70 * k, y0 + 60 * k], [x0 + 70 * k, y0 + 120 * k]], 1.6 * k, 0.6, 0.4, seed + 3);
  const usa = new Path2D();
  usa.rect(x1 - 100 * k, y0 + 90 * k, 60 * k, y1 - y0 - 90 * k);
  spalare(g, usa, '#4a3a30', 0.85, 1, 1);
  return c;
}

// ── Close-ups (2048×1024). Each returns the canvas and the landing point. ──

type Erou = { canvas: HTMLCanvasElement; ancora: { u: number; v: number } };

function erou(seed: number, desen: (g: Ctx, W: number, H: number, r: Rng) => { x: number; y: number }): Erou {
  const W = 2048;
  const H = 1024;
  const { c, g } = panza(W, H);
  const a = desen(g, W, H, rng(seed));
  return { canvas: c, ancora: { u: a.x / W, v: a.y / H } };
}

/** Rapeseed: a flowering raceme of four-petalled yellow flowers. */
export const erouRapita = (seed: number) =>
  erou(seed, (g, W, H, r) => {
    const tulpini: [number, number, number][] = [
      [W * 0.38, H * 1.05, 0],
      [W * 0.12, H * 1.05, -0.12],
      [W * 0.62, H * 1.05, 0.15],
    ];
    let ancora = { x: 0, y: 0 };
    tulpini.forEach(([bx, by, lean], idx) => {
      const vx = bx + lean * H;
      const vy = H * (idx === 0 ? 0.42 : r.range(0.3, 0.5));
      linie(g, [[bx, by], [lerp(bx, vx, 0.5), lerp(by, vy, 0.5)], [vx, vy]], 6, 0.7, 2, idx);
      frunzaSimpla(g, lerp(bx, vx, 0.25), lerp(by, vy, 0.25), r.range(220, 280), idx % 2 ? -0.5 : -2.6, '#8fae8a', 0.32);
      // Seed pods below the flowers.
      for (let j = 0; j < 5; j++) {
        const py = lerp(by, vy, 0.6 + j * 0.05);
        const px = lerp(bx, vx, 0.6 + j * 0.05);
        const dir = j % 2 ? 1 : -1;
        linie(g, [[px, py], [px + dir * 60, py - 50]], 3, 0.45, 1, j);
      }
      // Buds at the tip, open flowers below them.
      for (let j = 0; j < 6; j++) {
        const a = r.range(0, Math.PI * 2);
        floareMica(g, vx + Math.cos(a) * 26, vy - 40 + Math.sin(a) * 22, '#c8c060', 10);
      }
      const nF = idx === 0 ? 6 : 4;
      for (let j = 0; j < nF; j++) {
        const a = (j / nF) * Math.PI * 2 + r.range(-0.2, 0.2);
        floareSimpla(g, vx + Math.cos(a) * 70, vy + 30 + Math.sin(a) * 50, r.range(46, 58), 4, '#efc93a', '#d79a1e', r);
      }
      if (idx === 0) {
        floareSimpla(g, vx + 10, vy + 20, 92, 4, '#f1cd3e', '#d79a1e', r, 0.4);
        ancora = { x: vx + 10, y: vy + 20 };
      }
    });
    return ancora;
  });

/** Black locust: a branch of pinnate leaves with a hanging white raceme. */
export const erouSalcam = (seed: number) =>
  erou(seed, (g, W, H, r) => {
    linie(g, [[W * 1.05, H * 0.2], [W * 0.6, H * 0.26], [W * 0.05, H * 0.18]], 10, 0.75, 2, 1);
    // Pinnate leaves along the branch.
    for (let i = 0; i < 5; i++) {
      const bx = lerp(W * 0.95, W * 0.12, i / 4);
      const by = H * 0.23;
      const ex = bx + r.range(-160, 160);
      const ey = by + r.range(-160, 200);
      linie(g, [[bx, by], [ex, ey]], 2.4, 0.5, 1, i);
      for (let j = 1; j <= 5; j++) {
        const t = j / 6;
        const lx = lerp(bx, ex, t);
        const ly = lerp(by, ey, t);
        const ang = Math.atan2(ey - by, ex - bx);
        frunzaSimpla(g, lx, ly, 70, ang - 1.2, '#97b27a', 0.5);
        frunzaSimpla(g, lx, ly, 70, ang + 1.2, '#97b27a', 0.5);
      }
    }
    // The raceme: pea-like flowers getting smaller towards the tip.
    const rx = W * 0.36;
    const ry0 = H * 0.24;
    linie(g, [[rx, ry0], [rx + 20, H * 0.5], [rx - 10, H * 0.9]], 3, 0.6, 1, 9);
    let ancora = { x: rx, y: ry0 + 90 };
    for (let j = 0; j < 11; j++) {
      const t = j / 10;
      const y = lerp(ry0 + 80, H * 0.92, t);
      const R = lerp(70, 26, t);
      for (const dir of [-1, 1]) {
        if (j > 7 && dir > 0) continue;
        const x = rx + dir * R * 0.9 + lerp(10, -10, t);
        const p = pata(x, y, R * 0.6, R * 0.75, 0.12, j * 3 + dir);
        g.fillStyle = HARTIE;
        g.fill(p);
        spalare(g, p, '#f5f0e2', 0.9, 2, 1);
        g.strokeStyle = CERNEALA;
        g.globalAlpha = 0.6;
        g.lineWidth = 2;
        g.stroke(p);
        g.globalAlpha = 1;
        spalare(g, pata(x + dir * R * 0.1, y + R * 0.35, R * 0.22, R * 0.14, 0.1, j), '#e8d98a', 0.8, 1, 1);
        if (j === 1 && dir < 0) ancora = { x, y };
      }
    }
    return ancora;
  });

/** Wildflowers: a pink clover head among chamomile and cornflowers. */
export const erouPoliflora = (seed: number) =>
  erou(seed, (g, W, H, r) => {
    const ax = W * 0.34;
    const ay = H * 0.44;
    linie(g, [[ax + 40, H * 1.05], [ax + 10, H * 0.7], [ax, ay + 40]], 6, 0.7, 2, 1);
    for (const [lx, ly, rot] of [
      [ax + 20, H * 0.75, -0.4],
      [ax + 20, H * 0.75, -1.5],
      [ax + 20, H * 0.75, -2.7],
    ] as const)
      frunzaSimpla(g, lx, ly, 130, rot, '#88a86f', 0.6);
    // Clover head: many small petals in a globe.
    for (let i = 0; i < 90; i++) {
      const a = r.range(0, Math.PI * 2);
      const d = Math.sqrt(r.next()) * 95;
      const x = ax + Math.cos(a) * d;
      const y = ay + Math.sin(a) * d * 0.85;
      const p = pata(x, y, 16, 9, 0.1, i);
      spalare(g, p, i % 3 ? '#c77fb2' : '#e0a8cf', 0.9, 1, 1);
      g.strokeStyle = CERNEALA;
      g.globalAlpha = 0.25;
      g.lineWidth = 1.2;
      g.stroke(p);
      g.globalAlpha = 1;
    }
    // Neighbours.
    linie(g, [[W * 0.62, H * 1.05], [W * 0.6, H * 0.5]], 4, 0.6, 2, 2);
    floareSimpla(g, W * 0.6, H * 0.5, 80, 12, '#f6f1e4', '#e8b93a', r);
    linie(g, [[W * 0.15, H * 1.05], [W * 0.17, H * 0.62]], 4, 0.6, 2, 3);
    floareSimpla(g, W * 0.17, H * 0.6, 70, 8, '#5b7fd0', '#2b2622', r);
    linie(g, [[W * 0.8, H * 1.05], [W * 0.82, H * 0.35]], 4, 0.6, 2, 4);
    floareSimpla(g, W * 0.82, H * 0.33, 64, 5, '#c9463a', '#2b2622', r);
    return { x: ax, y: ay - 40 };
  });

/** Fir: a needled branch with drops of honeydew catching the light. */
export const erouBrad = (seed: number) =>
  erou(seed, (g, W, H, r) => {
    const ramura = (x0: number, y0: number, x1: number, y1: number, lat: number, s: number) => {
      linie(g, [[x0, y0], [x1, y1]], lat, 0.75, 1.5, s);
      const L = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.floor(L / 16);
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const x = lerp(x0, x1, t);
        const y = lerp(y0, y1, t);
        for (const dir of [-1, 1]) {
          const ang = Math.atan2(y1 - y0, x1 - x0) + dir * 1.1;
          const l = 46 * (1 - t * 0.4);
          g.strokeStyle = ton('#3e5a44');
          g.globalAlpha = 0.5;
          g.lineWidth = 3;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(x, y);
          g.quadraticCurveTo(x + Math.cos(ang) * l * 0.5, y + Math.sin(ang) * l * 0.5 + 6, x + Math.cos(ang) * l, y + Math.sin(ang) * l + 4);
          g.stroke();
        }
      }
      g.globalAlpha = 1;
    };
    ramura(W * 1.05, H * 0.6, W * 0.08, H * 0.42, 12, 1);
    for (const t of [0.2, 0.45, 0.7]) {
      const x = lerp(W * 1.05, W * 0.08, t);
      const y = lerp(H * 0.6, H * 0.42, t);
      ramura(x, y, x - r.range(150, 260), y - r.range(120, 220), 5, t * 10);
      ramura(x, y, x - r.range(120, 220), y + r.range(100, 180), 5, t * 20);
    }
    // Honeydew drops.
    const picatura = (x: number, y: number, R: number) => {
      const p = new Path2D();
      p.moveTo(x, y - R * 1.4);
      p.quadraticCurveTo(x + R, y - R * 0.2, x, y + R);
      p.quadraticCurveTo(x - R, y - R * 0.2, x, y - R * 1.4);
      g.fillStyle = 'rgba(176,112,34,0.85)';
      g.fill(p);
      g.fillStyle = 'rgba(255,248,225,0.85)';
      g.beginPath();
      g.arc(x - R * 0.3, y - R * 0.2, R * 0.25, 0, Math.PI * 2);
      g.fill();
    };
    for (let i = 0; i < 6; i++) picatura(lerp(W * 0.9, W * 0.15, r.next()), lerp(H * 0.58, H * 0.44, r.next()) + 30, r.range(10, 16));
    const ax = W * 0.36;
    const ay = lerp(H * 0.6, H * 0.42, (W * 1.05 - ax) / (W * 0.97)) - 6;
    picatura(ax + 50, ay + 40, 18);
    return { x: ax, y: ay };
  });

/** Raspberry: a cane with leaves, a small white flower and ripe berries. */
export const erouZmeura = (seed: number) =>
  erou(seed, (g, W, H, r) => {
    linie(g, [[W * 0.95, H * 1.05], [W * 0.62, H * 0.35], [W * 0.1, H * 0.45]], 9, 0.75, 2, 1);
    for (let i = 0; i < 7; i++) {
      const t = r.range(0.15, 0.95);
      const x = t < 0.5 ? lerp(W * 0.95, W * 0.62, t * 2) : lerp(W * 0.62, W * 0.1, (t - 0.5) * 2);
      const y = t < 0.5 ? lerp(H * 1.05, H * 0.35, t * 2) : lerp(H * 0.35, H * 0.45, (t - 0.5) * 2);
      for (const rot of [-0.6, 0.6, 0]) frunzaSimpla(g, x, y, r.range(140, 190), (r.chance(0.5) ? -1.4 : 1.6) + rot, '#7f9e62', 0.55);
    }
    const boaba = (x: number, y: number, R: number) => {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const d = i < 7 ? R * 0.5 : R * 0.2;
        const p = cerc(g, x + Math.cos(a) * d, y + Math.sin(a) * d * 1.1, R * 0.38);
        spalare(g, p, '#c2333f', 0.95, 1, 1);
      }
      g.fillStyle = 'rgba(255,240,230,0.7)';
      g.fill(cerc(g, x - R * 0.3, y - R * 0.35, R * 0.12));
      linie(g, [[x, y - R * 1.1], [x, y - R * 1.9]], 2.4, 0.6, 0.6, x);
    };
    boaba(W * 0.55, H * 0.62, 56);
    boaba(W * 0.68, H * 0.7, 48);
    boaba(W * 0.2, H * 0.62, 44);
    const ax = W * 0.36;
    const ay = H * 0.38;
    linie(g, [[W * 0.42, H * 0.41], [ax, ay + 20]], 3, 0.6, 1, 2);
    floareSimpla(g, ax, ay, 96, 5, '#f4efe2', '#d9c56a', r, 0.3);
    return { x: ax, y: ay };
  });

/** Heather: upright sprigs covered in tiny violet bells. */
export const erouIarbaNeagra = (seed: number) =>
  erou(seed, (g, W, H, r) => {
    let ancora = { x: 0, y: 0 };
    const tulpini = 7;
    for (let i = 0; i < tulpini; i++) {
      const bx = lerp(W * 0.1, W * 0.9, i / (tulpini - 1)) + r.range(-40, 40);
      const vx = bx + r.range(-80, 80);
      const vy = i === 2 ? H * 0.36 : H * r.range(0.2, 0.5);
      linie(g, [[bx, H * 1.05], [lerp(bx, vx, 0.5), H * 0.7], [vx, vy]], 5, 0.7, 2, i);
      const n = 26;
      for (let j = 0; j < n; j++) {
        const t = j / n;
        const x = lerp(lerp(bx, vx, 0.5), vx, t) + r.range(-28, 28);
        const y = lerp(H * 0.7, vy, t) + r.range(-10, 10);
        const p = pata(x, y, r.range(12, 17), r.range(9, 13), 0.15, i * 40 + j);
        spalare(g, p, r.chance(0.75) ? '#9a5fa3' : '#c590c4', 0.95, 1, 1);
        g.strokeStyle = CERNEALA;
        g.globalAlpha = 0.3;
        g.lineWidth = 1.4;
        g.stroke(p);
        g.globalAlpha = 1;
      }
      if (i === 2) ancora = { x: vx, y: vy + 20 };
    }
    return ancora;
  });
