// Vercel Routing Middleware: sends visitors of the bare domain to their
// language. Romanian for visitors from Romania and Moldova or with a Romanian
// browser, English for everyone else. A choice made on the site (cookie-free:
// the site remembers it in the browser) is honoured by the page itself.

export const config = { matcher: '/' };

const LIMBI = ['ro', 'en'];

export default function middleware(request) {
  const tara = (request.headers.get('x-vercel-ip-country') || '').toUpperCase();
  const preferinte = (request.headers.get('accept-language') || '')
    .split(',')
    .map((p) => p.trim().slice(0, 2).toLowerCase());
  let limba = preferinte.find((l) => LIMBI.includes(l)) || 'en';
  if (tara === 'RO' || tara === 'MD') limba = 'ro';
  const url = new URL(request.url);
  url.pathname = `/${limba}/`;
  return Response.redirect(url, 307);
}
