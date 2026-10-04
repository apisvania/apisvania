// Scene 0 — the apiary at dawn: painted hives in a meadow, an old linden,
// mist in the valley. The bee hovers here while the brand is introduced.

import type { DefinitieScena } from '../lume';
import { mediu, biom, stratOrizont, dealuriInflorite } from './comun';
import { deal, ceata } from '../pictura/teren';
import { pom, PALETE } from '../pictura/copaci';
import { stup, gard, tufaFlori, CULORI_STUPI } from '../pictura/stupina';

const FLORI_LUNCA = [
  { tip: 'margareta' as const, culoare: '#f7f3ea', centru: '#e7b62c', densitate: 0.6, marime: 5 },
  { tip: 'papadie' as const, culoare: '#f0bf2e', densitate: 0.35, marime: 5 },
  { tip: 'disc' as const, culoare: '#8d9fd6', centru: '#f2e7b0', densitate: 0.25, marime: 3.5 },
];

export const deschidere: DefinitieScena = {
  id: 'deschidere',
  lungime: 240,
  sol: 0,
  tinta: { x: 0, inaltime: 2.1 },
  aterizare: false,
  incadrare: { lat: [0.7, 0.5], port: [0.62, 0.3] },
  claritate: 0.12,
  zbor: 12,
  mediu: mediu({
    cerSus: '#1f2d4f',
    cerMijloc: '#6f6f9a',
    cerOrizont: '#f4b98c',
    soareCuloare: '#ff9b5c',
    soareAz: -0.42,
    soareEl: 0.012,
    soareMarime: 0.03,
    lumina: '#d8b9ad',
    ceataCuloare: '#c7a3a3',
    ceataDensitate: 0.0042,
    stele: 0.35,
    nori: 0.32,
    noriCuloare: '#c8949b',
  }),
  particule: { polen: 0.25 },

  fasii: (ctx) =>
    biom(ctx, 'lunca', {
      iarba: ['#5c7a37', '#4d6b2f', '#6f8c3f', '#7d9a48'],
      corp: '#58753a',
      fond: '#3e5b2b',
      varfuri: '#e2c49a',
      flori: FLORI_LUNCA,
    }),

  fundal: (ctx) => [
    stratOrizont(ctx, {
      cheie: 'orizont-munti',
      seed: 11,
      sus: '#8b86a8',
      jos: '#a99bb0',
      banda: 260,
      varf: 230,
      distanta: 2600,
      creasta: 0.3,
      amplitudine: 0.42,
      frecventa: 4,
      ceata: 0.55,
    }),
    stratOrizont(ctx, {
      cheie: 'orizont-dealuri',
      seed: 12,
      sus: '#6f6a8e',
      jos: '#7d7392',
      banda: 90,
      varf: 70,
      distanta: 1500,
      creasta: 0.4,
      amplitudine: 0.3,
      frecventa: 7,
      padure: { culoare: '#5f5a7c', densitate: 0.6, marime: 7 },
      ceata: 0.45,
    }),
  ],

  construieste(ctx) {
    const { r, z0, sol, tinta } = ctx;

    // Mid-distance hills between the apiary and the orchard.
    const dealuri = [
      { dz: 130, x: -80, w: 700, banda: 60, sus: '#4f6a3f', jos: '#33472c', seed: 21 },
      { dz: 210, x: 120, w: 800, banda: 85, sus: '#5d7448', jos: '#3a4f30', seed: 22 },
      { dz: 320, x: -40, w: 1100, banda: 120, sus: '#667a52', jos: '#45573a', seed: 23 },
    ];
    for (const d of dealuri) {
      const z = z0 + d.dz;
      const t = ctx.tex(`deal-${d.seed}`, () =>
        deal({
          seed: d.seed,
          sus: d.sus,
          jos: d.jos,
          creasta: 0.3,
          amplitudine: 0.28,
          frecventa: 5,
          padure: { culoare: '#2f4229', densitate: 0.5, marime: 14 },
          campuri: 0.5,
          lumina: { culoare: '#ffc7a0', stanga: true, forta: 0.5 },
        }),
      );
      ctx.adauga({ tex: t, x: d.x, y: sol(z) + d.banda * 0.6 - 300, z, w: d.w, h: 300, banda: d.banda, ceata: 1 });
    }

    // Mist in the valley.
    const tCeata = ctx.tex('ceata', () => ceata(5, '#fff4ee'));
    for (const [dz, x, w] of [[60, -20, 260], [140, 30, 420], [250, -60, 600]] as const) {
      const z = z0 + dz;
      ctx.adauga({ tex: tCeata, x, y: sol(z) - 2, z, w, h: w * 0.09, ceata: 0.25, opacitate: 0.6, aproape: [20, 45] });
    }

    // The old linden behind the hives.
    const tTei = ctx.tex('tei', () => pom({ seed: 3, w: 1024, h: 1024, paleta: PALETE.tei, latime: 1.15, inaltimeTrunchi: 0.24, soareStanga: true, marimePunct: 7 }));
    ctx.adauga({ tex: tTei, x: 9, y: sol(z0 + 30) - 0.3, z: z0 + 30, w: 16, h: 16, leganare: 0.18, faza: 1.3 });
    const tTei2 = ctx.tex('tei-2', () => pom({ seed: 9, w: 512, h: 512, paleta: PALETE.tei, latime: 1.0, soareStanga: true }));
    ctx.adauga({ tex: tTei2, x: -12, y: sol(z0 + 46) - 0.3, z: z0 + 46, w: 12, h: 12, leganare: 0.14, faza: 2.1 });

    // Fence.
    const tGard = ctx.tex('gard', () => gard(4), true);
    ctx.adauga({ tex: tGard, x: 2, y: sol(z0 + 22) - 0.1, z: z0 + 22, w: 26, h: 1.4, repetari: 26 / 8 });

    // A row of painted hives in a soft arc.
    const texStupi = CULORI_STUPI.map((c, i) => ctx.tex(`stup-${i}`, () => stup(40 + i, c, true)));
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const x = -2.2 + t * 9 + r.range(-0.2, 0.2);
      const z = z0 + 6.5 + Math.sin(t * Math.PI) * 3.5 + r.range(-0.3, 0.3);
      ctx.adauga({ tex: texStupi[i % texStupi.length], x, y: sol(z) - 0.06, z, w: 1.35, h: 1.35 });
    }
    // A second, further row.
    for (let i = 0; i < 6; i++) {
      const x = -6 + i * 2.7 + r.range(-0.4, 0.4);
      const z = z0 + 16 + r.range(-0.5, 0.5);
      ctx.adauga({ tex: texStupi[(i + 3) % texStupi.length], x, y: sol(z) - 0.06, z, w: 1.35, h: 1.35 });
    }

    // Wildflower clumps in the foreground and along the way out.
    const texTufe = [0, 1, 2].map((i) => ctx.tex(`tufa-${i}`, () => tufaFlori(60 + i, FLORI_LUNCA)));
    for (let i = 0; i < 46; i++) {
      const z = z0 + r.range(1.5, 90);
      const x = tinta.x + r.range(-14, 14);
      if (!ctx.liber(x, z, 0.8, 0.9) && z > z0 + 4) continue;
      if (z < z0 + 6 && Math.abs(x - tinta.x) < 1.6) continue;
      const m = r.range(0.9, 1.5);
      ctx.adauga({ tex: r.pick(texTufe), x, y: sol(z) - 0.05, z, w: 1.6 * m, h: 0.8 * m, leganare: 0.06, faza: r.range(0, 6) });
    }

    // Foreground flowers at the camera's feet, softening the nearest ground line.
    for (let i = 0; i < 14; i++) {
      const z = z0 + r.range(1.2, 4.5);
      const x = tinta.x + r.range(-3.5, 5);
      if (Math.abs(x - tinta.x) < 0.9 && z < z0 + 2.5) continue;
      const m = r.range(0.5, 0.9);
      ctx.adauga({ tex: r.pick(texTufe), x, y: sol(z) - 0.25 - r.range(0, 0.3), z, w: 1.6 * m, h: 0.8 * m, leganare: 0.04, faza: r.range(0, 6), aproape: [0.6, 1.2] });
    }

    dealuriInflorite(ctx, 'lunca', z0 + 24, z0 + 170, FLORI_LUNCA, '#5c7a37');

    // Scattered trees along the way to the orchard.
    const texPomi = [0, 1].map((i) => ctx.tex(`pom-${i}`, () => pom({ seed: 70 + i, paleta: PALETE.tei, soareStanga: true })));
    for (let i = 0; i < 26; i++) {
      const z = z0 + r.range(50, 220);
      const x = tinta.x + r.range(-60, 60);
      if (!ctx.liber(x, z, 4, 8)) continue;
      const m = r.range(0.8, 1.3);
      ctx.adauga({ tex: r.pick(texPomi), x, y: sol(z) - 0.2, z, w: 8 * m, h: 8 * m, leganare: 0.12, faza: r.range(0, 6) });
    }
  },
};
