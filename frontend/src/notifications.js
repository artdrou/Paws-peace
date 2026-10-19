import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { register } from './api';
import { setPushToken } from './storage';
import { refreshWidgets } from './widget/refresh';

export const BG_TASK = 'CATS_BACKGROUND_NOTIFICATION';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Ne garde que la notif la plus récente par chat (et une seule alerte) :
// « Nara est sortie / rentrée / sortie » -> il ne reste que la dernière.
export async function collapseNotifications() {
  const latest = {};
  const list = await Notifications.getPresentedNotificationsAsync();
  for (const n of [...list].sort((a, b) => b.date - a.date)) {
    const d = n.request.content.data || {};
    const key = d.type === 'alert' ? 'alert' : d.type === 'move' ? `move-${d.cat}` : null;
    if (!key) continue;
    if (latest[key]) await Notifications.dismissNotificationAsync(n.request.identifier);
    else latest[key] = true;
  }
}

// Tâche lancée à la réception du push silencieux envoyé à chaque changement,
// même app fermée : on met le widget à jour et on regroupe les notifs.
TaskManager.defineTask(BG_TASK, async () => {
  try {
    await refreshWidgets();
  } catch (e) {
    // pas grave, le widget se rafraîchira au prochain clic / ouverture
  }
  try {
    await sleep(1500); // laisse la notif visible, envoyée en même temps, s'afficher d'abord
    await collapseNotifications();
  } catch (e) {
    // au pire, les anciennes notifs restent affichées
  }
});

// Comportement quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const type = notification.request.content.data?.type;
    const visible = type !== 'refresh';
    return {
      shouldShowAlert: visible,
      shouldShowBanner: visible,
      shouldShowList: visible,
      shouldPlaySound: false, // app ouverte : c'est l'app qui joue le son (src/feedback.js)
      shouldSetBadge: false,
    };
  },
});

// Sur Android le son est porté par le canal, et un canal ne peut plus être modifié
// une fois créé : un canal par son. Les fichiers sont embarqués via le plugin
// expo-notifications (app.json).
export async function setupChannels() {
  await Notifications.setNotificationChannelAsync('sortie', {
    name: 'Sorties',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'miaou_sortie.wav',
    vibrationPattern: [0, 250],
  });
  // même miaulement que la sortie ; nouvel identifiant car le son d'un canal ne change plus
  await Notifications.setNotificationChannelAsync('rentree_miaou', {
    name: 'Rentrées',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'miaou_sortie.wav',
    vibrationPattern: [0, 250],
  });
  await Notifications.setNotificationChannelAsync('baston', {
    name: 'Alerte bagarre',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'bagarre.wav',
    vibrationPattern: [0, 600, 250, 600, 250, 600],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  // anciens canaux (sans sons perso)
  await Notifications.deleteNotificationChannelAsync('moves').catch(() => {});
  await Notifications.deleteNotificationChannelAsync('alert').catch(() => {});
  await Notifications.deleteNotificationChannelAsync('rentree').catch(() => {});
}

export async function registerForPush(cat) {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') throw new Error('Notifications refusées');

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  await setPushToken(token);
  await register(token, cat);

  try {
    await Notifications.registerTaskAsync(BG_TASK);
  } catch (e) {
    console.warn('Tâche arrière-plan non enregistrée', e);
  }
  return token;
}

// Appelle cb à chaque notif reçue quand l'app est ouverte ; renvoie la fonction de désabonnement
export function onNotificationReceived(cb) {
  const sub = Notifications.addNotificationReceivedListener(cb);
  return () => sub.remove();
}
