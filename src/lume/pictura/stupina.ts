// The apiary: painted wooden hives, a rustic fence and wildflower clumps.

import { rng, jitter, shade, mixHex } from '../util';
import { panza, tulpina, cerc, elipsa, pataMoale } from './panza';
import { floareMica, type Floare } from './teren';

export const CULORI_STUPI = ['#3d6b8a', '#d4a03a', '#6e8e4f', '#e6dfcd', '#b4573d', '#5b8fa0'];

/** One hive in three-quarter view. Texture is 256×256; the hive sits on the bottom edge. */
export function stup(seed: number, culoare: string, soareStanga = true, W = 256, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  const k = W / 256;
  const fata = { x0: 58 * k, x1: 168 * k, y0: 92 * k, y1: 206 * k };
  const adanc = 46 * k;
  const urcare = 16 * k;
  const lumFata = soareStanga ? 0.1 : -0.12;
  const lumLat = soareStanga ? -0.28 : 0.05;

  g.save();
  g.translate(W / 2, 250 * k);
  g.scale(1, 0.16);
  pataMoale(g, 0, 0, 120 * k, 'rgba(25,30,20,0.45)', 'rgba(25,30,20,0)');
  g.restore();

  // Stand.
  g.fillStyle = '#6b5a48';
  g.fillRect(fata.x0 + 8 * k, fata.y1, 14 * k, 40 * k);
  g.fillRect(fata.x1 - 22 * k, fata.y1, 14 * k, 40 * k);
  g.fillStyle = '#4c4034';
  g.fillRect(fata.x1 + 18 * k, fata.y1 - 10 * k, 12 * k, 44 * k);

  // Side face (parallelogram).
  g.fillStyle = shade(culoare, lumLat);
  g.beginPath();
  g.moveTo(fata.x1, fata.y0);
  g.lineTo(fata.x1 + adanc, fata.y0 - urcare);
  g.lineTo(fata.x1 + adanc, fata.y1 - urcare);
  g.lineTo(fata.x1, fata.y1);
  g.fill();
  // Front face.
  const gr = g.createLinearGradient(0, fata.y0, 0, fata.y1);
  gr.addColorStop(0, shade(culoare, lumFata + 0.06));
  gr.addColorStop(1, shade(culoare, lumFata - 0.12));
  g.fillStyle = gr;
  g.fillRect(fata.x0, fata.y0, fata.x1 - fata.x0, fata.y1 - fata.y0);
  // Planks and wear.
  for (let x = fata.x0 + 14 * k; x < fata.x1; x += r.range(18, 26) * k) {
    g.fillStyle = 'rgba(0,0,0,0.07)';
    g.fillRect(x, fata.y0, 1.2 * k, fata.y1 - fata.y0);
  }
  for (let i = 0; i < 60; i++) {
    g.fillStyle = r.chance(0.5) ? 'rgba(255,255,255,0.08)' : 'rgba(40,25,10,0.08)';
    g.fillRect(r.range(fata.x0, fata.x1), r.range(fata.y0, fata.y1), r.range(4, 14) * k, r.range(1, 2) * k);
  }
  // Two boxes: seam and handholds.
  const seam = (fata.y0 + fata.y1) / 2 - 4 * k;
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.fillRect(fata.x0, seam, fata.x1 - fata.x0, 2.5 * k);
  g.beginPath();
  g.moveTo(fata.x1, seam);
  g.lineTo(fata.x1 + adanc, seam - urcare);
  g.lineTo(fata.x1 + adanc, seam - urcare + 2.5 * k);
  g.lineTo(fata.x1, seam + 2.5 * k);
  g.fill();
  g.fillStyle = 'rgba(0,0,0,0.3)';
  for (const y of [fata.y0 + 20 * k, seam + 22 * k]) {
    elipsa(g, fata.x1 + adanc * 0.5, y - urcare * 0.5, 10 * k, 3 * k, -0.33);
  }
  // Entrance and landing board.
  g.fillStyle = '#1a140f';
  g.fillRect(fata.x0 + 18 * k, fata.y1 - 9 * k, 70 * k, 6 * k);
  g.fillStyle = shade('#8a6b4a', soareStanga ? 0.1 : -0.05);
  g.beginPath();
  g.moveTo(fata.x0 + 8 * k, fata.y1 - 2 * k);
  g.lineTo(fata.x1 - 6 * k, fata.y1 - 2 * k);
  g.lineTo(fata.x1 - 18 * k, fata.y1 + 9 * k);
  g.lineTo(fata.x0 - 4 * k, fata.y1 + 9 * k);
  g.fill();

  // Roof: front overhang and top.
  const acoperis = r.chance(0.5) ? '#8d8f8c' : shade(culoare, -0.35);
  g.fillStyle = shade(acoperis, 0.25);
  g.beginPath();
  g.moveTo(fata.x0 - 8 * k, fata.y0 - 2 * k);
  g.lineTo(fata.x1 + 6 * k, fata.y0 - 2 * k);
  g.lineTo(fata.x1 + adanc + 8 * k, fata.y0 - urcare - 6 * k);
  g.lineTo(fata.x0 + adanc - 6 * k, fata.y0 - urcare - 6 * k);
  g.fill();
  g.fillStyle = acoperis;
  g.fillRect(fata.x0 - 8 * k, fata.y0 - 2 * k, fata.x1 - fata.x0 + 14 * k, 12 * k);
  g.fillStyle = shade(acoperis, -0.3);
  g.beginPath();
  g.moveTo(fata.x1 + 6 * k, fata.y0 - 2 * k);
  g.lineTo(fata.x1 + adanc + 8 * k, fata.y0 - urcare - 6 * k);
  g.lineTo(fata.x1 + adanc + 8 * k, fata.y0 - urcare + 4 * k);
  g.lineTo(fata.x1 + 6 * k, fata.y0 + 10 * k);
  g.fill();
  // A brick on the roof, as beekeepers do.
  if (r.chance(0.6)) {
    g.fillStyle = '#9b5a3c';
    g.fillRect(fata.x0 + 40 * k, fata.y0 - 16 * k, 34 * k, 12 * k);
    g.fillStyle = '#7a432d';
    g.fillRect(fata.x0 + 40 * k, fata.y0 - 6 * k, 34 * k, 2 * k);
  }
  // Grass tufts in front of the stand.
  for (let i = 0; i < 70; i++) {
    const x = r.range(20, 236) * k;
    g.fillStyle = jitter('#56722f', r, 0.12, 0.95);
    tulpina(g, x, 252 * k, x + r.range(-6, 6) * k, (252 - r.range(8, 26)) * k, 3 * k, 0.4);
  }
  return c;
}

/** A tileable split-rail wooden fence (1024×256). */
export function gard(seed: number, W = 1024, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  const lemn = '#7d6b58';
  for (const y of [H * 0.42, H * 0.66]) {
    g.fillStyle = shade(lemn, -0.12);
    g.fillRect(0, y, W, 12);
    g.fillStyle = shade(lemn, 0.12);
    g.fillRect(0, y, W, 4);
  }
  for (let x = 32; x < W; x += 128) {
    const xx = x + r.range(-6, 6);
    g.fillStyle = shade(lemn, -0.05);
    g.beginPath();
    g.moveTo(xx - 9, H);
    g.lineTo(xx - 8, H * 0.28);
    g.lineTo(xx, H * 0.22);
    g.lineTo(xx + 8, H * 0.28);
    g.lineTo(xx + 9, H);
    g.fill();
    g.fillStyle = shade(lemn, 0.2, 0.7);
    g.fillRect(xx - 7, H * 0.28, 4, H * 0.72);
  }
  for (let i = 0; i < 260; i++) {
    const x = r.range(0, W);
    g.fillStyle = jitter('#56722f', r, 0.12, 0.95);
    tulpina(g, x, H, x + r.range(-8, 8), H - r.range(10, 50), 3, 0.4);
  }
  return c;
}

/** A clump of spring wildflowers (512×256), base on the bottom edge. */
export function tufaFlori(seed: number, flori: Floare[], W = 512, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  g.save();
  g.translate(W / 2, H * 0.97);
  g.scale(1, 0.18);
  pataMoale(g, 0, 0, W * 0.45, 'rgba(25,35,15,0.3)', 'rgba(25,35,15,0)');
  g.restore();
  // Leaves and grass.
  for (let i = 0; i < 220; i++) {
    const x = W / 2 + r.gauss() * W * 0.16;
    const h = r.range(0.2, 0.55) * H;
    g.fillStyle = jitter(r.pick(['#5d7d34', '#4c6a2b', '#7a9a42']), r, 0.1, 0.95);
    tulpina(g, x, H, x + r.range(-0.4, 0.4) * h, H - h, r.range(4, 8), 0.6);
  }
  // Flowers on stems.
  for (const f of flori) {
    const n = Math.round(f.densitate * 14);
    for (let i = 0; i < n; i++) {
      const x = W / 2 + r.gauss() * W * 0.14;
      const h = r.range(0.4, 0.92) * H;
      const lean = r.range(-0.15, 0.15) * h;
      g.fillStyle = jitter('#56783a', r, 0.08);
      tulpina(g, x, H, x + lean, H - h, 4, 2.4);
      const m = f.marime * 3.2 * r.range(0.8, 1.2);
      floareMica(g, x + lean, H - h, f, m, r);
      g.fillStyle = mixHex('#ffffff', '#ffffff', 0, 0.25);
      cerc(g, x + lean - m * 0.15, H - h - m * 0.2, m * 0.18);
    }
  }
  return c;
}

/** A low, wide carpet of flowers (1024×256) — reads as a coloured patch on the hills from above. */
export function covorFlori(seed: number, flori: Floare[], iarba = '#5f8232', W = 1024, H = 256) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  // Irregular blob outline so the patch has no visible rectangle.
  const forma = (x: number) => 0.25 + 0.75 * Math.sin(Math.PI * (x / W)) ** 0.6;
  for (let i = 0; i < 900; i++) {
    const x = r.range(0, W);
    const h = r.range(0.25, 0.75) * H * forma(x);
    g.fillStyle = jitter(iarba, r, 0.14, 0.9);
    tulpina(g, x, H, x + r.range(-0.3, 0.3) * h, H - h, r.range(3, 6), 0.5);
  }
  for (let i = 0; i < 420; i++) {
    const x = r.range(W * 0.04, W * 0.96);
    const f = flori[Math.floor(r.next() ** 1.4 * flori.length)];
    const h = r.range(0.2, 0.85) * H * forma(x);
    const m = f.marime * r.range(1.6, 2.6);
    g.fillStyle = jitter('#56783a', r, 0.08);
    tulpina(g, x, H, x + r.range(-6, 6), H - h, 2.5, 1.5);
    floareMica(g, x, H - h, f, m, r);
  }
  return c;
}
