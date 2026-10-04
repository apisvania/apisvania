import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { viteSingleFile } from 'vite-plugin-singlefile';
// @ts-expect-error plain JS module
import { genereaza, incarcaContinut } from './scripts/genereaza-pagini.mjs';

// Regenerates the HTML pages whenever the editable content changes.
function paginiDinContinut(): Plugin {
  return {
    name: 'apisvania-pagini',
    buildStart() {
      genereaza();
    },
    configureServer(server) {
      const surse = ['continut/', 'scripts/genereaza-pagini.mjs', 'src/lume/traseu.json'];
      server.watcher.add(surse.map((s) => resolve(radacina, s)));
      server.watcher.on('change', (fisier) => {
        if (surse.some((s) => fisier.includes(s.replace(/\/$/, '')))) {
          try {
            genereaza();
            server.ws.send({ type: 'full-reload' });
          } catch (e) {
            console.error('\n[apisvania] Eroare în conținut:', (e as Error).message, '\n');
          }
        }
      });
    },
  };
}

const radacina = fileURLToPath(new URL('.', import.meta.url));

genereaza();

export default defineConfig(({ mode }) => {
  // `vite build --mode previzualizare` builds a single self-contained HTML
  // file (Romanian page) for a quick shareable preview.
  if (mode === 'previzualizare') {
    return {
      plugins: [paginiDinContinut(), viteSingleFile()],
      build: {
        outDir: 'dist-previzualizare',
        emptyOutDir: true,
        rollupOptions: { input: resolve(radacina, 'ro/index.html') },
      },
    };
  }
  const { texte } = incarcaContinut();
  const intrari: Record<string, string> = { radacina: resolve(radacina, 'index.html') };
  for (const l of texte.limbi as string[]) intrari[l] = resolve(radacina, l, 'index.html');
  return {
    plugins: [paginiDinContinut()],
    build: {
      target: 'es2020',
      rollupOptions: { input: intrari },
    },
  };
});
