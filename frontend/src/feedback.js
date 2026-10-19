import { Asset } from 'expo-asset';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { HAPTIC_PATTERNS } from './haptic-patterns';
import { getSettings, loadSettings } from './settings';

// Son + vibration calée sur l'enveloppe du son, joués dans l'app
// (les notifs ont leurs propres sons via les canaux Android).

const SOUNDS = {
  sortie: require('../assets/sounds/miaou_sortie.wav'),
  bagarre: require('../assets/sounds/bagarre.wav'),
};
const SOUND_OF = { rentree: 'sortie' }; // la rentrée utilise le même miaulement que la sortie
const STYLES = { 1: Haptics.ImpactFeedbackStyle.Light, 2: Haptics.ImpactFeedbackStyle.Medium, 3: Haptics.ImpactFeedbackStyle.Heavy };
const AUDIO_LATENCY = 40; // ms : le son démarre un peu après l'appel à play()

const uris = {};
let loading = null;
let timers = [];

// À appeler au démarrage de l'app. Dans l'APK, un son embarqué n'a pas d'adresse
// de fichier utilisable par le lecteur : on le copie d'abord en fichier local.
// Pas fait à l'import, car ce module est aussi chargé par la tâche du widget.
export function preloadFeedback() {
  loading ??= (async () => {
    await loadSettings();
    // playsInSilentMode : sinon expo-audio ignore play() quand le téléphone est en vibreur/silencieux.
    // duckOthers : baisse la musique en cours au lieu de la couper.
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
    for (const [name, source] of Object.entries(SOUNDS)) {
      try {
        const asset = Asset.fromModule(source);
        await asset.downloadAsync();
        uris[name] = asset.localUri ?? asset.uri;
      } catch (e) {
        console.warn(`[son] chargement de ${name} impossible`, e);
      }
    }
  })();
  return loading;
}

// Un lecteur neuf par son, libéré à la fin : un lecteur déjà joué une fois
// ne repartait pas (relecture ignorée après la fin du son).
function playSound(uri) {
  const player = createAudioPlayer({ uri });
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    sub.remove();
    player.remove();
  };
  const sub = player.addListener('playbackStatusUpdate', (s) => s.didJustFinish && release());
  setTimeout(release, 10000); // filet de sécurité si la fin n'est jamais signalée
  player.play();
}

// Son et vibration selon les réglages (page Réglages)
export function playFeedback(event) {
  const name = SOUND_OF[event] ?? event;
  const { sound, haptics } = getSettings();
  timers.forEach(clearTimeout);
  timers = [];
  if (sound) {
    preloadFeedback()
      .then(() => uris[name] && playSound(uris[name]))
      .catch((e) => console.warn(`[son] lecture de ${name} impossible`, e));
  }
  if (!haptics) return;
  timers = HAPTIC_PATTERNS[name].map(([t, level]) =>
    setTimeout(() => Haptics.impactAsync(STYLES[level]).catch(() => {}), t + AUDIO_LATENCY)
  );
}
