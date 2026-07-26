#!/usr/bin/env python3
"""
AgroTIC Smart P6 - Passerelle LoRa -> Backend
-----------------------------------------------
Ce script tourne en continu sur le Raspberry Pi central. Il recoit les
paquets LoRa envoyes par chaque noeud capteur de zone (ESP32), les
decode, puis les transmet au backend via une simple requete HTTP POST.

Prerequis materiel :
  - Un module LoRa (SX1262/SX1276) relie au Raspberry Pi, configure en
    reception sur la meme frequence que les noeuds ESP32.
  - Ce script suppose que le module LoRa expose ses paquets recus sur un
    port serie (via un firmware relais, ex: un ESP32/Heltec en mode
    "recepteur brut" connecte en USB au Pi, qui republie chaque paquet
    recu en JSON sur le port serie). Adapter selon ton materiel exact.

Installation :
    pip install -r requirements.txt --break-system-packages

Configuration : copier .env.example en .env et remplir les valeurs.

Lancement :
    python3 gateway.py

Pour un fonctionnement permanent, ajouter ce script a un service systemd
(voir README.md de ce dossier).
"""

import json
import os
import time
import logging

import serial
import requests
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "https://agrosmart-backend.onrender.com/api/mesures")
DEVICE_API_KEY = os.getenv("DEVICE_API_KEY", "")
SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")
SERIAL_BAUDRATE = int(os.getenv("SERIAL_BAUDRATE", "115200"))
MAX_RETRIES = 3

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("passerelle")


def envoyer_au_backend(mesure: dict) -> bool:
    """Transmet une mesure recue par LoRa au backend via HTTP POST."""
    headers = {"Content-Type": "application/json", "x-device-key": DEVICE_API_KEY}

    for tentative in range(1, MAX_RETRIES + 1):
        try:
            reponse = requests.post(BACKEND_URL, json=mesure, headers=headers, timeout=15)
            if reponse.status_code in (200, 201):
                log.info(f"Mesure envoyee avec succes (zone {mesure.get('zoneId')})")
                return True
            log.warning(f"Reponse inattendue du backend : {reponse.status_code} - {reponse.text}")
        except requests.RequestException as err:
            log.warning(f"Tentative {tentative}/{MAX_RETRIES} echouee : {err}")
        time.sleep(2 * tentative)

    log.error(f"Echec definitif de l'envoi de la mesure : {mesure}")
    return False


def lire_paquets_serie():
    """
    Lit en continu les lignes JSON envoyees sur le port serie par le
    module LoRa recepteur, et les transmet au backend au fur et a mesure.
    """
    log.info(f"Ouverture du port serie {SERIAL_PORT} @ {SERIAL_BAUDRATE} bauds...")

    while True:
        try:
            with serial.Serial(SERIAL_PORT, SERIAL_BAUDRATE, timeout=5) as port:
                log.info("Passerelle active, en attente de paquets LoRa...")
                while True:
                    ligne = port.readline().decode("utf-8", errors="ignore").strip()
                    if not ligne:
                        continue

                    try:
                        mesure = json.loads(ligne)
                    except json.JSONDecodeError:
                        log.warning(f"Ligne recue non-JSON, ignoree : {ligne}")
                        continue

                    if "zoneId" not in mesure:
                        log.warning(f"Paquet sans zoneId, ignore : {mesure}")
                        continue

                    log.info(f"Paquet recu de la zone {mesure['zoneId']} : {mesure}")
                    envoyer_au_backend(mesure)

        except serial.SerialException as err:
            log.error(f"Erreur port serie : {err}. Nouvelle tentative dans 10s...")
            time.sleep(10)


if __name__ == "__main__":
    if not DEVICE_API_KEY:
        log.warning("DEVICE_API_KEY non definie - le backend rejettera les envois (401).")
    lire_paquets_serie()
