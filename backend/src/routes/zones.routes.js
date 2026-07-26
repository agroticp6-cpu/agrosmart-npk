const express = require("express");
const Zone = require("../models/Zone");
const Parcelle = require("../models/Parcelle");
const Mesure = require("../models/Mesure");
const Fertilisation = require("../models/Fertilisation");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Liste des zones d'une parcelle (utilise pour la carte)
router.get("/parcelle/:parcelleId", requireAuth, async (req, res) => {
  const zones = await Zone.find({ parcelle: req.params.parcelleId, active: true });
  res.json(zones);
});

// Detail complet d'une zone : etat, GPS, deficience, historique
router.get("/:id", requireAuth, async (req, res) => {
  const zone = await Zone.findById(req.params.id);
  if (!zone) return res.status(404).json({ message: "Zone introuvable." });

  const [historiqueMesures, historiqueFertilisations] = await Promise.all([
    Mesure.find({ zone: zone._id }).sort({ dateMesure: -1 }).limit(50),
    Fertilisation.find({ zone: zone._id }).sort({ dateApplication: -1 }).limit(50),
  ]);

  res.json({ zone, historiqueMesures, historiqueFertilisations });
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { nom, parcelle, latitude, longitude } = req.body;

    const parcelleDoc = await Parcelle.findOne({ _id: parcelle, proprietaire: req.user.id });
    if (!parcelleDoc) return res.status(404).json({ message: "Parcelle introuvable." });

    const zone = await Zone.create({
      nom,
      parcelle,
      position: { type: "Point", coordinates: [longitude, latitude] },
    });

    res.status(201).json(zone);
  } catch (err) {
    res.status(400).json({ message: "Donnees invalides.", error: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const updates = { ...req.body };
  if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
    updates.position = { type: "Point", coordinates: [req.body.longitude, req.body.latitude] };
  }
  const zone = await Zone.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!zone) return res.status(404).json({ message: "Zone introuvable." });
  res.json(zone);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const zone = await Zone.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!zone) return res.status(404).json({ message: "Zone introuvable." });
  res.status(204).send();
});

module.exports = router;
