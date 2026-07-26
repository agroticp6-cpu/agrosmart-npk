const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentification requise." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expire." });
  }
}

// Cle API simple pour les appareils IoT (Raspberry Pi / ESP32) qui n'ont pas
// de session utilisateur. A definir cote appareil dans l'en-tete x-device-key.
function requireDeviceKey(req, res, next) {
  const key = req.headers["x-device-key"];
  if (!key || key !== process.env.DEVICE_API_KEY) {
    return res.status(401).json({ message: "Cle appareil invalide." });
  }
  next();
}

module.exports = { requireAuth, requireDeviceKey };
