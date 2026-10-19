import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Réglages de l'app, gardés sur le téléphone (survivent aux mises à jour).
// sound   : sons joués dans l'app (miaulement, bagarre)
// haptics : vibrations calées sur ces sons
// Les notifications ne sont pas concernées (réglables dans les paramètres Android).

const KEY = 'settings';
const DEFAULTS = { sound: true, haptics: true };

let current = { ...DEFAULTS };
let loading = null;
const listeners = new Set();

export function loadSettings() {
  loading ??= AsyncStorage.getItem(KEY)
    .then((v) => {
      if (v) current = { ...DEFAULTS, ...JSON.parse(v) };
      return current;
    })
    .catch(() => current);
  return loading;
}

export const getSettings = () => current;

export function updateSettings(patch) {
  current = { ...current, ...patch };
  listeners.forEach((l) => l(current));
  AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => {});
}

export function useSettings() {
  const [settings, setSettings] = useState(current);
  useEffect(() => {
    loadSettings().then(setSettings);
    listeners.add(setSettings);
    return () => listeners.delete(setSettings);
  }, []);
  return settings;
}
