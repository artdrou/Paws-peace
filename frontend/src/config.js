// Lus depuis frontend/.env (non commité, le repo est public)
export const API_URL = process.env.EXPO_PUBLIC_API_URL; // sans slash final
export const APP_KEY = process.env.EXPO_PUBLIC_APP_KEY;
export const NEEDS_ACCESS_CODE = false; // l'app Android a la clé ; seule la web app demande le code d'accès
