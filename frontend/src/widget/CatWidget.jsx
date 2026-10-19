import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { CATS, statusLine, buttonLabel } from '../cats';
import { COLORS } from '../theme';

const FULL = { height: 'match_parent', width: 'match_parent' };

export function CatWidget({ myCat, status, error, busy, pending }) {
  if (!myCat) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{ ...FULL, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20, padding: 12 }}
      >
        <TextWidget text="Ouvre l'app pour choisir ton chat" style={{ fontSize: 14, color: COLORS.neutral.text }} />
      </FlexWidget>
    );
  }

  const me = CATS[myCat];
  const t = me.theme;
  const mine = status?.[myCat]?.outside;
  const theirs = status?.[me.other]?.outside;
  const both = !!(mine && theirs);

  const fg = both ? COLORS.white : t.text;
  const sub = both ? COLORS.white : t.muted;

  let title = '…';
  if (both) title = '⚠️ Les deux chats sont dehors !';
  else if (error) title = 'Hors ligne';
  else if (status) title = statusLine(me.other, theirs);

  const subtitle = status ? statusLine(myCat, mine) : ' ';
  const label = busy ? '…' : status ? buttonLabel(myCat, mine) : 'Réessayer';
  // pendant le délai d'annulation, le bouton prend déjà la couleur du nouvel état
  const showOutside = pending ? !mine : mine;

  return (
    <FlexWidget
      style={{
        ...FULL,
        backgroundColor: both ? COLORS.alert : t.bg,
        borderRadius: 20,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget clickAction="OPEN_APP" style={{ width: 'match_parent', flexDirection: 'column' }}>
        <TextWidget text={title} style={{ fontSize: 15, fontWeight: 'bold', color: fg }} />
        <TextWidget text={subtitle} style={{ fontSize: 13, color: sub, marginTop: 2 }} />
      </FlexWidget>

      <FlexWidget
        clickAction="TOGGLE"
        style={{
          width: 'match_parent',
          height: 48,
          marginTop: 8,
          backgroundColor: both ? COLORS.white : showOutside ? COLORS.outButton : t.primary,
          borderRadius: 14,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget text={label} style={{ fontSize: 15, fontWeight: 'bold', color: both ? COLORS.alert : t.onPrimary }} />
        {pending && <TextWidget text="Confirmation automatique dans 5 s · appuie pour annuler" style={{ fontSize: 11, color: both ? COLORS.alert : t.onPrimary }} />}
      </FlexWidget>
    </FlexWidget>
  );
}
