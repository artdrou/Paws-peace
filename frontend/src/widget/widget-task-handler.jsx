import React from 'react';
import { CatWidget } from './CatWidget';
import { getStatus, toggle } from '../api';
import { getCat, getPushToken, getWidgetPending, setWidgetPending } from '../storage';

// Même délai que le bouton de l'app, géré par le serveur : la bascule part tout de
// suite et le serveur attend avant d'envoyer les notifs. Un second appui pendant
// ce délai renvoie une bascule, que le serveur traite comme une annulation.
const UNDO_DELAY = 5000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Appelé par Android (sans ouvrir l'app) quand le widget est ajouté, mis à jour ou cliqué.
export async function widgetTaskHandler({ widgetAction, clickAction, renderWidget }) {
  if (widgetAction === 'WIDGET_DELETED') return;

  const myCat = await getCat();
  let status = null;
  let error = false;

  try {
    if (widgetAction === 'WIDGET_CLICK' && clickAction === 'TOGGLE' && myCat) {
      const pending = await getWidgetPending();
      const token = await getPushToken();
      if (pending && Date.now() - Number(pending) < UNDO_DELAY) {
        // second appui pendant le délai : annulation
        await setWidgetPending(null);
        renderWidget(<CatWidget myCat={myCat} status={null} busy />);
        status = await toggle(myCat, token, UNDO_DELAY);
      } else {
        renderWidget(<CatWidget myCat={myCat} status={null} busy />);
        status = await toggle(myCat, token, UNDO_DELAY);
        const id = String(Date.now());
        await setWidgetPending(id);
        // pendant le délai, le widget montre l'état d'avant l'appui avec « Notif dans 5 s »
        const before = { ...status, [myCat]: { ...status[myCat], outside: !status[myCat].outside } };
        renderWidget(<CatWidget myCat={myCat} status={before} pending />);
        await sleep(UNDO_DELAY);
        if ((await getWidgetPending()) !== id) return; // annulé : l'autre appui a déjà redessiné le widget
        await setWidgetPending(null);
        status = await getStatus();
      }
    } else {
      status = await getStatus();
    }
  } catch {
    await setWidgetPending(null).catch(() => {});
    error = true;
  }

  renderWidget(<CatWidget myCat={myCat} status={status} error={error} />);
}
