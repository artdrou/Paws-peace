import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import './src/notifications'; // définit la tâche arrière-plan au démarrage du JS
import App from './App';
import { widgetTaskHandler } from './src/widget/widget-task-handler';

registerRootComponent(App);
registerWidgetTaskHandler(widgetTaskHandler);
