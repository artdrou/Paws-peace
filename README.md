# Paws Peace 🐾

Petite app Android pour se prévenir quand Nara ou Léon sortent.

```
server/   → backend Express + Postgres, à déployer sur Railway
app/      → app Expo (React Native) + widget écran d'accueil
```

---

## 1. Backend sur Railway (≈ 10 min)

1. Mets le dossier `server/` dans un repo GitHub (ou utilise `railway up` depuis ce dossier).
2. Sur Railway : **New Project → Deploy from GitHub repo** (root directory : `server` si tout est dans un même repo).
3. Dans le projet : **+ New → Database → PostgreSQL**.
4. Dans le service Node, onglet **Variables** :
   - `DATABASE_URL` → référence vers la variable du Postgres (`${{Postgres.DATABASE_URL}}`)
   - `APP_KEY` → une longue chaîne aléatoire (ex. `openssl rand -hex 24`)
5. Onglet **Settings → Networking → Generate Domain** pour avoir une URL publique.
6. Test : `https://ton-app.up.railway.app/health` doit répondre `ok`.

Les tables sont créées automatiquement au démarrage.

---

## 2. Firebase (juste pour les clés de push, ≈ 5 min)

Expo Push passe par FCM sur Android, donc il faut un projet Firebase (gratuit, plan Spark, aucun code Firebase à écrire).

1. [console.firebase.google.com](https://console.firebase.google.com) → nouveau projet.
2. **Ajouter une app Android** avec le package `com.pawspeace.app` (le même que dans `app.json`).
3. Télécharge `google-services.json` et mets-le dans `app/`.
4. **Paramètres du projet → Comptes de service → Générer une nouvelle clé privée** → garde ce JSON, il servira à l'étape 3.

---

## 3. App Expo

### Créer le projet et installer les dépendances

```bash
npx create-expo-app@latest paws-peace --template blank
cd paws-peace

npx expo install expo-notifications expo-constants expo-task-manager expo-dev-client \
  @react-native-async-storage/async-storage react-native-android-widget
```

Puis copie par-dessus les fichiers du dossier `app/` de ce zip :
`App.js`, `index.js`, `app.json`, `eas.json`, le dossier `src/` et ton `google-services.json`.

Vérifie que `package.json` contient bien `"main": "index.js"`.

### Configurer

- `src/config.js` : mets l'URL Railway et la même `APP_KEY`.
- Change le package Android dans `app.json` si tu veux (et dans Firebase en conséquence).

### Lier à EAS et ajouter la clé FCM

```bash
npm install -g eas-cli
eas login
eas init                 # remplit extra.eas.projectId dans app.json
eas credentials          # Android → preview → Google Service Account → FCM V1
                         # → upload le JSON de la clé privée de l'étape 2.4
```

### Builder l'APK

```bash
eas build -p android --profile preview
```

À la fin, EAS donne un lien/QR code pour télécharger l'APK. Envoie-le aux trois autres :
ils autorisent l'installation depuis des sources inconnues et installent.

Alternative en local (Android Studio + JDK installés) :

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

### Développer / tester

Pas d'Expo Go possible (le widget et les notifs ont besoin de code natif). Fais un dev build une fois :

```bash
eas build -p android --profile development   # installe cet APK sur ton téléphone
npx expo start --dev-client
```

Ensuite le JS se recharge à chaud comme d'habitude. Pour tester le widget, il faut redémarrer l'app après modif de `CatWidget.jsx`.

---

## Comment ça marche

| Action | Ce qui se passe |
|---|---|
| Premier lancement | Choix du chat → enregistré localement + token push envoyé au serveur (`/register`) |
| Bouton (app ou widget) | `POST /toggle` → le serveur inverse l'état et renvoie le nouveau statut |
| Après un toggle | Le serveur envoie une notif aux **autres** téléphones (« Léon est sorti ») |
| Les deux chats dehors | Notif **Alerte bagarre** à **tout le monde** + popup rouge dans l'app |
| Mise à jour du widget | Push silencieux → tâche en arrière-plan → `requestWidgetUpdate`, et aussi à chaque clic / ouverture d'app / toutes les 30 min |

Deux canaux de notification sont créés : « Sorties et rentrées » (normal) et « Alerte bagarre » (priorité max, vibration). Chacun peut régler le son de l'alerte dans les paramètres Android de l'app.

---

## Points d'attention

- **Mise à jour du widget quand l'autre chat bouge** : elle repose sur le push silencieux traité en arrière-plan. Sur certains téléphones (Xiaomi, Huawei, Oppo, parfois Samsung), il faut **désactiver l'optimisation de batterie** pour l'app, sinon le widget peut rester en retard (les notifs visibles, elles, arrivent quand même).
- **Permission notifications** : demandée au premier lancement (Android 13+). Si elle est refusée, l'app affiche une erreur ; il faut l'activer dans les paramètres.
- **Bibliothèque widget** : si une version récente de `react-native-android-widget` change l'API, vérifie sa doc (le code utilise `registerWidgetTaskHandler`, `requestWidgetUpdate`, `FlexWidget`, `TextWidget`, `clickAction`).
- **Sécurité** : la clé partagée est dans l'APK. Suffisant pour 4 personnes, mais ne publie pas l'APK publiquement.
