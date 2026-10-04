// Small living details drawn over the world: falling petals, golden motes in
// the light, and the pollen trail behind the bee.

import type { Camera } from './randare';
import { rng, clamp, lerp, mod } from './util';

interface Petala {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  culoare: number;
  varsta: number;
  marime: number;
}

interface Scanteie {
  x: number;
  y: number;
  vx: number;
  vy: number;
  viata: number;
  max: number;
  m: number;
}

const r = rng(9);

export interface Proiectie {
  (x: number, y: number, z: number): { x: number; y: number; k: number; d: number } | null;
}

export class Particule {
  private petale: Petala[] = [];
  private fire: Petala[] = [];
  private urma: Scanteie[] = [];
  culoriPetale: string[] = ['#ffffff'];

  constructor(private maxPetale = 140, private maxFire = 50) {}

  setCalitate(nivel: number) {
    this.maxPetale = Math.round(140 * nivel);
    this.maxFire = Math.round(50 * nivel);
  }

  private plaseaza(p: Petala, cam: Camera, prima: boolean) {
    const d = prima ? r.range(0.8, 26) : r.range(6, 26);
    p.z = cam.z + d;
    p.x = cam.x + r.range(-1, 1) * d * 0.9;
    p.y = cam.y + r.range(-0.6, prima ? 0.9 : 1.1) * d * 0.55 + (prima ? 0 : 1.5);
    p.vx = r.range(0.15, 0.55);
    p.vy = -r.range(0.25, 0.55);
    p.rot = r.range(0, 6.28);
    p.vr = r.range(-3, 3);
    p.culoare = r.int(0, 7);
    p.varsta = 0;
    p.marime = r.range(0.7, 1.3);
  }

  actualizeaza(dt: number, cam: Camera, densPetale: number, densFire: number, timp: number, L: number) {
    const tinta = Math.round(this.maxPetale * clamp(densPetale));
    while (this.petale.length < tinta) {
      const p = {} as Petala;
      this.plaseaza(p, cam, true);
      this.petale.push(p);
    }
    if (this.petale.length > tinta) this.petale.length = tinta;
    const tintaF = Math.round(this.maxFire * clamp(densFire));
    while (this.fire.length < tintaF) {
      const p = {} as Petala;
      this.plaseaza(p, cam, true);
      p.vy = r.range(-0.05, 0.05);
      this.fire.push(p);
    }
    if (this.fire.length > tintaF) this.fire.length = tintaF;

    const vant = Math.sin(timp * 0.4) * 0.35 + 0.25;
    for (const p of this.petale) {
      p.varsta += dt;
      p.x += (p.vx + vant + Math.sin(timp * 1.3 + p.rot) * 0.3) * dt;
      p.y += (p.vy + Math.sin(timp * 2 + p.culoare) * 0.15) * dt;
      p.rot += p.vr * dt;
      const d = mod(p.z - cam.z, L);
      if (d < 0.25 || d > 30 || Math.abs(p.x - cam.x) > d * 1.3 + 1 || p.y < cam.y - d * 0.9 - 2) this.plaseaza(p, cam, false);
    }
    for (const p of this.fire) {
      p.varsta += dt;
      p.x += Math.sin(timp * 0.5 + p.rot * 3) * 0.08 * dt;
      p.y += Math.sin(timp * 0.7 + p.rot * 2) * 0.06 * dt;
      const d = mod(p.z - cam.z, L);
      if (d < 0.3 || d > 30 || Math.abs(p.x - cam.x) > d * 1.3 + 1 || Math.abs(p.y - cam.y) > d) this.plaseaza(p, cam, false);
    }
    for (let i = this.urma.length - 1; i >= 0; i--) {
      const s = this.urma[i];
      s.viata += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 20 * dt;
      if (s.viata > s.max) this.urma.splice(i, 1);
    }
  }

  emite(x: number, y: number, marime: number, n: number) {
    for (let i = 0; i < n && this.urma.length < 120; i++) {
      this.urma.push({
        x: x + r.range(-0.3, 0.3) * marime,
        y: y + r.range(0, 0.3) * marime,
        vx: r.range(-20, 20),
        vy: r.range(-10, 15),
        viata: 0,
        max: r.range(0.5, 1.1),
        m: r.range(0.6, 1.6) * Math.max(1, marime / 60),
      });
    }
  }

  /** Draws petals and motes. `inFata` selects those nearer than `dLimita`. */
  deseneaza(g: CanvasRenderingContext2D, proiect: Proiectie, dLimita: number, inFata: boolean, culoareLumina: string) {
    for (const p of this.petale) {
      const s = proiect(p.x, p.y, p.z);
      if (!s || s.d < 0.25 || (s.d < dLimita) !== inFata) continue;
      const m = 0.02 * s.k * p.marime;
      if (m < 0.5) continue;
      const fade = clamp(p.varsta * 1.5) * clamp((30 - s.d) / 6);
      const aproape = s.d < 1.2;
      g.globalAlpha = fade * (aproape ? 0.45 : 0.92);
      g.fillStyle = this.culoriPetale[p.culoare % this.culoriPetale.length];
      g.beginPath();
      g.ellipse(s.x, s.y, m * (aproape ? 1.6 : 1), Math.max(0.3, m * 0.6 * Math.abs(Math.cos(p.rot))) * (aproape ? 1.6 : 1), p.rot * 0.5, 0, Math.PI * 2);
      g.fill();
    }
    if (!inFata) {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = culoareLumina;
      for (const p of this.fire) {
        const s = proiect(p.x, p.y, p.z);
        if (!s || s.d < 0.3) continue;
        const m = Math.max(0.6, 0.012 * s.k);
        const lic = 0.5 + 0.5 * Math.sin(p.varsta * 2 + p.rot * 5);
        g.globalAlpha = clamp(p.varsta) * lic * clamp((30 - s.d) / 8) * 0.8;
        g.beginPath();
        g.arc(s.x, s.y, m, 0, Math.PI * 2);
        g.fill();
      }
      g.globalCompositeOperation = 'source-over';
    }
    g.globalAlpha = 1;
  }

  deseneazaUrma(g: CanvasRenderingContext2D) {
    g.fillStyle = '#ffd36a';
    for (const s of this.urma) {
      g.globalAlpha = (1 - s.viata / s.max) * 0.85;
      g.beginPath();
      g.arc(s.x, s.y, s.m * lerp(1, 0.4, s.viata / s.max), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }
}
