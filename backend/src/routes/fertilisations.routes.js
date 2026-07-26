const express = require("express");
const Fertilisation = require("../models/Fertilisation");
const Zone = require("../models/Zone");
const { requireAuth } = require("../middleware/auth");
const { getIO } = require("../config/socket");

const router = express.Router();

router.get("/zone/:zoneId", requireAuth, async (req, res) => {
  const historique = await Fertilisation.find({ zone: req.params.zoneId }).sort({ dateApplication: -1 });
  res.json(historique);
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { zoneId, typeEngrais, nutrimentApporte, quantiteKg, dateApplication, notes } = req.body;

    const zone = await Zone.findById(zoneId);
    if (!zone) return res.status(404).json({ message: "Zone introuvable." });

    const fertilisation = await Fertilisation.create({
      zone: zoneId,
      parcelle: zone.parcelle,
      typeEngrais,
      nutrimentApporte,
      quantiteKg,
      dateApplication: dateApplication || new Date(),
      appliquePar: req.user.id,
      notes,
    });

    zone.derniereFertilisationAt = fertilisation.dateApplication;
    await zone.save();

    try {
      getIO().to(`parcelle_${zone.parcelle}`).emit("newFertilisation", fertilisation);
    } catch (err) {
      // Socket.IO pas initialise - on ignore
    }

    res.status(201).json(fertilisation);
  } catch (err) {
    res.status(400).json({ message: "Donnees invalides.", error: err.message });
  }
});

module.exports = router;
