// Trees in sketch style: ink trunk and branches, a crown of loose watercolour
// blobs, and the close-up blossom branch the bee lands on in the orchard.

import { rng, lerp, type Rng } from '../util';
import { panza, linie, pata, spalare, contur, CERNEALA, HARTIE, type Ctx } from './panza';
import { floareMica } from './teren';

export interface PaletaCoroana {
  spalare: string;
  /** Blossom dabs; omitted for leafy trees. */
  flori?: string;
}

export const PALETE = {
  mar: { spalare: '#f1c3cc', flori: '#e2849b' },
  cires: { spalare: '#f4dde0', flori: '#ecaebc' },
  prun: { spalare: '#e3edc7', flori: '#f0dda6' },
  tei: { spalare: '#92b36a' },
} satisfies Record<string, PaletaCoroana>;

export interface OptPom {
  seed: number;
  w?: number;
  h?: number;
  paleta: PaletaCoroana;
  latime?: number;
  inaltimeTrunchi?: number;
}

/** A whole tree with its trunk at the bottom centre of the texture. */
export function pom(o: OptPom) {
  const W = o.w ?? 512;
  const H = o.h ?? 512;
  const { c, g } = panza(W, H);
  const r = rng(o.seed);
  const k = W / 512;
  const lat = o.latime ?? 1;
  const solY = H * 0.965;
  const trunchi = H * (o.inaltimeTrunchi ?? 0.3);
  const baza = { x: W / 2 + r.range(-6, 6) * k, y: solY };
  const varf = { x: W / 2 + r.range(-12, 12) * k, y: solY - trunchi };
  const coroana = { x: W / 2, y: varf.y - H * 0.2, rx: W * 0.3 * Math.min(1.2, lat), ry: H * 0.24 };

  // Crown: a few overlapping washes.
  const blobs: Path2D[] = [];
  const n = r.int(3, 4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r.range(0, 1);
    const p = pata(
      coroana.x + Math.cos(a) * coroana.rx * 0.38,
      coroana.y + Math.sin(a) * coroana.ry * 0.32,
      coroana.rx * r.range(0.55, 0.72),
      coroana.ry * r.range(0.55, 0.72),
      0.16,
      o.seed + i,
    );
    blobs.push(p);
    spalare(g, p, o.paleta.spalare, 0.78, 3 * k, 2 * k);
  }

  // Trunk: two ink edges over a pale wash.
  const tw = W * 0.028;
  const trunk = new Path2D();
  trunk.moveTo(baza.x - tw, baza.y);
  trunk.lineTo(varf.x - tw * 0.5, varf.y);
  trunk.lineTo(varf.x + tw * 0.5, varf.y);
  trunk.lineTo(baza.x + tw, baza.y);
  trunk.closePath();
  spalare(g, trunk, '#b0916d', 0.7, 1, 0);
  linie(g, [[baza.x - tw, baza.y], [varf.x - tw * 0.5, varf.y]], 2.2 * k, 0.75, 0.8, o.seed);
  linie(g, [[baza.x + tw, baza.y], [varf.x + tw * 0.5, varf.y]], 1.6 * k, 0.55, 0.8, o.seed + 1);

  // Branches: two or three limbs that fork, starting at different heights.
  const limbi = r.int(2, 3);
  for (let i = 0; i < limbi; i++) {
    const t = limbi === 1 ? 0.5 : i / (limbi - 1);
    const start = r.range(0.0, 0.25);
    const sx = lerp(varf.x, baza.x, start);
    const sy = lerp(varf.y, baza.y, start);
    const ex = coroana.x + lerp(-0.55, 0.55, t) * coroana.rx + r.range(-12, 12) * k;
    const ey = coroana.y + r.range(-0.15, 0.25) * coroana.ry;
    const mx = lerp(sx, ex, 0.45) + r.range(-10, 10) * k;
    const my = lerp(sy, ey, 0.55);
    linie(g, [[sx, sy], [mx, my], [ex, ey]], 2 * k, 0.62, 0.9, o.seed + i * 3);
    // Forks.
    for (let f = 0; f < 2; f++) {
      const fx = lerp(mx, ex, 0.4) ;
      const fy = lerp(my, ey, 0.4);
      const dir = (f === 0 ? -1 : 1) * r.range(0.4, 0.9);
      const L = r.range(0.25, 0.45) * coroana.ry;
      linie(g, [[fx, fy], [fx + dir * L * 0.8 + (ex - mx) * 0.2, fy - L]], 1.2 * k, 0.45, 0.6, i * 7 + f);
    }
  }

  for (const p of blobs) contur(g, p, 1.4 * k, 0.32);

  if (o.paleta.flori) {
    for (let i = 0; i < 26; i++) {
      const a = r.range(0, Math.PI * 2);
      const d = Math.sqrt(r.next()) * 0.9;
      floareMica(g, coroana.x + Math.cos(a) * coroana.rx * d, coroana.y + Math.sin(a) * coroana.ry * d, o.paleta.flori, r.range(4, 6.5) * k);
    }
  }
  linie(g, [[baza.x - 40 * k, solY + 2], [baza.x + 46 * k, solY + 1]], 1.2 * k, 0.3, 0.6, o.seed);
  return c;
}

// ── The close-up branch ──────────────────────────────────────────────────

const PETALA = '#f0bcc6';
const POLEN = '#e7bf55';

/** One open five-petal blossom: pale wash petals with a fine ink outline. */
export function floareMare(g: Ctx, x: number, y: number, R: number, rot: number, squash: number, r: Rng) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(1, squash);
  const baza = r.range(0, Math.PI * 2);
  for (let i = 0; i < 5; i++) {
    const a = baza + (i / 5) * Math.PI * 2 + r.range(-0.1, 0.1);
    const L = R * r.range(0.92, 1.05);
    const Wp = R * 0.62;
    g.save();
    g.rotate(a);
    const p = new Path2D();
    p.moveTo(R * 0.05, 0);
    p.bezierCurveTo(L * 0.25, -Wp * 0.62, L * 0.82, -Wp * 0.72, L, -Wp * 0.08);
    p.bezierCurveTo(L * 1.04, Wp * 0.18, L * 0.86, Wp * 0.7, L * 0.45, Wp * 0.6);
    p.bezierCurveTo(L * 0.2, Wp * 0.5, R * 0.05, Wp * 0.15, R * 0.05, 0);
    g.fillStyle = HARTIE;
    g.fill(p);
    spalare(g, p, PETALA, 0.75, 2, 1);
    g.strokeStyle = CERNEALA;
    g.globalAlpha = 0.7;
    g.lineWidth = Math.max(1, R * 0.028);
    g.lineJoin = 'round';
    g.stroke(p);
    g.globalAlpha = 1;
    g.restore();
  }
  // Stamens.
  g.strokeStyle = CERNEALA;
  g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + r.range(-0.2, 0.2);
    const L = R * r.range(0.3, 0.42);
    g.globalAlpha = 0.5;
    g.lineWidth = Math.max(0.8, R * 0.016);
    g.beginPath();
    g.moveTo(Math.cos(a) * R * 0.08, Math.sin(a) * R * 0.08);
    g.lineTo(Math.cos(a) * L, Math.sin(a) * L);
    g.stroke();
    g.globalAlpha = 1;
    g.fillStyle = POLEN;
    g.beginPath();
    g.arc(Math.cos(a) * L, Math.sin(a) * L, R * 0.04, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#d8cf86';
  g.beginPath();
  g.arc(0, 0, R * 0.1, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function boboc(g: Ctx, x: number, y: number, R: number, rot: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const p = pata(0, 0, R * 0.6, R * 0.8, 0.05, x);
  g.fillStyle = HARTIE;
  g.fill(p);
  spalare(g, p, '#e58aa0', 0.85, 1.5, 1);
  g.strokeStyle = CERNEALA;
  g.globalAlpha = 0.65;
  g.lineWidth = 2.2;
  g.stroke(p);
  g.beginPath();
  g.moveTo(0, R * 0.8);
  g.lineTo(0, R * 1.4);
  g.stroke();
  g.restore();
}

function frunza(g: Ctx, x: number, y: number, L: number, rot: number, r: Rng) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const Wf = L * r.range(0.32, 0.4);
  const p = new Path2D();
  p.moveTo(0, 0);
  p.bezierCurveTo(L * 0.3, -Wf, L * 0.75, -Wf * 0.8, L, 0);
  p.bezierCurveTo(L * 0.75, Wf * 0.8, L * 0.3, Wf, 0, 0);
  spalare(g, p, '#9fc46e', 0.85, 4, 3);
  g.strokeStyle = CERNEALA;
  g.globalAlpha = 0.6;
  g.lineWidth = 2.2;
  g.stroke(p);
  g.globalAlpha = 0.4;
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(L * 0.05, 0);
  g.quadraticCurveTo(L * 0.5, -Wf * 0.1, L * 0.92, 0);
  g.stroke();
  g.restore();
}

/**
 * The branch for the orchard close-up. Returns the texture and the point
 * (u, v in 0..1) of the flower the bee lands on.
 */
export function creangaInflorita(seed: number, W = 2048, H = 1024) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  // The trunk stands on the left; the branch grows out of it to the right.
  const tx = W * 0.07;
  const trunchi = new Path2D();
  trunchi.moveTo(tx - 36, H + 10);
  trunchi.lineTo(tx - 24, H * 0.3);
  trunchi.lineTo(tx + 24, H * 0.3);
  trunchi.lineTo(tx + 36, H + 10);
  trunchi.closePath();
  spalare(g, trunchi, '#8a7360', 0.7, 2, 0);
  linie(g, [[tx, H * 1.35], [tx + 6, H * 0.55], [tx, H * 0.28]], 30, 0.7, 2, seed + 7);
  // Two limbs fork upwards into the crown above.
  linie(g, [[tx, H * 0.36], [tx + 70, H * 0.16], [W * 0.18, -H * 0.02]], 14, 0.65, 2, seed + 8);
  linie(g, [[tx, H * 0.34], [tx - 30, H * 0.12], [tx - 60, -H * 0.02]], 12, 0.6, 2, seed + 9);
  const p0 = { x: tx, y: H * 0.66 };
  const p1 = { x: W * 0.45, y: H * 0.5 };
  const p2 = { x: W * 1.06, y: H * 0.36 };
  const pe = (t: number) => {
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const cc = t * t;
    return { x: a * p0.x + b * p1.x + cc * p2.x, y: a * p0.y + b * p1.y + cc * p2.y };
  };
  const gros = (t: number) => lerp(44, 14, t);

  // Branch: pale wash between two ink edges.
  const sus: [number, number][] = [];
  const jos: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = pe(t);
    const b = pe(Math.min(1, t + 0.01));
    const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / L;
    const ny = (b.x - a.x) / L;
    sus.push([a.x + nx * gros(t) * 0.5, a.y + ny * gros(t) * 0.5]);
    jos.push([a.x - nx * gros(t) * 0.5, a.y - ny * gros(t) * 0.5]);
  }
  const corp = new Path2D();
  sus.forEach(([x, y], i) => (i ? corp.lineTo(x, y) : corp.moveTo(x, y)));
  [...jos].reverse().forEach(([x, y]) => corp.lineTo(x, y));
  corp.closePath();
  spalare(g, corp, '#b08d68', 0.8, 3, 2);
  linie(g, sus, 3, 0.75, 1.4, seed);
  linie(g, jos, 2.2, 0.55, 1.4, seed + 1);

  // Twigs ending in small clusters.
  const ciorchini: { x: number; y: number }[] = [];
  for (const t of [0.3, 0.62, 0.86]) {
    const b = pe(t);
    const susDir = r.chance(0.6);
    const a = susDir ? r.range(-2.3, -1.7) : r.range(1.8, 2.2);
    const L = r.range(130, 200);
    const e = { x: b.x + Math.cos(a) * L, y: b.y + Math.sin(a) * L };
    linie(g, [[b.x, b.y], [e.x, e.y]], 2.4, 0.65, 1, t * 10);
    ciorchini.push(e);
  }
  for (const k of ciorchini) {
    frunza(g, k.x, k.y, r.range(120, 160), r.range(-Math.PI, Math.PI), r);
    boboc(g, k.x + r.range(-70, 70), k.y + r.range(-60, 30), 24, r.range(-0.5, 0.5));
    const nF = r.int(1, 2);
    for (let i = 0; i < nF; i++) {
      const a = r.range(0, Math.PI * 2);
      floareMare(g, k.x + Math.cos(a) * 55, k.y + Math.sin(a) * 45, r.range(62, 80), r.range(-0.5, 0.5), r.range(0.65, 0.95), r);
    }
  }

  // The landing flower: large, open, facing the camera.
  const ax = W * 0.31;
  const ay = H * 0.42;
  const b = pe(0.35);
  linie(g, [[b.x, b.y], [ax + 10, ay + 30]], 2.6, 0.7, 1, 3);
  frunza(g, ax + 30, ay + 40, 180, 0.6, r);
  frunza(g, ax - 20, ay + 30, 160, 2.4, r);
  boboc(g, ax + 130, ay - 80, 26, 0.9);
  floareMare(g, ax, ay, 116, 0.2, 0.93, r);

  return { canvas: c, ancora: { u: ax / W, v: ay / H }, tulpini: [{ u: tx / W, lat: 30 }] };
}
