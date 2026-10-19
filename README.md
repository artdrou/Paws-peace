# Paws Peace

Paws Peace est une petite application Android pensée pour une situation bien précise : deux chats voisins, Nara et Léon, qui ne se supportent pas. Quand ils se croisent dehors, ça finit en bagarre. L'application permet aux quatre humains concernés de savoir en un coup d'œil quel chat est dehors, et d'être prévenus immédiatement si les deux sortent en même temps.

## Le principe

Au premier lancement, on indique de quel chat on s'occupe : Nara ou Léon. L'application prend alors la couleur de son chat, orange pour Nara, bleu pour Léon.

L'écran principal se résume à deux choses :

- le statut de l'autre chat, dehors ou à l'intérieur, avec l'heure de sortie ;
- un grand bouton pour signaler que son propre chat vient de sortir, qui devient ensuite le bouton pour signaler qu'il est rentré.

Il n'y a rien d'autre. L'objectif est qu'un geste suffise.

## Les notifications

Chaque sortie et chaque rentrée déclenche une notification chez les trois autres personnes, par exemple « Léon est sorti » ou « Nara est rentrée ».

Si un chat sort alors que l'autre est déjà dehors, tout le monde reçoit une alerte prioritaire avec vibration, et l'application affiche un écran rouge. C'est le moment d'aller récupérer l'un des deux.

Les alertes et les notifications ordinaires passent par deux canaux séparés. Chacun peut donc régler le son de l'alerte indépendamment dans les paramètres Android.

## Le widget

Un widget pour l'écran d'accueil reprend l'essentiel de l'application : le statut des deux chats et le bouton sortie/rentrée. On peut signaler une sortie sans ouvrir l'application. Le widget passe au rouge quand les deux chats sont dehors.

## Sous le capot

Le dépôt contient deux parties.

`server/` est un petit serveur Node.js (Express) avec une base PostgreSQL, hébergé sur Railway. Il garde l'état des deux chats, connaît les téléphones inscrits et envoie les notifications via le service de push d'Expo. Les requêtes sont protégées par une clé partagée entre l'application et le serveur.

`app/` est l'application mobile, écrite en React Native avec Expo. Le widget utilise la bibliothèque `react-native-android-widget`. L'application est distribuée sous forme d'APK, construit avec EAS Build, et installée directement sur les quatre téléphones.

## Mise en route

1. Déployer `server/` sur Railway avec une base PostgreSQL et la variable `APP_KEY`.
2. Créer un projet Firebase pour obtenir `google-services.json` et la clé FCM utilisée par Expo Push.
3. Renseigner l'URL du serveur et la clé dans `app/src/config.js`.
4. Construire l'APK avec `eas build -p android --profile preview` et l'envoyer aux autres.

## Limites connues

Sur certains téléphones (Xiaomi, Huawei, Oppo, parfois Samsung), l'optimisation de batterie peut retarder la mise à jour du widget quand l'autre chat change d'état. Désactiver cette optimisation pour Paws Peace règle le problème. Les notifications, elles, arrivent normalement.

L'application est prévue pour un usage privé entre voisins et n'a pas vocation à être publiée sur le Play Store.
