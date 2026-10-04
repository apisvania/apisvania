// Generates the static HTML pages (one per language, plus the root language
// chooser) from the editable content in continut/. The pages hold all text
// and products as real HTML, so search engines and screen readers read them
// without running the 3D journey.
//
// Run automatically by Vite (see vite.config.ts); run by hand with
//   node scripts/genereaza-pagini.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const radacina = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const citeste = (p) => readFileSync(resolve(radacina, p), 'utf8');

export function incarcaContinut() {
  const produse = YAML.parse(citeste('continut/produse.yaml'));
  const texte = YAML.parse(citeste('continut/texte.yaml'));
  const traseu = JSON.parse(citeste('src/lume/traseu.json'));
  return { produse, texte, traseu };
}

const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const pretNumeric = (p) => typeof p === 'number' && Number.isFinite(p);

function urlLimba(texte, limba) {
  return `${texte.domeniu}/${limba}/`;
}

function formatPret(pret, moneda, limba, t) {
  if (!pretNumeric(pret)) return t.ui.pret_la_cerere;
  return new Intl.NumberFormat(limba === 'ro' ? 'ro-RO' : 'en-IE', {
    style: 'currency',
    currency: moneda,
  }).format(pret);
}

const MARCA_SVG = `<svg class="marca" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M32 4.5 55.8 18.25v27.5L32 59.5 8.2 45.75v-27.5Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M17.5 44.5 32 19l14.5 25.5" fill="none" stroke="currentColor" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 29.2c1.9 2.5 4.3 5.3 4.3 7.6a4.3 4.3 0 0 1-8.6 0c0-2.3 2.4-5.1 4.3-7.6Z" fill="currentColor"/></svg>`;

function jsonLd(continut, limba) {
  const { produse, texte } = continut;
  const t = texte[limba];
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Apisvania',
    url: texte.domeniu,
    logo: `${texte.domeniu}/brand/apisvania-marca.svg`,
    description: t.meta.descriere,
  };
  const produseLd = produse.sortimente.map((p) => {
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${urlLimba(texte, limba)}#${p.id}`,
      name: p.nume[limba],
      description: p.descriere[limba],
      brand: { '@type': 'Brand', name: 'Apisvania' },
      category: limba === 'ro' ? 'Miere' : 'Honey',
      countryOfOrigin: 'RO',
      image: `${texte.domeniu}/og/${limba}.png`,
    };
    const cuPret = p.variante.filter((v) => pretNumeric(v.pret));
    if (cuPret.length) {
      ld.offers = cuPret.map((v) => ({
        '@type': 'Offer',
        name: `${p.nume[limba]} ${v.gramaj}`,
        price: v.pret.toFixed(2),
        priceCurrency: produse.moneda,
        availability: p.disponibil
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: `${urlLimba(texte, limba)}#${p.id}`,
      }));
    }
    return ld;
  });
  return [org, ...produseLd]
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n    ');
}

function alternate(texte) {
  return [
    ...texte.limbi.map(
      (l) => `<link rel="alternate" hreflang="${l}" href="${urlLimba(texte, l)}">`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${texte.domeniu}/">`,
  ].join('\n    ');
}

function sectiuneProdus(p, index, continut, limba) {
  const t = continut.texte[limba];
  const moneda = continut.produse.moneda;
  const carac = Object.entries(p.caracteristici)
    .map(
      ([cheie, val]) =>
        `<div><dt>${esc(t.caracteristici[cheie] ?? cheie)}</dt><dd>${esc(val[limba])}</dd></div>`,
    )
    .join('');
  const variante = p.variante
    .map((v, i) => {
      const pret = formatPret(v.pret, moneda, limba, t);
      return `<label class="varianta">
              <input type="radio" name="varianta" value="${esc(v.gramaj)}" data-pret="${pretNumeric(v.pret) ? v.pret : ''}"${i === 0 ? ' checked' : ''}${p.disponibil ? '' : ' disabled'}>
              <span class="varianta-gramaj">${esc(v.gramaj)}</span>
              <span class="varianta-pret">${esc(pret)}</span>
            </label>`;
    })
    .join('\n            ');
  return `
      <section class="scena scena-produs" id="${p.id}" data-scena="${index}" aria-labelledby="titlu-${p.id}">
        <div class="panou">
          <p class="panou-loc">${esc(p.loc[limba])}</p>
          <h2 class="panou-titlu" id="titlu-${p.id}">${esc(p.nume[limba])}</h2>
          <p class="panou-text">${esc(p.descriere[limba])}</p>
          <dl class="panou-carac">${carac}</dl>
          <form class="panou-comanda" data-produs="${p.id}" data-nume="${esc(p.nume[limba])}">
            <fieldset>
              <legend>${esc(t.ui.gramaj)}</legend>
            ${variante}
            </fieldset>
            ${
              p.disponibil
                ? `<button type="submit" class="buton buton-plin"><span class="buton-text">${esc(t.ui.adauga)}</span></button>`
                : `<p class="panou-indisponibil">${esc(t.ui.indisponibil)}</p>`
            }
          </form>
        </div>
      </section>`;
}

function sectiuneDeschidere(index, continut, limba) {
  const s = continut.texte[limba].scene.deschidere;
  const ui = continut.texte[limba].ui;
  return `
      <section class="scena scena-deschidere" id="deschidere" data-scena="${index}" aria-labelledby="titlu-deschidere">
        <div class="deschidere">
          <p class="sigla-mare">${MARCA_SVG}<span class="sigla-text">Apisvania</span></p>
          <p class="supratitlu">${esc(s.supratitlu)}</p>
          <h1 class="titlu-mare" id="titlu-deschidere">${esc(s.titlu)}</h1>
          <p class="deschidere-text">${esc(s.text)}</p>
          <a class="buton buton-contur" href="#${continut.traseu.scene[1]?.id ?? 'deschidere'}" data-mergi="1">${esc(ui.incepe)}</a>
          <p class="indiciu-derulare" aria-hidden="true"><span class="indiciu-roata"></span>${esc(ui.derulare)}</p>
        </div>
      </section>`;
}

function elementMeniu(scena, index, continut, limba) {
  const t = continut.texte[limba];
  if (scena.tip === 'produs') {
    const p = continut.produse.sortimente.find((x) => x.id === scena.produs);
    return `<li><a href="#${p.id}" data-mergi="${index}"><span class="meniu-nr">${String(index).padStart(2, '0')}</span><span class="meniu-loc">${esc(p.loc[limba])}</span><span class="meniu-produs">${esc(p.nume[limba])}</span></a></li>`;
  }
  const s = t.scene[scena.id];
  return `<li><a href="#${scena.id}" data-mergi="${index}"><span class="meniu-nr">${String(index).padStart(2, '0')}</span><span class="meniu-loc">${esc(s.eticheta)}</span></a></li>`;
}

export function paginaLimba(continut, limba) {
  const { texte, traseu, produse } = continut;
  const t = texte[limba];
  const sectiuni = traseu.scene
    .map((scena, i) => {
      if (scena.tip === 'deschidere') return sectiuneDeschidere(i, continut, limba);
      if (scena.tip === 'produs') {
        const p = produse.sortimente.find((x) => x.id === scena.produs);
        if (!p) throw new Error(`Produsul „${scena.produs}” nu există în continut/produse.yaml`);
        return sectiuneProdus(p, i, continut, limba);
      }
      return '';
    })
    .join('\n');
  const meniu = traseu.scene.map((s, i) => elementMeniu(s, i, continut, limba)).join('\n          ');
  const limbi = texte.limbi
    .map(
      (l) =>
        `<a href="/${l}/" hreflang="${l}" lang="${l}"${l === limba ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`,
    )
    .join('');

  const textClient = {
    limba,
    moneda: produse.moneda,
    ui: t.ui,
  };

  return `<!doctype html>
<!-- Fișier generat automat din continut/ — nu îl edita direct. -->
<html lang="${limba}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>${esc(t.meta.titlu)}</title>
    <meta name="description" content="${esc(t.meta.descriere)}">
    <link rel="canonical" href="${urlLimba(texte, limba)}">
    ${alternate(texte)}
    <meta name="theme-color" content="#f3ede1">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Apisvania">
    <meta property="og:title" content="${esc(t.meta.titlu)}">
    <meta property="og:description" content="${esc(t.meta.descriere)}">
    <meta property="og:url" content="${urlLimba(texte, limba)}">
    <meta property="og:image" content="${texte.domeniu}/og/${limba}.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="${limba === 'ro' ? 'ro_RO' : 'en_GB'}">
    <meta name="twitter:card" content="summary_large_image">
    ${jsonLd(continut, limba)}
    <script>document.documentElement.classList.add('js')</script>
    <script type="module" src="/src/main.ts"></script>
  </head>
  <body>
    <a class="sari" href="#calatorie">${esc(t.ui.sari_la_continut)}</a>
    <div class="lume" aria-hidden="true">
      <canvas id="lume-canvas"></canvas>
      <canvas id="albina-canvas"></canvas>
      <div class="lume-voal"></div>
    </div>

    <header class="bara">
      <a class="bara-sigla" href="#deschidere" data-mergi="0" aria-label="Apisvania — ${esc(t.ui.sus)}">${MARCA_SVG}<span>Apisvania</span></a>
      <div class="bara-dreapta">
        <nav class="bara-limbi" aria-label="${esc(t.ui.limba)}">${limbi}</nav>
        <button class="bara-buton" type="button" id="buton-meniu" aria-expanded="false" aria-controls="meniu">
          <span class="bara-buton-icon icon-meniu" aria-hidden="true"></span><span class="bara-buton-text">${esc(t.ui.meniu)}</span>
        </button>
        <button class="bara-buton" type="button" id="buton-cos" aria-expanded="false" aria-controls="cos">
          <span class="bara-buton-icon icon-cos" aria-hidden="true"></span><span class="bara-buton-text">${esc(t.ui.cos)}</span>
          <span class="cos-numar" data-cos-numar hidden>0</span>
        </button>
      </div>
    </header>

    <nav class="meniu" id="meniu" aria-label="${esc(t.ui.meniu)}" hidden>
      <div class="meniu-cap"><p class="meniu-titlu">${esc(t.ui.meniu)}</p><button type="button" class="meniu-inchide" data-inchide>${esc(t.ui.inchide)}</button></div>
      <ol class="meniu-lista">
          ${meniu}
      </ol>
      <button type="button" class="meniu-miscare" data-miscare aria-pressed="false">${esc(t.ui.miscare_redusa)}</button>
    </nav>

    <aside class="cos" id="cos" aria-label="${esc(t.ui.cos)}" hidden>
      <div class="meniu-cap"><p class="meniu-titlu">${esc(t.ui.cos)}</p><button type="button" class="meniu-inchide" data-inchide>${esc(t.ui.inchide)}</button></div>
      <p class="cos-gol" data-cos-gol>${esc(t.ui.cos_gol)}</p>
      <ul class="cos-lista" data-cos-lista></ul>
    </aside>

    <div class="harta" aria-hidden="true"></div>
    <p class="anunt" role="status" aria-live="polite" data-anunt></p>

    <main id="calatorie" class="calatorie">${sectiuni}
    </main>

    <script type="application/json" id="date-client">${JSON.stringify(textClient).replaceAll('<', '\\u003c')}</script>
  </body>
</html>
`;
}

export function paginaRadacina(continut) {
  const { texte } = continut;
  const t = texte[texte.limba_implicita];
  const linkuri = texte.limbi
    .map((l) => `<a href="/${l}/" hreflang="${l}" lang="${l}">${esc(texte[l].nume_limba)}</a>`)
    .join(' · ');
  // The root only chooses a language: on Vercel the middleware redirects
  // before this page is ever served; locally this small script does it.
  return `<!doctype html>
<!-- Fișier generat automat din continut/ — nu îl edita direct. -->
<html lang="${texte.limba_implicita}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(t.meta.titlu)}</title>
    <meta name="description" content="${esc(t.meta.descriere)}">
    ${alternate(texte)}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <script>
      (function () {
        var limbi = ${JSON.stringify(texte.limbi)};
        var aleasa = null;
        try { aleasa = localStorage.getItem('apisvania-limba'); } catch (e) {}
        if (limbi.indexOf(aleasa) < 0) {
          var pref = (navigator.languages || [navigator.language || '']).map(function (l) { return String(l).slice(0, 2).toLowerCase(); });
          aleasa = pref.filter(function (l) { return limbi.indexOf(l) >= 0; })[0] || ${JSON.stringify(texte.limbi.includes('en') ? 'en' : texte.limba_implicita)};
        }
        location.replace('/' + aleasa + '/' + location.hash);
      })();
    </script>
    <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1b2420;color:#f6f0e4;font:16px/1.5 system-ui,sans-serif}a{color:#f2c66d}</style>
  </head>
  <body>
    <p>Apisvania — ${linkuri}</p>
  </body>
</html>
`;
}

export function genereaza() {
  const continut = incarcaContinut();
  writeFileSync(resolve(radacina, 'index.html'), paginaRadacina(continut));
  for (const limba of continut.texte.limbi) {
    mkdirSync(resolve(radacina, limba), { recursive: true });
    writeFileSync(resolve(radacina, limba, 'index.html'), paginaLimba(continut, limba));
  }
  return continut.texte.limbi;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const limbi = genereaza();
  console.log(`Pagini generate: /, ${limbi.map((l) => `/${l}/`).join(', ')}`);
}
