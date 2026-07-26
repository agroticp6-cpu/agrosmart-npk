require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./src/config/db");
const { ensureSeedData } = require("./src/seed/autoSeed");
const { initSocket } = require("./src/config/socket");
const { demarrerBotTelegram } = require("./src/services/telegramBot");
const { verifierZonesCritiquesPersistantes } = require("./src/services/alerteService");

const authRoutes = require("./src/routes/auth.routes");
const parcellesRoutes = require("./src/routes/parcelles.routes");
const zonesRoutes = require("./src/routes/zones.routes");
const culturesRoutes = require("./src/routes/cultures.routes");
const mesuresRoutes = require("./src/routes/mesures.routes");
const fertilisationsRoutes = require("./src/routes/fertilisations.routes");
const alertesRoutes = require("./src/routes/alertes.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const imagesRoutes = require("./src/routes/images.routes");
const historiqueRoutes = require("./src/routes/historique.routes");

const app = express();
const httpServer = http.createServer(app);

// --- Middlewares ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // limite haute car les images base64 passent ici
app.use(morgan("dev"));

// --- Connexion base de donnees ---
connectDB().then(() => ensureSeedData());

// --- Socket.IO ---
initSocket(httpServer);

// --- Routes ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "AgroTIC Smart P6 API en ligne." });
});
app.get("/api/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

app.use("/api/auth", authRoutes);
app.use("/api/parcelles", parcellesRoutes);
app.use("/api/zones", zonesRoutes);
app.use("/api/cultures", culturesRoutes);
app.use("/api/mesures", mesuresRoutes);
app.use("/api/fertilisations", fertilisationsRoutes);
app.use("/api/alertes", alertesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/images", imagesRoutes);
app.use("/api/historique", historiqueRoutes);

// --- Gestion des erreurs 404 ---
app.use((req, res) => {
  res.status(404).json({ message: "Route introuvable." });
});

// --- Gestion des erreurs globales ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Erreur interne du serveur.", error: err.message });
});

// --- Demarrage ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Serveur AgroTIC Smart P6 demarre sur le port ${PORT}`);
});

// --- Bot Telegram (capture du chat_id via /start) ---
demarrerBotTelegram();

// --- Verification periodique des zones critiques persistantes ---
const INTERVALLE_VERIFICATION_MS = 30 * 60 * 1000; // toutes les 30 minutes
setInterval(() => {
  verifierZonesCritiquesPersistantes().catch((err) =>
    console.error("Erreur verification zones critiques :", err.message)
  );
}, INTERVALLE_VERIFICATION_MS);
