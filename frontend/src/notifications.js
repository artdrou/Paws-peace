import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { register } from './api';
import { setPushToken } from './storage';
import { refreshWidgets } from './widget/refresh';

export const BG_TASK = 'CATS_BACKGROUND_NOTIFICATION';

// Tâche lancée quand une notif arrive app fermée (messages data-only) :
// on met juste le widget à jour avec l'état du serveur.
TaskManager.defineTask(BG_TASK, async () => {
  try {
    await refreshWidgets();
  } catch (e) {
    // pas grave, le widget se rafraîchira au prochain clic / ouverture
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
  await Notifications.setNotificationChannelAsync('rentree', {
    name: 'Rentrées',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'miaou_rentree.wav',
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
