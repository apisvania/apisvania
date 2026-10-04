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
