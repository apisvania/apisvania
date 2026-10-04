// Terrain painters: distant hills, tileable meadow strips and mist.

import { fbm1, rng, jitter, mixHex, shade, clamp } from '../util';
import { panza, inBucla, tulpina, cerc, elipsa, pataMoale, type Ctx } from './panza';

/** Rows 0..BANDA of every terrain texture hold detail; the rows below are a flat fill. */
export const BANDA = 0.86;

function umplere(g: Ctx, W: number, H: number, culoare: string) {
  g.fillStyle = culoare;
  g.fillRect(0, Math.floor(H * BANDA) - 2, W, H);
}

export interface OptDeal {
  w?: number;
  h?: number;
  seed: number;
  sus: string;
  jos: string;
  /** Average ridge position (0 = top of band, 1 = bottom of band). */
  creasta: number;
  amplitudine: number;
  frecventa: number;
  padure?: { culoare: string; densitate: number; marime: number; conifere?: boolean };
  livada?: { culoare: string; randuri: number; marime: number };
  campuri?: number;
  lumina?: { culoare: string; stanga: boolean; forta?: number };
  margini?: number;
}

/** A wide hill silhouette, with optional forest edge, orchard rows and fields. */
export function deal(o: OptDeal) {
  const W = o.w ?? 2048;
  const H = o.h ?? 512;
  const { c, g } = panza(W, H);
  const r = rng(o.seed);
  const Hb = H * BANDA;
  const creasta = (x: number) =>
    Hb * o.creasta + Hb * o.amplitudine * fbm1((x / W) * o.frecventa, 5, o.seed) +
    Hb * o.amplitudine * 0.25 * fbm1((x / W) * o.frecventa * 6, 3, o.seed + 9);

  const forma = new Path2D();
  forma.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) forma.lineTo(x, creasta(x));
  forma.lineTo(W, H);
  forma.closePath();

  g.save();
  g.clip(forma);
  const gr = g.createLinearGradient(0, Hb * (o.creasta - o.amplitudine), 0, Hb);
  gr.addColorStop(0, o.sus);
  gr.addColorStop(1, o.jos);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);

  // Patchwork of fields following the contour.
  if (o.campuri) {
    for (let k = 0; k < 14; k++) {
      const off = r.range(0.04, 0.8) * (Hb - Hb * o.creasta);
      const gros = r.range(8, 40);
      let x = r.range(-200, 0);
      while (x < W) {
        const lung = r.range(80, 380);
        g.fillStyle = r.chance(0.5) ? shade(o.sus, r.range(0.04, 0.12), o.campuri) : shade(o.jos, -r.range(0.03, 0.1), o.campuri);
        g.beginPath();
        for (let xx = x; xx <= x + lung; xx += 10) g.lineTo(xx, creasta(xx) + off);
        for (let xx = x + lung; xx >= x; xx -= 10) g.lineTo(xx, creasta(xx) + off + gros);
        g.fill();
        x += lung + r.range(10, 60);
      }
    }
  }

  // Orchard rows: little blossoming trees following the slope.
  if (o.livada) {
    const L = o.livada;
    for (let k = 0; k < L.randuri; k++) {
      const off = (k + 0.6) * L.marime * 2.4 + r.range(-2, 2);
      const sc = 1 + k * 0.02;
      // Rows drift a little and have gaps, like real orchards on a slope.
      const deriva = r.range(-3, 3);
      for (let x = r.range(0, L.marime * 3); x < W; x += L.marime * r.range(2.2, 3.2)) {
        if (fbm1((x / W) * 9 + k * 0.3, 2, o.seed + 5) < -0.25) continue;
        const y = creasta(x) + off + deriva * Math.sin(x / 90);
        if (y > Hb) continue;
        const m = L.marime * sc * r.range(0.75, 1.2);
        g.fillStyle = shade(o.sus, -0.2, 0.35);
        elipsa(g, x + m * 0.3, y + m * 0.55, m * 0.9, m * 0.28);
        g.fillStyle = jitter(L.culoare, r, 0.08, 0.75);
        elipsa(g, x, y, m * 0.8, m * 0.62);
        g.fillStyle = shade(L.culoare, 0.3, 0.55);
        cerc(g, x - m * 0.25, y - m * 0.2, m * 0.32);
      }
    }
  }

  // Speckle texture.
  for (let i = 0; i < W * 1.2; i++) {
    const x = r.range(0, W);
    const y = r.range(creasta(x), Hb);
    g.fillStyle = r.chance(0.5) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    g.fillRect(x, y, r.range(1, 4), r.range(1, 2));
  }
  g.restore();

  // Forest edge along the ridge.
  if (o.padure) {
    const P = o.padure;
    const pas = P.marime * (1.1 - P.densitate * 0.6);
    for (let strat = 0; strat < 2; strat++) {
      for (let x = r.range(0, pas); x < W; x += pas * r.range(0.6, 1.3)) {
        if (fbm1((x / W) * 7, 2, o.seed + 31) < 0.15 - P.densitate * 0.6) continue;
        const y = creasta(x) + strat * P.marime * 0.5;
        const m = P.marime * r.range(0.65, 1.25);
        g.fillStyle = jitter(P.culoare, r, 0.05);
        if (P.conifere) {
          g.beginPath();
          g.moveTo(x, y - m * 2.2);
          g.lineTo(x + m * 0.55, y + m * 0.2);
          g.lineTo(x - m * 0.55, y + m * 0.2);
          g.fill();
        } else {
          elipsa(g, x, y - m * 0.45, m * 0.7, m * 0.65);
          elipsa(g, x + m * 0.4, y - m * 0.2, m * 0.5, m * 0.45);
        }
      }
    }
  }

  // Rim light on the sun side of the ridge.
  if (o.lumina) {
    g.save();
    g.globalCompositeOperation = 'source-atop';
    const Lg = g.createLinearGradient(0, 0, W, 0);
    const f = o.lumina.forta ?? 0.35;
    Lg.addColorStop(0, mixHex(o.lumina.culoare, o.lumina.culoare, 0, o.lumina.stanga ? f : 0));
    Lg.addColorStop(1, mixHex(o.lumina.culoare, o.lumina.culoare, 0, o.lumina.stanga ? 0 : f));
    g.strokeStyle = Lg;
    g.lineWidth = 3;
    g.beginPath();
    for (let x = 0; x <= W; x += 4) g.lineTo(x, creasta(x) + 1.5);
    g.stroke();
    g.restore();
  }

  umplere(g, W, H, o.jos);
  estompeazaMargini(g, W, H, o.margini ?? 0.08);
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

export interface Floare {
  culoare: string;
  centru?: string;
  densitate: number;
  marime: number;
  tip: 'disc' | 'margareta' | 'papadie' | 'clopot';
}

export interface OptFasie {
  seed: number;
  w?: number;
  h?: number;
  iarba: string[];
  corp: string;
  fond: string;
  varfuri?: string;
  flori: Floare[];
  /** Fraction of the band taken by grass blades above the ground line. */
  firul?: number;
  densitate?: number;
}

export function floareMica(g: Ctx, x: number, y: number, f: Floare, m: number, r: ReturnType<typeof rng>) {
  if (f.tip === 'margareta') {
    g.fillStyle = f.culoare;
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + r.next();
      elipsa(g, x + Math.cos(a) * m * 0.55, y + Math.sin(a) * m * 0.32, m * 0.42, m * 0.18, a);
    }
    g.fillStyle = f.centru ?? '#e8b830';
    cerc(g, x, y, m * 0.3);
  } else if (f.tip === 'papadie') {
    g.fillStyle = shade(f.culoare, -0.15);
    cerc(g, x, y, m * 0.62);
    g.fillStyle = f.culoare;
    cerc(g, x, y - m * 0.08, m * 0.5);
    g.fillStyle = shade(f.culoare, 0.35);
    cerc(g, x - m * 0.12, y - m * 0.2, m * 0.22);
  } else if (f.tip === 'clopot') {
    g.fillStyle = f.culoare;
    elipsa(g, x, y, m * 0.32, m * 0.5);
    g.fillStyle = shade(f.culoare, 0.3);
    elipsa(g, x - m * 0.08, y - m * 0.12, m * 0.12, m * 0.24);
  } else {
    g.fillStyle = f.culoare;
    cerc(g, x, y, m * 0.5);
    if (f.centru) {
      g.fillStyle = f.centru;
      cerc(g, x, y, m * 0.18);
    }
  }
}

/** A seamless horizontal strip of meadow: grass blades on top, flowers, then ground. */
export function fasie(o: OptFasie) {
  const W = o.w ?? 1024;
  const H = o.h ?? 256;
  const { c, g } = panza(W, H);
  const r = rng(o.seed);
  const Hb = Math.floor(H * BANDA);
  const firul = o.firul ?? 0.42;
  const yb = Hb * firul; // ground line
  const dens = o.densitate ?? 1;

  // Body of the meadow (seen from above as the strips stack up).
  const gr = g.createLinearGradient(0, yb, 0, Hb);
  gr.addColorStop(0, o.corp);
  gr.addColorStop(0.75, o.corp);
  gr.addColorStop(1, mixHex(o.corp, o.fond, 0.35));
  g.fillStyle = gr;
  g.fillRect(0, yb, W, H - yb);
  // Large soft patches so the stacked strips don't read as stripes.
  for (let i = 0; i < 40; i++) {
    const x = r.range(0, W);
    const y = r.range(yb, Hb);
    const rr = r.range(30, 90);
    const c = r.chance(0.5) ? shade(o.corp, 0.1, 0.35) : shade(o.corp, -0.12, 0.35);
    inBucla(W, x, rr, (xx) => {
      g.save();
      g.translate(xx, y);
      g.scale(1, 0.35);
      pataMoale(g, 0, 0, rr, c, mixHex(o.corp, o.corp, 0, 0));
      g.restore();
    });
  }
  // Soft undulating top edge of the ground.
  g.beginPath();
  g.moveTo(0, yb + 4);
  for (let x = 0; x <= W; x += 8) g.lineTo(x, yb - 4 - 5 * fbm1((x / W) * 8, 3, o.seed, 8));
  g.lineTo(W, yb + 4);
  g.fill();

  // Texture of short grass and clumps in the body.
  for (let i = 0; i < 1800 * dens; i++) {
    const x = r.range(0, W);
    const y = r.range(yb, Hb - 4);
    const t = (y - yb) / (Hb - yb);
    g.fillStyle = jitter(r.pick(o.iarba), r, 0.12, 0.45 * (1 - t * 0.6));
    inBucla(W, x, 6, (xx) => tulpina(g, xx, y + 4, xx + r.range(-3, 3), y - r.range(3, 9), 2, 0.3));
  }
  // Flowers seen from above, scattered in the body.
  for (const f of o.flori) {
    const n = Math.round(f.densitate * 60 * dens);
    for (let i = 0; i < n; i++) {
      const x = r.range(0, W);
      const y = r.range(yb + 6, Hb - 6);
      const m = f.marime * (0.45 + 0.4 * (1 - (y - yb) / (Hb - yb))) * r.range(0.7, 1.1);
      inBucla(W, x, m, (xx) => floareMica(g, xx, y, f, m, r));
    }
  }

  // Grass blades rising above the ground line, back to front.
  const nrFire = Math.round(1400 * dens * (W / 1024));
  for (let i = 0; i < nrFire; i++) {
    const t = i / nrFire;
    const x = r.range(0, W);
    const baza = yb + r.range(-2, 14);
    const inalt = r.range(0.35, 1) * yb * (0.75 + 0.25 * t);
    const lean = r.range(-0.35, 0.35) * inalt;
    const lat = r.range(2, 4.5);
    const col = r.pick(o.iarba);
    g.fillStyle = jitter(col, r, 0.12, 1);
    const fn = (xx: number) => tulpina(g, xx, baza, xx + lean, baza - inalt, lat, 0.4, xx + lean * 0.2, baza - inalt * 0.55);
    inBucla(W, x, Math.abs(lean) + 6, fn);
    if (o.varfuri && r.chance(0.35)) {
      g.fillStyle = mixHex(o.varfuri, o.varfuri, 0, 0.5);
      inBucla(W, x, Math.abs(lean) + 6, (xx) =>
        tulpina(g, xx + lean * 0.7, baza - inalt * 0.7, xx + lean, baza - inalt, lat * 0.45, 0.3),
      );
    }
  }

  // Taller flowers poking above the grass.
  for (const f of o.flori) {
    const n = Math.round(f.densitate * 26 * dens);
    for (let i = 0; i < n; i++) {
      const x = r.range(0, W);
      const baza = yb + r.range(0, 10);
      const inalt = r.range(0.5, 1.05) * yb;
      const m = f.marime * r.range(0.85, 1.25);
      const lean = r.range(-8, 8);
      inBucla(W, x, m + 10, (xx) => {
        g.fillStyle = jitter('#4f6a2c', r, 0.1);
        tulpina(g, xx, baza, xx + lean, baza - inalt, 2.2, 1.2);
        floareMica(g, xx + lean, baza - inalt, f, m, r);
      });
    }
  }

  // Flat fill rows used for everything below the band.
  g.fillStyle = mixHex(o.corp, o.fond, 0.35);
  g.fillRect(0, Hb + 2, W, H - Hb - 2);
  return c;
}

/** A long soft band of mist. */
export function ceata(seed: number, culoare = '#ffffff', w = 1024, h = 128) {
  const { c, g } = panza(w, h);
  const r = rng(seed);
  for (let i = 0; i < 90; i++) {
    const x = r.range(0, w);
    const y = h * (0.45 + r.gauss() * 0.08);
    const rx = r.range(60, 220);
    const a = clamp(0.1 + 0.18 * (fbm1((x / w) * 5, 3, seed) + 0.5));
    g.save();
    g.translate(x, y);
    g.scale(1, r.range(0.18, 0.3));
    pataMoale(g, 0, 0, rx, mixHex(culoare, culoare, 0, a), mixHex(culoare, culoare, 0, 0));
    g.restore();
  }
  estompeazaMargini(g, w, h, 0.15);
  return c;
}
