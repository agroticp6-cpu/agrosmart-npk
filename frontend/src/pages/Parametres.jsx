import { useState } from "react";
import { KeyRound, Send, Check } from "lucide-react";
import api from "../api/axios";

export default function Parametres() {
  const [motDePasse, setMotDePasse] = useState({ currentPassword: "", newPassword: "", confirmation: "" });
  const [telegramChatId, setTelegramChatId] = useState("");
  const [messagePassword, setMessagePassword] = useState("");
  const [messageTelegram, setMessageTelegram] = useState("");
  const [chargementPassword, setChargementPassword] = useState(false);
  const [chargementTelegram, setChargementTelegram] = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setMessagePassword("");

    if (motDePasse.newPassword !== motDePasse.confirmation) {
      setMessagePassword("Les mots de passe ne correspondent pas.");
      return;
    }

    setChargementPassword(true);
    try {
      await api.put("/auth/me", {
        currentPassword: motDePasse.currentPassword,
        newPassword: motDePasse.newPassword,
      });
      setMessagePassword("Mot de passe mis à jour avec succès.");
      setMotDePasse({ currentPassword: "", newPassword: "", confirmation: "" });
    } catch (err) {
      setMessagePassword(err.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setChargementPassword(false);
    }
  }

  async function handleTelegramSubmit(e) {
    e.preventDefault();
    setMessageTelegram("");
    setChargementTelegram(true);
    try {
      await api.put("/auth/me", { telegramChatId });
      setMessageTelegram("Identifiant Telegram enregistré. Tu recevras désormais tes alertes.");
    } catch (err) {
      setMessageTelegram(err.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setChargementTelegram(false);
    }
  }

  return (
    <div>
      <h2>Paramètres</h2>

      <div className="settings-section">
        <div className="settings-section-header">
          <span className="settings-icon settings-icon-blue">
            <KeyRound size={18} />
          </span>
          <h3>Changer le mot de passe</h3>
        </div>
        <form className="inline-form" onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            placeholder="Mot de passe actuel"
            value={motDePasse.currentPassword}
            onChange={(e) => setMotDePasse({ ...motDePasse, currentPassword: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={motDePasse.newPassword}
            onChange={(e) => setMotDePasse({ ...motDePasse, newPassword: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Confirmer le nouveau mot de passe"
            value={motDePasse.confirmation}
            onChange={(e) => setMotDePasse({ ...motDePasse, confirmation: e.target.value })}
            required
          />
          {messagePassword && <p className="settings-message"><Check size={14} /> {messagePassword}</p>}
          <button type="submit" disabled={chargementPassword}>
            {chargementPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </form>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <span className="settings-icon settings-icon-telegram">
            <Send size={18} />
          </span>
          <h3>Relier ton compte Telegram</h3>
        </div>
        <p className="settings-help">
          Pour recevoir tes alertes sur Telegram : cherche le bot de la plateforme, envoie-lui{" "}
          <code>/start</code>, il te donnera ton identifiant (chat ID) à copier ici. Une fois relié, tu
          peux aussi taper <code>/etat</code> ou <code>/parcelles</code> directement dans Telegram pour
          connaître l'état de tes parcelles à tout moment.
        </p>
        <form className="inline-form" onSubmit={handleTelegramSubmit}>
          <input
            placeholder="Ton identifiant Telegram (chat ID)"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            required
          />
          {messageTelegram && <p className="settings-message"><Check size={14} /> {messageTelegram}</p>}
          <button type="submit" disabled={chargementTelegram}>
            {chargementTelegram ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
