import React from 'react';
import { CatWidget } from './CatWidget';
import { getStatus, toggle } from '../api';
import { getCat, getPushToken } from '../storage';

// Appelé par Android (sans ouvrir l'app) quand le widget est ajouté, mis à jour ou cliqué.
export async function widgetTaskHandler({ widgetAction, clickAction, renderWidget }) {
  if (widgetAction === 'WIDGET_DELETED') return;

  const myCat = await getCat();
  let status = null;
  let error = false;

  try {
    if (widgetAction === 'WIDGET_CLICK' && clickAction === 'TOGGLE' && myCat) {
      renderWidget(<CatWidget myCat={myCat} status={null} busy />);
      status = await toggle(myCat, await getPushToken());
    } else {
      status = await getStatus();
    }
  } catch {
    error = true;
  }

  renderWidget(<CatWidget myCat={myCat} status={status} error={error} />);
}
