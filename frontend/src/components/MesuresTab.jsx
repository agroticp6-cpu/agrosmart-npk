import { useEffect, useState } from "react";
import { Download, Send } from "lucide-react";
import api from "../api/axios";

export default function MesuresTab({ parcelleId }) {
  const [mesures, setMesures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [messageEnvoi, setMessageEnvoi] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    api
      .get(`/mesures/parcelle/${parcelleId}`)
      .then((res) => setMesures(res.data))
      .finally(() => setChargement(false));
  }, [parcelleId]);

  async function telecharger() {
    const res = await api.get(`/historique/parcelle/${parcelleId}/mesures/export`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "mesures.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function envoyerTelegram() {
    setEnvoi(true);
    setMessageEnvoi("");
    try {
      const res = await api.post(`/historique/parcelle/${parcelleId}/mesures/envoyer-telegram`);
      setMessageEnvoi(res.data.envoye ? "Dernières mesures envoyées sur Telegram." : "Envoi impossible.");
    } catch (err) {
      setMessageEnvoi(err.response?.data?.message || "Erreur lors de l'envoi.");
    } finally {
      setEnvoi(false);
    }
  }

  if (chargement) return <p>Chargement des mesures...</p>;

  return (
    <div>
      <div className="tab-header">
        <h3 className="tab-title tab-title-blue">📊 Historique des mesures</h3>
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

      {mesures.length === 0 && <p>Aucune mesure enregistrée pour le moment.</p>}

      {mesures.length > 0 && (
        <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Zone</th>
              <th>N</th>
              <th>P</th>
              <th>K</th>
              <th>Humidité</th>
              <th>pH</th>
              <th>État</th>
            </tr>
          </thead>
          <tbody>
            {mesures.map((m) => (
              <tr key={m._id}>
                <td>{new Date(m.dateMesure).toLocaleString("fr-FR")}</td>
                <td>{m.zoneNom}</td>
                <td>{m.N}</td>
                <td>{m.P}</td>
                <td>{m.K}</td>
                <td>{m.humidite ?? "—"}</td>
                <td>{m.ph ?? "—"}</td>
                <td>
                  <span className={`badge badge-${m.etatCalcule}`}>{m.etatCalcule}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
