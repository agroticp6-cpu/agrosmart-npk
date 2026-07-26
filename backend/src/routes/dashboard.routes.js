const express = require("express");
const Zone = require("../models/Zone");
const Mesure = require("../models/Mesure");
const Fertilisation = require("../models/Fertilisation");
const Parcelle = require("../models/Parcelle");
const Alerte = require("../models/Alerte");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/dashboard/global
 * Vue d'ensemble agregee sur TOUTES les parcelles de l'utilisateur connecte.
 * Sert de page d'accueil (tableau de bord) apres connexion.
 */
router.get("/global", requireAuth, async (req, res) => {
  const parcelles = await Parcelle.find({ proprietaire: req.user.id }).populate("culture");
  const parcelleIds = parcelles.map((p) => p._id);

  const zones = await Zone.find({ parcelle: { $in: parcelleIds }, active: true });

  const compteurEtats = { vert: 0, jaune: 0, rouge: 0, inconnu: 0 };
  const compteurNutriments = { N: 0, P: 0, K: 0 };
  zones.forEach((z) => {
    compteurEtats[z.etatActuel] = (compteurEtats[z.etatActuel] || 0) + 1;
    if (z.nutrimentDeficient) compteurNutriments[z.nutrimentDeficient] += 1;
  });

  const nutrimentPlusDeficient =
    Object.values(compteurNutriments).some((v) => v > 0)
      ? Object.entries(compteurNutriments).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // Statistiques par parcelle (pour l'affichage en cartes sur le dashboard)
  const parcellesAvecStats = await Promise.all(
    parcelles.map(async (p) => {
      const zonesParcelle = zones.filter((z) => z.parcelle.toString() === p._id.toString());
      const total = zonesParcelle.length || 1;
      const compteur = { vert: 0, jaune: 0, rouge: 0 };
      zonesParcelle.forEach((z) => {
        if (compteur[z.etatActuel] !== undefined) compteur[z.etatActuel] += 1;
      });
      return {
        _id: p._id,
        nom: p.nom,
        culture: p.culture?.nom,
        cultureIcone: p.culture?.icone,
        cultureCouleur: p.culture?.couleur,
        stadeActuel: p.stadeActuel,
        totalZones: zonesParcelle.length,
        pourcentageVert: Math.round((compteur.vert / total) * 100),
        pourcentageJaune: Math.round((compteur.jaune / total) * 100),
        pourcentageRouge: Math.round((compteur.rouge / total) * 100),
      };
    })
  );

  const dernieresAlertes = await Alerte.find({ parcelle: { $in: parcelleIds } })
    .populate("zone", "nom")
    .populate("parcelle", "nom")
    .sort({ createdAt: -1 })
    .limit(6);

  const [derniereMesure, derniereFertilisation] = await Promise.all([
    Mesure.findOne({ parcelle: { $in: parcelleIds } }).sort({ dateMesure: -1 }),
    Fertilisation.findOne({ parcelle: { $in: parcelleIds } }).sort({ dateApplication: -1 }),
  ]);

  res.json({
    totalParcelles: parcelles.length,
    totalZones: zones.length,
    nombreZonesCritiques: compteurEtats.rouge,
    nombreZonesAttention: compteurEtats.jaune,
    nombreZonesOk: compteurEtats.vert,
    nutrimentPlusDeficient,
    derniereMesureAt: derniereMesure?.dateMesure || null,
    derniereFertilisationAt: derniereFertilisation?.dateApplication || null,
    parcelles: parcellesAvecStats,
    dernieresAlertes,
  });
});

router.get("/:parcelleId/stats", requireAuth, async (req, res) => {
  const { parcelleId } = req.params;

  const zones = await Zone.find({ parcelle: parcelleId, active: true });
  const total = zones.length || 1;

  const compteur = { vert: 0, jaune: 0, rouge: 0, inconnu: 0 };
  const compteurNutriments = { N: 0, P: 0, K: 0 };

  zones.forEach((z) => {
    compteur[z.etatActuel] = (compteur[z.etatActuel] || 0) + 1;
    if (z.nutrimentDeficient) {
      compteurNutriments[z.nutrimentDeficient] += 1;
    }
  });

  const nutrimentPlusDeficient =
    Object.entries(compteurNutriments).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const [derniereMesure, derniereFertilisation] = await Promise.all([
    Mesure.findOne({ parcelle: parcelleId }).sort({ dateMesure: -1 }),
    Fertilisation.findOne({ parcelle: parcelleId }).sort({ dateApplication: -1 }),
  ]);

  res.json({
    totalZones: zones.length,
    pourcentages: {
      vert: Math.round((compteur.vert / total) * 100),
      jaune: Math.round((compteur.jaune / total) * 100),
      rouge: Math.round((compteur.rouge / total) * 100),
    },
    nombreZonesCritiques: compteur.rouge,
    nutrimentPlusDeficient,
    derniereMesureAt: derniereMesure?.dateMesure || null,
    derniereFertilisationAt: derniereFertilisation?.dateApplication || null,
  });
});

module.exports = router;
