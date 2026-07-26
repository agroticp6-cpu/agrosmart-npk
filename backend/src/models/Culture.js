const mongoose = require("mongoose");

// Besoins NPK exprimés en mg/kg de sol (valeurs indicatives à calibrer
// avec un agronome pour chaque contexte réel - voir README).
const stadeBesoinSchema = new mongoose.Schema(
  {
    stade: { type: String, required: true }, // ex: "levee", "croissance", "floraison", "recolte"
    N: { type: Number, required: true },
    P: { type: Number, required: true },
    K: { type: Number, required: true },
    dureeJours: { type: Number, default: null }, // duree indicative de ce stade, en jours
  },
  { _id: false }
);

const cultureSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique: true, trim: true },
    nomScientifique: { type: String },
    icone: { type: String, default: "🌱" }, // emoji utilise pour l'affichage
    couleur: { type: String, default: "#4c9a2a" }, // couleur d'accent hex utilisee dans l'interface
    besoinsParStade: { type: [stadeBesoinSchema], default: [] },
    periodeSemis: { type: String, default: "" }, // ex: "Juin - Juillet (saison des pluies)"
    // Seuils spécifiques à la culture (sinon on utilise les seuils globaux .env)
    seuilVert: { type: Number, default: null },
    seuilJaune: { type: Number, default: null },
    phOptimalMin: { type: Number, default: 5.5 },
    phOptimalMax: { type: Number, default: 7.5 },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Culture", cultureSchema);
