// Draws the social-media preview images (public/og/ro.png, en.png) from code:
// silk paper, a vermilion sun, ink hills and the Apisvania mark.
// Needs Playwright (not part of the site build):  node scripts/genereaza-og.mjs

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const radacina = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const texte = YAML.parse(readFileSync(resolve(radacina, 'continut/texte.yaml'), 'utf8'));
const font = (f) => readFileSync(resolve(radacina, 'node_modules/@fontsource-variable', f)).toString('base64');
const fraunces = font('fraunces/files/fraunces-latin-ext-soft-normal.woff2');
const fraunces2 = font('fraunces/files/fraunces-latin-soft-normal.woff2');
const inter = font('inter/files/inter-latin-wght-normal.woff2');
const inter2 = font('inter/files/inter-latin-ext-wght-normal.woff2');

function deal(seed, y, amp, w = 1200) {
  let d = `M0 630 L0 ${y}`;
  for (let x = 0; x <= w; x += 20) {
    const v = y - amp * (Math.sin(x / 140 + seed) * 0.6 + Math.sin(x / 57 + seed * 2) * 0.3 + Math.sin(x / 23 + seed) * 0.1);
    d += ` L${x} ${v.toFixed(1)}`;
  }
  return d + ' L1200 630 Z';
}

const pagina = (limba) => {
  const t = texte[limba].scene.deschidere;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:F;src:url(data:font/woff2;base64,${fraunces}) format('woff2');unicode-range:U+0100-02BA}
@font-face{font-family:F;src:url(data:font/woff2;base64,${fraunces2}) format('woff2')}
@font-face{font-family:I;src:url(data:font/woff2;base64,${inter2}) format('woff2');unicode-range:U+0100-02BA}
@font-face{font-family:I;src:url(data:font/woff2;base64,${inter}) format('woff2')}
body{margin:0;width:1200px;height:630px;overflow:hidden;background:#f1e8d4;font-family:I}
svg{position:absolute;inset:0}
.text{position:absolute;left:84px;top:150px;width:620px;color:#2b2622}
.sigla{display:flex;align-items:center;gap:18px;font-family:F;font-weight:560;font-size:30px;letter-spacing:.3em;margin-bottom:40px}
h1{font-family:F;font-weight:340;font-variation-settings:'SOFT' 100;font-size:72px;line-height:1.03;margin:0 0 18px}
p{font-size:24px;color:#5a5048;margin:0;letter-spacing:.02em}
</style></head><body>
<svg viewBox="0 0 1200 630" width="1200" height="630">
<defs><filter id="b"><feGaussianBlur stdDeviation="3"/></filter></defs>
<circle cx="930" cy="190" r="92" fill="#c4412c" opacity=".92"/>
<path d="${deal(1, 485, 45)}" fill="#a9b3c6" opacity=".55" filter="url(#b)"/>
<rect x="700" y="380" width="520" height="34" rx="17" fill="#efe3c2" opacity=".9"/>
<rect x="820" y="420" width="380" height="28" rx="14" fill="#efe3c2" opacity=".85"/>
<path d="${deal(4, 540, 35)}" fill="#a5b99a" opacity=".7" filter="url(#b)"/>
<path d="${deal(7, 588, 22)}" fill="#e3e7c3"/>
<path d="${deal(7, 588, 22).replace(/ L1200 630 Z$/, '').replace(/^M0 630 L/, 'M')}" fill="none" stroke="#2b2622" stroke-width="3" stroke-linecap="round" opacity=".55"/>
</svg>
<div class="text">
<div class="sigla"><svg viewBox="0 0 64 64" width="64" height="64" style="position:static"><g fill="none" stroke="#d4932a"><path d="M32 4.5 55.8 18.25v27.5L32 59.5 8.2 45.75v-27.5Z" stroke-width="2.6" stroke-linejoin="round"/><path d="M17.5 44.5 32 19l14.5 25.5" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/></g><path d="M32 29.2c1.9 2.5 4.3 5.3 4.3 7.6a4.3 4.3 0 0 1-8.6 0c0-2.3 2.4-5.1 4.3-7.6Z" fill="#d4932a"/></svg>APISVANIA</div>
<h1>${t.titlu}</h1>
<p>${t.supratitlu}</p>
</div></body></html>`;
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const limba of texte.limbi) {
  await page.setContent(pagina(limba), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(radacina, 'public/og', `${limba}.png`) });
  console.log(`public/og/${limba}.png`);
}
await browser.close();
