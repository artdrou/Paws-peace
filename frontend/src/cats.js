export const CATS = {
  nara: {
    key: 'nara',
    name: 'Nara',
    other: 'leon',
    sorti: 'sortie',
    rentre: 'rentrée',
    head: require('../assets/nara-head.png'),
    // fond bleu ciel, bouton bleu-gris
    theme: { bg: '#DCEEFB', card: '#FFFFFF', soft: '#C6E2F6', primary: '#5E7A8F', onPrimary: '#FFFFFF', text: '#1F3442', muted: '#5D7385' },
  },
  leon: {
    key: 'leon',
    name: 'Léon',
    other: 'nara',
    sorti: 'sorti',
    rentre: 'rentré',
    head: require('../assets/leon-head.png'),
    // fond orangé, bouton marron
    theme: { bg: '#FFE4C7', card: '#FFFFFF', soft: '#FBD2A8', primary: '#8A5A3C', onPrimary: '#FFFFFF', text: '#4A2C17', muted: '#9A6E4E' },
  },
};

export const ALERT = '#D9434F';
export const ALERT_SOFT = '#FBE0E2';

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
