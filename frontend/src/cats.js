export const CATS = {
  nara: {
    key: 'nara',
    name: 'Nara',
    other: 'leon',
    sorti: 'sortie',
    rentre: 'rentrée',
    head: require('../assets/nara-head.png'),
    // sauge : gris-jaune-vert
    theme: { bg: '#F4F5E6', card: '#FFFFFF', soft: '#E7EACB', primary: '#BCC07A', onPrimary: '#33361C', text: '#33361C', muted: '#83866A' },
  },
  leon: {
    key: 'leon',
    name: 'Léon',
    other: 'nara',
    sorti: 'sorti',
    rentre: 'rentré',
    head: require('../assets/leon-head.png'),
    // terracotta rosé
    theme: { bg: '#FBEDE6', card: '#FFFFFF', soft: '#F3D9CD', primary: '#CF8E78', onPrimary: '#45221A', text: '#45221A', muted: '#9A766A' },
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
