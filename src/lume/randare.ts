// WebGL2 renderer for the 2.5D world: a procedural sky plus many painted
// "cards" (flat illustrated layers) placed in 3D space. Each card is drawn
// with perspective, wind sway, atmospheric fog, time-of-day light and a
// depth-of-field blur taken from the texture's mipmaps.

import type { RGB } from './util';
import { JAPONEZ } from './stil';

export interface Textura {
  tex: WebGLTexture;
  w: number;
  h: number;
}

/** A painted layer placed in the world. Position is the bottom-centre. */
export interface Carte {
  tex: () => Textura | null;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  /** Metres from the top that carry the detailed part of the texture (ground strips). */
  banda?: number;
  repetari?: number;
  u0?: number;
  oglinda?: boolean;
  /** Wind sway amplitude in metres at the top of the card. */
  leganare?: number;
  faza?: number;
  /** Fog multiplier (0 = no fog, 1 = normal). */
  ceata?: number;
  /** Fade-out distance when the camera gets close: [fully gone, fully visible]. */
  aproape?: [number, number];
  /** Distance at which the card starts to fade out far away. */
  departe?: number;
  /** Fixed distance in front of the camera (horizon layers), ignores z. */
  fundal?: number;
  /** Lateral parallax factor for horizon layers (0 = locked to the camera). */
  paralaxa?: number;
  opacitate?: number;
  /** Extra emissive amount (ignores scene light), e.g. hive windows at night. */
  emisie?: number;
  /** Colour multiplier for subtle variety between copies of one texture. */
  nuanta?: [number, number, number];
}

export interface Mediu {
  cerSus: RGB;
  cerMijloc: RGB;
  cerOrizont: RGB;
  soareCuloare: RGB;
  /** Sun position: horizontal angle (radians, + right) and elevation (radians). */
  soareAz: number;
  soareEl: number;
  soareMarime: number;
  lumina: RGB;
  ceataCuloare: RGB;
  ceataDensitate: number;
  stele: number;
  nori: number;
  noriCuloare: RGB;
}

export interface Camera {
  x: number;
  y: number;
  z: number;
  f: number;
  /** Lens shift in CSS pixels (moves the optical centre on screen). */
  sx: number;
  sy: number;
  ruliu: number;
  /** Depth of field: focus distance (m) and aperture (m). */
  focus: number;
  apertura: number;
}

const VS_CARTE = `#version 300 es
precision highp float;
in vec2 a_p;
uniform vec4 u_carte;   // x, y, z(depth from camera), w
uniform vec4 u_carte2;  // h, sway, phase, -
uniform vec4 u_cam;     // camX, camY, unused, f
uniform vec4 u_ecran;   // W, H, shiftX, shiftY
uniform vec2 u_ruliu;   // cos, sin
uniform vec4 u_uv;      // repeats, u0, flip, -
uniform float u_timp;
out vec2 v_uv;
out float v_m;
out vec2 v_local;
void main() {
  v_local = a_p;
  float X = u_carte.x + (a_p.x - 0.5) * u_carte.w;
  float Y = u_carte.y + a_p.y * u_carte2.x;
  float t = a_p.y * a_p.y;
  float s = sin(u_timp * 1.31 + u_carte2.z + X * 0.11) + 0.45 * sin(u_timp * 2.63 + u_carte2.z * 1.7) + 0.25 * sin(u_timp * 4.1 + X * 0.5);
  X += u_carte2.y * t * s;
  float d = u_carte.z;
  vec2 p = vec2(X - u_cam.x, Y - u_cam.y) * (u_cam.w / d);
  p = vec2(p.x * u_ruliu.x - p.y * u_ruliu.y, p.x * u_ruliu.y + p.y * u_ruliu.x);
  vec2 ecr = vec2(u_ecran.x * 0.5 + u_ecran.z + p.x, u_ecran.y * 0.5 + u_ecran.w - p.y);
  gl_Position = vec4(ecr.x / u_ecran.x * 2.0 - 1.0, 1.0 - ecr.y / u_ecran.y * 2.0, 0.0, 1.0);
  float u = u_uv.z > 0.5 ? 1.0 - a_p.x : a_p.x;
  v_uv = vec2(u_uv.y + u * u_uv.x, 1.0 - a_p.y);
  v_m = (1.0 - a_p.y) * u_carte2.x;
}`;

const FS_CARTE = `#version 300 es
precision mediump float;
in vec2 v_uv;
in float v_m;
uniform sampler2D u_tex;
uniform float u_banda;      // metres of detailed band (0 = plain mapping)
uniform float u_inaltime;   // card height in metres
uniform float u_bias;       // mip bias for depth of field
uniform float u_alfa;
uniform float u_ceata;      // fog amount 0..1
uniform vec3 u_ceataCul;
uniform vec3 u_lumina;
uniform vec3 u_nuanta;
uniform float u_emisie;
uniform vec3 u_bordura;     // edge fade width: x sides, top, bottom (0 = none)
in vec2 v_local;
out vec4 o;
void main() {
  vec2 uv = v_uv;
  if (u_banda > 0.0) {
    uv.y = v_m < u_banda ? (v_m / u_banda) * 0.86 : 0.875 + 0.115 * clamp((v_m - u_banda) / max(u_inaltime - u_banda, 0.001), 0.0, 1.0);
  }
  vec4 c = texture(u_tex, uv, u_bias);
  // Blurred (mip-biased) textures bleed to the card edge; fade the edges so
  // out-of-focus layers never show a rectangle.
  if (u_bordura.x > 0.0) c *= smoothstep(0.0, u_bordura.x, v_local.x) * smoothstep(0.0, u_bordura.x, 1.0 - v_local.x);
  if (u_bordura.y > 0.0) c *= smoothstep(0.0, u_bordura.y, 1.0 - v_local.y);
  if (u_bordura.z > 0.0) c *= smoothstep(0.0, u_bordura.z, v_local.y);
  if (c.a < 0.002) discard;
  vec3 lit = c.rgb * u_nuanta * mix(u_lumina, vec3(1.0), u_emisie);
  lit = mix(lit, u_ceataCul * c.a, u_ceata);
  o = vec4(lit, c.a) * u_alfa;
}`;

const VS_CER = `#version 300 es
in vec2 a_p;
void main() { gl_Position = vec4(a_p * 2.0 - 1.0, 0.0, 1.0); }`;

const FS_CER = `#version 300 es
precision highp float;
uniform vec4 u_ecran;   // W, H (device px), centreX, horizonY (device px)
uniform float u_f;      // focal length in device px
uniform vec3 u_sus, u_mijloc, u_orizont, u_soareCul, u_noriCul;
uniform vec3 u_soare;   // screen x, screen y (device px, y down), size
uniform float u_stele, u_nori, u_timp;
uniform float u_stil;    // 0 = sketch, 1 = Japanese
uniform vec2 u_deriva;  // cloud drift from camera travel
out vec4 o;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float zg(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * zg(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return s;
}
void main() {
  vec2 fc = vec2(gl_FragCoord.x, u_ecran.y - gl_FragCoord.y);
  float ey = (u_ecran.w - fc.y) / u_f;   // tangent of elevation
  float ex = (fc.x - u_ecran.z) / u_f;
  vec3 c = mix(u_orizont, u_mijloc, smoothstep(0.0, 0.32, ey));
  c = mix(c, u_sus, smoothstep(0.22, 1.1, ey));
  if (ey < 0.0) c = mix(u_orizont, u_orizont * 0.86, smoothstep(0.0, -0.4, ey));

  // Sun: wide glow, warm halo and a soft disc.
  vec2 ds = (fc - u_soare.xy) / u_f;
  float r = length(ds * vec2(1.0, 1.35));
  float halo = exp(-r * 3.2) * 0.35 + exp(-r * 14.0) * 0.25;
  c += u_soareCul * halo * (1.0 - u_stil * 0.85);
  // Sketched sun: a warm wash inside a thin, slightly uneven ink ring.
  float ds1 = length(ds);
  float disc = smoothstep(u_soare.z * 1.04, u_soare.z * 0.96, ds1);
  if (u_stil > 0.5) {
    // A flat vermilion disc (or a pale moon), as in woodblock prints.
    c = mix(c, u_soareCul, disc * 0.92);
  } else {
    c = mix(c, c + u_soareCul * 0.9, disc);
    float unghi = atan(ds.y, ds.x);
    float raza = u_soare.z * (1.0 + 0.04 * sin(unghi * 3.0 + 1.0));
    float inel = smoothstep(0.0025, 0.0, abs(ds1 - raza)) * (0.55 + 0.45 * sin(unghi * 2.0 + 0.5));
    c = mix(c, vec3(0.24, 0.21, 0.18), inel * 0.45);
  }

  // Stars (fade near the horizon).
  if (u_stele > 0.001 && ey > 0.0) {
    vec2 g = vec2(ex, ey) * 140.0;
    vec2 id = floor(g);
    float h = h21(id);
    vec2 pos = fract(g) - 0.5 - (vec2(h21(id + 3.1), h21(id + 7.7)) - 0.5) * 0.7;
    float st = smoothstep(0.08, 0.0, length(pos)) * step(0.93, h);
    st *= 0.6 + 0.4 * sin(u_timp * (1.0 + h * 3.0) + h * 40.0);
    c += vec3(1.0, 0.97, 0.9) * st * u_stele * smoothstep(0.02, 0.3, ey);
  }

  // Clouds on a virtual plane above the camera.
  if (u_nori > 0.001 && ey > 0.004) {
    vec2 q = vec2(ex * 0.55, 1.0) / ey;
    q = q * vec2(0.9, 0.55) + u_deriva + vec2(u_timp * 0.004, 0.0);
    float n = fbm(q * 0.9);
    float acoperire = 1.0 - u_nori;
    float m = smoothstep(acoperire, acoperire + 0.28, n) * smoothstep(0.004, 0.12, ey);
    float lum = 0.55 + 0.45 * smoothstep(0.35, 0.9, fbm(q * 0.9 + vec2(0.08, -0.06)));
    vec3 nc = mix(u_noriCul * 0.82, u_noriCul + u_soareCul * 0.25, lum);
    nc += u_soareCul * exp(-r * 4.0) * 0.6;
    c = mix(c, nc, m * 0.88);
  }
  // Very light dithering against banding.
  c += (h21(fc + u_timp) - 0.5) / 255.0;
  o = vec4(c, 1.0);
}`;

function compileaza(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  for (const [tip, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const s = gl.createShader(tip)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    gl.attachShader(p, s);
  }
  gl.bindAttribLocation(p, 0, 'a_p');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
  const u: Record<string, WebGLUniformLocation | null> = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i)!;
    u[info.name] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

const RANDURI = 8;

export class Randare {
  readonly gl: WebGL2RenderingContext;
  private carte: ReturnType<typeof compileaza>;
  private cer: ReturnType<typeof compileaza>;
  private vaoCarte: WebGLVertexArrayObject;
  private vaoCer: WebGLVertexArrayObject;
  private nrIndici: number;
  /** Device pixels per CSS pixel actually used (adapted to performance). */
  scara = 1;
  W = 1;
  H = 1;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('webgl2');
    this.gl = gl;
    this.carte = compileaza(gl, VS_CARTE, FS_CARTE);
    this.cer = compileaza(gl, VS_CER, FS_CER);

    // Card mesh: a strip with a few rows so wind can bend it smoothly.
    const v: number[] = [];
    for (let r = 0; r <= RANDURI; r++) v.push(0, r / RANDURI, 1, r / RANDURI);
    const idx: number[] = [];
    for (let r = 0; r < RANDURI; r++) {
      const a = r * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    this.nrIndici = idx.length;
    this.vaoCarte = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoCarte);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

    this.vaoCer = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoCer);
    const cb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 2, 0, 0, 2]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  incarcaTextura(sursa: HTMLCanvasElement | OffscreenCanvas, repetare = false): Textura {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sursa as TexImageSource);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repetare ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { tex, w: sursa.width, h: sursa.height };
  }

  stergeTextura(t: Textura) {
    this.gl.deleteTexture(t.tex);
  }

  redimensioneaza(wCss: number, hCss: number, scara: number) {
    this.scara = scara;
    this.W = wCss;
    this.H = hCss;
    const w = Math.max(1, Math.round(wCss * scara));
    const h = Math.max(1, Math.round(hCss * scara));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  deseneaza(carti: Carte[], cam: Camera, mediu: Mediu, timp: number, deriva: [number, number]) {
    const gl = this.gl;
    const k = this.scara;
    const W = this.W;
    const H = this.H;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.DEPTH_TEST);

    // ── Sky
    const s = this.cer;
    gl.useProgram(s.p);
    gl.disable(gl.BLEND);
    const cx = (W / 2 + cam.sx) * k;
    const hy = (H / 2 + cam.sy) * k;
    const fk = cam.f * k;
    gl.uniform4f(s.u.u_ecran, this.canvas.width, this.canvas.height, cx, hy);
    gl.uniform1f(s.u.u_f, fk);
    gl.uniform3fv(s.u.u_sus, mediu.cerSus);
    gl.uniform3fv(s.u.u_mijloc, mediu.cerMijloc);
    gl.uniform3fv(s.u.u_orizont, mediu.cerOrizont);
    gl.uniform3fv(s.u.u_soareCul, mediu.soareCuloare);
    gl.uniform3fv(s.u.u_noriCul, mediu.noriCuloare);
    gl.uniform3f(
      s.u.u_soare,
      cx + Math.tan(mediu.soareAz) * fk,
      hy - Math.tan(mediu.soareEl) * fk,
      mediu.soareMarime,
    );
    gl.uniform1f(s.u.u_stele, mediu.stele);
    gl.uniform1f(s.u.u_stil, JAPONEZ ? 1 : 0);
    gl.uniform1f(s.u.u_nori, mediu.nori);
    gl.uniform1f(s.u.u_timp, timp);
    gl.uniform2f(s.u.u_deriva, deriva[0], deriva[1]);
    gl.bindVertexArray(this.vaoCer);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // ── Cards, far to near
    const c = this.carte;
    gl.useProgram(c.p);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.vaoCarte);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(c.u.u_tex, 0);
    gl.uniform4f(c.u.u_cam, cam.x, cam.y, 0, cam.f);
    gl.uniform4f(c.u.u_ecran, W, H, cam.sx, cam.sy);
    gl.uniform2f(c.u.u_ruliu, Math.cos(cam.ruliu), Math.sin(cam.ruliu));
    gl.uniform1f(c.u.u_timp, timp);
    gl.uniform3fv(c.u.u_ceataCul, mediu.ceataCuloare);
    gl.uniform3fv(c.u.u_lumina, mediu.lumina);

    let ultimaTex: WebGLTexture | null = null;
    for (const carte of carti) {
      const t = carte.tex();
      const d = (carte as CarteVizibila)._d;
      const a = (carte as CarteVizibila)._a;
      if (!t || a <= 0.003) continue;
      if (t.tex !== ultimaTex) {
        gl.bindTexture(gl.TEXTURE_2D, t.tex);
        ultimaTex = t.tex;
      }
      const v = carte as CarteVizibila;
      gl.uniform4f(c.u.u_carte, v._x, v._y, d, carte.w);
      gl.uniform4f(c.u.u_carte2, v._h, carte.leganare ?? 0, carte.faza ?? 0, 0);
      gl.uniform4f(c.u.u_uv, carte.repetari ?? 1, carte.u0 ?? 0, carte.oglinda ? 1 : 0, 0);
      gl.uniform1f(c.u.u_banda, carte.banda ?? 0);
      gl.uniform1f(c.u.u_inaltime, v._h);
      gl.uniform1f(c.u.u_alfa, a);
      gl.uniform1f(c.u.u_emisie, carte.emisie ?? 0);
      const n = carte.nuanta;
      gl.uniform3f(c.u.u_nuanta, n ? n[0] : 1, n ? n[1] : 1, n ? n[2] : 1);
      const ceata = (1 - Math.exp(-d * mediu.ceataDensitate)) * (carte.ceata ?? 1);
      gl.uniform1f(c.u.u_ceata, Math.min(0.97, ceata));
      // Depth of field: circle of confusion in screen pixels → mip bias.
      const coc = cam.apertura * cam.f * Math.abs(1 / d - 1 / cam.focus);
      const bias = coc > 1 ? Math.min(5, Math.log2(coc) * 0.95) : 0;
      gl.uniform1f(c.u.u_bias, bias);
      // Edge fade grows with the blur (texels per mip level).
      const e = Math.min(0.35, Math.max(0.02, (Math.pow(2, bias) * 3.5) / t.w));
      const eY = Math.min(0.35, Math.max(0.02, (Math.pow(2, bias) * 3.5) / t.h));
      gl.uniform3f(
        c.u.u_bordura,
        (carte.repetari ?? 1) > 1 ? 0 : e,
        carte.banda ? 0 : eY,
        carte.banda ? 0 : eY * 0.5,
      );
      gl.drawElements(gl.TRIANGLES, this.nrIndici, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindVertexArray(null);
  }
}

/** Per-frame computed values attached to a card by the world before drawing. */
export interface CarteVizibila extends Carte {
  _d: number;
  _a: number;
  _x: number;
  /** Bottom and height actually drawn (ground strips are trimmed to save fill-rate). */
  _y: number;
  _h: number;
}
