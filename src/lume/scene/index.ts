import type { DefinitieScena } from '../lume';
import traseu from '../traseu.json';
import { deschidere } from './deschidere';
import { livada } from './livada';

const TOATE: Record<string, DefinitieScena> = {
  deschidere,
  primavara: livada,
};

/** Scenes in the order given by src/lume/traseu.json. */
export function sceneDinTraseu(): DefinitieScena[] {
  return traseu.scene.map((s) => {
    const d = TOATE[s.id];
    if (!d) throw new Error(`Scena „${s.id}” nu are încă peisaj.`);
    return d;
  });
}
