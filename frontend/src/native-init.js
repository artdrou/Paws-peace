// Initialisation propre à Android, chargée au démarrage du JS (app, widget, tâches) :
// tâche d'arrière-plan des notifs et gestionnaire du widget.
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import './notifications';
import { widgetTaskHandler } from './widget/widget-task-handler';

registerWidgetTaskHandler(widgetTaskHandler);
