import AsyncStorage from '@react-native-async-storage/async-storage';

const CAT_KEY = 'myCat';
const TOKEN_KEY = 'pushToken';

export const getCat = () => AsyncStorage.getItem(CAT_KEY);
export const setCat = (cat) => (cat ? AsyncStorage.setItem(CAT_KEY, cat) : AsyncStorage.removeItem(CAT_KEY));

export const getPushToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const setPushToken = (t) => AsyncStorage.setItem(TOKEN_KEY, t);
