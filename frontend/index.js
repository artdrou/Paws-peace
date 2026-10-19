import { registerRootComponent } from 'expo';

import './src/native-init'; // Android : tâche arrière-plan des notifs + widget (rien sur le web)
import App from './App';

registerRootComponent(App);
