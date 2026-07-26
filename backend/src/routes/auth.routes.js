const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function creerToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Identifiant et mot de passe requis." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caracteres." });
    }

    const existant = await User.findOne({ username: username.trim() });
    if (existant) {
      return res.status(409).json({ message: "Cet identifiant est deja utilise." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.trim(),
      email: email?.trim() || "",
      passwordHash,
      role: "farmer",
    });

    const token = creerToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Identifiant et mot de passe requis." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Identifiants incorrects." });
    }

    const valide = await bcrypt.compare(password, user.passwordHash);
    if (!valide) {
      return res.status(401).json({ message: "Identifiants incorrects." });
    }

    const token = creerToken(user);

    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });
  res.json(user);
});

/**
 * PUT /api/auth/me
 * Permet a l'utilisateur connecte de :
 * - changer son mot de passe (fournir currentPassword + newPassword)
 * - definir/mettre a jour son telegramChatId (fournir telegramChatId)
 * Les deux operations sont independantes, on peut envoyer l'une, l'autre, ou les deux.
 */
router.put("/me", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, telegramChatId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Mot de passe actuel requis pour le changer." });
      }
      const valide = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valide) {
        return res.status(401).json({ message: "Mot de passe actuel incorrect." });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caracteres." });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (telegramChatId !== undefined) {
      user.telegramChatId = telegramChatId.trim() === "" ? null : telegramChatId.trim();
    }

    await user.save();

    res.json({
      message: "Profil mis a jour.",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        telegramChatId: user.telegramChatId,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
});

module.exports = router;
