import { API_URL, APP_KEY } from './config';

// Web app : pas de clé, mais le code d'accès saisi au premier lancement
let accessCode = null;
export const setAccessCode = (code) => {
  accessCode = code;
};
const authHeader = () => (APP_KEY ? { 'x-app-key': APP_KEY } : { 'x-access-code': accessCode ?? '' });

async function call(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// -> { nara: { outside, updatedAt }, leon: { outside, updatedAt } }
export const getStatus = () => call('/status');

// delay (ms) : le serveur attend avant d'envoyer les notifs ; une nouvelle bascule
// pendant ce délai annule la première
export const toggle = (cat, pushToken, delay = 0) =>
  call('/toggle', { method: 'POST', body: JSON.stringify({ cat, pushToken, delay }) });

// Envoie tout de suite les notifs d'une bascule en attente
export const confirm = (cat) => call('/confirm', { method: 'POST', body: JSON.stringify({ cat }) });

export const register = (pushToken, cat) =>
  call('/register', { method: 'POST', body: JSON.stringify({ pushToken, cat }) });

// Web app : clé publique Web Push du serveur, et inscription du navigateur
export const getVapidKey = () => call('/vapid-public-key');
export const registerWeb = (subscription, cat) =>
  call('/register-web', { method: 'POST', body: JSON.stringify({ subscription, cat }) });
