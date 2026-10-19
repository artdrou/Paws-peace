import React, { useEffect, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';

// Mises à jour OTA (EAS Update) : expo-updates vérifie et télécharge au lancement,
// on revérifie au retour au premier plan. Une fois la maj téléchargée, on propose
// de redémarrer ; sinon elle s'applique au prochain lancement.
export function UpdatePrompt({ color, onColor, textColor }) {
  const { isUpdatePending } = Updates.useUpdates();
  const [later, setLater] = useState(false);

  useEffect(() => {
    if (!Updates.isEnabled) return; // dev build : pas d'OTA
    const sub = AppState.addEventListener('change', async (s) => {
      if (s !== 'active') return;
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // hors ligne ou vérification déjà en cours : on réessaiera plus tard
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <Modal visible={isUpdatePending && !later} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={[styles.title, { color: textColor }]}>Mise à jour disponible</Text>
          <Text style={[styles.body, { color: textColor }]}>Une nouvelle version de Paws Peace est prête.</Text>
          <Pressable onPress={() => Updates.reloadAsync()} style={[styles.button, { backgroundColor: color }]}>
            <Text style={[styles.buttonText, { color: onColor }]}>Redémarrer</Text>
          </Pressable>
          <Pressable onPress={() => setLater(true)} hitSlop={12} style={styles.later}>
            <Text style={{ color: textColor, opacity: 0.7 }}>Plus tard</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 28, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 16, textAlign: 'center', marginTop: 10 },
  button: { marginTop: 24, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 32 },
  buttonText: { fontSize: 17, fontWeight: '800' },
  later: { marginTop: 16 },
});
