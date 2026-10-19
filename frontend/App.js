import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import { CATS, ALERT, statusLine, buttonLabel, sinceLabel } from './src/cats';
import { getStatus, toggle } from './src/api';
import { getCat, setCat, getPushToken } from './src/storage';
import { setupChannels, registerForPush } from './src/notifications';
import { refreshWidgets } from './src/widget/refresh';

export default function App() {
  const [cat, setCatState] = useState(undefined); // undefined = chargement, null = pas encore choisi
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [alarmDismissed, setAlarmDismissed] = useState(false);

  useEffect(() => {
    setupChannels().catch(() => {});
    getCat().then((c) => setCatState(c ?? null));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const s = await getStatus();
      setStatus(s);
      setError(null);
      refreshWidgets(s).catch(() => {});
    } catch {
      setError('Impossible de joindre le serveur');
    }
  }, []);

  useEffect(() => {
    if (!cat) return;
    registerForPush(cat).catch((e) => setError(e.message));
    refresh();
    const appSub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const notifSub = Notifications.addNotificationReceivedListener(() => refresh());
    return () => {
      appSub.remove();
      notifSub.remove();
    };
  }, [cat, refresh]);

  const bothOut = !!(status?.nara?.outside && status?.leon?.outside);
  useEffect(() => {
    if (!bothOut) setAlarmDismissed(false);
  }, [bothOut]);

  const choose = async (c) => {
    await setCat(c);
    setCatState(c);
    refreshWidgets().catch(() => {});
  };

  const onToggle = async () => {
    setBusy(true);
    try {
      const s = await toggle(cat, await getPushToken());
      setStatus(s);
      setError(null);
      refreshWidgets(s).catch(() => {});
    } catch {
      setError('Impossible de joindre le serveur');
    } finally {
      setBusy(false);
    }
  };

  if (cat === undefined) return null;
  if (!cat) return <ChooseScreen onChoose={choose} />;

  const me = CATS[cat];
  const other = CATS[me.other];
  const t = me.theme;
  const mine = status?.[cat];
  const theirs = status?.[me.other];

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.bg} />

      <View style={[styles.card, { backgroundColor: t.card }]}>
        {status ? (
          <>
            <Text style={[styles.big, { color: theirs?.outside ? ALERT : t.text }]}>
              {statusLine(me.other, theirs?.outside)}
            </Text>
            {theirs?.outside && <Text style={[styles.small, { color: t.muted }]}>{sinceLabel(theirs.updatedAt)}</Text>}

            <View style={[styles.sep, { backgroundColor: t.bg }]} />

            <Text style={[styles.medium, { color: t.text }]}>{statusLine(cat, mine?.outside)}</Text>
            {mine?.outside && <Text style={[styles.small, { color: t.muted }]}>{sinceLabel(mine.updatedAt)}</Text>}
          </>
        ) : (
          <ActivityIndicator color={t.primary} />
        )}
      </View>

      <Pressable
        onPress={onToggle}
        disabled={busy || !status}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: t.primary, opacity: pressed || busy || !status ? 0.7 : 1 },
        ]}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{status ? buttonLabel(cat, mine?.outside) : '…'}</Text>
        )}
      </Pressable>

      {error && <Text style={[styles.error, { color: ALERT }]}>{error}</Text>}

      <Pressable onPress={() => choose(null)} style={styles.switch}>
        <Text style={{ color: t.muted }}>Je ne suis pas avec {me.name} ? Changer de chat</Text>
      </Pressable>

      <Modal visible={bothOut && !alarmDismissed} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.alarm}>
            <Text style={styles.alarmEmoji}>⚠️</Text>
            <Text style={styles.alarmTitle}>Les deux chats sont dehors !</Text>
            <Text style={styles.alarmBody}>
              {me.name} et {other.name} sont sortis en même temps. Risque de bagarre.
            </Text>
            <Pressable onPress={() => setAlarmDismissed(true)} style={styles.alarmButton}>
              <Text style={styles.alarmButtonText}>OK, je gère</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ChooseScreen({ onChoose }) {
  return (
    <View style={[styles.screen, { backgroundColor: '#FAFAFA' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <Text style={styles.chooseTitle}>Quel est ton chat ?</Text>
      {Object.values(CATS).map((c) => (
        <Pressable
          key={c.key}
          onPress={() => onChoose(c.key)}
          style={({ pressed }) => [styles.chooseButton, { backgroundColor: c.theme.primary, opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.chooseText}>
            {c.emoji} {c.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 72, justifyContent: 'center' },
  card: { borderRadius: 24, padding: 24, minHeight: 160, justifyContent: 'center' },
  big: { fontSize: 26, fontWeight: '700' },
  medium: { fontSize: 18, fontWeight: '600' },
  small: { fontSize: 14, marginTop: 4 },
  sep: { height: 2, borderRadius: 1, marginVertical: 18 },
  button: { marginTop: 24, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  error: { marginTop: 16, textAlign: 'center' },
  switch: { marginTop: 32, alignItems: 'center' },
  chooseTitle: { fontSize: 28, fontWeight: '700', color: '#222222', marginBottom: 32, textAlign: 'center' },
  chooseButton: { height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  chooseText: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  alarm: { backgroundColor: ALERT, borderRadius: 24, padding: 28, alignItems: 'center' },
  alarmEmoji: { fontSize: 48 },
  alarmTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  alarmBody: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', marginTop: 12 },
  alarmButton: { marginTop: 24, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28 },
  alarmButtonText: { color: ALERT, fontSize: 17, fontWeight: '700' },
});
