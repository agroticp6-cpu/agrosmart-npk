require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connecte a MongoDB pour le seed de l'admin...");

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "changeme";
  const email = process.env.ADMIN_EMAIL || "";

  const existant = await User.findOne({ username });
  if (existant) {
    console.log(`L'utilisateur "${username}" existe deja, aucune action.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ username, email, passwordHash, role: "admin" });

  console.log(`Utilisateur admin "${username}" cree avec succes.`);
  console.log("Pense a changer le mot de passe par defaut si ce n'est pas deja fait.");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Erreur lors du seed admin :", err);
  process.exit(1);
});
