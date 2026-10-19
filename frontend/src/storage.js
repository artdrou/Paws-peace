import AsyncStorage from '@react-native-async-storage/async-storage';

const CAT_KEY = 'myCat';
const TOKEN_KEY = 'pushToken';
const ACCESS_CODE_KEY = 'accessCode';

export const getCat = () => AsyncStorage.getItem(CAT_KEY);
export const setCat = (cat) => (cat ? AsyncStorage.setItem(CAT_KEY, cat) : AsyncStorage.removeItem(CAT_KEY));

export const getPushToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const setPushToken = (t) => AsyncStorage.setItem(TOKEN_KEY, t);

// Web app : code d'accès saisi au premier lancement
export const getStoredAccessCode = () => AsyncStorage.getItem(ACCESS_CODE_KEY);
export const storeAccessCode = (c) => (c ? AsyncStorage.setItem(ACCESS_CODE_KEY, c) : AsyncStorage.removeItem(ACCESS_CODE_KEY));

// Appui du widget en attente d'envoi (horodatage), pour pouvoir l'annuler
const WIDGET_PENDING_KEY = 'widgetPending';
export const getWidgetPending = () => AsyncStorage.getItem(WIDGET_PENDING_KEY);
export const setWidgetPending = (id) =>
  id ? AsyncStorage.setItem(WIDGET_PENDING_KEY, id) : AsyncStorage.removeItem(WIDGET_PENDING_KEY);
