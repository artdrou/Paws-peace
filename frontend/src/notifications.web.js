import { getVapidKey, registerWeb } from './api';
import { setPushToken } from './storage';

// Notifications de la web app : Web Push standard (service worker public/sw.js), sans Expo.

export async function setupChannels() {} // pas de canaux sur le web
export async function collapseNotifications() {} // le `tag` Web Push remplace déjà la notif précédente

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
// Sur iPhone, les notifs web ne marchent que si l'app est ouverte depuis l'écran d'accueil
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

// 'install' (iPhone : ajouter à l'écran d'accueil d'abord), 'unsupported', 'default', 'granted' ou 'denied'
export function pushState() {
  if (isIOS() && !isStandalone()) return 'install';
  if (!supported()) return 'unsupported';
  return Notification.permission;
}

let registration = null;
async function serviceWorker() {
  registration ??= await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return registration;
}

function base64UrlToBytes(b64) {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function subscribe(cat) {
  const reg = await serviceWorker();
  const { key } = await getVapidKey();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(key) }));
  await registerWeb(sub.toJSON(), cat);
  await setPushToken(sub.endpoint); // pour que le serveur ne nous notifie pas de nos propres appuis
  return sub.endpoint;
}

// Au démarrage : s'abonne seulement si c'est déjà autorisé
// (iPhone : la demande d'autorisation doit venir d'un appui, voir enablePush)
export async function registerForPush(cat) {
  if (!supported()) return null;
  await serviceWorker();
  if (pushState() !== 'granted') return null;
  return subscribe(cat);
}

// Bouton « Activer les notifications »
export async function enablePush(cat) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications refusées');
  return subscribe(cat);
}

export function onNotificationReceived(cb) {
  if (!supported()) return () => {};
  const handler = (e) => e.data?.type === 'push' && cb();
  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}
