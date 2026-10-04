// Trees: blossoming fruit trees, leafy trees, and the close-up blossom branch
// that the bee lands on in the orchard.

import { rng, jitter, mixHex, shade, clamp, lerp, type Rng } from '../util';
import { panza, tulpina, cerc, elipsa, pataMoale, type Ctx } from './panza';

export interface PaletaCoroana {
  umbra: string;
  mijloc: string;
  lumina: string;
  accent?: string;
  frunze?: string;
  /** Fraction of dots that are leaves instead of blossoms. */
  procentFrunze?: number;
}

export const PALETE = {
  mar: { umbra: '#c3a3ad', mijloc: '#f4e3e7', lumina: '#fffafa', accent: '#eeb3c3', frunze: '#9dbd5c', procentFrunze: 0.12 },
  cires: { umbra: '#c4c0c4', mijloc: '#f5f2ee', lumina: '#ffffff', accent: '#f6e6e8', frunze: '#93a24f', procentFrunze: 0.06 },
  prun: { umbra: '#bcc0b6', mijloc: '#f2f2ea', lumina: '#fffff8', accent: '#e8eed8', frunze: '#a6bf62', procentFrunze: 0.1 },
  tei: { umbra: '#2f4426', mijloc: '#4d6b33', lumina: '#86a24c', accent: '#6f8f3d', procentFrunze: 0 },
} satisfies Record<string, PaletaCoroana>;

interface Segment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  w0: number;
  w1: number;
  cx: number;
  cy: number;
  adancime: number;
}

export interface OptPom {
  seed: number;
  w?: number;
  h?: number;
  paleta: PaletaCoroana;
  /** Sun from the left? Controls which side of the crown is lit. */
  soareStanga?: boolean;
  /** Overall width of the crown relative to the height (fruit trees are wide). */
  latime?: number;
  inaltimeTrunchi?: number;
  densitate?: number;
  scoarta?: string;
  marimePunct?: number;
}

/** A whole tree, painted into a square-ish texture with the trunk at bottom centre. */
export function pom(o: OptPom) {
  const W = o.w ?? 512;
  const H = o.h ?? 512;
  const { c, g } = panza(W, H);
  const r = rng(o.seed);
  const scoarta = o.scoarta ?? '#4e4038';
  const lat = o.latime ?? 1;
  const segs: Segment[] = [];
  const varfuri: [number, number, number][] = [];

  const solY = H * 0.965;
  // Crown envelope: a dome above the trunk. Branches bend back towards it so
  // the silhouette reads as a European fruit tree, not a flat savanna crown.
  const trunchi = H * (o.inaltimeTrunchi ?? 0.26);
  const coroana = {
    x: W / 2,
    y: solY - trunchi - H * 0.27,
    rx: W * 0.32 * Math.min(1.2, lat),
    ry: H * 0.27,
  };
  const inCoroana = (x: number, y: number) =>
    ((x - coroana.x) / coroana.rx) ** 2 + ((y - coroana.y) / coroana.ry) ** 2;
  function ramura(x: number, y: number, a: number, len: number, w: number, ad: number) {
    let x1 = x + Math.sin(a) * len;
    let y1 = y - Math.cos(a) * len;
    const e = inCoroana(x1, y1);
    if (ad > 0 && e > 1) {
      // Pull the tip back inside the dome.
      const k = 1 / Math.sqrt(e);
      x1 = coroana.x + (x1 - coroana.x) * k;
      y1 = coroana.y + (y1 - coroana.y) * k;
    }
    const curb = r.range(-0.2, 0.2) * len;
    const cx = (x + x1) / 2 + Math.cos(a) * curb;
    const cy = (y + y1) / 2 + Math.sin(a) * curb;
    segs.push({ x0: x, y0: y, x1, y1, w0: w, w1: w * 0.7, cx, cy, adancime: ad });
    if (ad >= 5 || len < H * 0.035) {
      varfuri.push([x1, y1, ad]);
      return;
    }
    if (ad >= 2) varfuri.push([(x + x1) / 2, (y + y1) / 2, ad]);
    const n = ad === 0 ? r.int(3, 4) : r.int(2, 3);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const na = a * 0.55 + t * r.range(0.8, 1.15) * (ad === 0 ? 1.2 : 1) + r.range(-0.2, 0.2);
      ramura(x1, y1, na, len * r.range(0.72, 0.86), w * 0.66, ad + 1);
    }
  }
  ramura(W / 2 + r.range(-6, 6), solY, r.range(-0.06, 0.06), trunchi, W * 0.042, 0);
  // Fill the dome with extra clusters so the crown has volume.
  for (let i = 0; i < 26; i++) {
    const a = r.range(0, Math.PI * 2);
    const d = Math.sqrt(r.next()) * 0.85;
    const x = coroana.x + Math.cos(a) * coroana.rx * d;
    const y = coroana.y + Math.sin(a) * coroana.ry * d * (Math.sin(a) > 0 ? 0.7 : 1);
    varfuri.push([x, y, 4]);
  }

  // Ground shadow.
  g.save();
  g.translate(W / 2, solY);
  g.scale(1, 0.16);
  pataMoale(g, 0, 0, W * 0.36 * lat, 'rgba(30,40,20,0.35)', 'rgba(30,40,20,0)');
  g.restore();

  // Crown geometry for lighting.
  let cxC = 0;
  let cyC = 0;
  for (const v of varfuri) {
    cxC += v[0];
    cyC += v[1];
  }
  cxC /= varfuri.length;
  cyC /= varfuri.length;
  let R = 0;
  for (const v of varfuri) R = Math.max(R, Math.hypot(v[0] - cxC, v[1] - cyC));
  const lx = o.soareStanga === false ? 0.7 : -0.7;
  const ly = -0.7;

  const pal = o.paleta;
  const dens = o.densitate ?? 1;
  const mp = o.marimePunct ?? W / 170;

  const strat = (faza: 0 | 1 | 2) => {
    for (const [vx, vy, ad] of varfuri) {
      const raza = W * (0.06 + (5 - Math.min(5, ad)) * 0.004) * (faza === 0 ? 1.25 : faza === 1 ? 0.95 : 0.6);
      const n = Math.round(((raza * raza) / (mp * mp)) * 0.4 * dens);
      for (let i = 0; i < n; i++) {
        const px = vx + r.gauss() * raza * 0.5;
        const py = vy + r.gauss() * raza * 0.42 - raza * 0.15;
        const nx = (px - cxC) / R;
        const ny = (py - cyC) / R;
        // Quantised light level: dots of the same colour are filled in one go.
        const lum = Math.round(clamp(0.5 + (nx * lx + ny * ly) * 0.6 + r.range(-0.15, 0.15)) * 6) / 6;
        let col: string;
        if (faza === 0) col = mixHex(pal.umbra, pal.mijloc, lum * 0.5, 0.9);
        else if (faza === 1) col = mixHex(pal.umbra, pal.mijloc, 0.35 + lum * 0.65, 0.95);
        else col = mixHex(pal.mijloc, pal.lumina, lum, 1);
        if (pal.frunze && r.chance(pal.procentFrunze ?? 0)) {
          const p = cale(pal.frunze);
          const rx = mp * 1.1;
          const a = r.range(0, Math.PI);
          p.moveTo(px + Math.cos(a) * rx, py + Math.sin(a) * rx);
          p.ellipse(px, py, rx, mp * 0.5, a, 0, Math.PI * 2);
          continue;
        }
        if (pal.accent && r.chance(0.12)) col = mixHex(pal.accent, pal.mijloc, 1 - lum, 0.95);
        const rr = mp * r.range(0.6, 1.15) * (faza === 2 ? 0.85 : 1);
        const p = cale(col);
        p.moveTo(px + rr, py);
        p.arc(px, py, rr, 0, Math.PI * 2);
      }
    }
    for (const [col, p] of cai) {
      g.fillStyle = col;
      g.fill(p);
    }
    cai.clear();
  };
  const cai = new Map<string, Path2D>();
  const cale = (col: string) => {
    let p = cai.get(col);
    if (!p) cai.set(col, (p = new Path2D()));
    return p;
  };

  strat(0);
  // Branches: dark body plus a light edge on the sun side.
  for (const s of segs) {
    g.fillStyle = shade(scoarta, -0.1 + s.adancime * 0.04);
    tulpina(g, s.x0, s.y0, s.x1, s.y1, s.w0, s.w1, s.cx, s.cy);
  }
  for (const s of segs) {
    if (s.w0 < 2.5) continue;
    g.fillStyle = shade(scoarta, 0.28, 0.55);
    const off = s.w0 * 0.22 * (o.soareStanga === false ? 1 : -1);
    tulpina(g, s.x0 + off, s.y0, s.x1 + off * 0.7, s.y1, s.w0 * 0.3, s.w1 * 0.3, s.cx + off, s.cy);
  }
  strat(1);
  strat(2);
  return c;
}

// ── The close-up branch ──────────────────────────────────────────────────

export interface CuloriFloare {
  interior: string;
  petala: string;
  margine: string;
  stamina: string;
  antera: string;
  centru: string;
}

export const FLOARE_MAR: CuloriFloare = {
  interior: '#f6f0dc',
  petala: '#fffbfa',
  margine: '#f4cbd6',
  stamina: '#f5efd6',
  antera: '#f0bd2c',
  centru: '#c9c36a',
};

/** One open five-petal blossom seen at an angle (squash) and rotation. */
export function floareMare(
  g: Ctx,
  x: number,
  y: number,
  R: number,
  rot: number,
  squash: number,
  col: CuloriFloare,
  r: Rng,
  lumina = { x: -0.6, y: -0.8 },
) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(1, squash);
  const baza = r.range(0, Math.PI * 2);
  const unghiuri = Array.from({ length: 5 }, (_, i) => baza + (i / 5) * Math.PI * 2 + r.range(-0.12, 0.12));
  // Back-facing shadow beneath the corolla.
  pataMoale(g, R * 0.08, R * 0.12, R * 1.15, 'rgba(60,40,50,0.18)', 'rgba(60,40,50,0)');
  for (const a of unghiuri) {
    const L = R * r.range(0.92, 1.06);
    const Wp = R * r.range(0.6, 0.7);
    g.save();
    g.rotate(a);
    const p = new Path2D();
    p.moveTo(R * 0.05, 0);
    p.bezierCurveTo(L * 0.25, -Wp * 0.62, L * 0.82, -Wp * 0.72, L, -Wp * 0.08);
    p.bezierCurveTo(L * 1.04, Wp * 0.18, L * 0.86, Wp * 0.7, L * 0.45, Wp * 0.6);
    p.bezierCurveTo(L * 0.2, Wp * 0.5, R * 0.05, Wp * 0.15, R * 0.05, 0);
    const gr = g.createRadialGradient(0, 0, R * 0.05, 0, 0, L);
    gr.addColorStop(0, col.interior);
    gr.addColorStop(0.35, col.petala);
    gr.addColorStop(0.72, mixHex(col.petala, col.margine, 0.2));
    gr.addColorStop(1, col.margine);
    g.fillStyle = gr;
    g.fill(p);
    // Light/shade across the petal according to the sun.
    const ca = Math.cos(a + rot);
    const sa = Math.sin(a + rot);
    const lum = ca * lumina.x + sa * lumina.y;
    g.fillStyle = lum > 0 ? `rgba(255,255,255,${0.25 * lum})` : `rgba(120,90,110,${-0.16 * lum})`;
    g.fill(p);
    // Veins.
    g.strokeStyle = 'rgba(200,150,170,0.18)';
    g.lineWidth = Math.max(0.6, R * 0.012);
    for (let v = -2; v <= 2; v++) {
      g.beginPath();
      g.moveTo(R * 0.12, 0);
      g.quadraticCurveTo(L * 0.5, v * Wp * 0.16, L * 0.88, v * Wp * 0.24);
      g.stroke();
    }
    g.strokeStyle = 'rgba(150,110,125,0.22)';
    g.lineWidth = Math.max(0.8, R * 0.015);
    g.stroke(p);
    g.restore();
  }
  // Centre.
  g.fillStyle = shade(col.centru, -0.25);
  cerc(g, 0, 0, R * 0.2);
  g.fillStyle = col.centru;
  cerc(g, -R * 0.02, -R * 0.02, R * 0.16);
  // Stamens.
  const nS = 20;
  for (let i = 0; i < nS; i++) {
    const a = (i / nS) * Math.PI * 2 + r.range(-0.1, 0.1);
    const L = R * r.range(0.36, 0.5);
    const ex = Math.cos(a) * L;
    const ey = Math.sin(a) * L - R * 0.05;
    g.strokeStyle = col.stamina;
    g.lineWidth = Math.max(0.8, R * 0.022);
    g.beginPath();
    g.moveTo(Math.cos(a) * R * 0.1, Math.sin(a) * R * 0.1);
    g.quadraticCurveTo(Math.cos(a) * L * 0.6, Math.sin(a) * L * 0.6 - R * 0.06, ex, ey);
    g.stroke();
    g.fillStyle = shade(col.antera, -0.25);
    elipsa(g, ex + R * 0.008, ey + R * 0.01, R * 0.045, R * 0.032, a);
    g.fillStyle = col.antera;
    elipsa(g, ex, ey, R * 0.04, R * 0.028, a);
  }
  // Pistils.
  g.strokeStyle = '#d7d690';
  g.lineWidth = Math.max(0.8, R * 0.02);
  for (let i = 0; i < 5; i++) {
    const a = r.range(0, Math.PI * 2);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(a) * R * 0.15, Math.sin(a) * R * 0.15 - R * 0.06);
    g.stroke();
  }
  g.restore();
}

function boboc(g: Ctx, x: number, y: number, R: number, rot: number, r: Rng) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = '#6d8a3a';
  for (let k = -1; k <= 1; k++) {
    g.save();
    g.rotate(k * 0.55);
    elipsa(g, 0, R * 0.55, R * 0.18, R * 0.42);
    g.restore();
  }
  const gr = g.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.05, 0, 0, R);
  gr.addColorStop(0, '#fbd3dd');
  gr.addColorStop(0.6, '#ec98ae');
  gr.addColorStop(1, '#c86a86');
  g.fillStyle = gr;
  elipsa(g, 0, 0, R * 0.62, R * 0.8);
  g.strokeStyle = 'rgba(150,60,90,0.35)';
  g.lineWidth = R * 0.04;
  g.beginPath();
  g.moveTo(0, R * 0.7);
  g.quadraticCurveTo(R * r.range(-0.2, 0.2), 0, 0, -R * 0.75);
  g.stroke();
  g.restore();
}

function frunza(g: Ctx, x: number, y: number, L: number, rot: number, r: Rng, culoare = '#9fbe5e') {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const Wf = L * r.range(0.32, 0.42);
  const p = new Path2D();
  p.moveTo(0, 0);
  p.bezierCurveTo(L * 0.3, -Wf, L * 0.75, -Wf * 0.8, L, 0);
  p.bezierCurveTo(L * 0.75, Wf * 0.8, L * 0.3, Wf, 0, 0);
  const gr = g.createLinearGradient(0, -Wf, 0, Wf);
  gr.addColorStop(0, shade(culoare, 0.18));
  gr.addColorStop(1, shade(culoare, -0.22));
  g.fillStyle = gr;
  g.fill(p);
  g.strokeStyle = shade(culoare, 0.35, 0.8);
  g.lineWidth = Math.max(1, L * 0.02);
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(L * 0.5, -Wf * 0.08, L * 0.97, 0);
  g.stroke();
  g.strokeStyle = shade(culoare, 0.2, 0.35);
  g.lineWidth = Math.max(0.6, L * 0.008);
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    g.beginPath();
    g.moveTo(L * t * 0.95, 0);
    g.lineTo(L * (t * 0.95 + 0.12), -Wf * 0.6 * Math.sin(Math.PI * t));
    g.moveTo(L * t * 0.95, 0);
    g.lineTo(L * (t * 0.95 + 0.12), Wf * 0.6 * Math.sin(Math.PI * t));
    g.stroke();
  }
  g.restore();
}

/**
 * The detailed branch for the orchard close-up. Returns the texture and the
 * point (u, v in 0..1) of the flower the bee lands on.
 */
export function creangaInflorita(seed: number, culori: CuloriFloare = FLOARE_MAR, W = 2048, H = 1024) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  const scoarta = '#584a40';

  // Main branch from the right edge towards the upper left.
  const p0 = { x: W * 1.06, y: H * 0.78 };
  const p1 = { x: W * 0.55, y: H * 0.56 };
  const p2 = { x: W * 0.05, y: H * 0.34 };
  const pe = (t: number) => {
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const cc = t * t;
    return { x: a * p0.x + b * p1.x + cc * p2.x, y: a * p0.y + b * p1.y + cc * p2.y };
  };
  const ramuri: { x0: number; y0: number; x1: number; y1: number; w0: number; w1: number }[] = [];
  const N = 40;
  for (let i = 0; i < N; i++) {
    const a = pe(i / N);
    const b = pe((i + 1) / N);
    ramuri.push({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, w0: lerp(54, 12, i / N), w1: lerp(54, 12, (i + 1) / N) });
  }
  // Side twigs.
  const crengute: { x: number; y: number; a: number; L: number }[] = [];
  for (const t of [0.22, 0.38, 0.55, 0.7, 0.86]) {
    const b = pe(t);
    const sus = r.chance(0.6);
    const a = sus ? r.range(-2.4, -1.6) : r.range(1.7, 2.3);
    const L = r.range(120, 220) * (1 - t * 0.4);
    crengute.push({ x: b.x, y: b.y, a, L });
    ramuri.push({ x0: b.x, y0: b.y, x1: b.x + Math.cos(a) * L, y1: b.y + Math.sin(a) * L, w0: lerp(20, 8, t), w1: 5 });
  }

  // Leaves behind the branch.
  for (let i = 0; i < 14; i++) {
    const t = r.range(0.15, 0.95);
    const b = pe(t);
    frunza(g, b.x, b.y, r.range(110, 190), r.range(-Math.PI, Math.PI), r, '#89aa50');
  }

  // Bark.
  for (const s of ramuri) {
    g.fillStyle = shade(scoarta, -0.15);
    tulpina(g, s.x0, s.y0 + 3, s.x1, s.y1 + 3, s.w0, s.w1);
    g.fillStyle = scoarta;
    tulpina(g, s.x0, s.y0, s.x1, s.y1, s.w0, s.w1);
  }
  for (const s of ramuri) {
    g.fillStyle = 'rgba(190,170,150,0.45)';
    tulpina(g, s.x0, s.y0 - s.w0 * 0.28, s.x1, s.y1 - s.w1 * 0.28, s.w0 * 0.28, s.w1 * 0.28);
  }
  // Lenticels and bark texture.
  for (let i = 0; i < 260; i++) {
    const t = r.range(0, 0.95);
    const b = pe(t);
    const w = lerp(54, 12, t);
    g.fillStyle = r.chance(0.5) ? 'rgba(220,205,190,0.45)' : 'rgba(40,30,25,0.35)';
    elipsa(g, b.x + r.range(-8, 8), b.y + r.gauss() * w * 0.2, r.range(2, 6), r.range(0.8, 1.6), -0.45);
  }

  // Blossom clusters on the twigs and along the branch.
  const ciorchini: { x: number; y: number; m: number }[] = crengute.map((k) => ({
    x: k.x + Math.cos(k.a) * k.L,
    y: k.y + Math.sin(k.a) * k.L,
    m: r.range(0.75, 1),
  }));
  ciorchini.push({ x: pe(0.98).x, y: pe(0.98).y, m: 0.8 });

  for (const k of ciorchini) {
    const nF = r.int(3, 5);
    for (let i = 0; i < 3; i++) frunza(g, k.x, k.y, r.range(120, 170) * k.m, r.range(-Math.PI, Math.PI), r);
    for (let i = 0; i < r.int(2, 3); i++) {
      const a = r.range(0, Math.PI * 2);
      boboc(g, k.x + Math.cos(a) * 70 * k.m, k.y + Math.sin(a) * 60 * k.m, r.range(18, 26) * k.m, a + Math.PI / 2, r);
    }
    for (let i = 0; i < nF; i++) {
      const a = (i / nF) * Math.PI * 2 + r.range(-0.3, 0.3);
      const d = r.range(40, 85) * k.m;
      floareMare(g, k.x + Math.cos(a) * d, k.y + Math.sin(a) * d * 0.8, r.range(62, 86) * k.m, r.range(-0.6, 0.6), r.range(0.62, 0.95), culori, r);
    }
  }

  // The landing flower: large, open, facing the camera.
  const ax = W * 0.31;
  const ay = H * 0.42;
  g.fillStyle = scoarta;
  tulpina(g, pe(0.74).x, pe(0.74).y, ax + 10, ay + 20, 12, 5);
  frunza(g, ax + 30, ay + 40, 190, 0.6, r);
  frunza(g, ax - 20, ay + 30, 170, 2.4, r);
  boboc(g, ax + 120, ay - 70, 26, 0.9, r);
  floareMare(g, ax, ay, 118, 0.2, 0.93, culori, r);

  return { canvas: c, ancora: { u: ax / W, v: ay / H } };
}

/** A soft, out-of-focus blossom spray for the foreground (deliberately low resolution). */
export function bokehFlori(seed: number, W = 192, H = 128) {
  const { c, g } = panza(W, H);
  const r = rng(seed);
  g.fillStyle = 'rgba(70,55,48,0.8)';
  tulpina(g, W * 0.9, H * 0.85, W * 0.35, H * 0.45, 7, 3);
  for (let i = 0; i < 26; i++) {
    const x = lerp(W * 0.8, W * 0.3, r.next()) + r.gauss() * 8;
    const y = lerp(H * 0.78, H * 0.4, (W * 0.8 - x) / (W * 0.5)) + r.gauss() * 10;
    pataMoale(g, x, y, r.range(9, 18), 'rgba(255,244,246,0.9)', 'rgba(255,230,236,0)');
  }
  for (let i = 0; i < 8; i++) {
    pataMoale(g, r.range(W * 0.3, W * 0.85), r.range(H * 0.3, H * 0.85), r.range(8, 14), 'rgba(160,190,100,0.6)', 'rgba(160,190,100,0)');
  }
  return c;
}
