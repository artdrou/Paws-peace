import { API_URL, APP_KEY } from './config';

async function call(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-app-key': APP_KEY },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// -> { nara: { outside, updatedAt }, leon: { outside, updatedAt } }
export const getStatus = () => call('/status');

export const toggle = (cat, pushToken) =>
  call('/toggle', { method: 'POST', body: JSON.stringify({ cat, pushToken }) });

export const register = (pushToken, cat) =>
  call('/register', { method: 'POST', body: JSON.stringify({ pushToken, cat }) });
