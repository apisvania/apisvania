// The bee: drawn entirely with canvas paths, animated every frame.
// It follows a target point on screen with a soft spring, wobbles like a real
// insect, hesitates now and then, hovers when the journey pauses and lands
// on flowers in the close-up scenes.

import { clamp, lerp, noise1, damp, rng } from './util';

const r = rng(42);
// Fixed fuzz hairs so they don't flicker.
const PUF_TORACE = Array.from({ length: 90 }, () => ({ a: r.range(0, Math.PI * 2), l: r.range(0.05, 0.1), c: r.next() }));
const PUF_CAP = Array.from({ length: 26 }, () => ({ a: r.range(-1.6, 1.4), l: r.range(0.03, 0.06), c: r.next() }));
const PUF_ABDOMEN = Array.from({ length: 80 }, () => ({ t: r.range(-1, 1), s: r.chance(0.5) ? 1 : -1, l: r.range(0.02, 0.04) }));

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
    this.aripa += dt * Math.PI * 2 * (t.miscareRedusa ? 9 : 37) * (1 - this.pliere * 0.95);
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
    const fx = Math.sign(this.orientare || 1) * Math.max(0.18, Math.abs(this.orientare));
    g.scale(S * fx, S);
    const lw = 1 / S;

    this.aripi(g, true, lw);
    this.picioare(g, true, lw);
    this.abdomen(g, lw);
    this.torace(g, lw);
    this.cap(g, lw);
    this.picioare(g, false, lw);
    this.aripi(g, false, lw);
    g.restore();
  }

  private abdomen(g: CanvasRenderingContext2D, lw: number) {
    const respiratie = 1 + Math.sin(this.timp * 5) * 0.015 * this.pliere;
    g.save();
    g.translate(-0.34, 0.07);
    g.rotate(0.3);
    g.scale(respiratie, 1);
    const forma = new Path2D();
    forma.ellipse(0, 0, 0.34, 0.215, 0, 0, Math.PI * 2);
    const gr = g.createLinearGradient(0, -0.22, 0, 0.22);
    gr.addColorStop(0, '#f0b444');
    gr.addColorStop(0.55, '#d18d2c');
    gr.addColorStop(1, '#8a5518');
    g.fillStyle = gr;
    g.fill(forma);
    g.save();
    g.clip(forma);
    // Dark bands.
    for (let k = 0; k < 4; k++) {
      const x = 0.12 - k * 0.12;
      g.fillStyle = 'rgba(38,25,15,0.94)';
      g.beginPath();
      g.ellipse(x - 0.03, 0, 0.042 + k * 0.004, 0.32, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(250,215,130,0.35)';
      g.beginPath();
      g.ellipse(x + 0.022, 0, 0.012, 0.3, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#24170e';
    g.beginPath();
    g.ellipse(-0.36, 0.01, 0.12, 0.2, 0, 0, Math.PI * 2);
    g.fill();
    // Volume: light from above, shadow below.
    const v = g.createRadialGradient(0.02, -0.14, 0.01, 0, 0, 0.42);
    v.addColorStop(0, 'rgba(255,245,215,0.45)');
    v.addColorStop(0.45, 'rgba(255,230,180,0.05)');
    v.addColorStop(1, 'rgba(40,20,5,0.45)');
    g.fillStyle = v;
    g.fillRect(-0.4, -0.3, 0.8, 0.6);
    g.restore();
    // Fine hairs along the outline.
    g.strokeStyle = 'rgba(245,215,150,0.55)';
    g.lineWidth = lw * 1;
    g.beginPath();
    for (const h of PUF_ABDOMEN) {
      const a = Math.acos(h.t) * h.s;
      const px = Math.cos(a) * 0.34;
      const py = Math.sin(a) * 0.215;
      g.moveTo(px, py);
      g.lineTo(px * (1 + h.l * 2.2), py * (1 + h.l * 3));
    }
    g.stroke();
    // Sting tip.
    g.fillStyle = '#1a110a';
    g.beginPath();
    g.moveTo(-0.33, -0.02);
    g.lineTo(-0.41, 0.01);
    g.lineTo(-0.33, 0.04);
    g.fill();
    g.restore();
  }

  private torace(g: CanvasRenderingContext2D, lw: number) {
    const gr = g.createRadialGradient(-0.03, -0.07, 0.02, 0, 0, 0.21);
    gr.addColorStop(0, '#d9a04c');
    gr.addColorStop(0.6, '#a86d2c');
    gr.addColorStop(1, '#5e3a18');
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(0, 0, 0.19, 0.18, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(55,35,18,0.55)';
    g.beginPath();
    g.ellipse(0.01, -0.05, 0.09, 0.075, 0, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = lw * 1.1;
    for (const h of PUF_TORACE) {
      const ca = Math.cos(h.a);
      const sa = Math.sin(h.a);
      g.strokeStyle = h.c > 0.5 ? 'rgba(240,205,130,0.7)' : 'rgba(200,150,80,0.6)';
      g.beginPath();
      g.moveTo(ca * 0.15, sa * 0.145);
      g.lineTo(ca * (0.19 + h.l), sa * (0.18 + h.l));
      g.stroke();
    }
  }

  private cap(g: CanvasRenderingContext2D, lw: number) {
    // Antennae (behind the head outline).
    const vib = Math.sin(this.timp * 3.1) * 0.05;
    g.strokeStyle = '#1d140e';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = lw * 1.8 + 0.012;
    for (const [dx, dy, unghi] of [
      [0.0, 0.0, 0],
      [-0.02, 0.01, 0.25],
    ] as const) {
      g.beginPath();
      g.moveTo(0.3 + dx, -0.07 + dy);
      g.lineTo(0.37 + dx, -0.22 + dy);
      g.quadraticCurveTo(0.46 + dx, -0.27 + dy + unghi * 0.2 + vib, 0.55 + dx, -0.2 + dy + unghi * 0.25 + vib);
      g.stroke();
    }
    const gr = g.createRadialGradient(0.27, -0.03, 0.01, 0.27, 0.03, 0.15);
    gr.addColorStop(0, '#4a3524');
    gr.addColorStop(1, '#1e150e');
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(0.27, 0.035, 0.115, 0.13, -0.15, 0, Math.PI * 2);
    g.fill();
    // Compound eye with a soft highlight.
    const och = g.createLinearGradient(0.25, -0.08, 0.31, 0.1);
    och.addColorStop(0, '#5a4636');
    och.addColorStop(1, '#0e0a07');
    g.fillStyle = och;
    g.beginPath();
    g.ellipse(0.275, 0.0, 0.058, 0.095, -0.22, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.beginPath();
    g.ellipse(0.286, -0.05, 0.016, 0.022, -0.3, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.beginPath();
    g.ellipse(0.262, 0.03, 0.01, 0.03, -0.2, 0, Math.PI * 2);
    g.fill();
    // Face fuzz.
    g.lineWidth = lw;
    g.strokeStyle = 'rgba(240,210,150,0.6)';
    g.beginPath();
    for (const h of PUF_CAP) {
      const ca = Math.cos(h.a);
      const sa = Math.sin(h.a);
      g.moveTo(0.27 + ca * 0.1, 0.035 + sa * 0.115);
      g.lineTo(0.27 + ca * (0.1 + h.l), 0.035 + sa * (0.115 + h.l));
    }
    g.stroke();
    // Mandible.
    g.fillStyle = '#2b1d12';
    g.beginPath();
    g.ellipse(0.33, 0.15, 0.025, 0.04, 0.4, 0, Math.PI * 2);
    g.fill();
  }

  private picioare(g: CanvasRenderingContext2D, departe: boolean, lw: number) {
    const p = this.pliere;
    const leg = (bx: number, kx: number, ky: number, fx: number, fy: number, cos = false) => {
      // Folded down onto the flower when sitting, dangling while flying.
      const kxs = lerp(kx, kx * 1.25, p);
      const kys = lerp(ky, 0.25, p);
      const fxs = lerp(fx, fx * 1.5, p);
      const fys = lerp(fy, 0.31, p);
      g.beginPath();
      g.moveTo(bx, 0.12);
      g.lineTo(bx + kxs, kys);
      g.lineTo(bx + fxs, fys);
      g.stroke();
      if (cos && this.polen > 0.02) {
        const m = 0.025 + this.polen * 0.045;
        const cx = bx + (kxs + fxs) * 0.5;
        const cy = (kys + fys) * 0.5;
        g.fillStyle = departe ? '#c98a22' : '#f2b232';
        g.beginPath();
        g.ellipse(cx, cy, m * 1.2, m, 0.6, 0, Math.PI * 2);
        g.fill();
        if (!departe) {
          g.fillStyle = 'rgba(255,240,180,0.7)';
          g.beginPath();
          g.ellipse(cx - m * 0.3, cy - m * 0.35, m * 0.4, m * 0.3, 0.6, 0, Math.PI * 2);
          g.fill();
        }
      }
    };
    const leg2 = Math.sin(this.timp * 2.2) * 0.012 * (1 - p);
    g.strokeStyle = departe ? 'rgba(25,17,11,0.75)' : '#2a1c12';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = lw * 1.4 + (departe ? 0.016 : 0.022);
    const o = departe ? 0.03 : 0;
    leg(0.08 + o, 0.06, 0.25 + leg2, 0.11, 0.37, false);
    leg(0.0 + o, -0.02, 0.27 - leg2, -0.05, 0.4, false);
    leg(-0.08 + o, -0.12, 0.25 + leg2, -0.28, 0.38, true);
  }

  private aripi(g: CanvasRenderingContext2D, departe: boolean, lw: number) {
    const p = this.pliere;
    const formaAripa = (L: number) => {
      const f = new Path2D();
      f.moveTo(0, 0);
      f.bezierCurveTo(0.2 * L, -0.15 * L, 0.78 * L, -0.17 * L, 0.98 * L, -0.04 * L);
      f.bezierCurveTo(1.04 * L, 0.04 * L, 0.84 * L, 0.11 * L, 0.5 * L, 0.1 * L);
      f.bezierCurveTo(0.25 * L, 0.09 * L, 0.08 * L, 0.05 * L, 0, 0);
      return f;
    };
    const nervuri = (L: number) => {
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(0.4 * L, -0.08 * L, 0.9 * L, -0.06 * L);
      g.moveTo(0.05 * L, 0.01 * L);
      g.quadraticCurveTo(0.4 * L, 0.02 * L, 0.66 * L, 0.06 * L);
      g.moveTo(0.38 * L, -0.07 * L);
      g.lineTo(0.5 * L, 0.04 * L);
      g.lineTo(0.66 * L, -0.07 * L);
      g.stroke();
    };
    const deseneaza = (unghi: number, latime: number, L: number, alfa: number, cuNervuri: boolean) => {
      g.save();
      g.rotate(unghi);
      g.scale(1, latime);
      const f = formaAripa(L);
      const gr = g.createLinearGradient(0, 0, L, 0);
      gr.addColorStop(0, `rgba(210,225,240,${0.42 * alfa})`);
      gr.addColorStop(0.6, `rgba(235,240,255,${0.26 * alfa})`);
      gr.addColorStop(1, `rgba(255,230,245,${0.2 * alfa})`);
      g.fillStyle = gr;
      g.fill(f);
      g.strokeStyle = `rgba(255,255,255,${0.55 * alfa})`;
      g.lineWidth = lw * 1;
      g.stroke(f);
      if (cuNervuri) {
        g.strokeStyle = `rgba(70,55,40,${0.35 * alfa})`;
        g.lineWidth = lw * 0.8;
        nervuri(L);
      }
      g.restore();
    };

    g.save();
    g.translate(departe ? -0.01 : -0.03, -0.14);
    const baza = Math.PI + 0.55;
    const amp = 0.62;
    const pliat = Math.PI + 0.13;
    const mult = departe ? 0.86 : 1;
    const a = departe ? 0.55 : 1;
    if (p < 0.98) {
      // Motion blur fan: a few faint ghosts across the stroke.
      for (let k = 0; k < 5; k++) {
        const ph = (k / 5) * Math.PI * 2;
        const ung = lerp(baza + Math.sin(ph) * amp, pliat, p);
        deseneaza(ung, 0.5 + 0.5 * Math.abs(Math.cos(ph)), 0.64 * mult, 0.22 * a * (1 - p), false);
      }
    }
    const ph = this.aripa + (departe ? 0.4 : 0);
    const ung = lerp(baza + Math.sin(ph) * amp, pliat, p);
    const lat = lerp(0.45 + 0.55 * Math.abs(Math.cos(ph)), 1, p);
    deseneaza(ung + 0.12, lat, 0.46 * mult, 0.8 * a, true);
    deseneaza(ung, lat, 0.66 * mult, (0.6 + 0.4 * p) * a, true);
    g.restore();
  }
}
