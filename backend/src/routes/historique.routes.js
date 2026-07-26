const express = require("express");
const Mesure = require("../models/Mesure");
const Fertilisation = require("../models/Fertilisation");
const Zone = require("../models/Zone");
const Parcelle = require("../models/Parcelle");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { versCSV } = require("../utils/csv");
const telegramService = require("../services/telegramService");

const router = express.Router();

// Historique complet (mesures + fertilisations) de toutes les zones d'une parcelle
router.get("/parcelle/:parcelleId", requireAuth, async (req, res) => {
  const zones = await Zone.find({ parcelle: req.params.parcelleId });
  const zoneIds = zones.map((z) => z._id);

  const [mesures, fertilisations] = await Promise.all([
    Mesure.find({ zone: { $in: zoneIds } }).sort({ dateMesure: -1 }).limit(200),
    Fertilisation.find({ zone: { $in: zoneIds } }).sort({ dateApplication: -1 }).limit(200),
  ]);

  const zonesById = Object.fromEntries(zones.map((z) => [z._id.toString(), z.nom]));

  res.json({
    mesures: mesures.map((m) => ({ ...m.toObject(), zoneNom: zonesById[m.zone.toString()] })),
    fertilisations: fertilisations.map((f) => ({
      ...f.toObject(),
      zoneNom: zonesById[f.zone.toString()],
    })),
  });
});

// Telecharger l'historique des mesures au format CSV
router.get("/parcelle/:parcelleId/mesures/export", requireAuth, async (req, res) => {
  const zones = await Zone.find({ parcelle: req.params.parcelleId });
  const zonesById = Object.fromEntries(zones.map((z) => [z._id.toString(), z.nom]));
  const mesures = await Mesure.find({ zone: { $in: zones.map((z) => z._id) } }).sort({ dateMesure: -1 });

  const csv = versCSV(
    mesures.map((m) => ({
      date: new Date(m.dateMesure).toLocaleString("fr-FR"),
      zone: zonesById[m.zone.toString()] || "",
      N: m.N,
      P: m.P,
      K: m.K,
      humidite: m.humidite ?? "",
      temperature: m.temperature ?? "",
      ph: m.ph ?? "",
      etat: m.etatCalcule,
      nutrimentDeficient: m.nutrimentDeficient || "",
    })),
    [
      { key: "date", label: "Date" },
      { key: "zone", label: "Zone" },
      { key: "N", label: "N" },
      { key: "P", label: "P" },
      { key: "K", label: "K" },
      { key: "humidite", label: "Humidite" },
      { key: "temperature", label: "Temperature" },
      { key: "ph", label: "pH" },
      { key: "etat", label: "Etat calcule" },
      { key: "nutrimentDeficient", label: "Nutriment deficient" },
    ]
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=mesures.csv");
  res.send("\uFEFF" + csv);
});

// Telecharger l'historique des fertilisations au format CSV
router.get("/parcelle/:parcelleId/fertilisations/export", requireAuth, async (req, res) => {
  const zones = await Zone.find({ parcelle: req.params.parcelleId });
  const zonesById = Object.fromEntries(zones.map((z) => [z._id.toString(), z.nom]));
  const fertilisations = await Fertilisation.find({ zone: { $in: zones.map((z) => z._id) } }).sort({
    dateApplication: -1,
  });

  const csv = versCSV(
    fertilisations.map((f) => ({
      date: new Date(f.dateApplication).toLocaleString("fr-FR"),
      zone: zonesById[f.zone.toString()] || "",
      typeEngrais: f.typeEngrais,
      nutrimentApporte: f.nutrimentApporte,
      quantiteKg: f.quantiteKg,
      notes: f.notes || "",
    })),
    [
      { key: "date", label: "Date" },
      { key: "zone", label: "Zone" },
      { key: "typeEngrais", label: "Type d'engrais" },
      { key: "nutrimentApporte", label: "Nutriment apporte" },
      { key: "quantiteKg", label: "Quantite (kg)" },
      { key: "notes", label: "Notes" },
    ]
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=fertilisations.csv");
  res.send("\uFEFF" + csv);
});

// Envoyer un recapitulatif des dernieres mesures sur Telegram
router.post("/parcelle/:parcelleId/mesures/envoyer-telegram", requireAuth, async (req, res) => {
  const parcelle = await Parcelle.findById(req.params.parcelleId);
  if (!parcelle) return res.status(404).json({ message: "Parcelle introuvable." });

  const user = await User.findById(req.user.id);
  if (!user?.telegramChatId) {
    return res.status(400).json({
      message: "Aucun identifiant Telegram configure. Ajoute-le dans Parametres.",
    });
  }

  const zones = await Zone.find({ parcelle: parcelle._id });
  const zonesById = Object.fromEntries(zones.map((z) => [z._id.toString(), z.nom]));
  const mesures = await Mesure.find({ zone: { $in: zones.map((z) => z._id) } })
    .sort({ dateMesure: -1 })
    .limit(10);

  if (mesures.length === 0) {
    return res.status(400).json({ message: "Aucune mesure a envoyer." });
  }

  const lignes = mesures
    .map(
      (m) =>
        `- [${new Date(m.dateMesure).toLocaleDateString("fr-FR")}] ${zonesById[m.zone.toString()]} : N${m.N} P${m.P} K${m.K} → ${m.etatCalcule}`
    )
    .join("\n");

  const texte = `📊 *Dernières mesures - ${parcelle.nom}*\n\n${lignes}`;

  const resultat = await telegramService.envoyerMessage(texte, user.telegramChatId);
  res.json({ envoye: !!resultat.ok });
});

// Envoyer un recapitulatif de l'historique recent sur Telegram
router.post("/parcelle/:parcelleId/envoyer-telegram", requireAuth, async (req, res) => {
  const parcelle = await Parcelle.findById(req.params.parcelleId);
  if (!parcelle) return res.status(404).json({ message: "Parcelle introuvable." });

  const user = await User.findById(req.user.id);
  if (!user?.telegramChatId) {
    return res.status(400).json({
      message: "Aucun identifiant Telegram configure. Ajoute-le dans Parametres.",
    });
  }

  const zones = await Zone.find({ parcelle: parcelle._id });
  const zonesById = Object.fromEntries(zones.map((z) => [z._id.toString(), z.nom]));
  const fertilisations = await Fertilisation.find({ zone: { $in: zones.map((z) => z._id) } })
    .sort({ dateApplication: -1 })
    .limit(10);

  if (fertilisations.length === 0) {
    return res.status(400).json({ message: "Aucun historique a envoyer." });
  }

  const lignes = fertilisations
    .map(
      (f) =>
        `- [${new Date(f.dateApplication).toLocaleDateString("fr-FR")}] ${zonesById[f.zone.toString()]} : ${f.typeEngrais} (${f.quantiteKg} kg)`
    )
    .join("\n");

  const texte = `📖 *Historique des fertilisations - ${parcelle.nom}*\n\n${lignes}`;

  const resultat = await telegramService.envoyerMessage(texte, user.telegramChatId);
  res.json({ envoye: !!resultat.ok });
});

module.exports = router;
