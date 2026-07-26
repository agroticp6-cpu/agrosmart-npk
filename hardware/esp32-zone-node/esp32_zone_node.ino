/*
 * AgroTIC Smart P6 - Noeud capteur de zone (ESP32 + capteur NPK RS485 + LoRa)
 * ---------------------------------------------------------------------------
 * Ce firmware tourne sur CHAQUE ESP32 plante dans une zone de la parcelle.
 * Il lit le capteur NPK (7/8-en-1, protocole Modbus RS485) via un module
 * MAX485, puis envoie les valeurs par LoRa vers le Raspberry Pi (passerelle).
 *
 * A CONFIGURER AVANT DE FLASHER CHAQUE ESP32 :
 *   - ZONE_ID     : copie-le depuis le site (bouton "Copier" dans le
 *                   panneau de la zone concernee)
 *   - Frequence LoRa, pins RS485/MAX485 selon ton cablage
 *
 * Bibliotheques necessaires (a installer via l'IDE Arduino / PlatformIO) :
 *   - RadioLib          (communication LoRa point-a-point)
 *   - ModbusMaster       (lecture du capteur NPK via Modbus RS485)
 *   - ArduinoJson        (construction du paquet de donnees)
 *
 * Cablage typique (Heltec WiFi LoRa 32 V3 ou ESP32 + module LoRa SX1262) :
 *   - MAX485 : DI -> GPIO17 (TX2), RO -> GPIO16 (RX2), DE/RE -> GPIO4
 *   - Capteur NPK relie au bus RS485 (A/B) sortant du MAX485
 *   - Module LoRa deja integre sur les cartes Heltec (SPI interne)
 */

#include <RadioLib.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

// ============ A CONFIGURER POUR CHAQUE ZONE ============
const char* ZONE_ID = "COLLE_ICI_L_ID_DE_LA_ZONE_COPIE_DEPUIS_LE_SITE";
const uint8_t MODBUS_SLAVE_ID = 1;        // adresse Modbus du capteur NPK (voir sa doc)
const float LORA_FREQUENCY = 868.0;       // 868 MHz (Europe/Afrique) ou 915.0 (Ameriques)
const uint32_t INTERVALLE_MESURE_MS = 15UL * 60UL * 1000UL; // 15 minutes entre mesures
// =========================================================

// --- Broches RS485 (a adapter selon ton cablage) ---
#define RS485_RX_PIN 16
#define RS485_TX_PIN 17
#define RS485_DE_RE_PIN 4

// --- Broches LoRa (exemple Heltec WiFi LoRa 32 V3, SX1262) ---
#define LORA_NSS_PIN 8
#define LORA_DIO1_PIN 14
#define LORA_RESET_PIN 12
#define LORA_BUSY_PIN 13

SX1262 radio = new Module(LORA_NSS_PIN, LORA_DIO1_PIN, LORA_RESET_PIN, LORA_BUSY_PIN);
ModbusMaster capteurNPK;

void preTransmission() { digitalWrite(RS485_DE_RE_PIN, HIGH); }
void postTransmission() { digitalWrite(RS485_DE_RE_PIN, LOW); }

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(RS485_DE_RE_PIN, OUTPUT);
  digitalWrite(RS485_DE_RE_PIN, LOW);

  Serial2.begin(4800, SERIAL_8N1, RS485_RX_PIN, RS485_TX_PIN);
  capteurNPK.begin(MODBUS_SLAVE_ID, Serial2);
  capteurNPK.preTransmission(preTransmission);
  capteurNPK.postTransmission(postTransmission);

  int etat = radio.begin(LORA_FREQUENCY);
  if (etat != RADIOLIB_ERR_NONE) {
    Serial.print("Erreur init LoRa, code : ");
    Serial.println(etat);
    while (true) { delay(1000); }
  }

  Serial.println("Noeud capteur pret. Zone : " + String(ZONE_ID));
}

/**
 * Lit le capteur NPK via Modbus. Adapter les adresses de registres selon
 * le modele exact de capteur (voir sa documentation, souvent JXCT ou
 * equivalent). Les valeurs ci-dessous sont un exemple courant :
 *   registre 0 = humidite, 1 = temperature, 2 = conductivite,
 *   3 = pH, 4 = N, 5 = P, 6 = K
 */
bool lireCapteurNPK(float &humidite, float &temperature, float &ec, float &ph,
                     float &N, float &P, float &K) {
  uint8_t resultat = capteurNPK.readHoldingRegisters(0x0000, 7);
  if (resultat != capteurNPK.ku8MBSuccess) {
    Serial.print("Erreur lecture Modbus, code : ");
    Serial.println(resultat);
    return false;
  }

  humidite = capteurNPK.getResponseBuffer(0) / 10.0;
  temperature = capteurNPK.getResponseBuffer(1) / 10.0;
  ec = capteurNPK.getResponseBuffer(2);
  ph = capteurNPK.getResponseBuffer(3) / 10.0;
  N = capteurNPK.getResponseBuffer(4);
  P = capteurNPK.getResponseBuffer(5);
  K = capteurNPK.getResponseBuffer(6);
  return true;
}

void envoyerParLoRa(float humidite, float temperature, float ec, float ph,
                     float N, float P, float K) {
  StaticJsonDocument<256> doc;
  doc["zoneId"] = ZONE_ID;
  doc["N"] = N;
  doc["P"] = P;
  doc["K"] = K;
  doc["humidite"] = humidite;
  doc["temperature"] = temperature;
  doc["ph"] = ph;
  doc["conductiviteElectrique"] = ec;
  doc["sourceAppareil"] = "esp32-" + String(ZONE_ID).substring(0, 8);

  char buffer[256];
  size_t taille = serializeJson(doc, buffer);

  int etat = radio.transmit((uint8_t*)buffer, taille);
  if (etat == RADIOLIB_ERR_NONE) {
    Serial.println("Paquet envoye : " + String(buffer));
  } else {
    Serial.print("Erreur envoi LoRa, code : ");
    Serial.println(etat);
  }
}

void loop() {
  float humidite, temperature, ec, ph, N, P, K;

  if (lireCapteurNPK(humidite, temperature, ec, ph, N, P, K)) {
    envoyerParLoRa(humidite, temperature, ec, ph, N, P, K);
  }

  delay(INTERVALLE_MESURE_MS);
}
