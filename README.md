# Apisvania

Site-ul Apisvania: o călătorie după o albină, prin peisajele fiecărui sortiment de miere, pictate în stilul picturii japoneze cu tuș. Toată grafica este desenată din cod: nu există fotografii și nici imagini generate.

Traseul: stupina → livada în floare → câmpul de rapiță → pădurea de salcâm → câmpul cu flori sălbatice → pădurea de brad → liziera cu zmeur → pajiștea alpină → întoarcerea acasă (povestea, cererea de comandă, contactul) → din nou stupina.

## Cum îl pornești pe calculatorul tău

Ai nevoie o singură dată de **Node.js** (versiunea 20 sau mai nouă), de pe https://nodejs.org (butonul „LTS”).

Apoi, într-un terminal deschis în acest folder:

```
npm install
npm run dev
```

Deschide adresa afișată în terminal (de obicei http://localhost:5173). Modificările din fișierele de conținut apar imediat.

## Unde schimbi textele și prețurile

- **Produse, prețuri, gramaje, disponibilitate:** `continut/produse.yaml`. Cât timp la preț scrie `PRET_DE_COMPLETAT`, pe site apare „preț la cerere”. Pentru un preț real, scrie doar numărul, cu punct la zecimale (de exemplu `pret: 34.90`).
- **Celelalte texte (povestea, pașii, formularul, butoanele, textele pentru Google) și datele de contact:** `continut/texte.yaml`.

În ambele fișiere, la început, găsești explicații despre cum se editează. Păstrează spațiile de la începutul rândurilor exact cum sunt.

## Cererile de comandă

Formularul trimite cererile pe **apisvania@gmail.com** prin serviciul gratuit FormSubmit, fără server propriu și fără plată online.

**Important, o singură dată:** la prima cerere trimisă de pe site-ul publicat, FormSubmit trimite pe apisvania@gmail.com un e-mail de activare. Apasă linkul din el. Abia după activare cererile încep să ajungă în inbox.

Dacă trimiterea eșuează, clientul vede adresa de e-mail și numărul de telefon, ca să vă contacteze direct.

## Cum publici pe Vercel

1. Intră pe https://vercel.com cu contul de GitHub și alege **Add New → Project**.
2. Alege repository-ul `apisvania/apisvania`. Setările sunt deja în `vercel.json`, deci apeși doar **Deploy**.
3. În proiect, la **Settings → Domains**, adaugă `apisvania.com`, `www.apisvania.com` și `apisvania.eu`. Vercel îți arată ce înregistrări DNS trebuie puse la firma de la care ai cumpărat domeniile. Toate adresele trimit automat spre apisvania.com.
4. De acum, orice modificare urcată pe GitHub se publică singură în 1–2 minute.

Vizitatorii care intră pe apisvania.com ajung automat în română (din România și Moldova sau cu browserul în română) ori în engleză (restul).

## Stilul vechi, de schiță

Varianta anterioară, desenată în creion și acuarelă, e păstrată. O vezi adăugând `?stil=schita` la adresă, de exemplu http://localhost:5173/ro/?stil=schita.

## Pentru programatori

- `scripts/genereaza-pagini.mjs` generează paginile HTML statice (câte una pe limbă), `sitemap.xml` și `robots.txt`, din `continut/`.
- `scripts/genereaza-og.mjs` desenează imaginile pentru rețele sociale (`public/og/`). Are nevoie de Playwright și se rulează manual.
- `src/lume/` conține lumea 2.5D: randarea WebGL (`randare.ts`), lumea și camera (`lume.ts`), derularea infinită (`derulare.ts`), albina (`albina.ts`), stilul vizual (`stil.ts`) și scenele (`scene/`).
- `src/lume/pictura/` conține pictura procedurală: teren, copaci, flori, stupi și prim-planurile fiecărui sortiment (`flora.ts`).
- `src/lume/traseu.json` stabilește ordinea scenelor. O scenă nouă se adaugă acolo, în `scene/index.ts` și, dacă are produs, în `continut/produse.yaml`.
- `middleware.js` alege limba pentru adresa principală, pe Vercel.
