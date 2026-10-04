import './stiluri/fonturi.css';
import './stiluri/brand.css';
import './stiluri/site.css';
import { Calatorie, type StareCalatorie } from './lume/calatorie';
import { Cos } from './ui/cos';
import { mod } from './lume/util';
import { JAPONEZ } from './lume/stil';

document.documentElement.classList.toggle('stil-japonez', JAPONEZ);

interface DateClient {
  limba: string;
  moneda: string;
  ui: Record<string, string>;
  formular: Record<string, string>;
  contact: { email: string; telefon: string };
  scenaComanda: number;
}

const date: DateClient = JSON.parse(document.getElementById('date-client')!.textContent!);
const ui = date.ui;
const f = date.formular;
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
  $('[data-spre-comanda]').hidden = n === 0;
  randeazaRezumat();
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
  // Scrollable panels keep the wheel while they can still scroll that way.
  const blocata = (el: EventTarget | null, dy?: number) => {
    if (sertarDeschis) return true;
    const p = el instanceof Element ? el.closest<HTMLElement>('.lasa-derulare') : null;
    if (!p || p.scrollHeight <= p.clientHeight + 2) return false;
    if (dy === undefined) return true;
    return dy > 0 ? p.scrollTop + p.clientHeight < p.scrollHeight - 1 : p.scrollTop > 0;
  };
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

  let focusComanda = false;
  $('[data-spre-comanda]').addEventListener('click', () => {
    if (sertarDeschis) inchide(sertarDeschis, false);
    calatorie.derulare.mergiLa(date.scenaComanda);
    focusComanda = true;
  });

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
    document.documentElement.classList.toggle('noapte', s.scena === date.scenaComanda && s.detaliu > 0.15);
    if (focusComanda && s.scena === date.scenaComanda && s.detaliu > 0.97) {
      focusComanda = false;
      const panou = $('#intoarcere .panou');
      const tinta = $('#comanda');
      panou.scrollTo({ top: tinta.offsetTop - 20, behavior: 'smooth' });
      $<HTMLInputElement>('#f-nume').focus({ preventScroll: true });
    }
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



// ── Order request ──────────────────────────────────────────────────────
function textComanda() {
  return cos.articole
    .map((a) => `${a.cantitate} × ${a.nume} ${a.gramaj}${a.pret == null ? '' : ` (${fmt.format(a.pret * a.cantitate)})`}`)
    .join('\n');
}
function randeazaRezumat() {
  const el = document.querySelector<HTMLElement>('[data-rezumat]');
  if (!el) return;
  if (!cos.articole.length) {
    const p = document.createElement('p');
    p.className = 'rezumat-gol';
    p.textContent = f.cos_gol;
    el.replaceChildren(p);
    return;
  }
  const ul = document.createElement('ul');
  for (const a of cos.articole) {
    const li = document.createElement('li');
    li.innerHTML = '<span></span><span></span>';
    li.children[0].textContent = `${a.cantitate} × ${a.nume}, ${a.gramaj}`;
    li.children[1].textContent = a.pret == null ? ui.pret_la_cerere : fmt.format(a.pret * a.cantitate);
    ul.append(li);
  }
  const toatePreturile = cos.articole.every((a) => a.pret != null);
  const total = document.createElement('p');
  total.className = 'rezumat-total';
  total.textContent = toatePreturile
    ? `${f.total}: ${fmt.format(cos.articole.reduce((s, a) => s + (a.pret ?? 0) * a.cantitate, 0))}`
    : f.total_la_cerere;
  el.replaceChildren(ul, total);
}
randeazaRezumat();

const formular = document.querySelector<HTMLFormElement>('[data-formular]');
formular?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const stare = $('[data-stare]', formular);
  stare.className = 'formular-stare';
  if (!cos.articole.length) {
    stare.textContent = f.cos_gol;
    stare.classList.add('eroare');
    return;
  }
  if (!formular.checkValidity()) {
    formular.classList.add('verificat');
    stare.textContent = f.obligatoriu;
    stare.classList.add('eroare');
    formular.querySelector<HTMLElement>(':invalid')?.focus();
    return;
  }
  const d = Object.fromEntries(new FormData(formular)) as Record<string, string>;
  const buton = $<HTMLButtonElement>('button[type=submit]', formular);
  buton.disabled = true;
  buton.textContent = f.se_trimite;
  const comanda = textComanda();
  try {
    // FormSubmit forwards the request to the Apisvania inbox (no server of our own).
    const r = await fetch(`https://formsubmit.co/ajax/${date.contact.email}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `Cerere de comandă Apisvania – ${d.nume}`,
        _template: 'table',
        _captcha: 'false',
        _replyto: d.email,
        Nume: d.nume,
        Email: d.email,
        Telefon: d.telefon,
        Tara: d.tara,
        Localitate: d.oras,
        Adresa: d.adresa,
        Mesaj: d.mesaj || '-',
        Comanda: comanda,
        Limba: date.limba,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || String(j.success) !== 'true') throw new Error('trimitere');
    formular.hidden = true;
    const ok = document.createElement('div');
    ok.className = 'formular-succes';
    ok.innerHTML = '<p class="panou-subtitlu"></p><p></p>';
    ok.children[0].textContent = f.succes_titlu;
    ok.children[1].textContent = f.succes_text;
    formular.after(ok);
    while (cos.articole.length) cos.seteazaCantitate(0, 0);
    spune(f.succes_text);
  } catch {
    stare.classList.add('eroare');
    const corp = encodeURIComponent(`${comanda}\n\n${d.nume}\n${d.telefon}\n${d.adresa}, ${d.oras}, ${d.tara}\n\n${d.mesaj ?? ''}`);
    stare.innerHTML = '<span></span> <a></a> · <span></span>';
    stare.children[0].textContent = f.eroare;
    const a = stare.children[1] as HTMLAnchorElement;
    a.href = `mailto:${date.contact.email}?subject=${encodeURIComponent('Cerere de comandă Apisvania')}&body=${corp}`;
    a.textContent = date.contact.email;
    stare.children[2].textContent = date.contact.telefon;
  } finally {
    buton.disabled = false;
    buton.textContent = f.trimite;
  }
});

porneste();
