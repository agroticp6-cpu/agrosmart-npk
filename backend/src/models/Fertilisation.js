const mongoose = require("mongoose");

const fertilisationSchema = new mongoose.Schema(
  {
    zone: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", required: true },
    parcelle: { type: mongoose.Schema.Types.ObjectId, ref: "Parcelle", required: true },
    typeEngrais: { type: String, required: true }, // ex: "Uree 46%", "NPK 15-15-15"
    nutrimentApporte: { type: String, enum: ["N", "P", "K", "NPK", "autre"], default: "NPK" },
    quantiteKg: { type: Number, required: true },
    dateApplication: { type: Date, default: Date.now },
    appliquePar: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { timestamps: true }
);

fertilisationSchema.index({ zone: 1, dateApplication: -1 });

module.exports = mongoose.model("Fertilisation", fertilisationSchema);
