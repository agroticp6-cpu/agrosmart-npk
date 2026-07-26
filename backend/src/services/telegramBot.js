const TelegramBot = require("node-telegram-bot-api");

const ICONES_ETAT = { vert: "🟢", jaune: "🟡", rouge: "🔴", inconnu: "⚪" };

/**
 * Trouve l'utilisateur lie a ce chat Telegram. Renvoie null si personne
 * n'a encore relie ce chat_id depuis la page Parametres du site.
 */
async function trouverUtilisateur(chatId) {
  const User = require("../models/User");
  return User.findOne({ telegramChatId: String(chatId) });
}

/**
 * Construit le message d'etat de toutes les parcelles/zones d'un utilisateur.
 */
async function construireMessageEtat(userId) {
  const Parcelle = require("../models/Parcelle");
  const Zone = require("../models/Zone");

  const parcelles = await Parcelle.find({ proprietaire: userId }).populate("culture");

  if (parcelles.length === 0) {
    return "Tu n'as pas encore de parcelle enregistree sur AgroTIC Smart P6.";
  }

  let message = "🌱 *Etat de tes parcelles*\n\n";

  for (const p of parcelles) {
    const zones = await Zone.find({ parcelle: p._id, active: true });
    const compteur = { vert: 0, jaune: 0, rouge: 0, inconnu: 0 };
    zones.forEach((z) => {
      compteur[z.etatActuel] = (compteur[z.etatActuel] || 0) + 1;
    });

    message += `*${p.nom}* (${p.culture?.nom || "culture non definie"})\n`;
    if (zones.length === 0) {
      message += "  Aucune zone enregistree.\n\n";
      continue;
    }
    message += `  ${ICONES_ETAT.vert} ${compteur.vert}  ${ICONES_ETAT.jaune} ${compteur.jaune}  ${ICONES_ETAT.rouge} ${compteur.rouge}\n\n`;
  }

  message += "Tape /parcelles pour la liste detaillee, ou consulte le site pour plus de details.";
  return message;
}

async function construireMessageParcelles(userId) {
  const Parcelle = require("../models/Parcelle");
  const Zone = require("../models/Zone");

  const parcelles = await Parcelle.find({ proprietaire: userId }).populate("culture");
  if (parcelles.length === 0) {
    return "Tu n'as pas encore de parcelle enregistree sur AgroTIC Smart P6.";
  }

  let message = "📋 *Detail de tes parcelles*\n\n";

  for (const p of parcelles) {
    const zones = await Zone.find({ parcelle: p._id, active: true });
    message += `*${p.nom}* — ${p.culture?.nom || "?"} (${p.stadeActuel})\n`;
    if (zones.length === 0) {
      message += "  Aucune zone.\n\n";
      continue;
    }
    zones.forEach((z) => {
      const icone = ICONES_ETAT[z.etatActuel] || ICONES_ETAT.inconnu;
      const deficience = z.nutrimentDeficient ? ` (carence ${z.nutrimentDeficient})` : "";
      message += `  ${icone} ${z.nom}${deficience}\n`;
    });
    message += "\n";
  }

  return message;
}

const MESSAGE_AIDE =
  "🤖 *Commandes disponibles*\n\n" +
  "/etat — resume rapide (vert/jaune/rouge) de toutes tes parcelles\n" +
  "/parcelles — detail zone par zone avec les carences\n" +
  "/aide — cette liste de commandes\n\n" +
  "Pour relier ton compte, va sur le site AgroTIC Smart P6, page Parametres.";

/**
 * Demarre le bot en mode "polling". Gere :
 *   - /start : affiche le chat_id (a copier dans Parametres) et l'aide
 *   - /etat : resume vert/jaune/rouge de toutes les parcelles de l'utilisateur
 *   - /parcelles : detail zone par zone
 *   - /aide : liste des commandes
 */
function demarrerBotTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("TELEGRAM_BOT_TOKEN non defini, bot Telegram non demarre.");
    return null;
  }

  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log(`Nouveau chat Telegram demarre. chat_id = ${chatId}`);

    bot.sendMessage(
      chatId,
      `Bonjour ! Ton identifiant Telegram est : *${chatId}*\n\n` +
        "Colle cette valeur dans Parametres sur le site AgroTIC Smart P6 pour relier ton compte et recevoir tes alertes.\n\n" +
        MESSAGE_AIDE,
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/\/etat/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const user = await trouverUtilisateur(chatId);
      if (!user) {
        return bot.sendMessage(
          chatId,
          "Ton compte Telegram n'est pas encore relie. Va sur le site, page Parametres, et colle ton identifiant : " +
            chatId
        );
      }
      const message = await construireMessageEtat(user._id);
      bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Erreur commande /etat :", err.message);
      bot.sendMessage(chatId, "Une erreur est survenue, reessaie plus tard.");
    }
  });

  bot.onText(/\/parcelles/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const user = await trouverUtilisateur(chatId);
      if (!user) {
        return bot.sendMessage(
          chatId,
          "Ton compte Telegram n'est pas encore relie. Va sur le site, page Parametres, et colle ton identifiant : " +
            chatId
        );
      }
      const message = await construireMessageParcelles(user._id);
      bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Erreur commande /parcelles :", err.message);
      bot.sendMessage(chatId, "Une erreur est survenue, reessaie plus tard.");
    }
  });

  bot.onText(/\/aide/, (msg) => {
    bot.sendMessage(msg.chat.id, MESSAGE_AIDE, { parse_mode: "Markdown" });
  });

  bot.on("polling_error", (err) => {
    console.error("Erreur polling Telegram :", err.message);
  });

  console.log("Bot Telegram demarre en mode polling (commandes: /start, /etat, /parcelles, /aide).");
  return bot;
}

module.exports = { demarrerBotTelegram };
