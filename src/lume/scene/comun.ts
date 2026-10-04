// Shared helpers for scene definitions: environment presets, horizon layers
// and the ground strip biomes.

import type { Mediu, Carte } from '../randare';
import type { ContextScena } from '../lume';
import { hex } from '../util';
import { deal, fasie, ceata, type OptFasie, type Floare } from '../pictura/teren';
import { tufaFlori } from '../pictura/stupina';
import { pom, PALETE } from '../pictura/copaci';
import { picior, coroanaGazda, type Erou, type TipCoroana } from '../pictura/flora';

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

/**
 * The close-up the bee lands on, rooted in the world: its stems (or trunk)
 * continue down to the ground, and a tree's crown rises behind it.
 */
export function adaugaErou(
  ctx: ContextScena,
  o: { erou: () => Erou; marime: { w: number; h: number }; coroana?: TipCoroana },
) {
  const { sol, tinta } = ctx;
  const { w, h } = o.marime;
  // Only the layout (landing point, stems) is kept between paintings. The
  // canvas itself is released after upload, so a texture freed when the bee
  // flies far away is painted afresh on the next loop.
  let forma: Pick<Erou, 'ancora' | 'tulpini'> | null = null;
  const picteaza = () => {
    const e = o.erou();
    forma = { ancora: e.ancora, tulpini: e.tulpini };
    return e.canvas;
  };
  const obtine = () => {
    if (!forma) picteaza().width = 0;
    return forma!;
  };
  const tErou = ctx.tex('erou', picteaza);
  const ancora = () => forma?.ancora ?? { u: 0.31, v: 0.42 };
  const centruX = () => tinta.x + (0.5 - ancora().u) * w;
  const jos = () => tinta.y - (1 - ancora().v) * h;
  const solZ = sol(tinta.z);
  ctx.adauga({
    tex: tErou,
    get x() {
      return centruX();
    },
    get y() {
      return jos();
    },
    z: tinta.z,
    w,
    h,
    leganare: 0.004,
    ceata: 0.1,
    aproape: [0.25, 0.8],
  });
  // Stems or trunk from the bottom edge of the close-up down into the ground.
  const tPicior = ctx.tex('erou-picior', () => picior(obtine().tulpini, 3));
  ctx.adauga({
    tex: tPicior,
    get x() {
      return centruX();
    },
    y: solZ - 0.08,
    get h() {
      return Math.max(0.05, jos() - solZ + 0.1);
    },
    z: tinta.z + 0.002,
    w,
    ceata: 0.1,
    aproape: [0.25, 0.8],
  });
  if (o.coroana) {
    const tip = o.coroana;
    const tCoroana = ctx.tex('erou-coroana', () => coroanaGazda(tip, 5));
    // Above and slightly behind the trunk, which sits near the left edge.
    ctx.adauga({
      tex: tCoroana,
      get x() {
        return centruX() - w * 0.35;
      },
      get y() {
        return jos() + h * 0.85;
      },
      z: tinta.z + 0.9,
      w: 4.2,
      h: 2.8,
      leganare: 0.03,
      ceata: 0.15,
      aproape: [0.3, 0.9],
    });
  }
}

// ── A generic landscape scene ───────────────────────────────────────────

import type { DefinitieScena, Incadrare, ParticuleScena } from '../lume';

export interface Element {
  cheie: string;
  pictura: (seed: number) => HTMLCanvasElement;
  variante?: number;
  numar: number;
  /** z range relative to the landing target. */
  zona: [number, number];
  /** Lateral spread (± metres around the target). */
  lat: number;
  w: number;
  h: number;
  leganare?: number;
  /** Height used to keep the flight corridor clear. */
  inaltime: number;
  repetare?: boolean;
}

export interface OptPeisaj {
  id: string;
  lungime?: number;
  sol: number;
  tinta: { x: number; inaltime: number };
  incadrare?: Incadrare;
  mediu: MediuHex;
  claritate?: number;
  zbor?: number;
  solCuloare: string;
  floriSol: Floare[];
  orizont: Omit<OptStratOrizont, 'cheie' | 'seed'>[];
  erou: (seed: number) => Erou;
  erouMarime?: { w: number; h: number };
  /** For trees: the crown the close-up branch belongs to. */
  coroana?: TipCoroana;
  dealuri?: { dz: number; x: number; w: number; banda: number; spalare: string; padure?: OptStratOrizont['padure']; livada?: { culoare: string; randuri: number; marime: number } }[];
  elemente: Element[];
  particule?: ParticuleScena;
  /** Flowers for the flowering hills on the way to the next scene (omit for none). */
  floriDrum?: Floare[];
  ceata?: { dz: number; x: number; w: number }[];
}

export function scenaPeisaj(o: OptPeisaj): DefinitieScena {
  const marime = o.erouMarime ?? { w: 2.6, h: 1.3 };
  return {
    id: o.id,
    lungime: o.lungime ?? 240,
    sol: o.sol,
    tinta: o.tinta,
    aterizare: true,
    // On phones, trees are framed a little to the right so their trunk stays in view.
    incadrare: o.incadrare ?? { lat: [0.34, 0.5], port: [o.coroana ? 0.64 : 0.5, 0.27] },
    claritate: o.claritate ?? 0.35,
    zbor: o.zbor ?? 13,
    mediu: mediu(o.mediu),
    particule: o.particule,
    fasii: (ctx) => biom(ctx, o.id, { sol: o.solCuloare, flori: o.floriSol }),
    fundal: (ctx) => o.orizont.map((s, i) => stratOrizont(ctx, { ...s, cheie: `orizont-${i}`, seed: 600 + i * 7 + o.id.length })),
    construieste(ctx) {
      const { r, z0, sol, tinta } = ctx;
      adaugaErou(ctx, { erou: () => o.erou(101 + o.id.length), marime, coroana: o.coroana });

      for (const d of o.dealuri ?? []) {
        const z = z0 + d.dz;
        const t = ctx.tex(`deal-${d.dz}`, () =>
          deal({ seed: 40 + d.dz, sol: o.solCuloare, spalare: d.spalare, creasta: 0.28, amplitudine: 0.3, frecventa: 4, padure: d.padure, livada: d.livada }),
        );
        ctx.adauga({ tex: t, x: d.x, y: sol(z) + d.banda * 0.6 - 300, z, w: d.w, h: 300, banda: d.banda });
      }

      for (const el of o.elemente) {
        const texturi = Array.from({ length: el.variante ?? 2 }, (_, i) => ctx.tex(`${el.cheie}-${i}`, () => el.pictura(700 + i * 13 + el.cheie.length), el.repetare));
        for (let i = 0; i < el.numar; i++) {
          const dz = r.range(el.zona[0], el.zona[1]);
          const z = z0 + dz;
          const x = tinta.x + r.range(-el.lat, el.lat);
          if (Math.abs(dz) < 8 && Math.abs(x - tinta.x) < 5 + el.w * 0.4) continue;
          if (!ctx.liber(x, z, el.w * 0.45, el.inaltime)) continue;
          const m = r.range(0.85, 1.2);
          ctx.adauga({ tex: r.pick(texturi), x, y: sol(z) - 0.15, z, w: el.w * m, h: el.h * m, leganare: el.leganare ?? 0.05, faza: r.range(0, 6), oglinda: r.chance(0.5) });
        }
      }

      if (o.ceata?.length) {
        const tCeata = ctx.tex('ceata', () => ceata(9, '#fbf4ec'));
        for (const c of o.ceata) {
          const z = z0 + c.dz;
          ctx.adauga({ tex: tCeata, x: c.x, y: sol(z) - 2, z, w: c.w, h: c.w * 0.09, ceata: 0.2, opacitate: 0.6, aproape: [20, 45] });
        }
      }
      if (o.floriDrum) dealuriInflorite(ctx, o.id, z0 + 30, z0 + (o.lungime ?? 240) - 50, o.floriDrum);
    },
  };
}
