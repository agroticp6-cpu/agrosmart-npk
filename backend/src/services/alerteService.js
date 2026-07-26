const Alerte = require("../models/Alerte");
const telegramService = require("./telegramService");
const { getIO } = require("../config/socket");

const COOLDOWN_MS = Number(process.env.ALERT_COOLDOWN_MINUTES ?? 60) * 60 * 1000;

/**
 * Verifie si une alerte peut etre envoyee maintenant pour cette zone
 * (evite d'inonder Telegram avec la meme notification en boucle).
 */
function cooldownEcoule(zone) {
  if (!zone.dernierAlerteAt) return true;
  const depuisMs = Date.now() - new Date(zone.dernierAlerteAt).getTime();
  return depuisMs >= COOLDOWN_MS;
}

/**
 * Cree une alerte en base, l'envoie sur Telegram et la diffuse en temps reel
 * via Socket.IO. Respecte le cooldown pour eviter le spam.
 */
async function declencherAlerte({ parcelle, zone, type, etat, nutrimentDeficient, pourcentages }) {
  if (!cooldownEcoule(zone)) {
    console.log(`Alerte ignoree (cooldown actif) pour la zone ${zone.nom}.`);
    return null;
  }

  const messages = {
    degradation_vert_jaune: `La zone ${zone.nom} est passee de vert a jaune.`,
    degradation_jaune_rouge: `La zone ${zone.nom} est passee de jaune a rouge.`,
    nutriment_critique: `Nutriment critique detecte sur la zone ${zone.nom}.`,
    critique_persistant: `La zone ${zone.nom} reste critique depuis un moment.`,
  };

  const alerte = await Alerte.create({
    parcelle: parcelle._id,
    zone: zone._id,
    type,
    niveau: etat === "rouge" ? "critique" : "avertissement",
    message: messages[type] || `Alerte sur la zone ${zone.nom}.`,
    nutrimentConcerne: nutrimentDeficient || null,
  });

  const User = require("../models/User");
  const proprietaire = await User.findById(parcelle.proprietaire);
  const chatId = proprietaire?.telegramChatId;

  const resultatTelegram = await telegramService.envoyerAlerteZone({
    parcelle,
    zone,
    etat,
    nutrimentDeficient,
    pourcentages,
    typeAlerte: type,
    chatId,
  });

  alerte.envoyeeTelegram = !!resultatTelegram?.ok;
  await alerte.save();

  zone.dernierAlerteAt = new Date();
  await zone.save();

  try {
    getIO().to(`parcelle_${parcelle._id}`).emit("newAlert", alerte);
  } catch (err) {
    // Socket.IO peut ne pas etre initialise dans certains contextes (tests, scripts)
  }

  return alerte;
}

/**
 * Verifie periodiquement les zones restees en etat "rouge" trop longtemps
 * et envoie un rappel si necessaire. A appeler via un setInterval au demarrage
 * du serveur (voir server.js).
 */
async function verifierZonesCritiquesPersistantes() {
  const Zone = require("../models/Zone");
  const Parcelle = require("../models/Parcelle");

  const seuilHeures = Number(process.env.CRITICAL_REMINDER_HOURS ?? 24);
  const seuilMs = seuilHeures * 60 * 60 * 1000;

  const zonesRouges = await Zone.find({ etatActuel: "rouge", devenuRougeAt: { $ne: null } });

  for (const zone of zonesRouges) {
    const depuisMs = Date.now() - new Date(zone.devenuRougeAt).getTime();
    if (depuisMs >= seuilMs && cooldownEcoule(zone)) {
      const parcelle = await Parcelle.findById(zone.parcelle);
      if (!parcelle) continue;

      await declencherAlerte({
        parcelle,
        zone,
        type: "critique_persistant",
        etat: "rouge",
        nutrimentDeficient: zone.nutrimentDeficient,
      });
    }
  }
}

module.exports = { declencherAlerte, verifierZonesCritiquesPersistantes };
