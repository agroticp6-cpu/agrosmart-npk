import { useState } from "react";
import { Download, Send } from "lucide-react";
import api from "../api/axios";

export default function AlertesTab({ parcelleId, alertes }) {
  const [messageEnvoi, setMessageEnvoi] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function telecharger() {
    const res = await api.get(`/alertes/parcelle/${parcelleId}/export`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "alertes.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function envoyerTelegram() {
    setEnvoi(true);
    setMessageEnvoi("");
    try {
      const res = await api.post(`/alertes/parcelle/${parcelleId}/envoyer-telegram`);
      setMessageEnvoi(res.data.envoye ? "Récapitulatif envoyé sur Telegram." : "Envoi impossible.");
    } catch (err) {
      setMessageEnvoi(err.response?.data?.message || "Erreur lors de l'envoi.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div>
      <div className="tab-header">
        <h3 className="tab-title tab-title-red">🔔 Alertes</h3>
        <div className="tab-actions">
          <button onClick={telecharger}>
            <Download size={14} /> Télécharger (CSV)
          </button>
          <button onClick={envoyerTelegram} disabled={envoi} className="tab-action-telegram">
            <Send size={14} /> {envoi ? "Envoi..." : "Envoyer sur Telegram"}
          </button>
        </div>
      </div>

      {messageEnvoi && <p className="settings-message">{messageEnvoi}</p>}

      {alertes.length === 0 && <p>Aucune alerte pour le moment.</p>}
      {alertes.map((a) => (
        <div className="alert-item" key={a._id}>
          <strong>{a.zone?.nom}</strong> — {a.message}
          <br />
          <small>{new Date(a.createdAt).toLocaleString("fr-FR")}</small>
        </div>
      ))}
    </div>
  );
}
