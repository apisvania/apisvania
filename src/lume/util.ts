// Small math, randomness, noise and colour helpers shared by the world.

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, x: number) => clamp((x - a) / (b - a));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = invLerp(a, b, x);
  return t * t * (3 - 2 * t);
};
export const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export const mod = (x: number, m: number) => ((x % m) + m) % m;
export const TAU = Math.PI * 2;

/** Frame-rate independent exponential smoothing factor. */
export const damp = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);

/** Deterministic PRNG (mulberry32) so every landscape is the same on every visit. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (a: number, b: number) => a + (b - a) * next(),
    int: (a: number, b: number) => Math.floor(a + (b - a + 1) * next()),
    pick: <T>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
    /** Approximately normal, mean 0, sd 1. */
    gauss: () => (next() + next() + next() + next() - 2) * 1.732,
  };
}
export type Rng = ReturnType<typeof rng>;

// ── Value noise ────────────────────────────────────────────────────────────
function hash1(i: number, seed: number) {
  let h = (i * 374761393 + seed * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise1(x: number, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash1(i, seed), hash1(i + 1, seed), u) * 2 - 1;
}
/** Periodic 1-D noise: noise1p(x, p) === noise1p(x + p, p). */
export function noise1p(x: number, period: number, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash1(mod(i, period), seed);
  const b = hash1(mod(i + 1, period), seed);
  return lerp(a, b, u) * 2 - 1;
}
export function fbm1(x: number, octaves = 4, seed = 0, period = 0) {
  let s = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    s += amp * (period ? noise1p(x * freq, period * freq, seed + o * 17) : noise1(x * freq, seed + o * 17));
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return s / norm;
}

// ── Colour ─────────────────────────────────────────────────────────────────
export type RGB = [number, number, number];

export function hex(h: string): RGB {
  const n = parseInt(h.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
export const css = (c: RGB, a = 1) =>
  `rgba(${Math.round(clamp(c[0]) * 255)},${Math.round(clamp(c[1]) * 255)},${Math.round(clamp(c[2]) * 255)},${a})`;
/** Mixes two hex colours and returns a CSS colour string. */
export const mixHex = (a: string, b: string, t: number, alpha = 1) => css(mixRGB(hex(a), hex(b), t), alpha);
export const shade = (h: string, amount: number, alpha = 1) =>
  amount >= 0 ? mixHex(h, '#ffffff', amount, alpha) : mixHex(h, '#000000', -amount, alpha);
/** Small random jitter of a colour, used to make painted elements less uniform. */
export function jitter(h: string, r: Rng, amount = 0.08, alpha = 1) {
  const c = hex(h);
  const j = () => (r.next() - 0.5) * amount;
  const l = j();
  return css([c[0] + l + j() * 0.4, c[1] + l + j() * 0.4, c[2] + l + j() * 0.4], alpha);
}
