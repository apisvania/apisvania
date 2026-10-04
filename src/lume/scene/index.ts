import type { DefinitieScena } from '../lume';
import traseu from '../traseu.json';
import { deschidere } from './deschidere';
import { livada } from './livada';
import { rapita, salcam, poliflora, manaBrad, zmeura, iarbaNeagra, intoarcere } from './peisaje';
import { mediuStil } from '../stil';

const TOATE: Record<string, DefinitieScena> = {
  deschidere,
  primavara: livada,
  rapita,
  salcam,
  poliflora,
  'mana-brad': manaBrad,
  zmeura,
  'iarba-neagra': iarbaNeagra,
  intoarcere,
};

/** Scenes in the order given by src/lume/traseu.json. */
export function sceneDinTraseu(): DefinitieScena[] {
  return traseu.scene.map((s) => {
    const d = TOATE[s.id];
    if (!d) throw new Error(`Scena „${s.id}” nu are încă peisaj.`);
    return { ...d, mediu: mediuStil(d.id, d.mediu) };
  });
}
