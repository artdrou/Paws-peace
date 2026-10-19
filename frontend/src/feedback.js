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

// À appeler au démarrage de l'app : un lecteur doit avoir fini de charger avant
// de pouvoir jouer (sinon play() est ignoré). Pas fait à l'import, car ce module
// est aussi chargé par la tâche du widget, qui n'a pas besoin de son.
export function preloadFeedback() {
  setAudioModeAsync({ interruptionMode: 'duckOthers' }).catch(() => {}); // baisse la musique en cours au lieu de la couper
  for (const [name, source] of Object.entries(SOUNDS)) {
    try {
      players[name] ??= createAudioPlayer(source);
    } catch {
      // pas de son, on garde la vibration
    }
  }
}

function playSound(player) {
  const start = () => {
    player.seekTo(0).catch(() => {});
    player.play();
  };
  if (player.isLoaded) return start();
  const sub = player.addListener('playbackStatusUpdate', (s) => {
    if (s.isLoaded) {
      sub.remove();
      start();
    }
  });
}

export function playFeedback(name) {
  timers.forEach(clearTimeout);
  timers = [];
  if (!players[name]) preloadFeedback();
  try {
    playSound(players[name]);
  } catch {
    // pas de son, on garde la vibration
  }
  timers = HAPTIC_PATTERNS[name].map(([t, level]) =>
    setTimeout(() => Haptics.impactAsync(STYLES[level]).catch(() => {}), t + AUDIO_LATENCY)
  );
}
