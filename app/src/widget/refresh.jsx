import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { CatWidget } from './CatWidget';
import { getStatus } from '../api';
import { getCat } from '../storage';

// Redessine tous les widgets "CatWidget" posés sur l'écran d'accueil.
// Si on a déjà le status (après un toggle dans l'app), on le passe pour éviter un appel réseau.
export async function refreshWidgets(knownStatus) {
  const myCat = await getCat();
  let status = knownStatus ?? null;
  let error = false;
  if (!status) {
    try {
      status = await getStatus();
    } catch {
      error = true;
    }
  }
  await requestWidgetUpdate({
    widgetName: 'CatWidget',
    renderWidget: () => <CatWidget myCat={myCat} status={status} error={error} />,
    widgetNotFound: () => {}, // aucun widget posé : rien à faire
  });
}
