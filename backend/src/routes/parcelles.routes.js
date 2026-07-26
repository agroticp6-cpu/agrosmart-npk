const express = require("express");
const Parcelle = require("../models/Parcelle");
const Zone = require("../models/Zone");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const parcelles = await Parcelle.find({ proprietaire: req.user.id })
    .populate("culture")
    .sort({ createdAt: -1 });
  res.json(parcelles);
});

router.get("/:id", requireAuth, async (req, res) => {
  const parcelle = await Parcelle.findOne({ _id: req.params.id, proprietaire: req.user.id }).populate(
    "culture"
  );
  if (!parcelle) return res.status(404).json({ message: "Parcelle introuvable." });
  res.json(parcelle);
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { nom, culture, stadeActuel, typeSol, superficieHectares, latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Latitude et longitude requises." });
    }

    const parcelle = await Parcelle.create({
      nom,
      culture,
      stadeActuel,
      typeSol,
      superficieHectares,
      proprietaire: req.user.id,
      centre: { type: "Point", coordinates: [longitude, latitude] },
    });

    res.status(201).json(parcelle);
  } catch (err) {
    res.status(400).json({ message: "Donnees invalides.", error: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const updates = { ...req.body };
  if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
    updates.centre = { type: "Point", coordinates: [req.body.longitude, req.body.latitude] };
  }

  const parcelle = await Parcelle.findOneAndUpdate(
    { _id: req.params.id, proprietaire: req.user.id },
    updates,
    { new: true }
  );
  if (!parcelle) return res.status(404).json({ message: "Parcelle introuvable." });
  res.json(parcelle);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const parcelle = await Parcelle.findOneAndDelete({ _id: req.params.id, proprietaire: req.user.id });
  if (!parcelle) return res.status(404).json({ message: "Parcelle introuvable." });
  await Zone.deleteMany({ parcelle: parcelle._id });
  res.status(204).send();
});

module.exports = router;
