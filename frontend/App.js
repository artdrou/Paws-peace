import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Image, Modal, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import { CATS, ALERT, ALERT_SOFT, buttonLabel, sinceLabel } from './src/cats';
import { getStatus, toggle } from './src/api';
import { getCat, setCat, getPushToken } from './src/storage';
import { setupChannels, registerForPush } from './src/notifications';
import { refreshWidgets } from './src/widget/refresh';

const PAWS = require('./assets/paws.png');

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
      <Wallpaper color={t.soft} />

      <View style={[styles.card, { backgroundColor: t.card }]}>
        {status ? (
          <>
            <CatRow c={other} state={theirs} t={t} size={72} big />
            <View style={[styles.sep, { backgroundColor: t.soft }]} />
            <CatRow c={me} state={mine} t={t} size={44} />
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
          { backgroundColor: t.primary, opacity: busy || !status ? 0.6 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={t.onPrimary} />
        ) : (
          <>
            <Image source={me.head} style={styles.buttonHead} />
            <Text style={[styles.buttonText, { color: t.onPrimary }]}>{status ? buttonLabel(cat, mine?.outside) : '…'}</Text>
          </>
        )}
      </Pressable>

      {error && <Text style={[styles.error, { color: ALERT }]}>{error}</Text>}

      <Pressable onPress={() => choose(null)} style={styles.switch}>
        <Text style={{ color: t.muted }}>Je ne suis pas avec {me.name} ? Changer de chat</Text>
      </Pressable>

      <Modal visible={bothOut && !alarmDismissed} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.alarm}>
            <View style={styles.alarmHeads}>
              <Image source={CATS.nara.head} style={styles.alarmHead} />
              <Image source={CATS.leon.head} style={styles.alarmHead} />
            </View>
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

// Papier peint de pattes : une tuile répétée, teintée selon le thème
function Wallpaper({ color }) {
  return <Image source={PAWS} resizeMode="repeat" style={[StyleSheet.absoluteFill, { tintColor: color }]} />;
}

// Une ligne « tête + nom + pastille dehors/dedans »
function CatRow({ c, state, t, size, big }) {
  const out = !!state?.outside;
  return (
    <View style={styles.row}>
      <Image source={c.head} style={{ width: size, height: size }} />
      <View style={styles.rowText}>
        <Text style={[big ? styles.big : styles.medium, { color: t.text }]}>{c.name}</Text>
        <View style={[styles.pill, { backgroundColor: out ? ALERT_SOFT : t.soft }]}>
          <Text style={[styles.pillText, { color: out ? ALERT : t.text }]}>
            {out ? `Dehors · ${sinceLabel(state.updatedAt)}` : "À l'intérieur"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ChooseScreen({ onChoose }) {
  return (
    <View style={[styles.screen, { backgroundColor: '#FAF7F2' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF7F2" />
      <Wallpaper color="#EFE6DA" />
      <Text style={styles.chooseTitle}>Quel est ton chat ?</Text>
      {Object.values(CATS).map((c) => (
        <Pressable
          key={c.key}
          onPress={() => onChoose(c.key)}
          style={({ pressed }) => [
            styles.chooseButton,
            { backgroundColor: c.theme.primary, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <Image source={c.head} style={styles.chooseHead} />
          <Text style={[styles.chooseText, { color: c.theme.onPrimary }]}>{c.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const shadow = { elevation: 3, shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } };

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 72, justifyContent: 'center' },
  card: { borderRadius: 28, padding: 24, minHeight: 180, justifyContent: 'center', ...shadow },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowText: { marginLeft: 16, flex: 1, alignItems: 'flex-start' },
  big: { fontSize: 26, fontWeight: '800' },
  medium: { fontSize: 18, fontWeight: '700' },
  pill: { marginTop: 6, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12 },
  pillText: { fontSize: 14, fontWeight: '600' },
  sep: { height: 2, borderRadius: 1, marginVertical: 20 },
  button: {
    marginTop: 24,
    height: 80,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  buttonHead: { width: 44, height: 44, marginRight: 12 },
  buttonText: { fontSize: 20, fontWeight: '800' },
  error: { marginTop: 16, textAlign: 'center' },
  switch: { marginTop: 32, alignItems: 'center' },
  chooseTitle: { fontSize: 28, fontWeight: '800', color: '#3A3530', marginBottom: 32, textAlign: 'center' },
  chooseButton: {
    height: 104,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadow,
  },
  chooseHead: { width: 64, height: 64, marginRight: 16 },
  chooseText: { fontSize: 28, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  alarm: { backgroundColor: ALERT, borderRadius: 28, padding: 28, alignItems: 'center' },
  alarmHeads: { flexDirection: 'row' },
  alarmHead: { width: 64, height: 64, marginHorizontal: 4 },
  alarmTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  alarmBody: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', marginTop: 12 },
  alarmButton: { marginTop: 24, backgroundColor: '#FFFFFF', borderRadius: 999, paddingVertical: 14, paddingHorizontal: 28 },
  alarmButtonText: { color: ALERT, fontSize: 17, fontWeight: '700' },
});
