import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { HAPTIC_PATTERNS } from './haptic-patterns';

// Son + vibration calée sur l'enveloppe du son, joués dans l'app
// (les notifs ont leurs propres sons via les canaux Android).

const SOUNDS = {
  sortie: require('../assets/sounds/miaou_sortie.wav'),
  rentree: require('../assets/sounds/miaou_rentree.wav'),
  bagarre: require('../assets/sounds/bagarre.wav'),
};
const STYLES = { 1: Haptics.ImpactFeedbackStyle.Light, 2: Haptics.ImpactFeedbackStyle.Medium, 3: Haptics.ImpactFeedbackStyle.Heavy };
const AUDIO_LATENCY = 40; // ms : le son démarre un peu après l'appel à play()

const players = {};
let timers = [];

setAudioModeAsync({ interruptionMode: 'duckOthers' }).catch(() => {}); // baisse la musique en cours au lieu de la couper

export function playFeedback(name) {
  timers.forEach(clearTimeout);
  timers = [];
  try {
    players[name] ??= createAudioPlayer(SOUNDS[name]);
    players[name].seekTo(0);
    players[name].play();
  } catch {
    // pas de son, on garde la vibration
  }
  timers = HAPTIC_PATTERNS[name].map(([t, level]) =>
    setTimeout(() => Haptics.impactAsync(STYLES[level]).catch(() => {}), t + AUDIO_LATENCY)
  );
}
