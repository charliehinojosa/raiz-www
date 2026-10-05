import { initHero } from './hero';
import { initRadio } from './radio';
import { initTrailer } from './trailer';

const radio = initRadio();
initTrailer({ onOpen: () => radio.pause() });
initHero();
