import { THEMES } from './theme';

export const CATS = {
  nara: {
    key: 'nara',
    name: 'Nara',
    other: 'leon',
    sorti: 'sortie',
    rentre: 'rentrée',
    head: require('../assets/nara-head.png'),
    theme: THEMES.nara,
  },
  leon: {
    key: 'leon',
    name: 'Léon',
    other: 'nara',
    sorti: 'sorti',
    rentre: 'rentré',
    head: require('../assets/leon-head.png'),
    theme: THEMES.leon,
  },
};

export function statusLine(catKey, outside) {
  const c = CATS[catKey];
  return outside ? `${c.name} est dehors` : `${c.name} est à l'intérieur`;
}

export function buttonLabel(catKey, outside) {
  const c = CATS[catKey];
  return outside ? `${c.name} est ${c.rentre}` : `${c.name} est ${c.sorti}`;
}

export function sinceLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const today = new Date().toDateString() === d.toDateString();
  return today ? `depuis ${hh}h${mm}` : `depuis le ${d.getDate()}/${d.getMonth() + 1} à ${hh}h${mm}`;
}
