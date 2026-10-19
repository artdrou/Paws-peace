export const CATS = {
  nara: {
    key: 'nara',
    name: 'Nara',
    other: 'leon',
    sorti: 'sortie',
    rentre: 'rentrée',
    head: require('../assets/nara-head.png'),
    // fond bleu ciel, bouton jaune soleil (ses yeux), liens bleu-gris
    theme: { bg: '#DCEEFB', card: '#FFFFFF', soft: '#C6E2F6', primary: '#FFC93C', onPrimary: '#1F3442', link: '#5E7A8F', text: '#1F3442', muted: '#5D7385' },
  },
  leon: {
    key: 'leon',
    name: 'Léon',
    other: 'nara',
    sorti: 'sorti',
    rentre: 'rentré',
    head: require('../assets/leon-head.png'),
    // fond orangé, bouton turquoise, liens marron
    theme: { bg: '#FFE4C7', card: '#FFFFFF', soft: '#FBD2A8', primary: '#2EC4B6', onPrimary: '#0F3B37', link: '#8A5A3C', text: '#4A2C17', muted: '#9A6E4E' },
  },
};

export const ALERT = '#D9434F';
export const ALERT_SOFT = '#FBE0E2';
export const OUT_BUTTON = '#EF6F80'; // bouton quand son chat est dehors : rouge rosé

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
