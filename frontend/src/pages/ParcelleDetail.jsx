import { Map, BarChart3, Bell, BookOpen, Plus, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { socket } from "../api/socket";
import MapView from "../components/MapView.jsx";
import StatsCards from "../components/StatsCards.jsx";
import ZonePanel from "../components/ZonePanel.jsx";
import MesuresTab from "../components/MesuresTab.jsx";
import AlertesTab from "../components/AlertesTab.jsx";
import HistoriqueTab from "../components/HistoriqueTab.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const ONGLETS = [
  { id: "carte", label: "Carte", icon: <Map size={16} /> },
  { id: "mesures", label: "Mesures", icon: <BarChart3 size={16} /> },
  { id: "alertes", label: "Alertes", icon: <Bell size={16} /> },
  { id: "historique", label: "Historique", icon: <BookOpen size={16} /> },
];

const LABELS_STADE = {
  levee: "Levée",
  croissance: "Croissance",
  floraison: "Floraison",
  recolte: "Récolte",
};

export default function ParcelleDetail() {
  const { id } = useParams();
  const [parcelle, setParcelle] = useState(null);
  const [zones, setZones] = useState([]);
  const [stats, setStats] = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [zoneSelectionnee, setZoneSelectionnee] = useState(null);
  const [afficherFormZone, setAfficherFormZone] = useState(false);
  const [formZone, setFormZone] = useState({ nom: "", latitude: "", longitude: "" });
  const [ongletActif, setOngletActif] = useState("carte");
  const [modificationStade, setModificationStade] = useState(false);
  const [nouveauStade, setNouveauStade] = useState("");
  const [enregistrementStade, setEnregistrementStade] = useState(false);

  const chargerTout = useCallback(async () => {
    const [resParcelle, resZones, resStats, resAlertes] = await Promise.all([
      api.get(`/parcelles/${id}`),
      api.get(`/zones/parcelle/${id}`),
      api.get(`/dashboard/${id}/stats`),
      api.get(`/alertes/parcelle/${id}`),
    ]);
    setParcelle(resParcelle.data);
    setZones(resZones.data);
    setStats(resStats.data);
    setAlertes(resAlertes.data);
  }, [id]);

  useEffect(() => {
    chargerTout();
  }, [chargerTout]);

  async function enregistrerNouveauStade() {
    setEnregistrementStade(true);
    try {
      await api.put(`/parcelles/${id}`, { stadeActuel: nouveauStade });
      setModificationStade(false);
      chargerTout();
    } finally {
      setEnregistrementStade(false);
    }
  }

  // --- Temps reel via Socket.IO ---
  useEffect(() => {
    socket.emit("joinParcelle", id);

    function handleZoneUpdate(payload) {
      setZones((prev) =>
        prev.map((z) =>
          z._id === payload.zoneId
            ? { ...z, etatActuel: payload.etat, nutrimentDeficient: payload.nutrimentDeficient }
            : z
        )
      );
      api.get(`/dashboard/${id}/stats`).then((res) => setStats(res.data));
    }

    function handleNewAlert(alerte) {
      setAlertes((prev) => [alerte, ...prev]);
    }

    socket.on("zoneUpdate", handleZoneUpdate);
    socket.on("newAlert", handleNewAlert);

    return () => {
      socket.off("zoneUpdate", handleZoneUpdate);
      socket.off("newAlert", handleNewAlert);
    };
  }, [id]);

  async function handleCreateZone(e) {
    e.preventDefault();
    await api.post("/zones", {
      nom: formZone.nom,
      parcelle: id,
      latitude: Number(formZone.latitude),
      longitude: Number(formZone.longitude),
    });
    setAfficherFormZone(false);
    setFormZone({ nom: "", latitude: "", longitude: "" });
    chargerTout();
  }

  if (!parcelle) return <LoadingSpinner texte="Chargement de la parcelle..." />;

  const [lng, lat] = parcelle.centre.coordinates;

  return (
    <div>
      <h2>{parcelle.nom}</h2>
      <p>
        Culture : {parcelle.culture?.nom} — Stade :{" "}
        {modificationStade ? (
          <span className="stade-edit-inline">
            <select value={nouveauStade} onChange={(e) => setNouveauStade(e.target.value)}>
              <option value="levee">Levée</option>
              <option value="croissance">Croissance</option>
              <option value="floraison">Floraison</option>
              <option value="recolte">Récolte</option>
            </select>
            <button onClick={enregistrerNouveauStade} disabled={enregistrementStade}>
              {enregistrementStade ? "..." : "Valider"}
            </button>
            <button className="stade-edit-annuler" onClick={() => setModificationStade(false)}>
              Annuler
            </button>
          </span>
        ) : (
          <span className="stade-edit-inline">
            <strong>{LABELS_STADE[parcelle.stadeActuel] || parcelle.stadeActuel}</strong>
            <button
              className="btn-icon"
              onClick={() => {
                setNouveauStade(parcelle.stadeActuel);
                setModificationStade(true);
              }}
            >
              Changer le stade
            </button>
          </span>
        )}
      </p>

      <StatsCards stats={stats} />

      <div className="tabs-nav">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            className={`tab-button tab-button-${o.id} ${ongletActif === o.id ? "tab-button-active" : ""}`}
            onClick={() => setOngletActif(o.id)}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>

      {ongletActif === "carte" && (
        <div className="carte-tab-layout">
          <div className="carte-tab-main">
            <button className="btn-icon" onClick={() => setAfficherFormZone(!afficherFormZone)}>
              {afficherFormZone ? <><X size={15} /> Annuler</> : <><Plus size={15} /> Ajouter une zone</>}
            </button>

            {afficherFormZone && (
              <form className="inline-form" onSubmit={handleCreateZone} style={{ margin: "12px 0" }}>
                <input
                  placeholder="Nom de la zone (ex: A5)"
                  value={formZone.nom}
                  onChange={(e) => setFormZone({ ...formZone, nom: e.target.value })}
                  required
                />
                <input
                  placeholder="Latitude"
                  value={formZone.latitude}
                  onChange={(e) => setFormZone({ ...formZone, latitude: e.target.value })}
                  required
                />
                <input
                  placeholder="Longitude"
                  value={formZone.longitude}
                  onChange={(e) => setFormZone({ ...formZone, longitude: e.target.value })}
                  required
                />
                <button type="submit">Créer la zone</button>
              </form>
            )}

            <MapView centre={[lat, lng]} zones={zones} onSelectZone={setZoneSelectionnee} />

            <ZonePanel zone={zoneSelectionnee} onFertilisationAjoutee={chargerTout} />
          </div>

          <div className="carte-tab-side">
            <h3>Alertes récentes</h3>
            {alertes.length === 0 && <p>Aucune alerte pour le moment.</p>}
            {alertes.slice(0, 8).map((a) => (
              <div className="alert-item" key={a._id}>
                <strong>{a.zone?.nom}</strong> — {a.message}
                <br />
                <small>{new Date(a.createdAt).toLocaleString("fr-FR")}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {ongletActif === "mesures" && <MesuresTab parcelleId={id} />}
      {ongletActif === "alertes" && <AlertesTab parcelleId={id} alertes={alertes} />}
      {ongletActif === "historique" && <HistoriqueTab parcelleId={id} />}
    </div>
  );
}
