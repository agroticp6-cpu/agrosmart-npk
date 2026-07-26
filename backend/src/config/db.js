const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI manquant dans les variables d'environnement.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB Atlas connecte avec succes.");
  } catch (err) {
    console.error("Echec de connexion a MongoDB :", err.message);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB deconnecte. Tentative de reconnexion geree par le driver.");
  });
}

module.exports = connectDB;
