import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Easing,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Notifications from 'expo-notifications';

import { CATS, buttonLabel, sinceLabel } from './src/cats';
import { COLORS, darken } from './src/theme';
import { confirm, getStatus, toggle } from './src/api';
import { getCat, setCat, getPushToken } from './src/storage';
import { setupChannels, registerForPush, collapseNotifications } from './src/notifications';
import { refreshWidgets } from './src/widget/refresh';
import { UpdatePrompt } from './src/UpdatePrompt';
import { SettingsScreen } from './src/SettingsScreen';
import { playFeedback, preloadFeedback } from './src/feedback';

const PAWS = require('./assets/paws.png');
const GEAR = require('./assets/gear.png');
const UNDO_DELAY = 5000; // délai avant l'envoi des notifs, pour pouvoir annuler un appui par erreur
const PAWS_TILE = 360; // taille de la tuile en dp

export default function App() {
  const [cat, setCatState] = useState(undefined); // undefined = chargement, null = pas encore choisi
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [alarmDismissed, setAlarmDismissed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  useEffect(() => {
    setupChannels().catch(() => {});
    preloadFeedback();
    getCat().then((c) => setCatState(c ?? null));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const s = await getStatus();
      if (pendingRef.current) return; // pendant le délai, on garde l'affichage d'avant l'appui
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
    const notifSub = Notifications.addNotificationReceivedListener(() => {
      refresh();
      setTimeout(() => collapseNotifications().catch(() => {}), 1500);
    });
    return () => {
      appSub.remove();
      notifSub.remove();
    };
  }, [cat, refresh]);

  // Appui sur le bouton : la bascule part tout de suite au serveur, qui attend UNDO_DELAY
  // avant d'envoyer les notifs (comme ça elles partent même si on quitte l'app).
  // Pendant ce délai : la barre se remplit, un second appui annule, « Confirmer » envoie tout de suite.
  // L'affichage garde l'état d'avant l'appui jusqu'à la fin du délai.
  const [pending, setPending] = useState(false);
  const [remaining, setRemaining] = useState(0); // secondes avant l'envoi, pour le compte à rebours
  const progress = useRef(new Animated.Value(0)).current;
  const pendingRef = useRef(false);
  const requestRef = useRef(null); // requête /toggle de l'appui en cours
  const resultRef = useRef(null); // état renvoyé par le serveur, affiché à la fin du délai
  const finishRef = useRef(null);
  pendingRef.current = pending;

  const stopPending = () => {
    progress.stopAnimation();
    progress.setValue(0);
    setPending(false);
  };

  // Fin du délai (ou app quittée) : le serveur envoie les notifs de lui-même
  finishRef.current = () => {
    stopPending();
    const req = requestRef.current;
    requestRef.current = null;
    if (resultRef.current) setStatus(resultRef.current);
    else req?.then((s) => s && setStatus(s));
  };

  // Annuler ou confirmer, une fois la requête de l'appui arrivée au serveur
  const followUp = (action) => {
    const req = requestRef.current ?? Promise.resolve(null);
    requestRef.current = null;
    stopPending();
    setBusy(true);
    req
      .then((sent) => sent && action())
      .then((s) => {
        if (!s) return;
        setStatus(s);
        setError(null);
        refreshWidgets(s).catch(() => {});
      })
      .catch(() => {
        setError('Impossible de joindre le serveur');
        refresh();
      })
      .finally(() => setBusy(false));
  };
  const cancelPress = () => followUp(async () => toggle(cat, await getPushToken(), UNDO_DELAY)); // 2e bascule = annulation
  const confirmPress = () => followUp(() => confirm(cat));

  // Les deux chats dehors : l'alerte s'affiche dès l'appui, sans attendre la fin du délai
  // (seule la notif aux autres attend)
  const mineOutside = pending ? !status?.[cat]?.outside : !!status?.[cat]?.outside;
  const otherOutside = !!(cat && status?.[CATS[cat].other]?.outside);
  const bothOut = mineOutside && otherOutside;
  useEffect(() => {
    if (!bothOut) setAlarmDismissed(false);
  }, [bothOut]);

  const alarmVisible = bothOut && !alarmDismissed;
  useEffect(() => {
    if (alarmVisible) playFeedback('bagarre');
  }, [alarmVisible]);

  const onPress = () => {
    if (pending) return cancelPress();
    const goingOut = !status?.[cat]?.outside;
    // si ça déclenche l'alerte, c'est le son de bagarre qui joue (via alarmVisible)
    if (!(goingOut && otherOutside)) playFeedback(goingOut ? 'sortie' : 'rentree');
    setRemaining(UNDO_DELAY / 1000);
    setPending(true);
    resultRef.current = null;
    requestRef.current = getPushToken()
      .then((token) => toggle(cat, token, UNDO_DELAY))
      .then((s) => {
        resultRef.current = s;
        setError(null);
        refreshWidgets(s).catch(() => {});
        return s;
      })
      .catch(() => {
        stopPending();
        setError('Impossible de joindre le serveur');
        refresh();
        return null;
      });
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: UNDO_DELAY, easing: Easing.linear, useNativeDriver: false }).start(
      ({ finished }) => finished && finishRef.current()
    );
  };

  useEffect(() => {
    if (!pending) return;
    const sub = AppState.addEventListener('change', (s) => s !== 'active' && finishRef.current());
    const id = progress.addListener(({ value }) => setRemaining(Math.max(1, Math.ceil(((1 - value) * UNDO_DELAY) / 1000))));
    return () => {
      sub.remove();
      progress.removeListener(id);
    };
  }, [pending]);

  const choose = async (c) => {
    if (pendingRef.current) finishRef.current();
    await setCat(c);
    setCatState(c);
    refreshWidgets().catch(() => {});
  };

  if (cat === undefined) return null;
  if (!cat) return <ChooseScreen onChoose={choose} />;

  const me = CATS[cat];
  const other = CATS[me.other];
  const t = me.theme;
  const mine = status?.[cat];
  const theirs = status?.[me.other];
  // pendant le délai, le bouton prend déjà la couleur du nouvel état
  const showOutside = pending ? !mine?.outside : mine?.outside;
  const buttonColor = showOutside ? COLORS.outButton : t.primary;

  if (showSettings) return <SettingsScreen t={t} onClose={closeSettings} wallpaper={<Wallpaper color={t.soft} />} />;

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.bg} />
      <Wallpaper color={t.soft} />

      <Pressable onPress={() => setShowSettings(true)} hitSlop={16} style={styles.gear}>
        {({ pressed }) => <Image source={GEAR} style={[styles.gearIcon, { tintColor: t.link, opacity: pressed ? 0.6 : 1 }]} />}
      </Pressable>

      <View style={[styles.card, { backgroundColor: t.card }]}>
        {status ? (
          <>
            <CatRow c={other} state={theirs} t={t} size={72} big />
            <View style={[styles.sep, { backgroundColor: t.soft }]} />
            <CatRow c={me} state={mine} t={t} size={44} />
          </>
        ) : (
          <ActivityIndicator color={t.link} />
        )}
      </View>

      <Pressable
        onPress={onPress}
        disabled={busy || !status}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: buttonColor, opacity: busy || !status ? 0.6 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        {pending && (
          <Animated.View
            style={[
              styles.buttonProgress,
              {
                backgroundColor: darken(buttonColor, 0.15),
                width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        )}
        {busy ? (
          <ActivityIndicator color={t.onPrimary} />
        ) : (
          <>
            <Image source={me.head} style={styles.buttonHead} />
            <Text style={[styles.buttonText, { color: t.onPrimary }]}>{status ? buttonLabel(cat, mine?.outside) : '…'}</Text>
            {pending && (
              <Text style={[styles.buttonHint, { color: t.onPrimary }]}>
                Les autres seront prévenus dans {remaining} s · appuie pour annuler
              </Text>
            )}
          </>
        )}
      </Pressable>

      {pending && (
        <Pressable
          onPress={confirmPress}
          style={({ pressed }) => [styles.confirm, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
        >
          <Text style={styles.confirmText}>Confirmer</Text>
        </Pressable>
      )}

      {error && <Text style={[styles.error, { color: COLORS.alert }]}>{error}</Text>}

      <View style={styles.switch}>
        <Text style={[styles.switchText, { color: t.muted }]}>Je ne suis pas avec {me.name} ?</Text>
        <Pressable onPress={() => choose(null)} hitSlop={12}>
          {({ pressed }) => (
            <Text style={[styles.switchLink, { color: t.link, opacity: pressed ? 0.6 : 1 }]}>Changer de chat</Text>
          )}
        </Pressable>
      </View>

      <Modal visible={alarmVisible} transparent animationType="fade">
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

      <UpdatePrompt color={t.primary} onColor={t.onPrimary} textColor={t.text} />
    </View>
  );
}

// Papier peint de pattes : grille de tuiles couvrant l'écran, teintées selon le thème
// (resizeMode="repeat" ne répète pas l'image sur Android)
function Wallpaper({ color }) {
  const { width, height } = useWindowDimensions();
  const tiles = [];
  for (let y = 0; y < height + PAWS_TILE; y += PAWS_TILE) {
    for (let x = 0; x < width; x += PAWS_TILE) {
      tiles.push(
        <Image
          key={`${x}-${y}`}
          source={PAWS}
          style={{ position: 'absolute', left: x, top: y, width: PAWS_TILE, height: PAWS_TILE, tintColor: color }}
        />
      );
    }
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {tiles}
    </View>
  );
}

// Une ligne « tête + nom + pastille dehors/dedans »
function CatRow({ c, state, t, size, big }) {
  const out = !!state?.outside;
  return (
    <View style={styles.row}>
      <Image source={c.head} style={{ width: size, height: size }} />
      <View style={styles.rowText}>
        <Text style={[big ? styles.big : styles.medium, { color: t.text }]}>{c.name}</Text>
        <View style={[styles.pill, { backgroundColor: out ? COLORS.alertSoft : t.soft }]}>
          <Text style={[styles.pillText, { color: out ? COLORS.alert : t.text }]}>
            {out ? `Dehors · ${sinceLabel(state.updatedAt)}` : "À l'intérieur"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ChooseScreen({ onChoose }) {
  return (
    <View style={[styles.screen, { backgroundColor: COLORS.neutral.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutral.bg} />
      <Wallpaper color={COLORS.neutral.soft} />
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

      <UpdatePrompt color={COLORS.neutral.text} onColor={COLORS.neutral.onText} textColor={COLORS.neutral.text} />
    </View>
  );
}

const shadow = { elevation: 3, shadowColor: COLORS.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } };

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 72, justifyContent: 'center' },
  gear: { position: 'absolute', top: 52, right: 24, zIndex: 1 },
  gearIcon: { width: 30, height: 30 },
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
    height: 160,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow,
  },
  buttonProgress: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  buttonHint: { fontSize: 13, fontWeight: '600', marginTop: 4, opacity: 0.85, textAlign: 'center', paddingHorizontal: 16 },
  buttonHead: { width: 72, height: 72, marginBottom: 10 },
  buttonText: { fontSize: 22, fontWeight: '800' },
  confirm: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: COLORS.confirm,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 32,
    ...shadow,
  },
  confirmText: { color: COLORS.onConfirm, fontSize: 17, fontWeight: '800' },
  error: { marginTop: 16, textAlign: 'center' },
  switch: { marginTop: 32, alignItems: 'center' },
  switchText: { textAlign: 'center' },
  switchLink: { marginTop: 4, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  chooseTitle: { fontSize: 28, fontWeight: '800', color: COLORS.neutral.text, marginBottom: 32, textAlign: 'center' },
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
  backdrop: { flex: 1, backgroundColor: COLORS.backdrop, justifyContent: 'center', padding: 24 },
  alarm: { backgroundColor: COLORS.alert, borderRadius: 28, padding: 28, alignItems: 'center' },
  alarmHeads: { flexDirection: 'row' },
  alarmHead: { width: 64, height: 64, marginHorizontal: 4 },
  alarmTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  alarmBody: { color: COLORS.white, fontSize: 16, textAlign: 'center', marginTop: 12 },
  alarmButton: { marginTop: 24, backgroundColor: COLORS.white, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 28 },
  alarmButtonText: { color: COLORS.alert, fontSize: 17, fontWeight: '700' },
});
