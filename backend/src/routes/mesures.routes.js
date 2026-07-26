const express = require("express");
const Mesure = require("../models/Mesure");
const Zone = require("../models/Zone");
const Parcelle = require("../models/Parcelle");
const Culture = require("../models/Culture");
const { requireDeviceKey, requireAuth } = require("../middleware/auth");
const { calculerEtatNutritionnel, typeAlertePourTransition } = require("../services/npkEngine");
const { declencherAlerte } = require("../services/alerteService");
const { getIO } = require("../config/socket");

const router = express.Router();

/**
 * POST /api/mesures
 * Endpoint appele par le Raspberry Pi / ESP32 a chaque nouvelle lecture
 * du capteur NPK. Corps attendu :
 * {
 *   zoneId, N, P, K, humidite, temperature, ph, conductiviteElectrique,
 *   sourceAppareil
 * }
 */
router.post("/", requireDeviceKey, async (req, res) => {
  try {
    const { zoneId, N, P, K, humidite, temperature, ph, conductiviteElectrique, salinite, sourceAppareil } =
      req.body;

    if (zoneId === undefined || N === undefined || P === undefined || K === undefined) {
      return res.status(400).json({ message: "zoneId, N, P et K sont requis." });
    }

    const zone = await Zone.findById(zoneId);
    if (!zone) return res.status(404).json({ message: "Zone introuvable." });

    const parcelle = await Parcelle.findById(zone.parcelle);
    if (!parcelle) return res.status(404).json({ message: "Parcelle associee introuvable." });

    const culture = await Culture.findById(parcelle.culture);
    if (!culture) return res.status(404).json({ message: "Culture associee introuvable." });

    // --- Calcul de l'etat nutritionnel ---
    const { etat, nutrimentDeficient, pourcentages } = calculerEtatNutritionnel(
      { N, P, K },
      culture,
      parcelle.stadeActuel
    );

    const ancienEtat = zone.etatActuel;

    // --- Enregistrement de la mesure (snapshot historique) ---
    const mesure = await Mesure.create({
      zone: zone._id,
      parcelle: parcelle._id,
      N,
      P,
      K,
      humidite,
      temperature,
      ph,
      conductiviteElectrique,
      salinite,
      etatCalcule: etat,
      nutrimentDeficient,
      pourcentageCouverture: pourcentages,
      sourceAppareil: sourceAppareil || "raspberry-pi",
    });

    // --- Mise a jour de l'etat courant de la zone ---
    zone.etatActuel = etat;
    zone.nutrimentDeficient = nutrimentDeficient;
    zone.derniereMesureAt = mesure.dateMesure;
    if (etat === "rouge" && ancienEtat !== "rouge") {
      zone.devenuRougeAt = new Date();
    } else if (etat !== "rouge") {
      zone.devenuRougeAt = null;
    }
    await zone.save();

    // --- Diffusion en temps reel vers le frontend ---
    try {
      getIO().to(`parcelle_${parcelle._id}`).emit("zoneUpdate", {
        zoneId: zone._id,
        etat,
        nutrimentDeficient,
        pourcentages,
        dateMesure: mesure.dateMesure,
      });
    } catch (err) {
      // Socket.IO pas initialise (ex: script/test) - on ignore
    }

    // --- Declenchement d'alerte si degradation ---
    const typeAlerte = typeAlertePourTransition(ancienEtat, etat);
    if (typeAlerte) {
      await declencherAlerte({
        parcelle,
        zone,
        type: typeAlerte,
        etat,
        nutrimentDeficient,
        pourcentages,
      });
    }

    res.status(201).json({ mesure, zone });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors du traitement de la mesure.", error: err.message });
  }
});

// Historique des mesures d'une zone (pour le dashboard web)
router.get("/zone/:zoneId", requireAuth, async (req, res) => {
  const limite = Number(req.query.limit) || 100;
  const mesures = await Mesure.find({ zone: req.params.zoneId })
    .sort({ dateMesure: -1 })
    .limit(limite);
  res.json(mesures);
});

// Toutes les mesures de toutes les zones d'une parcelle (onglet "Mesures")
router.get("/parcelle/:parcelleId", requireAuth, async (req, res) => {
  const limite = Number(req.query.limit) || 200;
  const zones = await Zone.find({ parcelle: req.params.parcelleId });
  const zonesById = Object.fromEntries(zones.map((z) => [z._id.toString(), z.nom]));

  const mesures = await Mesure.find({ zone: { $in: zones.map((z) => z._id) } })
    .sort({ dateMesure: -1 })
    .limit(limite);

  res.json(mesures.map((m) => ({ ...m.toObject(), zoneNom: zonesById[m.zone.toString()] })));
});

module.exports = router;
