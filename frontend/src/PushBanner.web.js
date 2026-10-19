import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { enablePush, pushState } from './notifications';

// Web app : explique comment recevoir les notifications, ou propose de les activer.
const MESSAGES = {
  install: "Pour recevoir les notifications : touche Partager puis « Sur l'écran d'accueil », et ouvre Paws Peace depuis l'écran d'accueil.",
  denied: 'Notifications bloquées : autorise-les dans les réglages du navigateur.',
  unsupported: 'Ce navigateur ne peut pas recevoir les notifications.',
};

export function PushBanner({ t, cat }) {
  const [state, setState] = useState(pushState());
  const [error, setError] = useState(null);
  if (state === 'granted') return null;

  const enable = () =>
    enablePush(cat)
      .then(() => setState('granted'))
      .catch((e) => {
        setState(pushState());
        setError(e.message);
      });

  return (
    <View style={[styles.banner, { backgroundColor: t.card }]}>
      {state === 'default' ? (
        <Pressable onPress={enable} style={({ pressed }) => [styles.button, { backgroundColor: t.primary, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={[styles.buttonText, { color: t.onPrimary }]}>Activer les notifications</Text>
        </Pressable>
      ) : (
        <Text style={[styles.text, { color: t.text }]}>{MESSAGES[state]}</Text>
      )}
      {error && <Text style={[styles.text, { color: t.muted, marginTop: 8 }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 20, padding: 16, marginBottom: 16, alignItems: 'center' },
  text: { fontSize: 15, textAlign: 'center' },
  button: { borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 },
  buttonText: { fontSize: 16, fontWeight: '800' },
});
