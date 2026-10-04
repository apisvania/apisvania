// Canvas helpers for procedural painting.

export type Ctx = CanvasRenderingContext2D;

export function panza(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: false })!;
  return { c, g };
}

/** Draws `fn` at x and, when close to an edge, also wrapped to the other side (seamless tiles). */
export function inBucla(W: number, x: number, raza: number, fn: (x: number) => void) {
  fn(x);
  if (x - raza < 0) fn(x + W);
  if (x + raza > W) fn(x - W);
}

/** A tapered stroke between two points (used for branches, stems, grass). */
export function tulpina(
  g: Ctx,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w0: number,
  w1: number,
  cx?: number,
  cy?: number,
) {
  const mx = cx ?? (x0 + x1) / 2;
  const my = cy ?? (y0 + y1) / 2;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  g.beginPath();
  g.moveTo(x0 + nx * w0 * 0.5, y0 + ny * w0 * 0.5);
  g.quadraticCurveTo(mx + nx * (w0 + w1) * 0.25, my + ny * (w0 + w1) * 0.25, x1 + nx * w1 * 0.5, y1 + ny * w1 * 0.5);
  g.lineTo(x1 - nx * w1 * 0.5, y1 - ny * w1 * 0.5);
  g.quadraticCurveTo(mx - nx * (w0 + w1) * 0.25, my - ny * (w0 + w1) * 0.25, x0 - nx * w0 * 0.5, y0 - ny * w0 * 0.5);
  g.closePath();
  g.fill();
}

export function cerc(g: Ctx, x: number, y: number, r: number) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

export function elipsa(g: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  g.beginPath();
  g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2);
  g.fill();
}

/** A soft round spot: radial gradient from colour to transparent. */
export function pataMoale(g: Ctx, x: number, y: number, r: number, culoare: string, culoareMargine: string) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, culoare);
  gr.addColorStop(1, culoareMargine);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

// ── Sketch style: hand-drawn ink lines and light watercolour washes ──────

export const CERNEALA = '#3d352e';

/** A wobbly, hand-drawn ink line through the given points. */
export function linie(
  g: Ctx,
  pts: [number, number][],
  latime: number,
  alfa = 0.8,
  tremur = 1.2,
  seed = 1,
  culoare = CERNEALA,
) {
  if (pts.length < 2) return;
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = culoare;
  for (let trecere = 0; trecere < 2; trecere++) {
    g.globalAlpha = trecere === 0 ? alfa : alfa * 0.3;
    g.lineWidth = trecere === 0 ? latime : latime * 0.7;
    g.beginPath();
    let s = seed * 13.7 + trecere * 5.1;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const L = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.max(1, Math.ceil(L / 7));
      const nx = -(y1 - y0) / (L || 1);
      const ny = (x1 - x0) / (L || 1);
      for (let k = i === 0 ? 0 : 1; k <= n; k++) {
        const t = k / n;
        s += 0.37;
        const o = (Math.sin(s * 1.7) * 0.6 + Math.sin(s * 0.53 + 2) * 0.4) * tremur + trecere * 0.6;
        const x = x0 + (x1 - x0) * t + nx * o;
        const y = y0 + (y1 - y0) * t + ny * o;
        if (i === 0 && k === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
    }
    g.stroke();
  }
  g.restore();
}

/** An irregular round blob, as a closed path. */
export function pata(cx: number, cy: number, rx: number, ry: number, neregulat = 0.18, seed = 1) {
  const p = new Path2D();
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + neregulat * (Math.sin(a * 3 + seed) * 0.6 + Math.sin(a * 5 + seed * 2.3) * 0.4);
    const x = cx + Math.cos(a) * rx * k;
    const y = cy + Math.sin(a) * ry * k;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.closePath();
  return p;
}

/** A light watercolour wash: soft fill, darker pooled edge, slight misregistration. */
export function spalare(g: Ctx, p: Path2D, culoare: string, alfa = 0.5, dx = 2, dy = 1.5) {
  g.save();
  g.fillStyle = culoare;
  g.globalAlpha = alfa * 0.55;
  g.fill(p);
  g.translate(dx, dy);
  g.globalAlpha = alfa * 0.35;
  g.fill(p);
  g.translate(-dx, -dy);
  g.strokeStyle = culoare;
  g.globalAlpha = alfa * 0.45;
  g.lineWidth = 2;
  g.stroke(p);
  g.restore();
}

/** Outline of a blob drawn as a loose, broken scribble. */
export function contur(g: Ctx, p: Path2D, latime: number, alfa: number) {
  g.save();
  g.strokeStyle = CERNEALA;
  g.lineWidth = latime;
  g.globalAlpha = alfa;
  g.lineCap = 'round';
  g.setLineDash([latime * 14, latime * 5, latime * 6, latime * 3]);
  g.stroke(p);
  g.restore();
}
