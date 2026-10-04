// Scene 1 — the blossoming orchard in the morning. The bee lands on an apple
// blossom; behind it, rows of fruit trees in bloom dissolve into soft focus.

import type { DefinitieScena } from '../lume';
import { mediu, biom, stratOrizont, dealuriInflorite } from './comun';
import { deal, ceata } from '../pictura/teren';
import { pom, PALETE, creangaInflorita, bokehFlori } from '../pictura/copaci';
import { tufaFlori } from '../pictura/stupina';

const FLORI_LIVADA = [
  { tip: 'papadie' as const, culoare: '#f3c22c', densitate: 1, marime: 5.5 },
  { tip: 'margareta' as const, culoare: '#fbf8f0', centru: '#ecc23a', densitate: 0.6, marime: 5 },
  { tip: 'clopot' as const, culoare: '#7f6cc0', densitate: 0.25, marime: 4.5 },
];

// The hero branch geometry (world metres) and where its landing flower sits.
const CREANGA = { w: 2.6, h: 1.3 };

export const livada: DefinitieScena = {
  id: 'primavara',
  lungime: 240,
  sol: 6,
  tinta: { x: 3, inaltime: 2.3 },
  aterizare: true,
  incadrare: { lat: [0.34, 0.5], port: [0.5, 0.27] },
  claritate: 1,
  zbor: 13,
  mediu: mediu({
    cerSus: '#4a82c4',
    cerMijloc: '#97c0e2',
    cerOrizont: '#f5dfc4',
    soareCuloare: '#ffd29a',
    soareAz: -0.62,
    soareEl: 0.16,
    soareMarime: 0.026,
    lumina: '#fff6ea',
    ceataCuloare: '#d9e2e6',
    ceataDensitate: 0.0034,
    stele: 0,
    nori: 0.42,
    noriCuloare: '#ffffff',
  }),
  particule: { petale: { culori: ['#fff7f9', '#fbe1e8', '#ffffff', '#f6cad6'], densitate: 1 }, polen: 0.6 },

  fasii: (ctx) =>
    biom(ctx, 'livada', {
      iarba: ['#7a9c3e', '#6a8c35', '#8fb04a', '#5f8232'],
      corp: '#6f9140',
      fond: '#4d6f30',
      varfuri: '#eef0b0',
      flori: FLORI_LIVADA,
    }),

  fundal: (ctx) => [
    stratOrizont(ctx, {
      cheie: 'orizont-munti',
      seed: 31,
      sus: '#9db3cc',
      jos: '#b9c8d6',
      banda: 300,
      varf: 300,
      distanta: 2600,
      creasta: 0.25,
      amplitudine: 0.45,
      frecventa: 4,
      ceata: 0.5,
    }),
    stratOrizont(ctx, {
      cheie: 'orizont-dealuri',
      seed: 32,
      sus: '#7f9a8c',
      jos: '#8fa597',
      banda: 90,
      varf: 80,
      distanta: 1500,
      creasta: 0.4,
      amplitudine: 0.3,
      frecventa: 7,
      padure: { culoare: '#6c8a78', densitate: 0.7, marime: 7 },
      ceata: 0.4,
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
      ceata: 0.15,
      aproape: [0.25, 0.8],
    });
    // Out-of-focus blossoms framing the bottom-left corner.
    const tBokeh = ctx.tex('bokeh', () => bokehFlori(7));
    ctx.adauga({ tex: tBokeh, x: tinta.x - 0.95, y: tinta.y - 0.75, z: tinta.z - 0.95, w: 1.1, h: 0.72, ceata: 0, aproape: [0.12, 0.3], oglinda: true, leganare: 0.02 });
    ctx.adauga({ tex: tBokeh, x: tinta.x + 1.6, y: tinta.y + 0.25, z: tinta.z + 0.6, w: 1.2, h: 0.8, ceata: 0.1, aproape: [0.12, 0.3], leganare: 0.02, faza: 2 });

    // Orchard: rows of blossoming trees on both sides of the flight path.
    const texPomi = [
      ctx.tex('mar-1', () => pom({ seed: 201, paleta: PALETE.mar, latime: 1.25, soareStanga: true })),
      ctx.tex('mar-2', () => pom({ seed: 202, paleta: PALETE.mar, latime: 1.15, soareStanga: true })),
      ctx.tex('mar-3', () => pom({ seed: 203, paleta: PALETE.mar, latime: 1.3, soareStanga: true, densitate: 1.2 })),
      ctx.tex('cires-1', () => pom({ seed: 204, paleta: PALETE.cires, latime: 1.05, soareStanga: true, inaltimeTrunchi: 0.3 })),
      ctx.tex('cires-2', () => pom({ seed: 205, paleta: PALETE.cires, latime: 1.1, soareStanga: true, inaltimeTrunchi: 0.28 })),
      ctx.tex('prun-1', () => pom({ seed: 206, paleta: PALETE.prun, latime: 1.0, soareStanga: true })),
    ];
    for (let zr = -110; zr <= 120; zr += 7.5) {
      const z = z0 + zr + r.range(-0.6, 0.6);
      for (let x = -71.5; x <= 70; x += 11 + r.range(-0.4, 0.4)) {
        const xx = x + tinta.x;
        // Keep the close-up uncluttered: nothing right behind the branch.
        if (Math.abs(zr) < 8 && Math.abs(xx - tinta.x) < 6) continue;
        if (!ctx.liber(xx, z, 3.6, 6)) continue;
        const m = r.range(0.85, 1.15);
        ctx.adauga({ tex: r.pick(texPomi), x: xx, y: sol(z) - 0.25, z, w: 7 * m, h: 7 * m, leganare: 0.1, faza: r.range(0, 6), oglinda: r.chance(0.5) });
      }
    }

    // Distant orchard hills.
    const dealuri = [
      { dz: 140, x: 60, w: 760, banda: 70, seed: 41 },
      { dz: 230, x: -90, w: 1000, banda: 100, seed: 42 },
    ];
    for (const d of dealuri) {
      const z = z0 + d.dz;
      const t = ctx.tex(`deal-${d.seed}`, () =>
        deal({
          seed: d.seed,
          sus: '#8fae58',
          jos: '#5f7f3d',
          creasta: 0.25,
          amplitudine: 0.25,
          frecventa: 4,
          livada: { culoare: '#efe4e6', randuri: 22, marime: 4.2 },
          padure: { culoare: '#56723a', densitate: 0.3, marime: 12 },
          campuri: 0.35,
          lumina: { culoare: '#fff2d0', stanga: true, forta: 0.5 },
        }),
      );
      ctx.adauga({ tex: t, x: d.x, y: sol(z) + d.banda * 0.6 - 300, z, w: d.w, h: 300, banda: d.banda });
    }

    const tCeata = ctx.tex('ceata', () => ceata(8, '#ffffff'));
    for (const [dz, x, w] of [[90, 10, 380], [190, -40, 560]] as const) {
      const z = z0 + dz;
      ctx.adauga({ tex: tCeata, x, y: sol(z) - 1, z, w, h: w * 0.07, ceata: 0.3, opacitate: 0.35, aproape: [25, 55] });
    }

    dealuriInflorite(ctx, 'livada', z0 + 110, z0 + 210, FLORI_LIVADA, '#6a8c35');

    // Dandelion and daisy clumps.
    const texTufe = [0, 1, 2].map((i) => ctx.tex(`tufa-${i}`, () => tufaFlori(160 + i, FLORI_LIVADA)));
    for (let i = 0; i < 70; i++) {
      const z = z0 + r.range(-100, 100);
      const x = tinta.x + r.range(-16, 16);
      if (!ctx.liber(x, z, 0.8, 0.9)) continue;
      const m = r.range(0.9, 1.6);
      ctx.adauga({ tex: r.pick(texTufe), x, y: sol(z) - 0.05, z, w: 1.6 * m, h: 0.8 * m, leganare: 0.06, faza: r.range(0, 6) });
    }
  },
};
