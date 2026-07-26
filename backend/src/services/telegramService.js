const axios = require("axios");

const TELEGRAM_API = "https://api.telegram.org";

function isEnabled() {
  return process.env.TELEGRAM_ENABLED !== "false" && !!process.env.TELEGRAM_BOT_TOKEN;
}

/**
 * Envoie un message brut au chat Telegram donne (ou au chat par defaut
 * defini dans TELEGRAM_CHAT_ID si aucun chatId n'est fourni).
 */
async function envoyerMessage(texte, chatId) {
  const destinataire = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!isEnabled() || !destinataire) {
    console.log("[Telegram desactive ou destinataire manquant] Message non envoye :", texte);
    return { ok: false, skipped: true };
  }

  const url = `${TELEGRAM_API}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await axios.post(url, {
      chat_id: destinataire,
      text: texte,
      parse_mode: "Markdown",
    });
    return { ok: true, data: response.data };
  } catch (err) {
    console.error("Erreur envoi Telegram :", err.response?.data || err.message);
    return { ok: false, error: err.message };
  }
}

const ICONES_ETAT = { vert: "🟢", jaune: "🟡", rouge: "🔴" };
const NOMS_NUTRIMENTS = { N: "Azote (N)", P: "Phosphore (P)", K: "Potassium (K)" };

/**
 * Construit et envoie une alerte formattee pour une zone.
 */
async function envoyerAlerteZone({ parcelle, zone, etat, nutrimentDeficient, pourcentages, typeAlerte, chatId }) {
  const icone = ICONES_ETAT[etat] || "⚠️";
  const [lng, lat] = zone.position?.coordinates || [null, null];

  const lignesNutriments = ["N", "P", "K"]
    .map((n) => {
      const pct = pourcentages ? Math.round(pourcentages[n]) : "?";
      const iconeLigne = n === nutrimentDeficient ? "🔴" : "🟢";
      return `${NOMS_NUTRIMENTS[n]} : ${pct}% du besoin ${iconeLigne}`;
    })
    .join("\n");

  const recommandation = nutrimentDeficient
    ? `Envisager une fertilisation adaptee en ${NOMS_NUTRIMENTS[nutrimentDeficient]} sur cette zone.`
    : "Verifier la zone.";

  const texte =
    `⚠️ *ALERTE AGRICOLE*\n\n` +
    `Parcelle : ${parcelle.nom}\n` +
    `Zone : ${zone.nom}\n\n` +
    `${lignesNutriments}\n\n` +
    `Etat de la zone : ${icone} ${etat.toUpperCase()}\n\n` +
    (lat && lng ? `📍 Coordonnees GPS : ${lat}, ${lng}\n\n` : "") +
    `💡 Recommandation : ${recommandation}`;

  return envoyerMessage(texte, chatId);
}

async function envoyerAlerteStressCamera({ parcelle, zone, scoreStress, chatId }) {
  const texte =
    `📷 *ALERTE CAMERA - STRESS VEGETAL*\n\n` +
    `Parcelle : ${parcelle.nom}\n` +
    `Zone : ${zone.nom}\n` +
    `Score de stress detecte : ${scoreStress ?? "N/A"}\n\n` +
    `💡 Recommandation : Inspection visuelle recommandee sur le terrain.`;

  return envoyerMessage(texte, chatId);
}

async function envoyerRappelCritique({ parcelle, zone, depuisHeures, chatId }) {
  const texte =
    `🔴 *RAPPEL - ZONE TOUJOURS CRITIQUE*\n\n` +
    `Parcelle : ${parcelle.nom}\n` +
    `Zone : ${zone.nom}\n` +
    `Cette zone est en etat critique depuis environ ${depuisHeures}h.\n\n` +
    `💡 Une intervention est fortement recommandee.`;

  return envoyerMessage(texte, chatId);
}

module.exports = {
  envoyerMessage,
  envoyerAlerteZone,
  envoyerAlerteStressCamera,
  envoyerRappelCritique,
  isEnabled,
};
