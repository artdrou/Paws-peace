// Backend "Paws Peace" — Express + Postgres + Expo Push
// Déployé sur Railway. Variables d'env : APP_KEY, DATABASE_URL (fourni par le plugin Postgres), PORT (fourni par Railway)

const express = require('express');
const { Pool } = require('pg');
const { Expo } = require('expo-server-sdk');

const PORT = process.env.PORT || 3000;
const APP_KEY = process.env.APP_KEY;
if (!APP_KEY) {
  console.error('APP_KEY manquant dans les variables d\'environnement');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const expo = new Expo();
const app = express();
app.use(express.json());

const CATS = {
  nara: { name: 'Nara', sorti: 'sortie', rentre: 'rentrée' },
  leon: { name: 'Léon', sorti: 'sorti', rentre: 'rentré' },
};
const OTHER = { nara: 'leon', leon: 'nara' };

// ---------- Base de données ----------

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cats (
      name TEXT PRIMARY KEY,
      outside BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS devices (
      push_token TEXT PRIMARY KEY,
      cat TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  // Historique des sorties/rentrées, pour les stats (pas utilisé par l'app)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      cat TEXT NOT NULL,
      outside BOOLEAN NOT NULL,
      at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  await pool.query(`INSERT INTO cats (name) VALUES ('nara'), ('leon') ON CONFLICT DO NOTHING`);
}

async function getStatus() {
  const { rows } = await pool.query('SELECT name, outside, updated_at FROM cats');
  const status = {};
  for (const r of rows) status[r.name] = { outside: r.outside, updatedAt: r.updated_at };
  return status;
}

// ---------- Notifications ----------

async function sendAll(messages) {
  if (!messages.length) return;
  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      // Nettoie les téléphones qui ont désinstallé l'app
      for (let i = 0; i < tickets.length; i++) {
        const t = tickets[i];
        if (t.status === 'error') {
          console.warn('Push error', t.message, t.details);
          if (t.details && t.details.error === 'DeviceNotRegistered') {
            await pool.query('DELETE FROM devices WHERE push_token = $1', [chunk[i].to]);
          }
        }
      }
    } catch (err) {
      console.error('Envoi push échoué', err);
    }
  }
}

async function notify(cat, outside, status, senderToken) {
  const { rows } = await pool.query('SELECT push_token FROM devices');
  const all = rows.map((r) => r.push_token).filter((t) => Expo.isExpoPushToken(t));
  const others = all.filter((t) => t !== senderToken);

  const c = CATS[cat];
  const o = CATS[OTHER[cat]];
  const otherOutside = status[OTHER[cat]].outside;
  const bothOut = status.nara.outside && status.leon.outside;
  const messages = [];

  if (outside && bothOut) {
    // Alerte : à tout le monde, y compris celui qui vient d'appuyer
    for (const to of all) {
      messages.push({
        to,
        channelId: 'baston',
        priority: 'high',
        sound: 'bagarre.wav',
        title: '⚠️ Les deux chats sont dehors !',
        body: `${c.name} vient de sortir alors que ${o.name} est déjà dehors.`,
        data: { type: 'alert', cat, outside },
      });
    }
  } else {
    // Notif normale : à tout le monde sauf celui qui a appuyé
    const title = outside ? `🐈 ${c.name} est ${c.sorti}` : `🏠 ${c.name} est ${c.rentre}`;
    const body = otherOutside ? `${o.name} est dehors en ce moment.` : `${o.name} est à l'intérieur.`;
    // canal Android (et donc son) selon sortie/rentrée, voir setupChannels côté app
    const channelId = outside ? 'sortie' : 'rentree';
    const sound = outside ? 'miaou_sortie.wav' : 'miaou_rentree.wav';
    for (const to of others) {
      messages.push({ to, channelId, sound, priority: 'high', title, body, data: { type: 'move', cat, outside } });
    }
  }

  // Message silencieux (data-only) pour que les widgets se mettent à jour en arrière-plan
  for (const to of others) {
    messages.push({ to, priority: 'high', data: { type: 'refresh' } });
  }

  await sendAll(messages);
}

// ---------- Routes ----------

app.get('/health', (req, res) => res.send('ok'));

// Tout le reste demande la clé partagée
app.use((req, res, next) => {
  if (req.get('x-app-key') === APP_KEY) return next();
  res.status(401).json({ error: 'unauthorized' });
});

app.get('/status', async (req, res, next) => {
  try {
    res.json(await getStatus());
  } catch (e) {
    next(e);
  }
});

app.post('/register', async (req, res, next) => {
  try {
    const { pushToken, cat } = req.body || {};
    if (!Expo.isExpoPushToken(pushToken) || !CATS[cat]) {
      return res.status(400).json({ error: 'pushToken ou cat invalide' });
    }
    await pool.query(
      `INSERT INTO devices (push_token, cat) VALUES ($1, $2)
       ON CONFLICT (push_token) DO UPDATE SET cat = $2, updated_at = now()`,
      [pushToken, cat]
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Inverse l'état du chat (dehors <-> dedans) et prévient les autres
app.post('/toggle', async (req, res, next) => {
  try {
    const { cat, pushToken } = req.body || {};
    if (!CATS[cat]) return res.status(400).json({ error: 'cat invalide' });

    // Bascule + ajout dans l'historique en une seule requête (atomique)
    const { rows } = await pool.query(
      `WITH u AS (
         UPDATE cats SET outside = NOT outside, updated_at = now() WHERE name = $1
         RETURNING name, outside, updated_at
       )
       INSERT INTO events (cat, outside, at) SELECT name, outside, updated_at FROM u
       RETURNING outside`,
      [cat]
    );
    const status = await getStatus();
    res.json(status); // on répond tout de suite, les notifs partent ensuite

    notify(cat, rows[0].outside, status, pushToken).catch((err) => console.error('notify', err));
  } catch (e) {
    next(e);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'server error' });
});

initDb()
  .then(() => app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`)))
  .catch((err) => {
    console.error('Init DB échouée', err);
    process.exit(1);
  });
