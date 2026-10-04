import './stiluri/fonturi.css';
import './stiluri/brand.css';
import './stiluri/site.css';
import { Calatorie, type StareCalatorie } from './lume/calatorie';
import { Cos } from './ui/cos';
import { mod } from './lume/util';

interface DateClient {
  limba: string;
  moneda: string;
  ui: Record<string, string>;
}

const date: DateClient = JSON.parse(document.getElementById('date-client')!.textContent!);
const ui = date.ui;
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => Array.from(el.querySelectorAll(s)) as T[];

try {
  localStorage.setItem('apisvania-limba', date.limba);
} catch {
  /* ignore */
}
$$('.bara-limbi a').forEach((a) =>
  a.addEventListener('click', () => {
    try {
      localStorage.setItem('apisvania-limba', a.getAttribute('hreflang')!);
    } catch {
      /* ignore */
    }
  }),
);

const anunt = $('[data-anunt]');
const spune = (t: string) => {
  anunt.textContent = '';
  requestAnimationFrame(() => (anunt.textContent = t));
};

// ── Drawers: route menu and basket ─────────────────────────────────────
const sertare = new Map<HTMLElement, HTMLButtonElement>([
  [$('#meniu'), $<HTMLButtonElement>('#buton-meniu')],
  [$('#cos'), $<HTMLButtonElement>('#buton-cos')],
]);
let sertarDeschis: HTMLElement | null = null;

function deschide(s: HTMLElement) {
  if (sertarDeschis && sertarDeschis !== s) inchide(sertarDeschis, false);
  s.hidden = false;
  requestAnimationFrame(() => s.classList.add('deschis'));
  sertare.get(s)!.setAttribute('aria-expanded', 'true');
  sertarDeschis = s;
  const primul = $<HTMLElement>('a, button:not([data-inchide]), input', s) ?? $<HTMLElement>('[data-inchide]', s);
  primul?.focus();
}
function inchide(s: HTMLElement, focus = true) {
  s.classList.remove('deschis');
  sertare.get(s)!.setAttribute('aria-expanded', 'false');
  setTimeout(() => {
    if (!s.classList.contains('deschis')) s.hidden = true;
  }, 300);
  if (sertarDeschis === s) sertarDeschis = null;
  if (focus) sertare.get(s)!.focus();
}
for (const [s, b] of sertare) {
  b.addEventListener('click', () => (s.hidden || !s.classList.contains('deschis') ? deschide(s) : inchide(s)));
  $$('[data-inchide]', s).forEach((x) => x.addEventListener('click', () => inchide(s)));
}
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sertarDeschis) inchide(sertarDeschis);
});
addEventListener('pointerdown', (e) => {
  if (!sertarDeschis) return;
  const t = e.target as Node;
  if (!sertarDeschis.contains(t) && !sertare.get(sertarDeschis)!.contains(t)) inchide(sertarDeschis, false);
});

// ── Basket ─────────────────────────────────────────────────────────────
const cos = new Cos();
const fmt = new Intl.NumberFormat(date.limba === 'ro' ? 'ro-RO' : 'en-IE', { style: 'currency', currency: date.moneda });
function randeazaCos() {
  const n = cos.numar;
  const numar = $('[data-cos-numar]');
  numar.textContent = String(n);
  numar.hidden = n === 0;
  $('[data-cos-gol]').hidden = n > 0;
  const lista = $('[data-cos-lista]');
  lista.innerHTML = '';
  cos.articole.forEach((a, i) => {
    const li = document.createElement('li');
    li.className = 'cos-articol';
    const pret = a.pret == null ? ui.pret_la_cerere : fmt.format(a.pret * a.cantitate);
    li.innerHTML = `<div class="cos-nume"><strong></strong><span></span></div>
      <div class="cos-cantitate" role="group">
        <button type="button" data-minus aria-label="−">−</button><output></output><button type="button" data-plus aria-label="+">+</button>
      </div><p class="cos-pret"></p>`;
    $('strong', li).textContent = a.nume;
    $('span', li).textContent = a.gramaj;
    $('output', li).textContent = String(a.cantitate);
    $('.cos-pret', li).textContent = pret;
    $('[role=group]', li).setAttribute('aria-label', `${ui.cantitate}: ${a.nume} ${a.gramaj}`);
    $('[data-minus]', li).addEventListener('click', () => cos.seteazaCantitate(i, a.cantitate - 1));
    $('[data-plus]', li).addEventListener('click', () => cos.seteazaCantitate(i, a.cantitate + 1));
    lista.append(li);
  });
}
cos.laSchimbare(randeazaCos);
randeazaCos();

$$<HTMLFormElement>('.panou-comanda').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ales = $<HTMLInputElement>('input[name=varianta]:checked', form);
    if (!ales) return;
    cos.adauga({
      produs: form.dataset.produs!,
      nume: form.dataset.nume!,
      gramaj: ales.value,
      pret: ales.dataset.pret ? Number(ales.dataset.pret) : null,
    });
    const b = $('button[type=submit]', form);
    b.classList.add('adaugat');
    $('.buton-text', b).textContent = ui.adaugat;
    setTimeout(() => {
      b.classList.remove('adaugat');
      $('.buton-text', b).textContent = ui.adauga;
    }, 1600);
    spune(`${ui.adaugat}: ${form.dataset.nume} ${ales.value}`);
    $('#buton-cos').classList.remove('puls');
    void $('#buton-cos').offsetWidth;
    $('#buton-cos').classList.add('puls');
  });
});

// ── The journey ────────────────────────────────────────────────────────
const sectiuni = $$('.scena');
const idLaIndex = new Map(sectiuni.map((s) => [s.id, Number(s.dataset.scena)]));

function porneste() {
  const canvasLume = $<HTMLCanvasElement>('#lume-canvas');
  const canvasAlbina = $<HTMLCanvasElement>('#albina-canvas');
  const blocata = (el: EventTarget | null) =>
    !!sertarDeschis || (el instanceof Element && !!el.closest('.lasa-derulare'));
  let calatorie: Calatorie;
  try {
    calatorie = new Calatorie(canvasLume, canvasAlbina, blocata);
  } catch (e) {
    console.error(e);
    return;
  }
  document.documentElement.classList.add('calatorie-activa');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const aplicaMiscare = () => {
    let ales: string | null = null;
    try {
      ales = localStorage.getItem('apisvania-miscare');
    } catch {
      /* ignore */
    }
    const da = ales ? ales === 'redusa' : reduce.matches;
    calatorie.setMiscareRedusa(da);
    document.documentElement.classList.toggle('miscare-redusa', da);
    $('[data-miscare]')?.setAttribute('aria-pressed', String(da));
  };
  reduce.addEventListener('change', aplicaMiscare);
  aplicaMiscare();
  $('[data-miscare]')?.addEventListener('click', () => {
    const acum = document.documentElement.classList.contains('miscare-redusa');
    try {
      localStorage.setItem('apisvania-miscare', acum ? 'normala' : 'redusa');
    } catch {
      /* ignore */
    }
    aplicaMiscare();
  });

  const start = idLaIndex.get(decodeURIComponent(location.hash.slice(1))) ?? 0;
  calatorie.derulare.mergiLa(start, true);
  calatorie.pregatesteInceput(start);

  // Links that fly the bee somewhere.
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLElement>('[data-mergi]');
    if (!a) return;
    e.preventDefault();
    if (sertarDeschis) inchide(sertarDeschis, false);
    calatorie.derulare.mergiLa(Number(a.dataset.mergi));
  });
  // Keyboard users: focusing something inside a scene flies there.
  document.addEventListener('focusin', (e) => {
    const s = (e.target as Element).closest<HTMLElement>('.scena');
    if (!s) return;
    const i = Number(s.dataset.scena);
    if (mod(Math.round(calatorie.derulare.tinta), calatorie.N) !== i) calatorie.derulare.mergiLa(i);
  });

  const harta = construiesteHarta(calatorie.N);
  const indiciu = $('.indiciu-derulare');
  let ultimaScena = -1;
  let ultimVizibil: number[] = [];
  calatorie.onCadru = (s: StareCalatorie) => {
    sectiuni.forEach((el, i) => {
      const v = s.vizibil[i];
      if (Math.abs((ultimVizibil[i] ?? -1) - v) > 0.004) {
        el.style.setProperty('--vizibil', v.toFixed(3));
        el.classList.toggle('activ', v > 0.5);
      }
    });
    ultimVizibil = s.vizibil.slice();
    harta(s.p);
    if (indiciu && calatorie.derulare.inactiv < 1 && s.detaliu < 0.9) indiciu.classList.add('ascuns');
    if (s.detaliu > 0.95 && s.scena !== ultimaScena) {
      ultimaScena = s.scena;
      const id = sectiuni[s.scena]?.id;
      if (id) history.replaceState(null, '', s.scena === 0 ? location.pathname : `#${id}`);
    }
  };
  calatorie.porneste();
  (window as unknown as { apisvania: Calatorie }).apisvania = calatorie;
  requestAnimationFrame(() => document.documentElement.classList.add('pregatit'));
}

function construiesteHarta(N: number) {
  const cont = $('.harta');
  const W = 156;
  const H = 40;
  const cx = W / 2;
  const cy = H / 2;
  const rx = W / 2 - 10;
  const ry = H / 2 - 9;
  const punct = (u: number) => {
    const t = Math.PI + u * Math.PI * 2;
    return [cx + Math.cos(t) * rx, cy + Math.sin(t) * ry * (Math.sin(t) < 0 ? 1 : 0.55) + Math.sin(u * Math.PI * 6) * 1.5];
  };
  let d = '';
  for (let k = 0; k <= 96; k++) {
    const [x, y] = punct(k / 96);
    d += `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  const hex = (x: number, y: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI / 6 + (i * Math.PI) / 3;
      return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`;
    }).join(' ');
  const noduri = Array.from({ length: N }, (_, i) => {
    const [x, y] = punct(i / N);
    return `<polygon class="harta-nod" data-nod="${i}" points="${hex(x, y, 4.2)}"/>`;
  }).join('');
  cont.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path class="harta-drum" d="${d}"/>${noduri}<circle class="harta-albina" r="3.2"/></svg>`;
  const albina = $('.harta-albina', cont);
  const nod = $$('.harta-nod', cont);
  return (p: number) => {
    const u = mod(p, N) / N;
    const [x, y] = punct(u);
    albina.setAttribute('cx', x.toFixed(2));
    albina.setAttribute('cy', y.toFixed(2));
    const activ = mod(Math.round(p), N);
    nod.forEach((n, i) => n.classList.toggle('activ', i === activ));
  };
}

porneste();
