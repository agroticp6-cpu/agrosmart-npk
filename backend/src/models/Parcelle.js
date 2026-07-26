const mongoose = require("mongoose");

const parcelleSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    culture: { type: mongoose.Schema.Types.ObjectId, ref: "Culture", required: true },
    stadeActuel: { type: String, default: "levee" },
    typeSol: { type: String, default: "non specifie" },
    superficieHectares: { type: Number, default: null },

    // Centre de la parcelle pour centrer la carte
    centre: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },

    // Limites de la parcelle (polygone GeoJSON), optionnel
    limites: {
      type: { type: String, enum: ["Polygon"], default: undefined },
      coordinates: { type: [[[Number]]], default: undefined },
    },

    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

parcelleSchema.index({ centre: "2dsphere" });
parcelleSchema.index({ limites: "2dsphere" });

module.exports = mongoose.model("Parcelle", parcelleSchema);
