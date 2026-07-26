const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    zone: { type: mongoose.Schema.Types.ObjectId, ref: "Zone" },
    parcelle: { type: mongoose.Schema.Types.ObjectId, ref: "Parcelle", required: true },
    url: { type: String, required: true },
    cloudinaryPublicId: { type: String },
    sourceAppareil: { type: String, default: "raspberry-pi-cam" },
    // Champs reserves a l'analyse IA future (YOLOv8 / detection de stress)
    stressDetecte: { type: Boolean, default: false },
    scoreStress: { type: Number, default: null },
    notes: { type: String },
    dateCapture: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

imageSchema.index({ zone: 1, dateCapture: -1 });

module.exports = mongoose.model("Image", imageSchema);
