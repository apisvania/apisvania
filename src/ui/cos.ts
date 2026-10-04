// The basket: kept in the browser so it survives reloads. No online payment —
// the basket becomes an order request (form comes with the final scene).

export interface ArticolCos {
  produs: string;
  nume: string;
  gramaj: string;
  pret: number | null;
  cantitate: number;
}

const CHEIE = 'apisvania-cos';

export class Cos {
  articole: ArticolCos[] = [];
  private ascultatori: (() => void)[] = [];

  constructor() {
    try {
      const salvat = JSON.parse(localStorage.getItem(CHEIE) ?? '[]');
      if (Array.isArray(salvat)) this.articole = salvat;
    } catch {
      this.articole = [];
    }
  }

  laSchimbare(fn: () => void) {
    this.ascultatori.push(fn);
  }

  private salveaza() {
    try {
      localStorage.setItem(CHEIE, JSON.stringify(this.articole));
    } catch {
      /* private mode: keep it in memory only */
    }
    this.ascultatori.forEach((f) => f());
  }

  adauga(a: Omit<ArticolCos, 'cantitate'>) {
    const existent = this.articole.find((x) => x.produs === a.produs && x.gramaj === a.gramaj);
    if (existent) existent.cantitate++;
    else this.articole.push({ ...a, cantitate: 1 });
    this.salveaza();
  }

  seteazaCantitate(i: number, n: number) {
    if (n <= 0) this.articole.splice(i, 1);
    else this.articole[i].cantitate = Math.min(99, n);
    this.salveaza();
  }

  get numar() {
    return this.articole.reduce((s, a) => s + a.cantitate, 0);
  }
}
