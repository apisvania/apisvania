// The journey: ties the endless scroll, the world, the camera, the bee and
// the HTML panels together, and runs the animation loop.

import { Randare, type Camera, type Mediu } from './randare';
import { Lume, DIST_ALBINA } from './lume';
import { Derulare } from './derulare';
import { Albina } from './albina';
import { Particule } from './particule';
import { clamp, damp, lerp, mod, smoothstep, css } from './util';
import { sceneDinTraseu } from './scene';

export interface StareCalatorie {
  /** Continuous progress (scene units). */
  p: number;
  /** Index of the scene the bee is at or flying to. */
  scena: number;
  /** 0..1: how settled in the close-up the journey is. */
  detaliu: number;
  /** Visibility 0..1 for each scene's HTML panel. */
  vizibil: number[];
}

export class Calatorie {
  readonly N: number;
  readonly derulare: Derulare;
  private lume: Lume;
  private randare: Randare | null = null;
  private albina = new Albina();
  private particule = new Particule();
  private g: CanvasRenderingContext2D;
  private timp = 0;
  private ultim = performance.now();
  private cam: Camera = { x: 0, y: 0, z: 0, f: 1000, sx: 0, sy: 0, ruliu: 0, focus: 30, apertura: 0 };
  private ruliu = 0;
  private camAnterior = { x: 0, z: 0 };
  private liniste = 0;
  private asezataDe = 0;
  private aterizariNumarate = new Set<number>();
  private W = 1;
  private H = 1;
  private calitate = 1;
  private medieCadru = 16;
  private cadreLente = 0;
  private cadreRapide = 0;
  private scaraMax = 1.5;
  private sariCadru = false;
  private voal: HTMLElement;
  miscareRedusa = false;
  onCadru: ((s: StareCalatorie) => void) | null = null;
  private stare: StareCalatorie;

  constructor(
    private canvasLume: HTMLCanvasElement,
    private canvasAlbina: HTMLCanvasElement,
    esteBlocata: (el: EventTarget | null, dy?: number) => boolean,
  ) {
    const scene = sceneDinTraseu();
    this.N = scene.length;
    this.voal = document.querySelector('.lume-voal') as HTMLElement;
    try {
      this.randare = new Randare(canvasLume);
      canvasLume.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        this.lume.uitaTexturi();
      });
      canvasLume.addEventListener('webglcontextrestored', () => location.reload());
    } catch {
      this.randare = null;
      document.documentElement.classList.add('fara-webgl');
    }
    this.lume = new Lume(scene, this.randare);
    this.g = canvasAlbina.getContext('2d')!;
    this.derulare = new Derulare(this.N, esteBlocata);
    this.derulare.onSalt = (la) => this.tranzitieCalma(la);
    const mobil = matchMedia('(pointer: coarse)').matches;
    this.scaraMax = Math.min(devicePixelRatio || 1, mobil ? 1.5 : 1.75);
    this.calitate = this.scaraMax;
    this.particule.setCalitate(mobil ? 0.6 : 1);
    this.stare = { p: 0, scena: 0, detaliu: 1, vizibil: new Array(this.N).fill(0) };
    addEventListener('resize', () => this.redimensioneaza());
    this.redimensioneaza();
  }

  /** Paints the textures of the first scene before the first frame. */
  pregatesteInceput(scena: number) {
    this.lume.pregateste(scena, 1e9, 0);
  }

  porneste() {
    const bucla = (acum: number) => {
      requestAnimationFrame(bucla);
      const dt = Math.min(0.05, (acum - this.ultim) / 1000);
      // When nothing moves for a while, render at half rate to save battery.
      if (this.derulare.inactiv > 8 && !this.derulare.inMiscare) {
        this.sariCadru = !this.sariCadru;
        if (this.sariCadru) return;
      }
      this.ultim = acum;
      this.cadru(dt, acum);
    };
    requestAnimationFrame(bucla);
  }

  setMiscareRedusa(da: boolean) {
    this.miscareRedusa = da;
    this.derulare.calm = da;
    this.particule.setCalitate(da ? 0 : matchMedia('(pointer: coarse)').matches ? 0.6 : 1);
  }

  private tranzitieCalma(la: number) {
    this.voal.style.transition = 'opacity 0.35s ease';
    this.voal.style.opacity = '1';
    setTimeout(() => {
      this.derulare.sari(la);
      this.voal.style.opacity = '0';
    }, 380);
  }

  private redimensioneaza() {
    this.W = innerWidth;
    this.H = innerHeight;
    this.randare?.redimensioneaza(this.W, this.H, this.calitate);
    const k = Math.min(devicePixelRatio || 1, 2);
    this.canvasAlbina.width = Math.round(this.W * k);
    this.canvasAlbina.height = Math.round(this.H * k);
    this.g.setTransform(k, 0, 0, k, 0, 0);
  }

  private adapteazaCalitatea(dt: number) {
    this.medieCadru = lerp(this.medieCadru, dt * 1000, 0.05);
    if (this.medieCadru > 21) this.cadreLente++;
    else this.cadreLente = Math.max(0, this.cadreLente - 1);
    if (this.medieCadru < 13) this.cadreRapide++;
    else this.cadreRapide = 0;
    if (this.cadreLente > 60 && this.calitate > 0.7) {
      this.calitate = Math.max(0.7, this.calitate - 0.25);
      this.cadreLente = 0;
      this.randare?.redimensioneaza(this.W, this.H, this.calitate);
    } else if (this.cadreRapide > 240 && this.calitate < this.scaraMax) {
      this.calitate = Math.min(this.scaraMax, this.calitate + 0.25);
      this.cadreRapide = 0;
      this.randare?.redimensioneaza(this.W, this.H, this.calitate);
    }
  }

  private cadru(dt: number, acum: number) {
    this.timp += dt;
    this.derulare.actualizeaza(dt);
    this.adapteazaCalitatea(dt);
    const p = this.derulare.p;
    const W = this.W;
    const H = this.H;
    const st = this.lume.stare(p);
    const sc = this.lume.scene[st.scenaApropiata];
    const portret = W / H < 0.85;

    // Paint upcoming scenes a little at a time.
    this.lume.pregateste(st.scenaApropiata, this.derulare.inMiscare ? 3 : 8);

    // ── Camera
    const cam = this.cam;
    const w = st.detaliu;
    cam.f = Math.min(H / (2 * Math.tan((24 * Math.PI) / 180)), W / (2 * Math.tan(((portret ? 20 : 31) * Math.PI) / 180)));
    cam.x = st.poz.x;
    cam.y = st.poz.y;
    cam.z = st.poz.z;
    const inc = portret ? sc.incadrare.port : sc.incadrare.lat;
    cam.sx = lerp(0, (inc[0] - 0.5) * W, smoothstep(0, 1, w));
    cam.sy = lerp(-0.13 * H, (inc[1] - 0.5) * H, smoothstep(0, 1, w));
    const vx = (cam.x - this.camAnterior.x) / Math.max(dt, 1e-3);
    this.camAnterior = { x: cam.x, z: cam.z };
    this.ruliu = lerp(this.ruliu, clamp(-vx * 0.006, -0.06, 0.06) * (this.miscareRedusa ? 0 : 1), damp(3, dt));
    cam.ruliu = this.ruliu;
    cam.focus = lerp(40, DIST_ALBINA, w);
    cam.apertura = lerp(0.002, 0.028 * (sc.claritate ?? 1), w * w);

    // ── World
    if (this.randare) {
      const vizibile = this.lume.vizibileDin(cam, W, H, p);
      this.randare.deseneaza(vizibile, cam, st.mediu, this.timp, [cam.x * 0.0012, cam.z * 0.0011]);
    }

    // ── Bee and particles
    this.desenStrat(dt, st, sc.aterizare, portret);

    // ── HTML panels
    const viz = this.stare.vizibil;
    for (let k = 0; k < this.N; k++) viz[k] = 0;
    const panou = smoothstep(0.45, 0.95, w);
    viz[st.scenaApropiata] = panou;
    this.stare.p = p;
    this.stare.scena = st.scenaApropiata;
    this.stare.detaliu = w;
    this.onCadru?.(this.stare);
    void acum;
  }

  private proiecteaza = (x: number, y: number, z: number) => {
    const c = this.cam;
    const d = mod(z - c.z, this.lume.L);
    if (d <= 0.05 || d > this.lume.L * 0.5) return null;
    const k = c.f / d;
    let px = (x - c.x) * k;
    let py = (y - c.y) * k;
    const cr = Math.cos(c.ruliu);
    const sr = Math.sin(c.ruliu);
    const rx = px * cr - py * sr;
    const ry = px * sr + py * cr;
    px = rx;
    py = ry;
    return { x: this.W / 2 + c.sx + px, y: this.H / 2 + c.sy - py, k, d };
  };

  private desenStrat(dt: number, st: ReturnType<Lume['stare']>, aterizare: boolean, portret: boolean) {
    const g = this.g;
    const W = this.W;
    const H = this.H;
    g.clearRect(0, 0, W, H);
    const w = st.detaliu;

    // How still is the journey?
    const miscare = Math.abs(this.derulare.tinta - this.derulare.p);
    this.liniste = lerp(this.liniste, miscare < 0.004 ? 1 : 0, damp(2.5, dt));

    // Where the bee should be: on the target at rest, ahead of the camera in flight.
    const T = this.lume.tinte[st.scenaApropiata];
    const pr = this.proiecteaza(T.x, T.y, T.z);
    const zborX = W * (portret ? 0.5 : 0.52) + Math.sin(this.timp * 0.6) * W * 0.03;
    const zborY = H * (portret ? 0.5 : 0.56) + Math.sin(this.timp * 0.8) * H * 0.02;
    const b = smoothstep(0.15, 0.9, w);
    const tx = pr ? lerp(zborX, pr.x, b) : zborX;
    const ty = pr ? lerp(zborY, pr.y, b) : zborY;
    const baza = Math.min(W, H);
    const marimeRepaus = clamp(baza * (st.scenaApropiata === 0 ? 0.15 : 0.13), 54, 150);
    const marime = lerp(clamp(baza * 0.085, 40, 90), marimeRepaus, b);

    // Sit on the flower after a short pause in a close-up.
    if (aterizare && w > 0.97 && this.liniste > 0.85) this.asezataDe += dt;
    else this.asezataDe = 0;
    const asezare = this.asezataDe > 0.7 ? 1 : 0;
    if (asezare && !this.aterizariNumarate.has(st.scenaApropiata)) {
      this.aterizariNumarate.add(st.scenaApropiata);
      this.albina.polen = Math.min(1, this.albina.polen + 0.34);
    }
    // Back at the hive the pollen is delivered.
    if (st.scenaApropiata === 0 && w > 0.9) {
      this.albina.polen = Math.max(0, this.albina.polen - dt * 0.3);
      this.aterizariNumarate.clear();
    }

    this.albina.actualizeaza(dt, { x: tx, y: ty, marime, asezare, liniste: this.liniste, miscareRedusa: this.miscareRedusa });

    // Particles.
    const a = this.lume.scene[st.i].particule ?? {};
    const bb = this.lume.scene[st.j].particule ?? {};
    const t = smoothstep(0.2, 0.8, st.f);
    const petale = lerp(a.petale?.densitate ?? 0, bb.petale?.densitate ?? 0, t);
    const fire = lerp(a.polen ?? 0, bb.polen ?? 0, t);
    this.particule.culoriPetale = (t < 0.5 ? a.petale?.culori : bb.petale?.culori) ?? ['#ffffff'];
    if (!this.miscareRedusa) {
      this.particule.actualizeaza(dt, this.cam, petale, fire, this.timp, this.lume.L);
      if (this.albina.viteza() > 3.5) this.particule.emite(this.albina.x, this.albina.y + marime * 0.2, marime, 1);
    }
    const lumina = luminaParticule(st.mediu);
    this.particule.deseneaza(g, this.proiecteaza, DIST_ALBINA, false, lumina);
    this.particule.deseneazaUrma(g);
    this.albina.deseneaza(g);
    this.particule.deseneaza(g, this.proiecteaza, DIST_ALBINA, true, lumina);
  }
}

function luminaParticule(m: Mediu) {
  return css([lerp(m.soareCuloare[0], 1, 0.5), lerp(m.soareCuloare[1], 0.95, 0.5), lerp(m.soareCuloare[2], 0.7, 0.5)]);
}
