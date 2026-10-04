# Apisvania

Site-ul Apisvania: o călătorie după o albină, prin peisajele fiecărui sortiment de miere. Toată grafica este desenată din cod: nu există fotografii și nici imagini generate.

## Cum îl pornești pe calculatorul tău

Ai nevoie o singură dată de **Node.js** (versiunea 20 sau mai nouă), de pe https://nodejs.org (butonul „LTS”).

Apoi, într-un terminal deschis în acest folder:

```
npm install
npm run dev
```

Deschide adresa afișată în terminal (de obicei http://localhost:5173). Modificările din fișierele de conținut apar imediat.

## Unde schimbi textele și prețurile

- **Produse, prețuri, gramaje, disponibilitate:** `continut/produse.yaml`
- **Celelalte texte (titluri, butoane, meta pentru Google):** `continut/texte.yaml`

În ambele fișiere, la începutul lor, găsești explicații despre cum se editează.

## Structura proiectului (pentru programatori)

- `scripts/genereaza-pagini.mjs` generează paginile HTML statice, câte una pe limbă, din `continut/`.
- `src/lume/` conține lumea 2.5D: randarea WebGL (`randare.ts`), lumea și camera (`lume.ts`), derularea infinită (`derulare.ts`), albina (`albina.ts`) și scenele (`scene/`).
- `src/lume/pictura/` conține pictura procedurală: dealuri, pajiști, copaci, flori și stupi.
- `src/lume/traseu.json` stabilește ordinea scenelor din călătorie.
