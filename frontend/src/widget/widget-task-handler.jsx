import React from 'react';
import { CatWidget } from './CatWidget';
import { getStatus, toggle } from '../api';
import { getCat, getPushToken, getWidgetPending, setWidgetPending } from '../storage';

// Même délai que le bouton de l'app : un second appui pendant ce temps annule.
// (La tâche Android a 30 s pour finir : 5 s d'attente + l'appel réseau, ça passe.)
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
      // marque récente = appui en attente : ce second appui l'annule
      // (une marque plus vieille vient d'une tâche interrompue, on l'ignore)
      if (pending && Date.now() - Number(pending) < UNDO_DELAY + 5000) {
        await setWidgetPending(null);
        status = await getStatus();
      } else {
        const id = String(Date.now());
        await setWidgetPending(id);
        status = await getStatus();
        renderWidget(<CatWidget myCat={myCat} status={status} pending />);
        await sleep(UNDO_DELAY);
        if ((await getWidgetPending()) !== id) return; // annulé : l'autre appui a déjà redessiné le widget
        await setWidgetPending(null);
        renderWidget(<CatWidget myCat={myCat} status={status} busy />);
        status = await toggle(myCat, await getPushToken());
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
