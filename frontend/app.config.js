const fs = require('fs');

// google-services.json (relie l'app à Firebase/FCM pour les push).
// Il n'est pas commité (repo public) : sur les serveurs EAS il arrive par la
// variable d'environnement fichier GOOGLE_SERVICES_JSON, en local on prend le fichier.
module.exports = ({ config }) => {
  const file =
    process.env.GOOGLE_SERVICES_JSON ?? (fs.existsSync('./google-services.json') ? './google-services.json' : null);
  if (file) config.android.googleServicesFile = file;
  return config;
};
