// Virtual, endless scrolling. The page itself never scrolls: wheel, touch,
// keyboard and menu clicks move a "progress" number (1.0 = one scene). The
// world reads it modulo the number of scenes, so the journey loops forever
// in both directions without any visible jump.

import { clamp, damp, mod } from './util';

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Derulare {
  /** Where the user wants to be. */
  tinta = 0;
  /** Smoothed progress actually shown. */
  p = 0;
  /** Seconds since the last user input. */
  inactiv = 10;
  private inertie = 0;
  private animatie: { de: number; la: number; t: number; durata: number } | null = null;
  private atingere: { y: number; x: number; t: number; v: number } | null = null;
  /** Reduced-motion mode: move scene by scene, with a gentle fade. */
  calm = false;
  private acumulat = 0;
  private blocatPana = 0;
  onSalt: ((tinta: number) => void) | null = null;
  activa = true;

  constructor(
    private N: number,
    private esteBlocata: (el: EventTarget | null, dy?: number) => boolean,
  ) {
    addEventListener('wheel', this.rotita, { passive: false });
    addEventListener('touchstart', this.atingeStart, { passive: true });
    addEventListener('touchmove', this.atingeMiscare, { passive: false });
    addEventListener('touchend', this.atingeFinal);
    addEventListener('touchcancel', this.atingeFinal);
    addEventListener('keydown', this.tasta);
  }

  private rotita = (e: WheelEvent) => {
    if (!this.activa || this.esteBlocata(e.target, e.deltaY) || e.ctrlKey) return;
    e.preventDefault();
    let d = e.deltaY + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0);
    if (e.deltaMode === 1) d *= 32;
    else if (e.deltaMode === 2) d *= innerHeight;
    d = clamp(d, -240, 240);
    if (this.calm) {
      this.acumulat += d;
      if (Math.abs(this.acumulat) > 120) {
        this.pas(Math.sign(this.acumulat));
        this.acumulat = 0;
      }
      return;
    }
    this.anuleazaAnimatia();
    this.tinta += d / 1300;
    this.inactiv = 0;
  };

  private atingeStart = (e: TouchEvent) => {
    if (!this.activa || this.esteBlocata(e.target) || e.touches.length > 1) return;
    const t = e.touches[0];
    this.atingere = { x: t.clientX, y: t.clientY, t: performance.now(), v: 0 };
    this.inertie = 0;
    this.anuleazaAnimatia();
  };

  private atingeMiscare = (e: TouchEvent) => {
    if (!this.atingere) return;
    const t = e.touches[0];
    const dy = this.atingere.y - t.clientY;
    const dx = this.atingere.x - t.clientX;
    const acum = performance.now();
    const dt = Math.max(1, acum - this.atingere.t) / 1000;
    const d = Math.abs(dy) > Math.abs(dx) ? dy : dx * 0.6;
    if (e.cancelable) e.preventDefault();
    const pe = 1 / (innerHeight * 2.1);
    if (this.calm) {
      this.acumulat += d;
    } else {
      this.tinta += d * pe;
    }
    this.atingere.v = 0.75 * ((d * pe) / dt) + 0.25 * this.atingere.v;
    this.atingere.x = t.clientX;
    this.atingere.y = t.clientY;
    this.atingere.t = acum;
    this.inactiv = 0;
  };

  private atingeFinal = () => {
    if (!this.atingere) return;
    if (this.calm) {
      if (Math.abs(this.acumulat) > 40) this.pas(Math.sign(this.acumulat));
      this.acumulat = 0;
    } else if (performance.now() - this.atingere.t < 120) {
      this.inertie = clamp(this.atingere.v, -1.6, 1.6);
    }
    this.atingere = null;
  };

  private tasta = (e: KeyboardEvent) => {
    if (!this.activa || this.esteBlocata(e.target)) return;
    const el = e.target as HTMLElement | null;
    if (el && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName) && (e.key === ' ' || e.key === 'Enter')) return;
    const inainte = ['ArrowDown', 'PageDown', 'ArrowRight'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
    const inapoi = ['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key) || (e.key === ' ' && e.shiftKey);
    if (inainte || inapoi) {
      e.preventDefault();
      this.pas(inainte ? 1 : -1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.mergiLa(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      this.mergiLa(this.N - 1);
    }
  };

  /** Moves to the next/previous scene. */
  pas(dir: number) {
    const baza = this.animatie ? this.animatie.la : Math.round(this.tinta);
    this.zboaraLa(baza + dir);
  }

  /** Flies to scene `index` by the shortest way around the loop. */
  mergiLa(index: number, instant = false) {
    const curent = this.animatie ? this.animatie.la : this.tinta;
    let delta = mod(index - curent, this.N);
    if (delta > this.N / 2) delta -= this.N;
    const la = Math.round(curent + delta);
    if (instant) {
      this.anuleazaAnimatia();
      this.tinta = this.p = la;
      return;
    }
    this.zboaraLa(la);
  }

  private zboaraLa(la: number) {
    this.inactiv = 0;
    this.inertie = 0;
    if (this.calm) {
      if (performance.now() < this.blocatPana) return;
      this.blocatPana = performance.now() + 900;
      this.onSalt?.(la);
      return;
    }
    const dist = Math.abs(la - this.tinta);
    this.animatie = { de: this.tinta, la, t: 0, durata: Math.min(5, 1.1 + dist * 1.6) };
  }

  /** Called by the reduced-motion transition once the screen is faded. */
  sari(la: number) {
    this.tinta = this.p = la;
  }

  private anuleazaAnimatia() {
    this.animatie = null;
  }

  actualizeaza(dt: number) {
    this.inactiv += dt;
    if (this.animatie) {
      const a = this.animatie;
      a.t += dt / a.durata;
      this.tinta = a.de + (a.la - a.de) * easeInOut(clamp(a.t));
      if (a.t >= 1) this.animatie = null;
      this.inactiv = 0;
    } else if (Math.abs(this.inertie) > 0.001) {
      this.tinta += this.inertie * dt;
      this.inertie *= Math.exp(-dt * 2.6);
    } else if (!this.atingere && this.inactiv > 0.3) {
      // Gentle magnet towards the nearest scene when the user stops close to it.
      const n = Math.round(this.tinta);
      if (Math.abs(this.tinta - n) < 0.22) this.tinta += (n - this.tinta) * damp(2.4, dt);
    }
    this.p += (this.tinta - this.p) * damp(this.animatie ? 12 : 4.2, dt);
    // Keep numbers small on very long journeys.
    if (Math.abs(this.p) > 1e5) {
      const k = Math.round(this.p / this.N) * this.N;
      this.p -= k;
      this.tinta -= k;
      if (this.animatie) {
        this.animatie.de -= k;
        this.animatie.la -= k;
      }
    }
  }

  get inMiscare() {
    return !!this.animatie || Math.abs(this.tinta - this.p) > 0.002 || Math.abs(this.inertie) > 0.01;
  }
}
