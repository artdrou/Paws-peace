import React, { useEffect } from 'react';
import { BackHandler, Pressable, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { COLORS } from './theme';
import { updateSettings, useSettings } from './settings';

// Page Réglages : sons et vibrations de l'app, aux couleurs du chat choisi.
export function SettingsScreen({ t, onClose, wallpaper }) {
  const settings = useSettings();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.bg} />
      {wallpaper}

      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12}>
          {({ pressed }) => <Text style={[styles.back, { color: t.link, opacity: pressed ? 0.6 : 1 }]}>‹ Retour</Text>}
        </Pressable>
        <Text style={[styles.title, { color: t.text }]}>Réglages</Text>
      </View>

      <View style={[styles.card, { backgroundColor: t.card }]}>
        <SettingRow
          t={t}
          label="Sons"
          hint="Miaulement et bagarre dans l'app"
          value={settings.sound}
          onChange={(sound) => updateSettings({ sound })}
        />
        <View style={[styles.sep, { backgroundColor: t.soft }]} />
        <SettingRow
          t={t}
          label="Vibrations"
          hint="Retour haptique calé sur les sons"
          value={settings.haptics}
          onChange={(haptics) => updateSettings({ haptics })}
        />
      </View>

      <Text style={[styles.note, { color: t.muted }]}>
        Les notifications gardent leurs propres sons et vibrations, réglables dans les paramètres Android.
      </Text>
    </View>
  );
}

// Switch à deux états de couleur : couleur du thème quand activé, gris quand désactivé
function SettingRow({ t, label, hint, value, onChange }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.row}>
      <View style={styles.rowText}>
        <Text style={[styles.label, { color: t.text }]}>{label}</Text>
        <Text style={[styles.hint, { color: t.muted }]}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.switchTrackOff, true: t.primary }}
        thumbColor={value ? COLORS.switchThumbOn : COLORS.switchThumbOff}
        ios_backgroundColor={COLORS.switchTrackOff}
      />
    </Pressable>
  );
}

const shadow = { elevation: 3, shadowColor: COLORS.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } };

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 56 },
  header: { marginBottom: 24 },
  back: { fontSize: 17, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', marginTop: 16 },
  card: { borderRadius: 28, paddingHorizontal: 20, paddingVertical: 8, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  rowText: { flex: 1, marginRight: 12 },
  label: { fontSize: 18, fontWeight: '700' },
  hint: { fontSize: 14, marginTop: 2 },
  sep: { height: 2, borderRadius: 1 },
  note: { fontSize: 13, marginTop: 16, textAlign: 'center', paddingHorizontal: 12 },
});
