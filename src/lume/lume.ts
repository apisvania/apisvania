// The world: a closed loop of scenes laid out along the z axis. It builds the
// cards of every scene, the terrain, the camera path through all scenes, and
// answers "what does the camera see at journey progress p?".

import type { Carte, CarteVizibila, Camera, Mediu, Textura, Randare } from './randare';
import { clamp, lerp, mod, rng, smoothstep, smootherstep, fbm1, mixRGB, type Rng, type RGB } from './util';

export interface ContextScena {
  r: Rng;
  /** World z of this scene's landing target. */
  z0: number;
  /** Ground elevation at any z. */
  sol: (z: number) => number;
  /** Camera path position at z (useful to keep the flight corridor clear). */
  drum: (z: number) => { x: number; y: number };
  /** Registers a lazily painted texture owned by this scene. */
  tex: (cheie: string, pictura: () => HTMLCanvasElement, repetare?: boolean) => () => Textura | null;
  adauga: (c: Carte) => void;
  /** True if an object at (x, z) with this radius and height does not block the flight path. */
  liber: (x: number, z: number, raza: number, inaltime: number) => boolean;
  tinta: { x: number; y: number; z: number };
}

export interface Incadrare {
  /** Where the landing target sits on screen at rest (fractions of width/height). */
  lat: [number, number];
  port: [number, number];
}

export interface ParticuleScena {
  petale?: { culori: string[]; densitate: number };
  polen?: number;
  licurici?: number;
}

export interface DefinitieScena {
  id: string;
  /** Distance (m) from this scene's target to the next scene's target. */
  lungime: number;
  /** Ground elevation at the scene (m). */
  sol: number;
  /** Landing target: lateral x and height above ground. */
  tinta: { x: number; inaltime: number };
  /** Whether the bee lands (on a flower) or just hovers. */
  aterizare: boolean;
  incadrare: Incadrare;
  mediu: Mediu;
  /** Depth-of-field strength at rest (0 = everything sharp). */
  claritate?: number;
  /** Ground strip textures used around this scene. */
  fasii: (ctx: ContextScena) => (() => Textura | null)[];
  /** Horizon layers (fixed distance from the camera), cross-faded between scenes. */
  fundal: (ctx: ContextScena) => Carte[];
  construieste: (ctx: ContextScena) => void;
  particule?: ParticuleScena;
  /** Height of the cruise flight above the ground after leaving this scene. */
  zbor?: number;
}

interface IntrareTex {
  cheie: string;
  scena: number;
  pictura: () => HTMLCanvasElement;
  repetare: boolean;
  t: Textura | null;
}

/** Distance from the camera to the bee / landing target at rest. */
export const DIST_ALBINA = 1.6;

type V3 = { x: number; y: number; z: number };

function catmull(p0: V3, p1: V3, p2: V3, p3: V3, t: number): V3 {
  // Centripetal Catmull–Rom (no overshoot loops, no cusps).
  const tj = (a: V3, b: V3) => Math.pow(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z), 0.5) || 1e-4;
  const t0 = 0;
  const t1 = t0 + tj(p0, p1);
  const t2 = t1 + tj(p1, p2);
  const t3 = t2 + tj(p2, p3);
  const u = lerp(t1, t2, t);
  const L = (a: V3, b: V3, ta: number, tb: number): V3 => {
    const k = (u - ta) / (tb - ta);
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) };
  };
  const A1 = L(p0, p1, t0, t1);
  const A2 = L(p1, p2, t1, t2);
  const A3 = L(p2, p3, t2, t3);
  const B1 = L(A1, A2, t0, t2);
  const B2 = L(A2, A3, t1, t3);
  return L(B1, B2, t1, t2);
}

export class Lume {
  readonly scene: DefinitieScena[];
  readonly N: number;
  readonly L: number;
  readonly z0: number[] = [];
  readonly tinte: V3[] = [];
  private carti: Carte[] = [];
  private fundaluri: Carte[][] = [];
  private texturi = new Map<string, IntrareTex>();
  private coada: IntrareTex[] = [];
  /** Per scene: sampled path points and cumulative arc length. */
  private drumuri: { p: V3[]; s: number[] }[] = [];
  private vizibile: CarteVizibila[] = [];
  /** Any ready ground strip, drawn in place of strips whose texture is still being painted. */
  private fasieRezerva: Textura | null = null;

  constructor(scene: DefinitieScena[], private randare: Randare | null) {
    this.scene = scene;
    this.N = scene.length;
    let z = 0;
    for (const s of scene) {
      this.z0.push(z);
      z += s.lungime;
    }
    this.L = z;
    this.tinte = scene.map((s, i) => ({ x: s.tinta.x, y: this.sol(this.z0[i]) + s.tinta.inaltime, z: this.z0[i] }));
    this.construiesteDrum();
    this.construiesteScene();
  }

  // ── Terrain ──────────────────────────────────────────────────────────
  sol = (zLume: number): number => {
    const z = mod(zLume, this.L);
    let i = this.N - 1;
    for (let k = 0; k < this.N; k++) if (this.z0[k] <= z) i = k;
    const j = (i + 1) % this.N;
    const zA = this.z0[i];
    const zB = i === this.N - 1 ? this.L : this.z0[j];
    const t = (z - zA) / (zB - zA);
    const a = this.scene[i].sol;
    const b = this.scene[j].sol;
    const baza = lerp(a, b, smootherstep(t));
    // Rolling hills between scenes, flat-ish near each landing target.
    const deal = Math.sin(Math.PI * t) ** 2 * 6 * fbm1(z / 60, 3, 7, this.L / 60);
    return baza + deal + 1.2 * fbm1(z / 23, 2, 3, this.L / 23);
  };

  // ── Camera path ─────────────────────────────────────────────────────
  private puncteDrum(): V3[] {
    const r = rng(1234);
    const pts: V3[] = [];
    for (let i = 0; i < this.N; i++) {
      const s = this.scene[i];
      const T = this.tinte[i];
      const Tn = { ...this.tinte[(i + 1) % this.N] };
      Tn.z = this.z0[i] + s.lungime;
      const R = { x: T.x, y: T.y, z: T.z - DIST_ALBINA };
      const Rn = { x: Tn.x, y: Tn.y, z: Tn.z - DIST_ALBINA };
      let maxSol = -Infinity;
      for (let k = 0; k <= 20; k++) maxSol = Math.max(maxSol, this.sol(lerp(T.z, Tn.z, k / 20)));
      const zbor = s.zbor ?? 13;
      pts.push(R);
      pts.push({ x: T.x + r.range(-2, 2), y: Math.max(R.y + 4, this.sol(T.z + s.lungime * 0.16) + zbor * 0.6), z: T.z + s.lungime * 0.16 });
      pts.push({ x: lerp(T.x, Tn.x, 0.5) + r.range(-6, 6), y: maxSol + zbor, z: T.z + s.lungime * 0.5 });
      pts.push({ x: Tn.x + r.range(-1.5, 1.5), y: Math.max(Rn.y + 3.2, this.sol(Tn.z - s.lungime * 0.15) + 4), z: Tn.z - s.lungime * 0.15 });
      void Rn;
    }
    return pts;
  }

  private construiesteDrum() {
    const pts = this.puncteDrum();
    const n = pts.length;
    const P = (k: number): V3 => {
      const w = Math.floor(k / n);
      const p = pts[mod(k, n)];
      return { x: p.x, y: p.y, z: p.z + w * this.L };
    };
    const ESANT = 48;
    for (let i = 0; i < this.N; i++) {
      const p: V3[] = [];
      const s: number[] = [];
      let lung = 0;
      for (let span = 0; span < 4; span++) {
        const k = i * 4 + span;
        for (let e = span === 0 ? 0 : 1; e <= ESANT; e++) {
          const q = catmull(P(k - 1), P(k), P(k + 1), P(k + 2), e / ESANT);
          if (p.length) {
            const a = p[p.length - 1];
            lung += Math.hypot(q.x - a.x, q.y - a.y, q.z - a.z);
          }
          p.push(q);
          s.push(lung);
        }
      }
      this.drumuri.push({ p, s });
    }
  }

  /** Path position for a given scene index and distance along it (0..1 of arc length). */
  private punctPeDrum(i: number, g: number): V3 {
    const d = this.drumuri[i];
    const tinta = g * d.s[d.s.length - 1];
    let lo = 0;
    let hi = d.s.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (d.s[m] < tinta) lo = m;
      else hi = m;
    }
    const k = (tinta - d.s[lo]) / Math.max(1e-6, d.s[hi] - d.s[lo]);
    const a = d.p[lo];
    const b = d.p[hi];
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) };
  }

  /** Path x/y at a world z (approximate; used to keep the corridor clear). */
  drum = (zLume: number) => {
    const z = mod(zLume, this.L);
    for (const d of this.drumuri) {
      for (let k = 1; k < d.p.length; k++) {
        const a = d.p[k - 1];
        const b = d.p[k];
        const za = mod(a.z, this.L);
        const zb = za + (b.z - a.z);
        if (z >= za && z <= zb) {
          const t = (z - za) / Math.max(1e-6, zb - za);
          return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
        }
      }
    }
    return { x: 0, y: this.sol(z) + 10 };
  };

  // ── Scenes and textures ─────────────────────────────────────────────
  private construiesteScene() {
    for (let i = 0; i < this.N; i++) {
      const s = this.scene[i];
      const ctx = this.context(i);
      s.construieste(ctx);
      this.fundaluri.push(s.fundal(this.context(i)));
    }
    this.construiesteTeren();
  }

  private context(i: number): ContextScena {
    const s = this.scene[i];
    return {
      r: rng(1000 + i * 7919),
      z0: this.z0[i],
      sol: this.sol,
      drum: this.drum,
      tinta: this.tinte[i],
      tex: (cheie, pictura, repetare = false) => {
        const id = `${s.id}/${cheie}`;
        let e = this.texturi.get(id);
        if (!e) {
          e = { cheie: id, scena: i, pictura, repetare, t: null };
          this.texturi.set(id, e);
        }
        const ref = e;
        return () => ref.t;
      },
      adauga: (c) => this.carti.push(c),
      liber: (x, z, raza, inaltime) => {
        const p = this.drum(z);
        if (Math.abs(x - p.x) > raza + 2.2) return true;
        return this.sol(z) + inaltime < p.y - 1.8;
      },
    };
  }

  /** Meadow strips covering the ground along the whole loop. */
  private construiesteTeren() {
    const r = rng(77);
    const fasiiScena = this.scene.map((s, i) => s.fasii(this.context(i)));
    for (let z = 0; z < this.L; z += r.range(3.5, 6.5)) {
      // Which scene's biome? Blend randomly near the midpoint between scenes.
      let i = this.N - 1;
      for (let k = 0; k < this.N; k++) if (this.z0[k] <= z) i = k;
      const j = (i + 1) % this.N;
      const zB = i === this.N - 1 ? this.L : this.z0[j];
      const t = (z - this.z0[i]) / (zB - this.z0[i]);
      const scena = r.next() < smoothstep(0.35, 0.75, t) ? j : i;
      const variante = fasiiScena[scena];
      const zz = z + r.range(-1.2, 1.2);
      const sol = this.sol(zz);
      const banda = 2.4;
      const sus = sol + banda * 0.42;
      const p = this.drum(zz);
      const v = r.range(-0.012, 0.012);
      this.carti.push({
        tex: variante[Math.floor(r.next() * variante.length)],
        x: p.x + r.range(-8, 8),
        y: sus - 80,
        z: zz,
        w: 420,
        h: 80,
        banda,
        repetari: 420 / 9,
        u0: r.next(),
        oglinda: r.chance(0.5),
        ceata: 1,
        nuanta: [1 + v, 1 + v, 1 + v],
      });
    }
  }

  /** Paints textures of scenes near `scena` within a time budget (ms). */
  pregateste(scena: number, bugetMs: number, raza = 1) {
    if (!this.randare) return 0;
    const t0 = performance.now();
    if (!this.coada.length) {
      const dorite = new Set<number>();
      for (let k = -raza; k <= raza; k++) dorite.add(mod(scena + k, this.N));
      for (const e of this.texturi.values()) if (!e.t && dorite.has(e.scena)) this.coada.push(e);
      // Nearest scene first; within a scene, ground strips first (missing ground is the most visible gap).
      this.coada.sort(
        (a, b) =>
          distCirc(a.scena, scena, this.N) - distCirc(b.scena, scena, this.N) || Number(b.repetare) - Number(a.repetare),
      );
    }
    let n = 0;
    while (this.coada.length && (n === 0 || performance.now() - t0 < bugetMs)) {
      const e = this.coada.shift()!;
      if (e.t) continue;
      const pz = e.pictura();
      e.t = this.randare.incarcaTextura(pz, e.repetare);
      pz.width = pz.height = 0;
      if (e.repetare && e.cheie.includes('/fasie-') && !this.fasieRezerva) this.fasieRezerva = e.t;
      n++;
    }
    // Free textures of scenes far away (only matters for long loops).
    if (this.N > 5) {
      for (const e of this.texturi.values()) {
        if (e.t && distCirc(e.scena, scena, this.N) > 2) {
          this.randare.stergeTextura(e.t);
          e.t = null;
        }
      }
    }
    return this.coada.length;
  }

  /** True when every texture of the given scene is ready. */
  gata(scena: number) {
    for (const e of this.texturi.values()) if (e.scena === scena && !e.t) return false;
    return true;
  }

  /** Forget all GPU textures (after a lost WebGL context). */
  uitaTexturi() {
    for (const e of this.texturi.values()) e.t = null;
    this.fasieRezerva = null;
    this.coada = [];
  }

  // ── Journey state at progress p ─────────────────────────────────────
  stare(p: number) {
    const u = mod(p, this.N);
    const i = Math.floor(u);
    const f = u - i;
    const j = (i + 1) % this.N;
    // Ease: linger near each scene, fly faster in between.
    const g = f - (0.9 * Math.sin(2 * Math.PI * f)) / (2 * Math.PI);
    const poz = this.punctPeDrum(i, g);
    const dd = Math.min(f, 1 - f);
    const detaliu = 1 - smoothstep(0.03, 0.17, dd);
    const scenaApropiata = f < 0.5 ? i : j;
    const mediu = amestecMediu(this.scene[i].mediu, this.scene[j].mediu, smoothstep(0.12, 0.88, f));
    return { i, j, f, poz, detaliu, scenaApropiata, mediu };
  }

  /** Cards visible from the camera, sorted far to near, with fade and fog values. */
  vizibileDin(cam: Camera, W: number, H: number, p: number): CarteVizibila[] {
    const out = this.vizibile;
    out.length = 0;
    const departe = Math.min(1600, this.L * 0.8);
    const add = (c: Carte, d: number, x: number, alfa: number) => {
      const t = c.tex();
      if (!t || alfa <= 0.003) return;
      // Fade out cards when the camera is so close their texture would look soft.
      let a = alfa;
      if (c.aproape) a *= smoothstep(c.aproape[0], c.aproape[1], d);
      else {
        const pxPeM = t.w / (c.w / (c.repetari ?? 1));
        const d1 = cam.f / (pxPeM * 2.4);
        a *= smoothstep(d1 * 0.6, d1, d);
      }
      a *= 1 - smoothstep(c.departe ?? departe * 0.82, c.departe ? c.departe * 1.2 : departe, d);
      if (a <= 0.003) return;
      // Screen-space culling.
      const k = cam.f / d;
      const sx = (x - cam.x) * k;
      const half = c.w * 0.5 * k + (c.leganare ?? 0) * k;
      if (sx + half < -W * 0.6 - Math.abs(cam.sx) || sx - half > W * 0.6 + Math.abs(cam.sx)) return;
      const yJos = H / 2 + cam.sy - (c.y - cam.y) * k;
      const ySus = H / 2 + cam.sy - (c.y + c.h - cam.y) * k;
      if (ySus > H * 1.15 || yJos < -H * 0.15) return;
      const v = c as CarteVizibila;
      v._d = d;
      v._a = a * (c.opacitate ?? 1);
      v._x = x;
      v._y = c.y;
      v._h = c.h;
      if (c.banda && (c.repetari ?? 1) > 1) {
        // Ground strips only need to reach down to where nearer strips take over.
        const sus = c.y + c.h;
        const peste = Math.max(0, cam.y - sus);
        const adanc = Math.min(c.h - c.banda, (peste * 7) / Math.max(d - 7, 0.5) * 1.6 + 4);
        v._h = c.banda + adanc;
        v._y = sus - v._h;
      }
      out.push(v);
    };
    for (const c of this.carti) {
      const d = mod(c.z - cam.z, this.L);
      if (d < 0.08 || d > departe) continue;
      if (c.banda && (c.repetari ?? 1) > 1 && !c.tex() && this.fasieRezerva) {
        const rezerva = this.fasieRezerva;
        const inlocuitor = Object.create(c) as Carte;
        inlocuitor.tex = () => rezerva;
        add(inlocuitor, d, c.x, 1);
        continue;
      }
      add(c, d, c.x, 1);
    }
    // Horizon layers of the two scenes around p, cross-faded.
    const u = mod(p, this.N);
    const i = Math.floor(u);
    const f = u - i;
    const amestec = smoothstep(0.3, 0.7, f);
    const strat = (lista: Carte[], alfa: number) => {
      for (const c of lista) add(c, c.fundal ?? 2000, cam.x * (1 - (c.paralaxa ?? 0)) + c.x, alfa);
    };
    strat(this.fundaluri[i], 1 - amestec);
    strat(this.fundaluri[(i + 1) % this.N], amestec);
    out.sort((a, b) => b._d - a._d);
    return out;
  }
}

function distCirc(a: number, b: number, n: number) {
  const d = Math.abs(a - b) % n;
  return Math.min(d, n - d);
}

export function amestecMediu(a: Mediu, b: Mediu, t: number): Mediu {
  const m = (x: RGB, y: RGB) => mixRGB(x, y, t);
  return {
    cerSus: m(a.cerSus, b.cerSus),
    cerMijloc: m(a.cerMijloc, b.cerMijloc),
    cerOrizont: m(a.cerOrizont, b.cerOrizont),
    soareCuloare: m(a.soareCuloare, b.soareCuloare),
    soareAz: lerp(a.soareAz, b.soareAz, t),
    soareEl: lerp(a.soareEl, b.soareEl, t),
    soareMarime: lerp(a.soareMarime, b.soareMarime, t),
    lumina: m(a.lumina, b.lumina),
    ceataCuloare: m(a.ceataCuloare, b.ceataCuloare),
    ceataDensitate: lerp(a.ceataDensitate, b.ceataDensitate, t),
    stele: lerp(a.stele, b.stele, t),
    nori: lerp(a.nori, b.nori, t),
    noriCuloare: m(a.noriCuloare, b.noriCuloare),
  };
}

export { clamp };
