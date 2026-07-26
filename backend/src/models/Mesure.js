const mongoose = require("mongoose");

const mesureSchema = new mongoose.Schema(
  {
    zone: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", required: true },
    parcelle: { type: mongoose.Schema.Types.ObjectId, ref: "Parcelle", required: true },

    // Valeurs brutes envoyées par le capteur NPK 7/8-en-1
    N: { type: Number, required: true },
    P: { type: Number, required: true },
    K: { type: Number, required: true },
    humidite: { type: Number },
    temperature: { type: Number },
    ph: { type: Number },
    conductiviteElectrique: { type: Number },
    salinite: { type: Number },

    // Résultat du calcul au moment de la mesure (snapshot pour historique)
    etatCalcule: { type: String, enum: ["vert", "jaune", "rouge"], required: true },
    nutrimentDeficient: { type: String, enum: ["N", "P", "K", null], default: null },
    pourcentageCouverture: {
      N: Number,
      P: Number,
      K: Number,
    },

    sourceAppareil: { type: String, default: "raspberry-pi" }, // ex: identifiant du Pi/ESP32
    dateMesure: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

mesureSchema.index({ zone: 1, dateMesure: -1 });
mesureSchema.index({ parcelle: 1, dateMesure: -1 });

module.exports = mongoose.model("Mesure", mesureSchema);
