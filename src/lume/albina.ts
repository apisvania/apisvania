// The bee: drawn entirely with canvas paths, animated every frame.
// It follows a target point on screen with a soft spring, wobbles like a real
// insect, hesitates now and then, hovers when the journey pauses and lands
// on flowers in the close-up scenes.

import { clamp, lerp, noise1, damp, rng } from './util';

const r = rng(42);

export interface TintaAlbina {
  x: number;
  y: number;
  /** Body length in CSS pixels. */
  marime: number;
  /** 0 = flying, 1 = should be sitting on the flower. */
  asezare: number;
  /** 0..1: how still the journey is (1 = paused). */
  liniste: number;
  miscareRedusa: boolean;
}

export class Albina {
  x = -100;
  y = -100;
  private vx = 0;
  private vy = 0;
  private marime = 60;
  private orientare = 1;
  private orientareTinta = 1;
  private aripa = 0;
  private timp = 0;
  private pliere = 0;
  private ezitare = { x: 0, y: 0, pana: 0 };
  private ezitareCurenta = { x: 0, y: 0 };
  private inclinare = 0;
  polen = 0;
  private initializata = false;

  actualizeaza(dt: number, t: TintaAlbina) {
    this.timp += dt;
    if (!this.initializata) {
      this.x = t.x;
      this.y = t.y;
      this.marime = t.marime;
      this.initializata = true;
    }
    this.marime = lerp(this.marime, t.marime, damp(4, dt));
    const S = this.marime;
    const asezata = t.asezare > 0.5;

    // Organic wobble and occasional darting while hovering.
    const amp = (1 - t.asezare) * S * (t.miscareRedusa ? 0.05 : 0.18);
    const tt = this.timp;
    let ox = noise1(tt * 0.9, 1) * amp + Math.sin(tt * 1.7) * amp * 0.4;
    let oy = noise1(tt * 1.1, 2) * amp * 0.8 + Math.sin(tt * 2.3 + 1) * amp * 0.35;
    if (!t.miscareRedusa && !asezata && t.liniste > 0.5) {
      if (tt > this.ezitare.pana) {
        const salt = r.chance(0.35);
        this.ezitare = {
          x: salt ? r.range(-0.6, 0.6) * S : 0,
          y: salt ? r.range(-0.4, 0.3) * S : 0,
          pana: tt + r.range(1.2, 3.4),
        };
      }
    } else this.ezitare = { x: 0, y: 0, pana: tt + 1 };
    this.ezitareCurenta.x = lerp(this.ezitareCurenta.x, this.ezitare.x, damp(5, dt));
    this.ezitareCurenta.y = lerp(this.ezitareCurenta.y, this.ezitare.y, damp(5, dt));
    ox += this.ezitareCurenta.x;
    oy += this.ezitareCurenta.y;

    // Landing: sit a little above the target point (the flower's centre).
    const tx = t.x + ox;
    const ty = t.y + oy - S * 0.28 * t.asezare;

    // Critically damped spring towards the target.
    const k = asezata ? 90 : 46;
    const c = 2 * Math.sqrt(k) * 0.92;
    const ax = (tx - this.x) * k - this.vx * c;
    const ay = (ty - this.y) * k - this.vy * c;
    this.vx += ax * dt;
    this.vy += ay * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Face the direction of travel; keep facing when hovering.
    if (Math.abs(this.vx) > S * 1.6) this.orientareTinta = Math.sign(this.vx);
    this.orientare = lerp(this.orientare, this.orientareTinta, damp(7, dt));
    const tinta = clamp(this.vy / (S * 14), -0.35, 0.35) * this.orientareTinta - clamp(this.vx / (S * 30), -0.25, 0.25) * 0.4;
    this.inclinare = lerp(this.inclinare, tinta * (1 - t.asezare) + 0.06 * t.asezare * this.orientareTinta, damp(6, dt));

    this.pliere = lerp(this.pliere, asezata ? 1 : 0, damp(asezata ? 3 : 12, dt));
    this.aripa += dt * Math.PI * 2 * (t.miscareRedusa ? 3 : 11) * (1 - this.pliere * 0.95);
  }

  /** Speed in body lengths per second (used for the pollen trail). */
  viteza() {
    return Math.hypot(this.vx, this.vy) / Math.max(1, this.marime);
  }

  deseneaza(g: CanvasRenderingContext2D) {
    const S = this.marime;
    g.save();
    g.translate(this.x, this.y);
    g.rotate(this.inclinare);
    const fx = Math.sign(this.orientare || 1) * Math.max(0.25, Math.abs(this.orientare));
    g.scale(S * fx, S);
    const lw = 1 / S;
    g.lineJoin = 'round';
    g.lineCap = 'round';

    // A simple drawing: one round body, two stripes, a head, two wings.
    const cerneala = '#3d352e';
    const contur = lw * 2.2;
    this.aripa2(g, true, contur);

    // Legs: three short strokes, tucked when sitting.
    g.strokeStyle = cerneala;
    g.lineWidth = contur * 0.8;
    const p = this.pliere;
    for (const bx of [-0.12, 0.02, 0.14]) {
      g.beginPath();
      g.moveTo(bx, 0.2);
      g.lineTo(bx - 0.04 + p * 0.02, lerp(0.34, 0.3, p));
      g.stroke();
    }
    if (this.polen > 0.02) {
      g.fillStyle = '#e7bf55';
      g.beginPath();
      g.arc(-0.15, 0.33, 0.03 + this.polen * 0.04, 0, Math.PI * 2);
      g.fill();
    }

    const corp = new Path2D();
    corp.ellipse(-0.1, 0.04, 0.4, 0.25, 0.08, 0, Math.PI * 2);
    g.fillStyle = '#ecb94f';
    g.fill(corp);
    g.save();
    g.clip(corp);
    g.fillStyle = cerneala;
    for (const x of [-0.08, -0.3]) {
      g.beginPath();
      g.ellipse(x, 0.04, 0.055, 0.32, 0.08, 0, Math.PI * 2);
      g.fill();
    }
    // A touch of light on top.
    g.fillStyle = 'rgba(255,250,235,0.55)';
    g.beginPath();
    g.ellipse(0.02, -0.1, 0.16, 0.05, -0.1, 0, Math.PI * 2);
    g.fill();
    g.restore();
    g.strokeStyle = cerneala;
    g.lineWidth = contur;
    g.stroke(corp);
    // Sting.
    g.beginPath();
    g.moveTo(-0.5, 0.05);
    g.lineTo(-0.57, 0.07);
    g.stroke();

    // Head and antennae.
    const vib = Math.sin(this.timp * 3) * 0.03;
    g.lineWidth = contur * 0.85;
    for (const [dx, dy] of [
      [0, 0],
      [-0.05, 0.02],
    ]) {
      g.beginPath();
      g.moveTo(0.36 + dx, -0.08 + dy);
      g.quadraticCurveTo(0.44 + dx, -0.26 + dy, 0.52 + dx, -0.24 + dy + vib);
      g.stroke();
      g.beginPath();
      g.arc(0.52 + dx, -0.24 + dy + vib, 0.022, 0, Math.PI * 2);
      g.fillStyle = cerneala;
      g.fill();
    }
    g.fillStyle = cerneala;
    g.beginPath();
    g.arc(0.34, 0.03, 0.13, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fbf8f2';
    g.beginPath();
    g.arc(0.38, -0.01, 0.028, 0, Math.PI * 2);
    g.fill();

    this.aripa2(g, false, contur);
    g.restore();
  }

  /** One pair of wings: pale fill, ink outline, a gentle flap. */
  private aripa2(g: CanvasRenderingContext2D, departe: boolean, contur: number) {
    const p = this.pliere;
    const bataie = Math.sin(this.aripa) * 0.55 * (1 - p);
    const unghi = lerp(-2.25, -2.9, p) + bataie + (departe ? 0.35 : 0);
    g.save();
    g.translate(departe ? 0.02 : -0.04, -0.16);
    g.rotate(unghi);
    const L = departe ? 0.38 : 0.46;
    const forma = new Path2D();
    forma.ellipse(L * 0.5, 0, L * 0.5, L * 0.24, 0, 0, Math.PI * 2);
    g.fillStyle = departe ? 'rgba(225,232,238,0.55)' : 'rgba(250,252,255,0.78)';
    g.fill(forma);
    g.strokeStyle = '#3d352e';
    g.globalAlpha = departe ? 0.5 : 0.85;
    g.lineWidth = contur * 0.8;
    g.stroke(forma);
    if (!departe) {
      g.globalAlpha = 0.35;
      g.beginPath();
      g.moveTo(L * 0.1, 0);
      g.quadraticCurveTo(L * 0.5, -L * 0.06, L * 0.85, 0);
      g.stroke();
    }
    g.restore();
  }
}
