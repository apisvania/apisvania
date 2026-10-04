// The apiary in sketch style: line-drawn hives with a flat wash of colour,
// a rustic fence and small clumps of wildflowers.

import { rng } from '../util';
import { panza, linie, spalare, CERNEALA } from './panza';
import { floareMica, type Floare } from './teren';

export const CULORI_STUPI = ['#8fb0c4', '#e3b866', '#a9bb8c', '#e9e2d0', '#d39a83'];

/** One hive in three-quarter view, 256×256, standing on the bottom edge. */
export function stup(seed: number, culoare: string, W = 256, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  const k = W / 256;
  const x0 = 62 * k;
  const x1 = 166 * k;
  const y0 = 96 * k;
  const y1 = 206 * k;
  const ad = 42 * k;
  const urc = 15 * k;
  const t = (n: number) => n + r.range(-1.2, 1.2) * k;

  const fata = new Path2D();
  fata.rect(x0, y0, x1 - x0, y1 - y0);
  const lat = new Path2D();
  lat.moveTo(x1, y0);
  lat.lineTo(x1 + ad, y0 - urc);
  lat.lineTo(x1 + ad, y1 - urc);
  lat.lineTo(x1, y1);
  lat.closePath();
  const acoperis = new Path2D();
  acoperis.moveTo(x0 - 8 * k, y0);
  acoperis.lineTo(x1 + 6 * k, y0);
  acoperis.lineTo(x1 + ad + 8 * k, y0 - urc - 6 * k);
  acoperis.lineTo(x0 + ad - 6 * k, y0 - urc - 6 * k);
  acoperis.closePath();

  g.fillStyle = '#fbf8f2';
  g.fill(fata);
  g.fill(lat);
  spalare(g, fata, culoare, 0.85, 4 * k, 2 * k);
  spalare(g, lat, culoare, 1, 2 * k, 1 * k);
  spalare(g, lat, '#7d6f62', 0.25, 0, 0);
  spalare(g, acoperis, '#b7b2a8', 0.7, 2 * k, 1 * k);

  const w = 2 * k;
  linie(g, [[x0, t(y0)], [x0, t(y1)], [x1, y1], [x1, y0], [x0, y0]], w, 0.8, 0.8, seed);
  linie(g, [[x1, y0], [x1 + ad, y0 - urc], [x1 + ad, y1 - urc], [x1, y1]], w * 0.9, 0.7, 0.8, seed + 1);
  linie(g, [[x0 - 8 * k, y0], [x1 + 6 * k, y0], [x1 + ad + 8 * k, y0 - urc - 6 * k], [x0 + ad - 6 * k, y0 - urc - 6 * k], [x0 - 8 * k, y0]], w, 0.75, 0.8, seed + 2);
  // Seam between the two boxes, entrance and landing board.
  const mij = (y0 + y1) / 2;
  linie(g, [[x0, mij], [x1, mij], [x1 + ad, mij - urc]], w * 0.7, 0.45, 0.6, seed + 3);
  linie(g, [[x0 + 20 * k, y1 - 8 * k], [x0 + 80 * k, y1 - 8 * k]], 3 * k, 0.85, 0.4, seed + 4);
  linie(g, [[x0 - 4 * k, y1 + 7 * k], [x1 - 14 * k, y1 + 7 * k]], w * 0.8, 0.6, 0.6, seed + 5);
  // Legs.
  linie(g, [[x0 + 12 * k, y1], [x0 + 12 * k, 246 * k]], w, 0.65, 0.5, seed + 6);
  linie(g, [[x1 - 12 * k, y1], [x1 - 12 * k, 246 * k]], w, 0.65, 0.5, seed + 7);
  linie(g, [[x1 + ad - 6 * k, y1 - urc], [x1 + ad - 6 * k, 236 * k]], w * 0.8, 0.5, 0.5, seed + 8);
  // Hatching on the shaded side.
  g.strokeStyle = CERNEALA;
  g.globalAlpha = 0.18;
  g.lineWidth = 1.1 * k;
  for (let i = 0; i < 6; i++) {
    const x = x1 + 6 * k + i * 6 * k;
    g.beginPath();
    g.moveTo(x, y0 - i * 2 * k + 6 * k);
    g.lineTo(x, y1 - i * 2 * k - 8 * k);
    g.stroke();
  }
  g.globalAlpha = 1;
  linie(g, [[20 * k, 247 * k], [236 * k, 246 * k]], 1.2 * k, 0.3, 0.6, seed + 9);
  return c;
}

/** A tileable split-rail fence (1024×256). */
export function gard(seed: number, W = 1024, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  for (const y of [H * 0.45, H * 0.68]) linie(g, [[0, y], [W, y + r.range(-3, 3)]], 2.6, 0.55, 1.2, y);
  for (let x = 32; x < W; x += 128) {
    const xx = x + r.range(-6, 6);
    linie(g, [[xx, H], [xx + r.range(-3, 3), H * 0.26]], 3, 0.65, 0.8, x);
  }
  return c;
}

/** A small clump of wildflowers (512×256), base on the bottom edge. */
export function tufaFlori(seed: number, flori: Floare[], W = 512, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  g.strokeStyle = CERNEALA;
  g.lineCap = 'round';
  // A few blades.
  for (let i = 0; i < 16; i++) {
    const x = W / 2 + r.gauss() * W * 0.12;
    const h = r.range(0.2, 0.5) * H;
    g.globalAlpha = 0.4;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x, H);
    g.quadraticCurveTo(x, H - h * 0.6, x + r.range(-0.3, 0.3) * h, H - h);
    g.stroke();
  }
  for (const f of flori) {
    const n = Math.max(1, Math.round(f.densitate * 4));
    for (let i = 0; i < n; i++) {
      const x = W / 2 + r.gauss() * W * 0.12;
      const h = r.range(0.45, 0.9) * H;
      const lean = r.range(-0.12, 0.12) * h;
      g.globalAlpha = 0.5;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x, H);
      g.quadraticCurveTo(x, H - h * 0.5, x + lean, H - h);
      g.stroke();
      g.globalAlpha = 1;
      floareMica(g, x + lean, H - h, f.culoare, r.range(9, 13));
    }
  }
  g.globalAlpha = 1;
  return c;
}
