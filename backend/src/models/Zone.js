const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true }, // ex: "A1", "A5"
    parcelle: { type: mongoose.Schema.Types.ObjectId, ref: "Parcelle", required: true },

    position: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },

    // Etat courant (mis à jour à chaque nouvelle mesure), dupliqué ici
    // pour un affichage rapide de la carte sans recalcul à chaque requête.
    etatActuel: {
      type: String,
      enum: ["vert", "jaune", "rouge", "inconnu"],
      default: "inconnu",
    },
    nutrimentDeficient: { type: String, enum: ["N", "P", "K", null], default: null },
    derniereMesureAt: { type: Date, default: null },
    derniereFertilisationAt: { type: Date, default: null },

    // Sert au suivi des alertes "reste critique depuis X heures"
    devenuRougeAt: { type: Date, default: null },
    dernierAlerteAt: { type: Date, default: null },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

zoneSchema.index({ position: "2dsphere" });
zoneSchema.index({ parcelle: 1, nom: 1 }, { unique: true });

module.exports = mongoose.model("Zone", zoneSchema);
