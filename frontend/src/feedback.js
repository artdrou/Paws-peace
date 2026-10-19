import { Asset } from 'expo-asset';
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
let loading = null;
let timers = [];

// À appeler au démarrage de l'app. Dans l'APK, un son embarqué n'a pas d'adresse
// de fichier utilisable par le lecteur : on le copie d'abord en fichier local
// (downloadAsync), puis on crée le lecteur, qui doit avoir fini de charger avant
// de pouvoir jouer. Pas fait à l'import, car ce module est aussi chargé par la
// tâche du widget, qui n'a pas besoin de son.
export function preloadFeedback() {
  loading ??= (async () => {
    // playsInSilentMode : sinon expo-audio ignore play() quand le téléphone est en vibreur/silencieux.
    // duckOthers : baisse la musique en cours au lieu de la couper.
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
    for (const [name, source] of Object.entries(SOUNDS)) {
      try {
        const asset = Asset.fromModule(source);
        await asset.downloadAsync();
        players[name] = createAudioPlayer({ uri: asset.localUri ?? asset.uri });
      } catch (e) {
        console.warn(`[son] chargement de ${name} impossible`, e);
      }
    }
  })();
  return loading;
}

function playSound(player) {
  // Après une première lecture le lecteur est « terminé » : il faut que le retour
  // au début soit effectif avant play(), sinon play() ne fait rien.
  const start = async () => {
    player.volume = 1;
    await player.seekTo(0).catch(() => {});
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
  preloadFeedback()
    .then(() => players[name] && playSound(players[name]))
    .catch((e) => console.warn(`[son] lecture de ${name} impossible`, e));
  timers = HAPTIC_PATTERNS[name].map(([t, level]) =>
    setTimeout(() => Haptics.impactAsync(STYLES[level]).catch(() => {}), t + AUDIO_LATENCY)
  );
}
