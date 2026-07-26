const express = require("express");
const cloudinary = require("cloudinary").v2;
const Image = require("../models/Image");
const Zone = require("../models/Zone");
const Parcelle = require("../models/Parcelle");
const { requireDeviceKey, requireAuth } = require("../middleware/auth");
const telegramService = require("../services/telegramService");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/images
 * Le Raspberry Pi envoie l'image encodee en base64 (data URI) accompagnee
 * du zoneId. L'image est uploadee vers Cloudinary (le disque Render etant
 * ephemere), seule l'URL est stockee en base MongoDB.
 *
 * Corps attendu : { zoneId, imageBase64, stressDetecte?, scoreStress? }
 * (stressDetecte/scoreStress sont reserves a une future analyse IA embarquee
 * sur le Pi ou faite cote serveur - laisser vide pour le MVP)
 */
router.post("/", requireDeviceKey, async (req, res) => {
  try {
    const { zoneId, imageBase64, stressDetecte, scoreStress } = req.body;

    if (!zoneId || !imageBase64) {
      return res.status(400).json({ message: "zoneId et imageBase64 sont requis." });
    }

    const zone = await Zone.findById(zoneId);
    if (!zone) return res.status(404).json({ message: "Zone introuvable." });

    const parcelle = await Parcelle.findById(zone.parcelle);

    const uploadResult = await cloudinary.uploader.upload(imageBase64, {
      folder: "agrosmart/camera",
      resource_type: "image",
    });

    const image = await Image.create({
      zone: zone._id,
      parcelle: parcelle._id,
      url: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      stressDetecte: !!stressDetecte,
      scoreStress: scoreStress ?? null,
    });

    // Croisement NPK + camera : alerte prioritaire si stress detecte ET zone deja rouge
    if (stressDetecte && zone.etatActuel === "rouge") {
      const User = require("../models/User");
      const proprietaire = await User.findById(parcelle.proprietaire);
      await telegramService.envoyerAlerteStressCamera({
        parcelle,
        zone,
        scoreStress,
        chatId: proprietaire?.telegramChatId,
      });
    }

    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'upload de l'image.", error: err.message });
  }
});

router.get("/zone/:zoneId", requireAuth, async (req, res) => {
  const images = await Image.find({ zone: req.params.zoneId }).sort({ dateCapture: -1 }).limit(50);
  res.json(images);
});

module.exports = router;
