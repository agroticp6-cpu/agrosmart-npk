const bcrypt = require("bcryptjs");
const Culture = require("../models/Culture");
const User = require("../models/User");
const culturesData = require("./data/cultures.data");

/**
 * Initialise automatiquement les donnees indispensables au fonctionnement
 * du site (cultures + compte admin) si elles n'existent pas encore.
 * Appele a chaque demarrage du serveur - sans danger si les donnees
 * existent deja (ne fait rien dans ce cas).
 */
async function ensureSeedData() {
  try {
    // Upsert individuel (et non pas seulement "si la collection est vide") pour que
    // les utilisateurs ayant deja quelques cultures recoivent aussi les nouvelles
    // ajoutees plus tard, sans dupliquer celles qui existent deja.
    for (const culture of culturesData) {
      await Culture.findOneAndUpdate({ nom: culture.nom }, culture, { upsert: true });
    }
    console.log(`Auto-seed : ${culturesData.length} cultures verifiees/inserees.`);

    const nbAdmins = await User.countDocuments({ role: "admin" });
    if (nbAdmins === 0 && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await User.create({
        username: process.env.ADMIN_USERNAME,
        email: process.env.ADMIN_EMAIL || "",
        passwordHash,
        role: "admin",
      });
      console.log(`Auto-seed : compte admin "${process.env.ADMIN_USERNAME}" cree.`);
    }
  } catch (err) {
    console.error("Erreur lors de l'auto-seed :", err.message);
  }
}

module.exports = { ensureSeedData };
