import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from './theme';
import { getStatus, setAccessCode } from './api';
import { storeAccessCode } from './storage';

// Web app : code d'accès commun demandé au premier lancement (gardé ensuite sur l'appareil).
export function AccessCodeScreen({ onDone }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const n = COLORS.neutral;

  const submit = async () => {
    const value = code.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    setAccessCode(value);
    try {
      await getStatus(); // vérifie le code auprès du serveur
      await storeAccessCode(value);
      onDone();
    } catch (e) {
      setAccessCode(null);
      setError(e.status === 401 ? 'Code incorrect' : 'Impossible de joindre le serveur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: n.bg }]}>
      <Image source={require('../assets/icon.png')} style={styles.logo} />
      <Text style={[styles.title, { color: n.text }]}>Code d'accès</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        onSubmitEditing={submit}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Le code partagé entre vous"
        placeholderTextColor={COLORS.switchTrackOff}
        style={[styles.input, { color: n.text, borderColor: n.soft }]}
      />
      <Pressable onPress={submit} disabled={busy} style={({ pressed }) => [styles.button, { backgroundColor: n.text, opacity: pressed || busy ? 0.7 : 1 }]}>
        {busy ? <ActivityIndicator color={n.onText} /> : <Text style={[styles.buttonText, { color: n.onText }]}>Valider</Text>}
      </Pressable>
      {error && <Text style={[styles.error, { color: COLORS.alert }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 120, height: 120, borderRadius: 28, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 20 },
  input: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    backgroundColor: COLORS.white,
  },
  button: { marginTop: 16, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 40 },
  buttonText: { fontSize: 17, fontWeight: '800' },
  error: { marginTop: 12, fontSize: 15 },
});
