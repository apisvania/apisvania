// Scene 0 — the apiary at dawn, drawn as a sketch: a row of hives in a
// meadow, an old linden, a fence and distant hills. The bee hovers here
// while the brand is introduced.

import type { DefinitieScena } from '../lume';
import { mediu, biom, stratOrizont, dealuriInflorite } from './comun';
import { deal, ceata } from '../pictura/teren';
import { pom, PALETE } from '../pictura/copaci';
import { stup, gard, tufaFlori, CULORI_STUPI } from '../pictura/stupina';

const FLORI_LUNCA = [
  { culoare: '#f1e9d6', densitate: 0.8 },
  { culoare: '#e8c25a', densitate: 0.6 },
  { culoare: '#a7b6d8', densitate: 0.4 },
];

const SOL = '#e9e7d4';

export const deschidere: DefinitieScena = {
  id: 'deschidere',
  lungime: 240,
  sol: 0,
  tinta: { x: 0, inaltime: 2.1 },
  aterizare: false,
  incadrare: { lat: [0.7, 0.5], port: [0.62, 0.3] },
  claritate: 0.08,
  zbor: 12,
  mediu: mediu({
    cerSus: '#d5d8e0',
    cerMijloc: '#e7dfd8',
    cerOrizont: '#f1dbc6',
    soareCuloare: '#4a2c1c',
    soareAz: -0.42,
    soareEl: 0.03,
    soareMarime: 0.03,
    lumina: '#fbf3ec',
    ceataCuloare: '#efe2d6',
    ceataDensitate: 0.0065,
    nori: 0.1,
    noriCuloare: '#fbf6ef',
  }),
  particule: {},

  fasii: (ctx) => biom(ctx, 'lunca', { sol: SOL, flori: FLORI_LUNCA }),

  fundal: (ctx) => [
    stratOrizont(ctx, {
      cheie: 'orizont-munti',
      seed: 11,
      sol: '#ebe3dc',
      spalare: '#c3bfd0',
      banda: 260,
      varf: 230,
      distanta: 2600,
      creasta: 0.3,
      amplitudine: 0.42,
      frecventa: 4,
      ceata: 0.45,
    }),
    stratOrizont(ctx, {
      cheie: 'orizont-dealuri',
      seed: 12,
      sol: '#e9e4da',
      spalare: '#bcc0bd',
      banda: 90,
      varf: 70,
      distanta: 1500,
      creasta: 0.4,
      amplitudine: 0.3,
      frecventa: 7,
      ceata: 0.35,
    }),
  ],

  construieste(ctx) {
    const { r, z0, sol, tinta } = ctx;

    for (const d of [
      { dz: 130, x: -80, w: 700, banda: 60, seed: 21 },
      { dz: 230, x: 120, w: 900, banda: 100, seed: 22 },
    ]) {
      const z = z0 + d.dz;
      const t = ctx.tex(`deal-${d.seed}`, () =>
        deal({
          seed: d.seed,
          sol: SOL,
          spalare: '#b9c49c',
          creasta: 0.3,
          amplitudine: 0.28,
          frecventa: 4,
          padure: { culoare: '#a3b28a', densitate: 0.4, marime: 16 },
        }),
      );
      ctx.adauga({ tex: t, x: d.x, y: sol(z) + d.banda * 0.6 - 300, z, w: d.w, h: 300, banda: d.banda });
    }

    const tCeata = ctx.tex('ceata', () => ceata(5, '#fbf4ec'));
    ctx.adauga({ tex: tCeata, x: 30, y: sol(z0 + 140) - 2, z: z0 + 140, w: 420, h: 38, ceata: 0.2, opacitate: 0.7, aproape: [20, 45] });

    // The old linden behind the hives, and one further off.
    const tTei = ctx.tex('tei', () => pom({ seed: 3, w: 1024, h: 1024, paleta: PALETE.tei, latime: 1.15 }));
    ctx.adauga({ tex: tTei, x: 9, y: sol(z0 + 30) - 0.3, z: z0 + 30, w: 16, h: 16, leganare: 0.12, faza: 1.3 });
    const tTei2 = ctx.tex('tei-2', () => pom({ seed: 9, paleta: PALETE.tei }));
    ctx.adauga({ tex: tTei2, x: -14, y: sol(z0 + 50) - 0.3, z: z0 + 50, w: 12, h: 12, leganare: 0.1, faza: 2.1 });

    const tGard = ctx.tex('gard', () => gard(4), true);
    ctx.adauga({ tex: tGard, x: 2, y: sol(z0 + 22) - 0.1, z: z0 + 22, w: 26, h: 1.4, repetari: 26 / 8 });

    // One row of painted hives in a soft arc.
    const texStupi = CULORI_STUPI.map((c, i) => ctx.tex(`stup-${i}`, () => stup(40 + i, c)));
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const x = -1.8 + t * 8.5 + r.range(-0.2, 0.2);
      const z = z0 + 7 + Math.sin(t * Math.PI) * 3 + r.range(-0.3, 0.3);
      ctx.adauga({ tex: texStupi[i % texStupi.length], x, y: sol(z) - 0.06, z, w: 1.35, h: 1.35 });
    }

    const texTufe = [0, 1].map((i) => ctx.tex(`tufa-${i}`, () => tufaFlori(60 + i, FLORI_LUNCA)));
    for (let i = 0; i < 10; i++) {
      const z = z0 + r.range(2.5, 30);
      const x = tinta.x + r.range(-10, 12);
      if (z < z0 + 6 && Math.abs(x - tinta.x) < 1.6) continue;
      const m = r.range(0.8, 1.3);
      ctx.adauga({ tex: r.pick(texTufe), x, y: sol(z) - 0.05, z, w: 1.6 * m, h: 0.8 * m, leganare: 0.05, faza: r.range(0, 6) });
    }

    dealuriInflorite(ctx, 'lunca', z0 + 34, z0 + 180, FLORI_LUNCA);
  },
};
