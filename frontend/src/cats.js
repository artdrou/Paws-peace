export const CATS = {
  nara: {
    key: 'nara',
    name: 'Nara',
    other: 'leon',
    sorti: 'sortie',
    rentre: 'rentrée',
    emoji: '🧡',
    theme: { bg: '#FFF4EC', card: '#FFFFFF', primary: '#E8743B', text: '#3A2416', muted: '#9A7B68' },
  },
  leon: {
    key: 'leon',
    name: 'Léon',
    other: 'nara',
    sorti: 'sorti',
    rentre: 'rentré',
    emoji: '💙',
    theme: { bg: '#EEF4FB', card: '#FFFFFF', primary: '#2F6FB5', text: '#14263A', muted: '#6A7F96' },
  },
};

export const ALERT = '#D7263D';

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
