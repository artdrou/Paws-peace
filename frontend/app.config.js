const fs = require('fs');

// google-services.json (clé FCM pour les push) n'est ajouté que s'il existe,
// pour pouvoir builder avant d'avoir configuré Firebase.
module.exports = ({ config }) => {
  if (fs.existsSync('./google-services.json')) {
    config.android.googleServicesFile = './google-services.json';
  }
  return config;
};
