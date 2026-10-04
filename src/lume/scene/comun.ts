// Shared helpers for scene definitions: environment presets, horizon layers
// and the ground strip biomes.

import type { Mediu, Carte } from '../randare';
import type { ContextScena } from '../lume';
import { hex } from '../util';
import { deal, fasie, type OptFasie, type Floare } from '../pictura/teren';
import { covorFlori, tufaFlori } from '../pictura/stupina';
import { pom, PALETE } from '../pictura/copaci';

export interface MediuHex {
  cerSus: string;
  cerMijloc: string;
  cerOrizont: string;
  soareCuloare: string;
  soareAz: number;
  soareEl: number;
  soareMarime?: number;
  lumina: string;
  ceataCuloare: string;
  ceataDensitate: number;
  stele?: number;
  nori?: number;
  noriCuloare?: string;
}

export function mediu(m: MediuHex): Mediu {
  return {
    cerSus: hex(m.cerSus),
    cerMijloc: hex(m.cerMijloc),
    cerOrizont: hex(m.cerOrizont),
    soareCuloare: hex(m.soareCuloare),
    soareAz: m.soareAz,
    soareEl: m.soareEl,
    soareMarime: m.soareMarime ?? 0.025,
    lumina: hex(m.lumina),
    ceataCuloare: hex(m.ceataCuloare),
    ceataDensitate: m.ceataDensitate,
    stele: m.stele ?? 0,
    nori: m.nori ?? 0.3,
    noriCuloare: hex(m.noriCuloare ?? '#ffffff'),
  };
}

/** Builds ground strip texture variants for a biome. */
export function biom(ctx: ContextScena, nume: string, o: Omit<OptFasie, 'seed'>, variante = 3) {
  return Array.from({ length: variante }, (_, i) =>
    ctx.tex(`fasie-${nume}-${i}`, () => fasie({ ...o, seed: 500 + i * 31 + nume.length * 7 }), true),
  );
}

export interface OptStratOrizont {
  cheie: string;
  seed: number;
  sus: string;
  jos: string;
  /** Height of the ridge band in metres and where the ridge sits (world y of the band top). */
  banda: number;
  varf: number;
  distanta: number;
  creasta?: number;
  amplitudine?: number;
  frecventa?: number;
  padure?: { culoare: string; densitate: number; marime: number; conifere?: boolean };
  ceata?: number;
}

/** A distant ridge that stays at a fixed distance from the camera (horizon layer). */
export function stratOrizont(ctx: ContextScena, o: OptStratOrizont): Carte {
  const h = o.banda + 900;
  return {
    tex: ctx.tex(o.cheie, () =>
      deal({
        seed: o.seed,
        w: 2048,
        h: 512,
        sus: o.sus,
        jos: o.jos,
        creasta: o.creasta ?? 0.35,
        amplitudine: o.amplitudine ?? 0.3,
        frecventa: o.frecventa ?? 5,
        padure: o.padure,
        margini: 0.12,
      }),
    ),
    x: 0,
    y: o.varf - h,
    z: 0,
    w: o.distanta * 3.2,
    h,
    banda: o.banda,
    fundal: o.distanta,
    paralaxa: 0.02,
    ceata: o.ceata ?? 0.85,
    aproape: [0, 0],
  };
}

/**
 * The flowering hills the bee crosses between two scenes: carpets of flowers
 * visible from above, clumps along the flight path and a few lone trees.
 */
export function dealuriInflorite(ctx: ContextScena, nume: string, zDe: number, zLa: number, flori: Floare[], iarba: string) {
  const { r, sol } = ctx;
  const covoare = [0, 1, 2].map((i) => ctx.tex(`covor-${nume}-${i}`, () => covorFlori(900 + i * 13 + nume.length, flori, iarba)));
  const tufe = [0, 1].map((i) => ctx.tex(`tufa-drum-${nume}-${i}`, () => tufaFlori(950 + i * 7 + nume.length, flori)));
  const copaci = [0, 1].map((i) => ctx.tex(`copac-drum-${nume}-${i}`, () => pom({ seed: 970 + i, paleta: PALETE.tei, soareStanga: true })));
  for (let z = zDe; z < zLa; z += r.range(2.5, 5)) {
    const p = ctx.drum(z);
    // Carpets spread wide so they are seen from cruise altitude.
    for (let k = 0; k < 2; k++) {
      const x = p.x + r.gauss() * 26;
      const w = r.range(7, 16);
      ctx.adauga({ tex: r.pick(covoare), x, y: sol(z) - 0.2, z: z + r.range(-1, 1), w, h: w * 0.12, leganare: 0.05, faza: r.range(0, 6), oglinda: r.chance(0.5) });
    }
    if (r.chance(0.55)) {
      const x = p.x + r.range(-9, 9);
      const m = r.range(0.9, 1.5);
      ctx.adauga({ tex: r.pick(tufe), x, y: sol(z) - 0.05, z, w: 1.6 * m, h: 0.8 * m, leganare: 0.06, faza: r.range(0, 6) });
    }
    if (r.chance(0.12)) {
      const x = p.x + (r.chance(0.5) ? -1 : 1) * r.range(12, 50);
      const m = r.range(0.8, 1.3);
      if (ctx.liber(x, z, 4, 8)) ctx.adauga({ tex: r.pick(copaci), x, y: sol(z) - 0.2, z, w: 8 * m, h: 8 * m, leganare: 0.12, faza: r.range(0, 6) });
    }
  }
}
