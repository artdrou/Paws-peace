// Toutes les couleurs de l'app au même endroit, pour itérer facilement sur les thèmes.
//
// THEMES : un thème par chat, appliqué à l'app et au widget de la personne qui a choisi ce chat.
//   bg        fond de l'écran
//   card      cartes (statut, réglages)
//   soft      teinte douce : papier peint de pattes, séparateurs, pastille « à l'intérieur »
//   primary   gros bouton, switchs activés
//   onPrimary texte posé sur primary
//   link      liens et icônes (« Changer de chat », roue des réglages)
//   text      texte principal
//   muted     texte secondaire
// COLORS : couleurs communes aux deux thèmes.

export const THEMES = {
  // fond bleu ciel, bouton jaune soleil (ses yeux), liens bleu-gris
  nara: {
    bg: '#DCEEFB',
    card: '#FFFFFF',
    soft: '#C6E2F6',
    primary: '#FFC93C',
    onPrimary: '#1F3442',
    link: '#5E7A8F',
    text: '#1F3442',
    muted: '#5D7385',
  },
  // fond orangé, bouton turquoise, liens marron
  leon: {
    bg: '#FFE4C7',
    card: '#FFFFFF',
    soft: '#FBD2A8',
    primary: '#2EC4B6',
    onPrimary: '#0F3B37',
    link: '#8A5A3C',
    text: '#4A2C17',
    muted: '#9A6E4E',
  },
};

export const COLORS = {
  white: '#FFFFFF',
  shadow: '#000000',
  backdrop: 'rgba(0,0,0,0.45)', // fond assombri derrière les popups

  alert: '#D9434F', // les deux chats dehors : popup, widget, texte d'erreur
  alertSoft: '#FBE0E2', // pastille « dehors »
  outButton: '#EF6F80', // gros bouton quand son chat est dehors : rouge rosé
  confirm: '#A3E635', // bouton « Confirmer » : vert lime
  onConfirm: '#1A2E05',

  // écran de choix du chat (avant d'avoir un thème)
  neutral: { bg: '#FAF7F2', soft: '#EFE6DA', text: '#3A3530', onText: '#FFFFFF' },

  // switchs des réglages : la couleur « activé » est le primary du thème
  switchTrackOff: '#C9CDD3',
  switchThumbOn: '#FFFFFF',
  switchThumbOff: '#F1F2F4',
};

// Assombrit une couleur #RRGGBB (amount entre 0 et 1)
export function darken(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.round(c * (1 - amount)).toString(16).padStart(2, '0');
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
}
