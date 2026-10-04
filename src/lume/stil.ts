// Visual style of the world. The default is the sketch style; the Japanese
// ink-painting variant (sumi-e, with kasumi mist bands and a red sun) is an
// experiment, switched on with ?stil=japonez or VITE_STIL=japonez at build time.

import type { Mediu } from './randare';
import { hex } from './util';

export type Stil = 'schita' | 'japonez';

function alege(): Stil {
  const dinBuild = import.meta.env.VITE_STIL as string | undefined;
  let dinAdresa: string | null = null;
  try {
    dinAdresa = new URLSearchParams(location.search).get('stil');
  } catch {
    /* ignore */
  }
  const s = dinAdresa ?? dinBuild;
  return s === 'japonez' ? 'japonez' : 'schita';
}

export const STIL: Stil = alege();
export const JAPONEZ = STIL === 'japonez';

/** Sumi ink. */
export const TUS = '#2b2622';

/** Japanese palette: mute every colour towards ink and silk, keep the blossom pinks and reds. */
export function ton(culoare: string): string {
  if (!JAPONEZ) return culoare;
  const [r, g, b] = hex(culoare);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  const roz = h > 0.88 || h < 0.03;
  s *= roz ? 0.85 : 0.38;
  const l2 = roz ? l : l * 0.94;
  const q = l2 < 0.5 ? l2 * (1 + s) : l2 + s - l2 * s;
  const p = 2 * l2 - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const c = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  return `#${c(f(h + 1 / 3))}${c(f(h))}${c(f(h - 1 / 3))}`;
}

/** Silk-paper skies and a vermilion sun for the Japanese variant. */
export function mediuStil(id: string, m: Mediu): Mediu {
  if (!JAPONEZ) return m;
  const zori = id === 'deschidere';
  return {
    ...m,
    cerSus: hex(zori ? '#e9dcc4' : '#ece3cf'),
    cerMijloc: hex(zori ? '#efe2c9' : '#f0e7d3'),
    cerOrizont: hex(zori ? '#f2e2c4' : '#f3ead6'),
    soareCuloare: hex('#c4412c'),
    soareMarime: zori ? 0.07 : 0.055,
    soareEl: zori ? 0.09 : 0.2,
    lumina: hex('#fffaf0'),
    ceataCuloare: hex('#f1e7d2'),
    ceataDensitate: m.ceataDensitate * 1.15,
    nori: 0,
  };
}
