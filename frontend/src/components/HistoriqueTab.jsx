import { useEffect, useState } from "react";
import { Download, Send } from "lucide-react";
import api from "../api/axios";

export default function HistoriqueTab({ parcelleId }) {
  const [fertilisations, setFertilisations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [messageEnvoi, setMessageEnvoi] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    api
      .get(`/historique/parcelle/${parcelleId}`)
      .then((res) => setFertilisations(res.data.fertilisations))
      .finally(() => setChargement(false));
  }, [parcelleId]);

  async function telecharger() {
    const res = await api.get(`/historique/parcelle/${parcelleId}/fertilisations/export`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "fertilisations.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function envoyerTelegram() {
    setEnvoi(true);
    setMessageEnvoi("");
    try {
      const res = await api.post(`/historique/parcelle/${parcelleId}/envoyer-telegram`);
      setMessageEnvoi(res.data.envoye ? "Historique envoyé sur Telegram." : "Envoi impossible.");
    } catch (err) {
      setMessageEnvoi(err.response?.data?.message || "Erreur lors de l'envoi.");
    } finally {
      setEnvoi(false);
    }
  }

  if (chargement) return <p>Chargement de l'historique...</p>;

  return (
    <div>
      <div className="tab-header">
        <h3 className="tab-title tab-title-purple">📖 Historique des fertilisations</h3>
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

      {fertilisations.length === 0 && <p>Aucune fertilisation enregistrée pour le moment.</p>}

      {fertilisations.length > 0 && (
        <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Zone</th>
              <th>Type d'engrais</th>
              <th>Nutriment</th>
              <th>Quantité (kg)</th>
            </tr>
          </thead>
          <tbody>
            {fertilisations.map((f) => (
              <tr key={f._id}>
                <td>{new Date(f.dateApplication).toLocaleString("fr-FR")}</td>
                <td>{f.zoneNom}</td>
                <td>{f.typeEngrais}</td>
                <td>{f.nutrimentApporte}</td>
                <td>{f.quantiteKg}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
