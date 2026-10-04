// Scene 1 — the blossoming orchard in the morning, drawn as a sketch. The
// bee lands on an apple blossom; behind it, rows of trees fade into paper.

import type { DefinitieScena } from '../lume';
import { mediu, biom, stratOrizont, dealuriInflorite } from './comun';
import { deal } from '../pictura/teren';
import { pom, PALETE, creangaInflorita } from '../pictura/copaci';
import { tufaFlori } from '../pictura/stupina';

const FLORI_LIVADA = [
  { culoare: '#ebb431', densitate: 1 },
  { culoare: '#f6efe0', densitate: 0.6 },
  { culoare: '#a48ddb', densitate: 0.4 },
];

const SOL = '#e3e9c4';

// The hero branch geometry (world metres).
const CREANGA = { w: 2.6, h: 1.3 };

export const livada: DefinitieScena = {
  id: 'primavara',
  lungime: 240,
  sol: 6,
  tinta: { x: 3, inaltime: 2.3 },
  aterizare: true,
  incadrare: { lat: [0.34, 0.5], port: [0.5, 0.27] },
  claritate: 0.35,
  zbor: 13,
  mediu: mediu({
    cerSus: '#bcd8e8',
    cerMijloc: '#e0ece6',
    cerOrizont: '#f6ecd6',
    soareCuloare: '#3a2c18',
    soareAz: -0.62,
    soareEl: 0.18,
    soareMarime: 0.026,
    lumina: '#ffffff',
    ceataCuloare: '#f1eee5',
    ceataDensitate: 0.0058,
    nori: 0.12,
    noriCuloare: '#fbfaf5',
  }),
  particule: { petale: { culori: ['#f0bcc6', '#fbf0ef'], densitate: 0.3 } },

  fasii: (ctx) => biom(ctx, 'livada', { sol: SOL, flori: FLORI_LIVADA }),

  fundal: (ctx) => [
    stratOrizont(ctx, {
      cheie: 'orizont-munti',
      seed: 31,
      sol: '#ecebe6',
      spalare: '#a7bdd6',
      banda: 300,
      varf: 300,
      distanta: 2600,
      creasta: 0.25,
      amplitudine: 0.45,
      frecventa: 4,
      ceata: 0.45,
    }),
    stratOrizont(ctx, {
      cheie: 'orizont-dealuri',
      seed: 32,
      sol: '#e9eadf',
      spalare: '#a5c49a',
      banda: 90,
      varf: 80,
      distanta: 1500,
      creasta: 0.4,
      amplitudine: 0.3,
      frecventa: 7,
      ceata: 0.35,
    }),
  ],

  construieste(ctx) {
    const { r, z0, sol, tinta } = ctx;

    // Hero: the blossoming branch, placed so its landing flower is the target.
    let ancora = { u: 0.31, v: 0.42 };
    const tCreanga = ctx.tex('creanga', () => {
      const { canvas, ancora: a } = creangaInflorita(101);
      ancora = a;
      return canvas;
    });
    ctx.adauga({
      tex: tCreanga,
      get x() {
        return tinta.x + (0.5 - ancora.u) * CREANGA.w;
      },
      get y() {
        return tinta.y - (1 - ancora.v) * CREANGA.h;
      },
      z: tinta.z,
      w: CREANGA.w,
      h: CREANGA.h,
      leganare: 0.004,
      ceata: 0.1,
      aproape: [0.25, 0.8],
    });

    // Orchard rows, airy and regular.
    const texPomi = [
      ctx.tex('mar-1', () => pom({ seed: 201, paleta: PALETE.mar, latime: 1.2 })),
      ctx.tex('mar-2', () => pom({ seed: 202, paleta: PALETE.mar, latime: 1.1 })),
      ctx.tex('cires-1', () => pom({ seed: 204, paleta: PALETE.cires, latime: 1.0, inaltimeTrunchi: 0.34 })),
      ctx.tex('prun-1', () => pom({ seed: 206, paleta: PALETE.prun, latime: 1.0 })),
    ];
    for (let zr = -100; zr <= 110; zr += 11) {
      const z = z0 + zr + r.range(-0.6, 0.6);
      for (let x = -66; x <= 66; x += 14 + r.range(-0.5, 0.5)) {
        const xx = x + tinta.x;
        if (Math.abs(zr) < 10 && Math.abs(xx - tinta.x) < 7) continue;
        if (!ctx.liber(xx, z, 3.6, 6)) continue;
        if (r.chance(0.15)) continue;
        const m = r.range(0.85, 1.1);
        ctx.adauga({ tex: r.pick(texPomi), x: xx, y: sol(z) - 0.25, z, w: 7 * m, h: 7 * m, leganare: 0.08, faza: r.range(0, 6), oglinda: r.chance(0.5) });
      }
    }

    for (const d of [
      { dz: 150, x: 60, w: 800, banda: 70, seed: 41 },
      { dz: 230, x: -90, w: 1000, banda: 100, seed: 42 },
    ]) {
      const z = z0 + d.dz;
      const t = ctx.tex(`deal-${d.seed}`, () =>
        deal({
          seed: d.seed,
          sol: SOL,
          spalare: '#a6c77c',
          creasta: 0.25,
          amplitudine: 0.25,
          frecventa: 4,
          livada: { culoare: '#efbcc6', randuri: 5, marime: 6 },
        }),
      );
      ctx.adauga({ tex: t, x: d.x, y: sol(z) + d.banda * 0.6 - 300, z, w: d.w, h: 300, banda: d.banda });
    }

    const texTufe = [0, 1].map((i) => ctx.tex(`tufa-${i}`, () => tufaFlori(160 + i, FLORI_LIVADA)));
    for (let i = 0; i < 16; i++) {
      const z = z0 + r.range(-60, 60);
      const x = tinta.x + r.range(-14, 14);
      if (!ctx.liber(x, z, 0.8, 0.9)) continue;
      const m = r.range(0.9, 1.4);
      ctx.adauga({ tex: r.pick(texTufe), x, y: sol(z) - 0.05, z, w: 1.6 * m, h: 0.8 * m, leganare: 0.05, faza: r.range(0, 6) });
    }

    dealuriInflorite(ctx, 'livada', z0 + 120, z0 + 210, FLORI_LIVADA);
  },
};
