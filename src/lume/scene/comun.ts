// Shared helpers for scene definitions: environment presets, horizon layers
// and the ground strip biomes.

import type { Mediu, Carte } from '../randare';
import type { ContextScena } from '../lume';
import { hex } from '../util';
import { deal, fasie, type OptFasie, type Floare } from '../pictura/teren';
import { tufaFlori } from '../pictura/stupina';
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
  /** Paper colour of the ground and watercolour tint under the ridge. */
  sol: string;
  spalare: string;
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
        sol: o.sol,
        spalare: o.spalare,
        cerneala: 0.32,
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
 * The flowering hills the bee crosses between two scenes: a few clumps of
 * flowers along the flight path and the odd lone tree, with lots of air.
 */
export function dealuriInflorite(ctx: ContextScena, nume: string, zDe: number, zLa: number, flori: Floare[]) {
  const { r, sol } = ctx;
  const tufe = [0, 1].map((i) => ctx.tex(`tufa-drum-${nume}-${i}`, () => tufaFlori(950 + i * 7 + nume.length, flori)));
  const copaci = [0, 1].map((i) => ctx.tex(`copac-drum-${nume}-${i}`, () => pom({ seed: 970 + i, paleta: PALETE.tei })));
  for (let z = zDe; z < zLa; z += r.range(7, 14)) {
    const p = ctx.drum(z);
    const x = p.x + r.range(-12, 12);
    const m = r.range(1, 1.6);
    ctx.adauga({ tex: r.pick(tufe), x, y: sol(z) - 0.05, z, w: 1.6 * m, h: 0.8 * m, leganare: 0.05, faza: r.range(0, 6) });
    if (r.chance(0.18)) {
      const xt = p.x + (r.chance(0.5) ? -1 : 1) * r.range(14, 50);
      const mt = r.range(0.8, 1.3);
      if (ctx.liber(xt, z, 4, 8)) ctx.adauga({ tex: r.pick(copaci), x: xt, y: sol(z) - 0.2, z, w: 8 * mt, h: 8 * mt, leganare: 0.1, faza: r.range(0, 6) });
    }
  }
}
