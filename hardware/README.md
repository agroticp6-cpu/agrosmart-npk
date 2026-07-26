# Architecture matérielle — Un capteur fixe par zone (Option A)

Ce dossier contient le code pour la collecte automatique des données NPK,
zone par zone, via des capteurs fixes communiquant en LoRa.

## Vue d'ensemble

```
[Zone A1]                    [Zone A2]                    [Zone A3]
ESP32 + NPK + LoRa            ESP32 + NPK + LoRa            ESP32 + NPK + LoRa
      │                             │                             │
      └──────────────── LoRa (868/915 MHz) ────────────────────────┘
                              │
                    Raspberry Pi (passerelle)
                    hardware/raspberry-pi-gateway/gateway.py
                              │
                         Internet (4G/WiFi)
                              │
                    Backend (Render) → MongoDB Atlas
                    POST /api/mesures
```

## Étape 1 — Créer la zone sur le site avant de flasher l'ESP32

1. Connecte-toi sur le site, ouvre ta parcelle, ajoute la zone (ex: "A5") avec ses coordonnées GPS
2. Clique sur la zone dans la carte pour ouvrir son panneau de détail
3. Copie son **ID technique** avec le bouton "Copier" (nouvel encart ajouté sous les infos de la zone)

Cet ID est indispensable : c'est lui qui permettra au backend de savoir que la mesure vient bien de cette zone précise.

## Étape 2 — Flasher chaque ESP32

Ouvre `esp32-zone-node/esp32_zone_node.ino` dans l'IDE Arduino (ou PlatformIO) :

1. Installe les bibliothèques : `RadioLib`, `ModbusMaster`, `ArduinoJson`
2. Modifie la ligne `ZONE_ID` avec l'ID copié à l'étape 1
3. Vérifie/adapte les broches selon ton câblage exact (voir commentaires dans le fichier)
4. Flash le firmware sur l'ESP32 destiné à cette zone

Répète cette étape pour chaque zone, avec son propre `ZONE_ID`.

⚠️ Les adresses de registres Modbus dans le firmware (`readHoldingRegisters`) sont un exemple courant pour les capteurs NPK type JXCT. Vérifie la documentation exacte de ton modèle de capteur — les adresses peuvent légèrement varier.

## Étape 3 — Configurer la passerelle Raspberry Pi

```bash
cd hardware/raspberry-pi-gateway
pip install -r requirements.txt --break-system-packages
cp .env.example .env
# Editer .env : renseigner BACKEND_URL et DEVICE_API_KEY (la meme cle que sur Render)
python3 gateway.py
```

Ce script écoute en continu les paquets reçus par le module LoRa du Raspberry Pi et les transmet automatiquement au backend.

Pour qu'il tourne en permanence (même après un redémarrage du Pi), crée un service systemd :

```bash
sudo nano /etc/systemd/system/agrosmart-gateway.service
```

```ini
[Unit]
Description=AgroSmart LoRa Gateway
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/agrosmart-npk/hardware/raspberry-pi-gateway/gateway.py
WorkingDirectory=/home/pi/agrosmart-npk/hardware/raspberry-pi-gateway
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable agrosmart-gateway
sudo systemctl start agrosmart-gateway
sudo journalctl -u agrosmart-gateway -f   # pour voir les logs en direct
```

## Notes importantes

- **Le format exact de réception LoRa côté Pi dépend de ton module matériel.** Ce script suppose que les paquets arrivent déjà décodés en JSON sur un port série (cas le plus simple : un second ESP32/Heltec branché en USB au Pi, qui fait juste office de récepteur LoRa et republie ce qu'il reçoit sur le port série). Si tu utilises un module LoRa HAT directement sur les GPIO du Pi, il faudra adapter la partie lecture du script en conséquence.
- **Intervalle de mesure** : configuré à 15 minutes dans le firmware ESP32 (`INTERVALLE_MESURE_MS`), ajustable selon le besoin (plus fréquent = plus réactif mais plus de consommation batterie).
- **Alimentation** : chaque nœud ESP32 fonctionnant sur batterie/solaire au champ, garde l'intervalle raisonnable pour économiser l'énergie.
