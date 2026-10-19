import { Asset } from 'expo-asset';
import { HAPTIC_PATTERNS } from './haptic-patterns';
import { getSettings, loadSettings } from './settings';

// Web app : son via le lecteur audio du navigateur, vibration seulement si le navigateur
// la permet (Chrome Android oui, Safari iPhone non).

const SOUNDS = {
  sortie: require('../assets/sounds/miaou_sortie.wav'),
  bagarre: require('../assets/sounds/bagarre.wav'),
};
const SOUND_OF = { rentree: 'sortie' }; // la rentrée utilise le même miaulement que la sortie

const audios = {};

export function preloadFeedback() {
  loadSettings();
  for (const [name, source] of Object.entries(SOUNDS)) {
    audios[name] ??= new Audio(Asset.fromModule(source).uri);
    audios[name].preload = 'auto';
  }
}

// Pattern haptique (impulsions toutes les 40 ms, force 1 à 3) -> [vibre, pause, vibre, pause…]
// pour navigator.vibrate. Sans réglage d'intensité sur le web, une impulsion forte dure plus longtemps.
function vibrationPattern(events) {
  const pattern = [0]; // commence par une vibration nulle : la suite alterne pause / vibration
  let t = 0;
  for (const [at, level] of events) {
    const length = 10 + level * 8;
    pattern.push(Math.max(0, at - t), length);
    t = at + length;
  }
  return pattern;
}

export function playFeedback(event) {
  const name = SOUND_OF[event] ?? event;
  const { sound, haptics } = getSettings();
  if (sound) {
    preloadFeedback();
    const audio = audios[name];
    audio.currentTime = 0;
    audio.play().catch(() => {}); // refusé si aucun appui avant (règle des navigateurs)
  }
  if (haptics && 'vibrate' in navigator) navigator.vibrate(vibrationPattern(HAPTIC_PATTERNS[name]));
}
