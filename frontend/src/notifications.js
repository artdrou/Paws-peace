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
      shouldPlaySound: type === 'alert',
      shouldSetBadge: false,
    };
  },
});

export async function setupChannels() {
  await Notifications.setNotificationChannelAsync('moves', {
    name: 'Sorties et rentrées',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync('alert', {
    name: 'Alerte bagarre',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 600, 250, 600, 250, 600],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
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
