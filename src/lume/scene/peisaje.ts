// The landscapes after the orchard, climbing from the rapeseed plain to the
// alpine heath, then the night-time return to the apiary. The day moves on
// with the journey: morning, noon, golden afternoon, sunset, night.

import type { DefinitieScena } from '../lume';
import { scenaPeisaj, mediu, biom, stratOrizont, type OptPeisaj } from './comun';
import { pom, PALETE } from '../pictura/copaci';
import { stup, CULORI_STUPI } from '../pictura/stupina';
import { deal } from '../pictura/teren';
import {
  brad,
  salcamPom,
  tufaRapita,
  tufaPoliflora,
  tufaZmeur,
  tufaIarbaNeagra,
  stanca,
  casuta,
  erouRapita,
  erouSalcam,
  erouPoliflora,
  erouBrad,
  erouZmeura,
  erouIarbaNeagra,
} from '../pictura/flora';

const SOARE = '#c4412c';

// Shared horizons.
const DEALURI_JOASE: OptPeisaj['orizont'] = [
  { sol: '#ebe5d6', spalare: '#a9b3c6', banda: 300, varf: 320, distanta: 2600, creasta: 0.25, amplitudine: 0.45, frecventa: 4, ceata: 0.45 },
  { sol: '#e9e6d8', spalare: '#a5b99a', banda: 90, varf: 90, distanta: 1500, creasta: 0.4, amplitudine: 0.3, frecventa: 7, ceata: 0.35 },
];
const MUNTI: OptPeisaj['orizont'] = [
  { sol: '#e6e0d2', spalare: '#8e98ae', banda: 700, varf: 760, distanta: 2700, creasta: 0.2, amplitudine: 0.6, frecventa: 5, ceata: 0.4 },
  { sol: '#e3dfd2', spalare: '#6f8577', banda: 240, varf: 200, distanta: 1500, creasta: 0.3, amplitudine: 0.4, frecventa: 8, ceata: 0.3, padure: { culoare: '#55695a', densitate: 0.9, marime: 12, conifere: true } },
];

const elementPom = (cheie: string, numar: number, zona: [number, number], lat: number) => ({
  cheie,
  pictura: (s: number) => pom({ seed: s, paleta: PALETE.tei }),
  numar,
  zona,
  lat,
  w: 9,
  h: 9,
  leganare: 0.08,
  inaltime: 8,
});

export const rapita = scenaPeisaj({
  id: 'rapita',
  sol: 8,
  tinta: { x: -2, inaltime: 1.4 },
  mediu: {
    cerSus: '#e6e3cd',
    cerMijloc: '#efead6',
    cerOrizont: '#f5eed9',
    soareCuloare: SOARE,
    soareAz: -0.5,
    soareEl: 0.3,
    soareMarime: 0.05,
    lumina: '#fffaf0',
    ceataCuloare: '#f2ecd8',
    ceataDensitate: 0.006,
    nori: 0,
  },
  solCuloare: '#e8e6b8',
  floriSol: [
    { culoare: '#efc93a', densitate: 9 },
    { culoare: '#f3dd6a', densitate: 3 },
  ],
  orizont: DEALURI_JOASE,
  erou: erouRapita,
  dealuri: [
    { dz: 120, x: 50, w: 800, banda: 60, spalare: '#c9cf7a', livada: { culoare: '#efd23f', randuri: 14, marime: 7 } },
    { dz: 210, x: -80, w: 1000, banda: 90, spalare: '#b9c487', livada: { culoare: '#efd23f', randuri: 10, marime: 6 } },
  ],
  elemente: [
    { cheie: 'rapita', pictura: tufaRapita, variante: 3, numar: 150, zona: [-100, 100], lat: 40, w: 1.9, h: 0.95, inaltime: 1.2 },
    elementPom('nuc', 6, [-100, 100], 60),
  ],
  floriDrum: [
    { culoare: '#efc93a', densitate: 1 },
    { culoare: '#f6efe0', densitate: 0.6 },
  ],
});

export const salcam = scenaPeisaj({
  id: 'salcam',
  sol: 16,
  tinta: { x: 4, inaltime: 3.2 },
  mediu: {
    cerSus: '#e9e5d2',
    cerMijloc: '#f1ecdc',
    cerOrizont: '#f5efde',
    soareCuloare: SOARE,
    soareAz: -0.25,
    soareEl: 0.4,
    soareMarime: 0.05,
    lumina: '#fffbf2',
    ceataCuloare: '#f3eedd',
    ceataDensitate: 0.006,
    nori: 0,
  },
  solCuloare: '#e2e6c6',
  floriSol: [
    { culoare: '#f6efe0', densitate: 1.5 },
    { culoare: '#e8c25a', densitate: 0.8 },
  ],
  orizont: DEALURI_JOASE,
  erou: erouSalcam,
  coroana: 'salcam',
  dealuri: [{ dz: 150, x: 40, w: 900, banda: 80, spalare: '#a6b97e', padure: { culoare: '#97ab78', densitate: 0.8, marime: 16 } }],
  elemente: [
    { cheie: 'salcam', pictura: (s) => salcamPom(s), variante: 3, numar: 90, zona: [-110, 110], lat: 60, w: 9, h: 9, leganare: 0.08, inaltime: 8 },
    { cheie: 'flori', pictura: tufaPoliflora, numar: 18, zona: [-60, 60], lat: 20, w: 1.6, h: 0.8, inaltime: 1 },
  ],
  particule: { petale: { culori: ['#f6f1e4', '#efe8d6'], densitate: 0.3 } },
  floriDrum: [
    { culoare: '#c9463a', densitate: 0.8 },
    { culoare: '#5b7fd0', densitate: 0.6 },
    { culoare: '#f6efe0', densitate: 0.8 },
  ],
});

export const poliflora = scenaPeisaj({
  id: 'poliflora',
  sol: 24,
  tinta: { x: 0, inaltime: 1.2 },
  mediu: {
    cerSus: '#ece6cf',
    cerMijloc: '#f3ecd8',
    cerOrizont: '#f6efda',
    soareCuloare: SOARE,
    soareAz: 0.1,
    soareEl: 0.42,
    soareMarime: 0.05,
    lumina: '#fffaf0',
    ceataCuloare: '#f2ecd8',
    ceataDensitate: 0.0055,
    nori: 0,
  },
  solCuloare: '#e3e7c3',
  floriSol: [
    { culoare: '#c9463a', densitate: 2 },
    { culoare: '#5b7fd0', densitate: 2 },
    { culoare: '#f6efe0', densitate: 2.5 },
    { culoare: '#c77fb2', densitate: 2 },
    { culoare: '#e9c047', densitate: 1.5 },
  ],
  orizont: DEALURI_JOASE,
  erou: erouPoliflora,
  dealuri: [
    { dz: 120, x: -40, w: 800, banda: 70, spalare: '#b7c784', livada: { culoare: '#c77fb2', randuri: 8, marime: 5 } },
    { dz: 200, x: 60, w: 1000, banda: 110, spalare: '#a9bd7c', padure: { culoare: '#6e8a66', densitate: 0.5, marime: 14, conifere: true } },
  ],
  elemente: [
    { cheie: 'flori', pictura: tufaPoliflora, variante: 3, numar: 140, zona: [-100, 100], lat: 35, w: 1.7, h: 0.85, inaltime: 1 },
    elementPom('pom', 5, [-100, 100], 60),
  ],
  floriDrum: [
    { culoare: '#c9463a', densitate: 0.6 },
    { culoare: '#5b7fd0', densitate: 0.6 },
  ],
});

export const manaBrad = scenaPeisaj({
  id: 'mana-brad',
  sol: 70,
  tinta: { x: 3, inaltime: 3 },
  zbor: 16,
  mediu: {
    cerSus: '#e3d6b6',
    cerMijloc: '#ecdcbc',
    cerOrizont: '#f0dfbd',
    soareCuloare: SOARE,
    soareAz: 0.35,
    soareEl: 0.26,
    soareMarime: 0.055,
    lumina: '#fff2dc',
    ceataCuloare: '#eadbbd',
    ceataDensitate: 0.007,
    nori: 0,
  },
  solCuloare: '#dfe0c2',
  floriSol: [{ culoare: '#f6efe0', densitate: 0.5 }],
  orizont: MUNTI,
  erou: erouBrad,
  coroana: 'brad',
  dealuri: [{ dz: 140, x: -30, w: 900, banda: 120, spalare: '#7f957f', padure: { culoare: '#4f6655', densitate: 1, marime: 20, conifere: true } }],
  elemente: [
    { cheie: 'brad', pictura: (s) => brad(s), variante: 3, numar: 220, zona: [-110, 120], lat: 70, w: 5, h: 10, leganare: 0.05, inaltime: 10 },
    { cheie: 'stanca', pictura: stanca, numar: 12, zona: [-80, 80], lat: 30, w: 3, h: 1.5, inaltime: 1.5 },
  ],
  ceata: [{ dz: 90, x: 20, w: 400 }],
});

export const zmeura = scenaPeisaj({
  id: 'zmeura',
  sol: 84,
  tinta: { x: -3, inaltime: 1.3 },
  zbor: 16,
  mediu: {
    cerSus: '#dfcda8',
    cerMijloc: '#e9d4ad',
    cerOrizont: '#efd5a8',
    soareCuloare: SOARE,
    soareAz: 0.45,
    soareEl: 0.15,
    soareMarime: 0.06,
    lumina: '#ffecd2',
    ceataCuloare: '#e8d3ad',
    ceataDensitate: 0.0068,
    nori: 0,
  },
  solCuloare: '#e0dcba',
  floriSol: [
    { culoare: '#f6efe0', densitate: 0.8 },
    { culoare: '#c2333f', densitate: 0.6 },
  ],
  orizont: MUNTI,
  erou: erouZmeura,
  elemente: [
    { cheie: 'zmeur', pictura: tufaZmeur, variante: 3, numar: 90, zona: [-80, 80], lat: 25, w: 2.2, h: 1.1, inaltime: 1.4 },
    { cheie: 'brad', pictura: (s) => brad(s, '#46604e'), variante: 2, numar: 120, zona: [-100, 120], lat: 70, w: 5, h: 10, leganare: 0.05, inaltime: 10 },
  ],
});

export const iarbaNeagra = scenaPeisaj({
  id: 'iarba-neagra',
  sol: 120,
  tinta: { x: 2, inaltime: 0.9 },
  zbor: 16,
  mediu: {
    cerSus: '#cdb1a6',
    cerMijloc: '#dfbaa0',
    cerOrizont: '#efc69a',
    soareCuloare: '#b8392a',
    soareAz: 0.5,
    soareEl: 0.045,
    soareMarime: 0.08,
    lumina: '#f6dcc4',
    ceataCuloare: '#e6c2a2',
    ceataDensitate: 0.0062,
    nori: 0,
  },
  solCuloare: '#ddd1bc',
  floriSol: [
    { culoare: '#9a5fa3', densitate: 5 },
    { culoare: '#c590c4', densitate: 2 },
  ],
  orizont: [
    { sol: '#e0d2c4', spalare: '#8d86a6', banda: 600, varf: 640, distanta: 2400, creasta: 0.15, amplitudine: 0.6, frecventa: 6, ceata: 0.35 },
    { sol: '#ddd0c0', spalare: '#9a8a8a', banda: 200, varf: 90, distanta: 1400, creasta: 0.3, amplitudine: 0.4, frecventa: 9, ceata: 0.3 },
  ],
  erou: erouIarbaNeagra,
  elemente: [
    { cheie: 'iarba', pictura: tufaIarbaNeagra, variante: 3, numar: 160, zona: [-100, 100], lat: 45, w: 2.3, h: 1.15, inaltime: 1 },
    { cheie: 'stanca', pictura: stanca, variante: 3, numar: 26, zona: [-100, 100], lat: 50, w: 3.4, h: 1.7, inaltime: 1.8 },
    { cheie: 'jneapan', pictura: (s) => brad(s, '#4a5c4c'), numar: 10, zona: [-100, 100], lat: 60, w: 3, h: 5, inaltime: 5 },
  ],
});

/** The return: night falls over the hills as the bee flies home to the apiary. */
export const intoarcere: DefinitieScena = {
  id: 'intoarcere',
  lungime: 240,
  sol: 30,
  tinta: { x: 0, inaltime: 2.2 },
  aterizare: false,
  incadrare: { lat: [0.28, 0.5], port: [0.5, 0.2] },
  claritate: 0.15,
  zbor: 14,
  mediu: mediu({
    cerSus: '#232a3a',
    cerMijloc: '#343b50',
    cerOrizont: '#555468',
    soareCuloare: '#ece2c6',
    soareAz: -0.3,
    soareEl: 0.22,
    soareMarime: 0.035,
    lumina: '#8b90a6',
    ceataCuloare: '#4a4d60',
    ceataDensitate: 0.006,
    stele: 0.8,
    nori: 0,
  }),
  particule: { polen: 1 },
  fasii: (ctx) => biom(ctx, 'noapte', { sol: '#d6d6c4', flori: [{ culoare: '#f6efe0', densitate: 0.6 }] }),
  fundal: (ctx) => DEALURI_JOASE.map((s, i) => stratOrizont(ctx, { ...s, cheie: `orizont-${i}`, seed: 800 + i })),
  construieste(ctx) {
    const { r, z0, sol, tinta } = ctx;
    const tCasa = ctx.tex('casuta', () => casuta(5));
    ctx.adauga({ tex: tCasa, x: tinta.x - 7, y: sol(z0 + 18) - 0.2, z: z0 + 18, w: 6, h: 6, emisie: 0.25 });
    const texStupi = CULORI_STUPI.map((c, i) => ctx.tex(`stup-${i}`, () => stup(140 + i, c)));
    for (let i = 0; i < 5; i++) {
      const z = z0 + 10 + r.range(-0.5, 0.5);
      ctx.adauga({ tex: texStupi[i], x: tinta.x - 2 + i * 1.9, y: sol(z) - 0.06, z, w: 1.35, h: 1.35 });
    }
    const tTei = ctx.tex('tei', () => pom({ seed: 31, w: 1024, h: 1024, paleta: PALETE.tei, latime: 1.1 }));
    ctx.adauga({ tex: tTei, x: tinta.x + 9, y: sol(z0 + 26) - 0.3, z: z0 + 26, w: 14, h: 14, leganare: 0.08 });
    for (const d of [
      { dz: 110, x: -60, w: 900, banda: 80 },
      { dz: 190, x: 80, w: 1000, banda: 110 },
    ]) {
      const z = z0 + d.dz;
      const t = ctx.tex(`deal-${d.dz}`, () => deal({ seed: 90 + d.dz, sol: '#d6d6c4', spalare: '#7d8a92', creasta: 0.3, amplitudine: 0.3, frecventa: 4 }));
      ctx.adauga({ tex: t, x: d.x, y: sol(z) + d.banda * 0.6 - 300, z, w: d.w, h: 300, banda: d.banda });
    }
    const texPomi = [0, 1].map((i) => ctx.tex(`pom-${i}`, () => pom({ seed: 330 + i, paleta: PALETE.tei })));
    for (let i = 0; i < 24; i++) {
      const z = z0 + r.range(-100, 200);
      const x = tinta.x + r.range(-60, 60);
      if (!ctx.liber(x, z, 4, 8) || (Math.abs(z - z0) < 30 && Math.abs(x - tinta.x) < 12)) continue;
      const m = r.range(0.8, 1.3);
      ctx.adauga({ tex: r.pick(texPomi), x, y: sol(z) - 0.2, z, w: 8 * m, h: 8 * m, leganare: 0.08, faza: r.range(0, 6) });
    }
  },
};
