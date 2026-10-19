import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { CATS, ALERT, statusLine, buttonLabel } from '../cats';

const FULL = { height: 'match_parent', width: 'match_parent' };

export function CatWidget({ myCat, status, error, busy }) {
  if (!myCat) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{ ...FULL, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 12 }}
      >
        <TextWidget text="Ouvre l'app pour choisir ton chat" style={{ fontSize: 14, color: '#333333' }} />
      </FlexWidget>
    );
  }

  const me = CATS[myCat];
  const t = me.theme;
  const mine = status?.[myCat]?.outside;
  const theirs = status?.[me.other]?.outside;
  const both = !!(mine && theirs);

  const fg = both ? '#FFFFFF' : t.text;
  const sub = both ? '#FFFFFF' : t.muted;

  let title = '…';
  if (both) title = '⚠️ Les deux chats sont dehors !';
  else if (error) title = 'Hors ligne';
  else if (status) title = statusLine(me.other, theirs);

  const subtitle = status ? statusLine(myCat, mine) : ' ';
  const label = busy ? '…' : status ? buttonLabel(myCat, mine) : 'Réessayer';

  return (
    <FlexWidget
      style={{
        ...FULL,
        backgroundColor: both ? ALERT : t.bg,
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
          backgroundColor: both ? '#FFFFFF' : t.primary,
          borderRadius: 14,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget text={label} style={{ fontSize: 15, fontWeight: 'bold', color: both ? ALERT : t.onPrimary }} />
      </FlexWidget>
    </FlexWidget>
  );
}
