const mongoose = require("mongoose");

const alerteSchema = new mongoose.Schema(
  {
    parcelle: { type: mongoose.Schema.Types.ObjectId, ref: "Parcelle", required: true },
    zone: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", required: true },
    type: {
      type: String,
      enum: [
        "degradation_vert_jaune",
        "degradation_jaune_rouge",
        "nutriment_critique",
        "critique_persistant",
        "stress_camera",
        "anomalie",
      ],
      required: true,
    },
    niveau: { type: String, enum: ["info", "avertissement", "critique"], default: "avertissement" },
    message: { type: String, required: true },
    nutrimentConcerne: { type: String, enum: ["N", "P", "K", null], default: null },
    envoyeeTelegram: { type: Boolean, default: false },
    lue: { type: Boolean, default: false },
  },
  { timestamps: true }
);

alerteSchema.index({ parcelle: 1, createdAt: -1 });

module.exports = mongoose.model("Alerte", alerteSchema);
