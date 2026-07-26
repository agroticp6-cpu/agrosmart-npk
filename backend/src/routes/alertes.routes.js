const express = require("express");
const Alerte = require("../models/Alerte");
const Parcelle = require("../models/Parcelle");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { versCSV } = require("../utils/csv");
const telegramService = require("../services/telegramService");

const router = express.Router();

router.get("/parcelle/:parcelleId", requireAuth, async (req, res) => {
  const alertes = await Alerte.find({ parcelle: req.params.parcelleId })
    .populate("zone", "nom")
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(alertes);
});

// Telecharger l'historique des alertes au format CSV
router.get("/parcelle/:parcelleId/export", requireAuth, async (req, res) => {
  const alertes = await Alerte.find({ parcelle: req.params.parcelleId })
    .populate("zone", "nom")
    .sort({ createdAt: -1 });

  const csv = versCSV(
    alertes.map((a) => ({
      date: new Date(a.createdAt).toLocaleString("fr-FR"),
      zone: a.zone?.nom || "",
      type: a.type,
      niveau: a.niveau,
      nutriment: a.nutrimentConcerne || "",
      message: a.message,
    })),
    [
      { key: "date", label: "Date" },
      { key: "zone", label: "Zone" },
      { key: "type", label: "Type" },
      { key: "niveau", label: "Niveau" },
      { key: "nutriment", label: "Nutriment concerne" },
      { key: "message", label: "Message" },
    ]
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=alertes.csv");
  res.send("\uFEFF" + csv); // BOM pour un bon affichage des accents dans Excel
});

// Renvoyer un recapitulatif des alertes recentes sur Telegram
router.post("/parcelle/:parcelleId/envoyer-telegram", requireAuth, async (req, res) => {
  const parcelle = await Parcelle.findById(req.params.parcelleId);
  if (!parcelle) return res.status(404).json({ message: "Parcelle introuvable." });

  const user = await User.findById(req.user.id);
  if (!user?.telegramChatId) {
    return res.status(400).json({
      message: "Aucun identifiant Telegram configure. Ajoute-le dans Parametres.",
    });
  }

  const alertes = await Alerte.find({ parcelle: parcelle._id })
    .populate("zone", "nom")
    .sort({ createdAt: -1 })
    .limit(10);

  if (alertes.length === 0) {
    return res.status(400).json({ message: "Aucune alerte a envoyer." });
  }

  const lignes = alertes
    .map((a) => `- [${new Date(a.createdAt).toLocaleDateString("fr-FR")}] ${a.zone?.nom} : ${a.message}`)
    .join("\n");

  const texte = `📋 *Récapitulatif des alertes - ${parcelle.nom}*\n\n${lignes}`;

  const resultat = await telegramService.envoyerMessage(texte, user.telegramChatId);
  res.json({ envoye: !!resultat.ok });
});

router.put("/:id/lue", requireAuth, async (req, res) => {
  const alerte = await Alerte.findByIdAndUpdate(req.params.id, { lue: true }, { new: true });
  if (!alerte) return res.status(404).json({ message: "Alerte introuvable." });
  res.json(alerte);
});

module.exports = router;
