# AgroTIC Smart P6 — Plateforme de suivi de fertilisation

Plateforme d'agriculture de précision : cartographie interactive des zones d'une
parcelle, calcul automatique de l'état nutritionnel (NPK) par zone, alertes
Telegram en temps réel, et suivi des interventions de fertilisation.

## Stack technique

| Composant | Techno |
|---|---|
| Backend | Node.js + Express + Socket.IO |
| Base de données | MongoDB Atlas (free tier M0) |
| Frontend | React + Vite + Leaflet |
| Alertes | Bot Telegram |
| Stockage images | Cloudinary |
| Déploiement | Render (Blueprint `render.yaml`) |

## Structure du projet

```
agrosmart-npk/
├── backend/
│   ├── server.js                  point d'entree du serveur
│   ├── src/
│   │   ├── config/                connexion MongoDB, Socket.IO
│   │   ├── models/                schemas Mongoose
│   │   ├── middleware/            auth JWT + cle appareil IoT
│   │   ├── services/              moteur NPK, Telegram, alertes
│   │   ├── routes/                toutes les routes API REST
│   │   └── seed/                  scripts de donnees initiales
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/                 Login, liste parcelles, detail parcelle
│   │   ├── components/            carte, stats, panneau de zone, formulaires
│   │   ├── api/                   client axios + socket.io
│   │   └── context/               contexte d'authentification
│   └── .env.example
├── render.yaml                    blueprint de deploiement Render
└── hardware/                      firmware ESP32 + passerelle Raspberry Pi (voir hardware/README.md)
```

---

## 1. Étape 1 — MongoDB Atlas

1. Crée un compte sur [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Crée un cluster **M0 (gratuit, ne périme jamais)**
3. Dans **Database Access**, crée un utilisateur avec mot de passe
4. Dans **Network Access**, autorise `0.0.0.0/0` (nécessaire car Render utilise des IP dynamiques)
5. Dans **Connect > Drivers**, copie l'URI de connexion — elle ressemble à :
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/agrosmart?retryWrites=true&w=majority
   ```
6. Garde cette URI, elle va dans `MONGODB_URI`

---

## 2. Étape 2 — Bot Telegram

1. Ouvre Telegram, cherche **@BotFather**
2. Envoie `/newbot`, choisis un nom et un identifiant (doit finir par `bot`)
3. BotFather te donne un **token** (ex: `123456789:AAExemple...`) → c'est `TELEGRAM_BOT_TOKEN`
4. Le `TELEGRAM_CHAT_ID` s'obtient après le premier déploiement (voir étape 5)

---

## 3. Étape 3 — Cloudinary (stockage des images caméra)

1. Crée un compte gratuit sur [cloudinary.com](https://cloudinary.com)
2. Sur le tableau de bord, récupère : `Cloud name`, `API Key`, `API Secret`

---

## 4. Étape 4 — Mettre le projet sur GitHub

```bash
cd agrosmart-npk
git init
git add .
git commit -m "Initial commit - AgroSmart NPK"
git branch -M main
git remote add origin https://github.com/<ton-compte>/agrosmart-npk.git
git push -u origin main
```

⚠️ Vérifie que les fichiers `.env` ne sont **jamais** commités (le `.gitignore` fourni s'en charge).

---

## 5. Étape 5 — Déploiement sur Render

### Option A — Déploiement automatique via Blueprint (recommandé)

1. Sur [dashboard.render.com](https://dashboard.render.com), clique sur **New > Blueprint**
2. Connecte ton dépôt GitHub `agrosmart-npk`
3. Render détecte automatiquement `render.yaml` et propose de créer les deux services (`agrosmart-backend` et `agrosmart-frontend`)
4. Render te demande de remplir les variables marquées `sync: false` :
   - `MONGODB_URI` (étape 1)
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` (le compte que tu utiliseras pour te connecter)
   - `TELEGRAM_BOT_TOKEN` (étape 2)
   - `TELEGRAM_CHAT_ID` → laisse vide pour l'instant, tu le remplis après le premier déploiement
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (étape 3)
   - `FRONTEND_URL` → mets l'URL Render de ton frontend une fois créée (ex: `https://agrosmart-frontend.onrender.com`)
   - `VITE_API_URL` → `https://agrosmart-backend.onrender.com/api`
   - `VITE_SOCKET_URL` → `https://agrosmart-backend.onrender.com`
5. Lance le déploiement

### Option B — Déploiement manuel (si tu préfères configurer service par service)

**Backend :**
- New > Web Service > connecte le repo
- Root Directory : `backend`
- Build Command : `npm install`
- Start Command : `npm start`
- Ajoute toutes les variables listées dans `backend/.env.example`

**Frontend :**
- New > Static Site > connecte le repo
- Root Directory : `frontend`
- Build Command : `npm install && npm run build`
- Publish Directory : `dist`
- Ajoute `VITE_API_URL` et `VITE_SOCKET_URL`

---

## 6. Étape 6 — Relier ton compte Telegram (par utilisateur)

Chaque utilisateur relie **son propre** compte Telegram directement depuis le site, pas besoin de toucher à Render :

1. Connecte-toi sur le site (`https://agrosmart-frontend.onrender.com`)
2. Va dans **Paramètres**
3. Cherche ton bot sur Telegram (par le nom que tu lui as donné dans BotFather) et envoie-lui `/start`
4. Le bot te répond avec ton chat ID
5. Colle ce chat ID dans le champ "Ton identifiant Telegram" sur la page Paramètres, puis enregistre

Chaque utilisateur relie ainsi ses propres alertes, sur son propre compte Telegram.

📱 **Commandes Telegram disponibles une fois le compte relié** :
- `/etat` — résumé rapide (nombre de zones vertes/jaunes/rouges) de toutes tes parcelles
- `/parcelles` — détail zone par zone, avec le nutriment en carence le cas échéant
- `/aide` — rappel de ces commandes

⚠️ **Limite du free tier Render à connaître** : un service web gratuit s'endort après 15 minutes d'inactivité. Le bot Telegram en mode "polling" ne répond donc aux commandes que lorsque le service est réveillé — envoyer n'importe quelle commande réveille automatiquement le service en quelques secondes, mais la toute première réponse peut prendre un peu de temps.

---

## 7. Étape 7 — Données initiales (cultures + compte admin)

**Aucune action requise** : à chaque démarrage du serveur, la plateforme vérifie/crée automatiquement :
- **15 cultures** représentatives de l'agriculture sénégalaise — Maïs, Riz, Tomate, Oignon, Pomme de terre, Mil, Sorgho, Arachide, Niébé, Manioc, Sésame, Coton, Gombo, Pastèque, Bissap — avec leurs besoins NPK indicatifs par stade, une icône et une couleur (consultables sur la page **Cultures** du site)
- Le compte admin défini par `ADMIN_USERNAME` / `ADMIN_PASSWORD` (si ce compte n'existe pas déjà)

Cette initialisation automatique est **sans danger** si elle tourne plusieurs fois, et **met aussi à jour la liste des cultures** si de nouvelles sont ajoutées plus tard dans `cultures.data.js` (même sur une base de données déjà en service depuis longtemps).

⚠️ **Important** : les valeurs de besoins NPK dans `backend/src/seed/data/cultures.data.js` sont des **ordres de grandeur indicatifs** pour faire fonctionner la plateforme. Il faut les faire valider/ajuster par ton binôme agronomie (ou avec les données ISRA que tu as déjà utilisées) avant tout usage réel au champ.

Si tu veux forcer un nouveau seed manuellement (par exemple après avoir modifié les données de culture) :

```bash
cd backend
npm install
npm run seed
```

---

## 8. Étape 8 — Connecter le Raspberry Pi / ESP32

Le Raspberry Pi envoie les mesures capteur via une simple requête HTTP :

```bash
curl -X POST https://agrosmart-backend.onrender.com/api/mesures \
  -H "Content-Type: application/json" \
  -H "x-device-key: TA_CLE_DEVICE_API_KEY" \
  -d '{
    "zoneId": "ID_DE_LA_ZONE",
    "N": 45,
    "P": 20,
    "K": 35,
    "humidite": 22,
    "temperature": 28,
    "ph": 6.2,
    "conductiviteElectrique": 1.4,
    "sourceAppareil": "pi-zone-A5"
  }'
```

Pour envoyer une image caméra (en base64) :

```bash
curl -X POST https://agrosmart-backend.onrender.com/api/images \
  -H "Content-Type: application/json" \
  -H "x-device-key: TA_CLE_DEVICE_API_KEY" \
  -d '{
    "zoneId": "ID_DE_LA_ZONE",
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

La `DEVICE_API_KEY` est générée automatiquement par Render (ou définie manuellement) — récupère-la dans les variables d'environnement du backend.

📡 **Architecture retenue : un capteur fixe par zone (ESP32 + LoRa).** Le détail complet (firmware ESP32, script de passerelle Raspberry Pi, câblage) est dans `hardware/README.md`.

---

## 9. Utilisation quotidienne

1. Connecte-toi sur le frontend avec le compte admin créé à l'étape 7
2. Crée une parcelle (nom, culture, stade, coordonnées GPS)
3. Ajoute des zones (A1, A2, A3...) avec leurs coordonnées GPS
4. Une fois que le Raspberry Pi envoie des mesures, la carte se colore automatiquement en temps réel (vert/jaune/rouge)
5. Enregistre les fertilisations directement depuis le panneau de zone
6. Les alertes Telegram partent automatiquement en cas de dégradation d'une zone

---

## Ce qui est inclus dans ce MVP

- ✅ Inscription et connexion des utilisateurs (JWT)
- ✅ Cartographie interactive avec zones colorées en temps réel (Socket.IO)
- ✅ Calcul automatique de l'état nutritionnel par zone et par nutriment
- ✅ Onglets dédiés par parcelle : Carte, Mesures, Alertes, Historique
- ✅ Téléchargement CSV des alertes, mesures et fertilisations
- ✅ Envoi des récapitulatifs (alertes / historique) sur Telegram à la demande
- ✅ Chaque utilisateur relie son propre compte Telegram (page Paramètres)
- ✅ Changement de mot de passe depuis Paramètres
- ✅ Alertes Telegram automatiques (dégradation, criticité persistante)
- ✅ Anti-spam des alertes (cooldown configurable)
- ✅ Upload d'images caméra avec croisement basique NPK + stress
- ✅ Tableau de bord avec statistiques (% vert/jaune/rouge, nutriment le plus déficient...)
- ✅ Météo automatique basée sur la position GPS du navigateur (API Open-Meteo, gratuite, sans clé)
- ✅ Calendrier cultural par culture (durée de chaque stade, période de semis typique)
- ✅ Mise à jour du stade de développement de la parcelle directement depuis le site (levée → croissance → floraison → récolte)
- ✅ Données de cultures + compte admin initialisés automatiquement au premier démarrage
- ✅ Authentification JWT + clé API séparée pour les appareils IoT

## Roadmap (non inclus dans ce MVP)

- ⏳ Analyse IA des images caméra (YOLOv8 pour détection de stress) — actuellement le champ `stressDetecte` doit être envoyé par le Pi lui-même s'il fait le calcul localement
- ⏳ Communication LoRa multi-zones (le backend est prêt à recevoir des données de n'importe quelle source, il ne gère pas le protocole radio lui-même — ça se passe côté ESP32/passerelle)
- ⏳ Gestion multi-exploitations / multi-utilisateurs avancée (rôles, permissions fines)
- ⏳ Export de rapports PDF/Excel

---

## Dépannage rapide

| Problème | Solution |
|---|---|
| Le frontend n'affiche rien | Vérifie que `VITE_API_URL` pointe bien vers `/api` (avec le `/api` à la fin) |
| CORS bloqué | Vérifie que `FRONTEND_URL` sur le backend correspond exactement à l'URL Render du frontend |
| Pas d'alerte Telegram | Vérifie `TELEGRAM_ENABLED=true`, `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID` |
| Erreur MongoDB | Vérifie que l'IP `0.0.0.0/0` est autorisée dans Atlas Network Access |
| Le service met du temps à répondre | Normal sur le free tier Render — le service s'endort après 15 min d'inactivité (cold start ~30-60s) |
