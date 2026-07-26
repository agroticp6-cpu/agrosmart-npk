require("dotenv").config();
const mongoose = require("mongoose");
const Culture = require("../models/Culture");
const cultures = require("./data/cultures.data");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connecte a MongoDB pour le seed des cultures...");

  for (const c of cultures) {
    await Culture.findOneAndUpdate({ nom: c.nom }, c, { upsert: true, new: true });
    console.log(`Culture "${c.nom}" inseree/mise a jour.`);
  }

  console.log("Seed des cultures termine.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Erreur lors du seed :", err);
  process.exit(1);
});
