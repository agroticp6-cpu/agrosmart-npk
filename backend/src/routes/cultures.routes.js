const express = require("express");
const Culture = require("../models/Culture");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const cultures = await Culture.find().sort({ nom: 1 });
  res.json(cultures);
});

router.get("/:id", requireAuth, async (req, res) => {
  const culture = await Culture.findById(req.params.id);
  if (!culture) return res.status(404).json({ message: "Culture introuvable." });
  res.json(culture);
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const culture = await Culture.create(req.body);
    res.status(201).json(culture);
  } catch (err) {
    res.status(400).json({ message: "Donnees invalides.", error: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const culture = await Culture.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!culture) return res.status(404).json({ message: "Culture introuvable." });
  res.json(culture);
});

router.delete("/:id", requireAuth, async (req, res) => {
  await Culture.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;
