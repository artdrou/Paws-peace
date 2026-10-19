import AsyncStorage from '@react-native-async-storage/async-storage';

const CAT_KEY = 'myCat';
const TOKEN_KEY = 'pushToken';

export const getCat = () => AsyncStorage.getItem(CAT_KEY);
export const setCat = (cat) => (cat ? AsyncStorage.setItem(CAT_KEY, cat) : AsyncStorage.removeItem(CAT_KEY));

export const getPushToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const setPushToken = (t) => AsyncStorage.setItem(TOKEN_KEY, t);

// Appui du widget en attente d'envoi (horodatage), pour pouvoir l'annuler
const WIDGET_PENDING_KEY = 'widgetPending';
export const getWidgetPending = () => AsyncStorage.getItem(WIDGET_PENDING_KEY);
export const setWidgetPending = (id) =>
  id ? AsyncStorage.setItem(WIDGET_PENDING_KEY, id) : AsyncStorage.removeItem(WIDGET_PENDING_KEY);
