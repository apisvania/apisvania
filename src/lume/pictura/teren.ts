// Terrain in sketch style: hills drawn as a single ink contour over a pale
// wash, ground strips that are mostly bare paper, and soft mist.

import { fbm1, rng, mixHex } from '../util';
import { panza, inBucla, linie, pata, spalare, pataMoale, CERNEALA, type Ctx } from './panza';
import { ton } from '../stil';

/** Rows 0..BANDA of every terrain texture hold detail; the rows below are a flat fill. */
export const BANDA = 0.86;

export interface Floare {
  culoare: string;
  densitate: number;
}

export interface OptDeal {
  w?: number;
  h?: number;
  seed: number;
  /** Paper colour of the ground (opaque fill). */
  sol: string;
  /** Watercolour tint just under the ridge. */
  spalare: string;
  creasta: number;
  amplitudine: number;
  frecventa: number;
  /** Ink strength of the ridge line (0..1). */
  cerneala?: number;
  padure?: { culoare: string; densitate: number; marime: number; conifere?: boolean };
  livada?: { culoare: string; randuri: number; marime: number };
  margini?: number;
}

export function deal(o0: OptDeal) {
  const o = { ...o0, sol: ton(o0.sol), spalare: ton(o0.spalare) };
  const W = o.w ?? 2048;
  const H = o.h ?? 512;
  const { c, g } = panza(W, H);
  const r = rng(o.seed);
  const Hb = H * BANDA;
  const creasta = (x: number) =>
    Hb * o.creasta +
    Hb * o.amplitudine * fbm1((x / W) * o.frecventa, 4, o.seed) +
    Hb * o.amplitudine * 0.15 * fbm1((x / W) * o.frecventa * 5, 2, o.seed + 9);

  const forma = new Path2D();
  forma.moveTo(0, H);
  for (let x = 0; x <= W; x += 6) forma.lineTo(x, creasta(x));
  forma.lineTo(W, H);
  forma.closePath();
  g.fillStyle = o.sol;
  g.fill(forma);

  // Wash under the ridge, fading into bare paper.
  g.save();
  g.clip(forma);
  const sus = Hb * (o.creasta - o.amplitudine);
  const gr = g.createLinearGradient(0, sus, 0, sus + Hb * 0.45);
  gr.addColorStop(0, mixHex(o.spalare, o.spalare, 0, 0.55));
  gr.addColorStop(1, mixHex(o.spalare, o.spalare, 0, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, W, Hb);
  // A few hatching strokes on the shaded flanks.
  for (let k = 0; k < 26; k++) {
    const x0 = r.range(0, W);
    const y0 = creasta(x0) + r.range(6, 40);
    for (let j = 0; j < r.int(3, 6); j++) {
      const x = x0 + j * 7;
      g.strokeStyle = CERNEALA;
      g.globalAlpha = 0.12;
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x, y0);
      g.lineTo(x + 10, y0 + 16);
      g.stroke();
    }
  }
  g.globalAlpha = 1;

  if (o.livada) {
    const L = o.livada;
    for (let k = 0; k < L.randuri; k++) {
      const off = (k + 1) * L.marime * 3;
      for (let x = r.range(0, L.marime * 4); x < W; x += L.marime * r.range(3.2, 4.2)) {
        if (fbm1((x / W) * 7 + k, 2, o.seed + 5) < -0.1) continue;
        const y = creasta(x) + off;
        if (y > Hb) continue;
        spalare(g, pata(x, y, L.marime, L.marime * 0.75, 0.2, x), L.culoare, 0.7, 1, 1);
      }
    }
  }
  g.restore();

  if (o.padure) {
    const P = o.padure;
    for (let x = r.range(0, P.marime); x < W; x += P.marime * r.range(0.9, 1.6)) {
      if (fbm1((x / W) * 6, 2, o.seed + 31) < 0.1 - P.densitate * 0.6) continue;
      const y = creasta(x);
      const m = P.marime * r.range(0.7, 1.2);
      if (P.conifere) {
        const p = new Path2D();
        p.moveTo(x, y - m * 2);
        p.lineTo(x + m * 0.5, y + 2);
        p.lineTo(x - m * 0.5, y + 2);
        p.closePath();
        spalare(g, p, P.culoare, 0.6, 1, 1);
      } else spalare(g, pata(x, y - m * 0.4, m * 0.6, m * 0.55, 0.15, x), P.culoare, 0.6, 1, 1);
    }
  }

  // The ridge itself: one confident ink line.
  const pts: [number, number][] = [];
  for (let x = 0; x <= W; x += 16) pts.push([x, creasta(x)]);
  linie(g, pts, 2, o.cerneala ?? 0.5, 1, o.seed);

  g.fillStyle = o.sol;
  g.fillRect(0, Math.floor(H * BANDA) - 2, W, H);
  estompeazaMargini(g, W, H, o.margini ?? 0.1);
  return c;
}

/** Fades the left/right edges so wide layers never show a hard end. */
export function estompeazaMargini(g: Ctx, W: number, H: number, f: number) {
  if (f <= 0) return;
  g.save();
  g.globalCompositeOperation = 'destination-out';
  const L = g.createLinearGradient(0, 0, W * f, 0);
  L.addColorStop(0, 'rgba(0,0,0,1)');
  L.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = L;
  g.fillRect(0, 0, W * f, H);
  const R = g.createLinearGradient(W, 0, W * (1 - f), 0);
  R.addColorStop(0, 'rgba(0,0,0,1)');
  R.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = R;
  g.fillRect(W * (1 - f), 0, W * f, H);
  g.restore();
}

/** A small flower head: a dab of colour with a hint of ink. */
export function floareMica(g: Ctx, x: number, y: number, culoare: string, m: number) {
  g.save();
  g.fillStyle = ton(culoare);
  g.globalAlpha = 0.75;
  g.beginPath();
  g.arc(x, y, m, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 0.45;
  g.strokeStyle = CERNEALA;
  g.lineWidth = Math.max(0.8, m * 0.25);
  g.beginPath();
  g.arc(x - m * 0.15, y - m * 0.1, m * 0.9, 0.3, Math.PI * 1.7);
  g.stroke();
  g.restore();
}

export interface OptFasie {
  seed: number;
  w?: number;
  h?: number;
  /** Paper colour of the ground. */
  sol: string;
  flori: Floare[];
  /** How much grass to sketch (1 = default, 0 = bare). */
  iarba?: number;
}

/** A seamless strip of ground: bare paper with a faint line, sparse grass ticks and a few flowers. */
export function fasie(o0: OptFasie) {
  const o = { ...o0, sol: ton(o0.sol) };
  const W = o.w ?? 1024;
  const H = o.h ?? 256;
  const { c, g } = panza(W, H);
  const r = rng(o.seed);
  const Hb = Math.floor(H * BANDA);
  const yb = Hb * 0.42;
  const iarba = o.iarba ?? 1;
  const linieSol = (x: number) => yb - 3 * fbm1((x / W) * 6, 2, o.seed, 6);

  g.fillStyle = o.sol;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) g.lineTo(x, linieSol(x));
  g.lineTo(W, H);
  g.fill();

  // A broken ground line.
  let x = r.range(0, 60);
  while (x < W) {
    const L = r.range(30, 140);
    if (r.chance(0.55)) {
      const pts: [number, number][] = [];
      for (let xx = x; xx <= Math.min(W, x + L); xx += 10) pts.push([xx, linieSol(xx)]);
      linie(g, pts, 1.3, 0.22, 0.6, x);
    }
    x += L + r.range(20, 120);
  }

  // Grass ticks in little tufts.
  const tufe = Math.round(26 * iarba);
  g.strokeStyle = CERNEALA;
  g.lineCap = 'round';
  for (let i = 0; i < tufe; i++) {
    const tx = r.range(0, W);
    const n = r.int(3, 6);
    inBucla(W, tx, 20, (xx) => {
      for (let k = 0; k < n; k++) {
        const bx = xx + k * 3 - n * 1.5;
        const h = r.range(6, 18);
        g.globalAlpha = 0.32;
        g.lineWidth = 1.1;
        g.beginPath();
        g.moveTo(bx, linieSol(bx) + 2);
        g.quadraticCurveTo(bx + r.range(-2, 2), linieSol(bx) - h * 0.6, bx + r.range(-5, 5), linieSol(bx) - h);
        g.stroke();
      }
    });
  }
  g.globalAlpha = 1;

  // A few flowers along the line and scattered in the body.
  for (const f of o.flori) {
    const n = Math.round(f.densitate * 10);
    for (let i = 0; i < n; i++) {
      const fx = r.range(0, W);
      const sus = r.chance(0.5);
      const fy = sus ? linieSol(fx) - r.range(8, 18) : r.range(yb + 10, Hb - 10);
      inBucla(W, fx, 6, (xx) => {
        if (sus) {
          g.globalAlpha = 0.3;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(xx, linieSol(xx) + 2);
          g.lineTo(xx, fy);
          g.stroke();
          g.globalAlpha = 1;
        }
        floareMica(g, xx, fy, f.culoare, sus ? 3.2 : 2.4);
      });
    }
  }
  // Sparse pencil marks in the body, lighter further down.
  for (let i = 0; i < 40; i++) {
    const hx = r.range(0, W);
    const hy = r.range(yb + 8, Hb - 6);
    g.globalAlpha = 0.07;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(hx, hy);
    g.lineTo(hx + r.range(6, 14), hy - r.range(1, 3));
    g.stroke();
  }
  g.globalAlpha = 1;
  g.fillStyle = o.sol;
  g.fillRect(0, Hb + 2, W, H - Hb - 2);
  return c;
}

/** A long soft band of mist. */
export function ceata(seed: number, culoare = '#ffffff', w = 1024, h = 128) {
  const { c, g } = panza(w, h);
  const r = rng(seed);
  for (let i = 0; i < 70; i++) {
    const x = r.range(0, w);
    const y = h * (0.45 + r.gauss() * 0.08);
    const rx = r.range(60, 220);
    g.save();
    g.translate(x, y);
    g.scale(1, r.range(0.18, 0.3));
    pataMoale(g, 0, 0, rx, mixHex(culoare, culoare, 0, 0.18), mixHex(culoare, culoare, 0, 0));
    g.restore();
  }
  estompeazaMargini(g, w, h, 0.15);
  return c;
}

/** Kasumi: a stylised band of golden mist, as in Japanese screens and prints (1024×128). */
export function kasumi(seed: number, W = 1024, H = 128) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  const culoare = '#efe3c2';
  const forme: Path2D[] = [];
  let x = r.range(10, 60);
  while (x < W - 120) {
    const L = r.range(220, 420);
    const y = H * r.range(0.35, 0.6);
    const h = H * r.range(0.22, 0.32);
    const p = new Path2D();
    p.roundRect(x, y - h / 2, Math.min(L, W - x - 20), h, h / 2);
    forme.push(p);
    x += L * r.range(0.55, 0.8);
  }
  g.save();
  g.setTransform(new DOMMatrix().translate(-10000, 0).multiply(g.getTransform()));
  g.shadowOffsetX = 10000;
  g.shadowColor = culoare;
  g.shadowBlur = 12;
  g.fillStyle = culoare;
  g.globalAlpha = 0.85;
  for (const p of forme) g.fill(p);
  g.restore();
  g.strokeStyle = '#cdb47a';
  g.globalAlpha = 0.18;
  g.lineWidth = 1.5;
  for (const p of forme) g.stroke(p);
  g.globalAlpha = 1;
  return c;
}
