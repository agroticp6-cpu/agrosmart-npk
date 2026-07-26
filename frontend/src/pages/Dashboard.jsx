import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, MapPinned, AlertTriangle, Leaf } from "lucide-react";
import api from "../api/axios";
import WeatherWidget from "../components/WeatherWidget.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard/global").then((res) => setData(res.data));
  }, []);

  if (!data) return <LoadingSpinner texte="Préparation de ton tableau de bord..." />;

  const {
    totalParcelles,
    totalZones,
    nombreZonesCritiques,
    nombreZonesAttention,
    nombreZonesOk,
    nutrimentPlusDeficient,
    parcelles,
    dernieresAlertes,
  } = data;

  return (
    <div>
      <WeatherWidget />

      <h2>Tableau de bord</h2>
      <p className="dashboard-subtitle">Vue d'ensemble de toutes tes parcelles.</p>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-green">
            <Sprout size={22} />
          </div>
          <div>
            <div className="kpi-value">{totalParcelles}</div>
            <div className="kpi-label">Parcelles</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-blue">
            <MapPinned size={22} />
          </div>
          <div>
            <div className="kpi-value">{totalZones}</div>
            <div className="kpi-label">Zones suivies</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-red">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="kpi-value">{nombreZonesCritiques}</div>
            <div className="kpi-label">Zones critiques</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-yellow">
            <Leaf size={22} />
          </div>
          <div>
            <div className="kpi-value">{nutrimentPlusDeficient || "—"}</div>
            <div className="kpi-label">Nutriment le plus déficient</div>
          </div>
        </div>
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-main-col">
          <div className="section-header">
            <h3>Tes parcelles</h3>
            <button onClick={() => navigate("/parcelles")}>+ Gérer les parcelles</button>
          </div>

          {parcelles.length === 0 && (
            <div className="empty-state">
              <p>Tu n'as pas encore de parcelle.</p>
              <button onClick={() => navigate("/parcelles")}>Créer ma première parcelle</button>
            </div>
          )}

          <div className="parcelle-cards-grid">
            {parcelles.map((p) => (
              <div
                key={p._id}
                className="parcelle-card parcelle-card-riche"
                style={{ borderTopColor: p.cultureCouleur || "#4c9a2a" }}
                onClick={() => navigate(`/parcelles/${p._id}`)}
              >
                <div className="parcelle-card-top">
                  <div
                    className="parcelle-card-icon"
                    style={{ background: (p.cultureCouleur || "#4c9a2a") + "22" }}
                  >
                    {p.cultureIcone || "🌱"}
                  </div>
                  <div>
                    <h4>{p.nom}</h4>
                    <p className="parcelle-card-meta">
                      {p.culture} · {p.stadeActuel} · {p.totalZones} zone(s)
                    </p>
                  </div>
                </div>
                <div className="parcelle-card-bar">
                  <div style={{ width: `${p.pourcentageVert}%`, background: "#2ecc71" }} />
                  <div style={{ width: `${p.pourcentageJaune}%`, background: "#f1c40f" }} />
                  <div style={{ width: `${p.pourcentageRouge}%`, background: "#e74c3c" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-side-col">
          <h3>Dernières alertes</h3>
          {dernieresAlertes.length === 0 && <p>Aucune alerte pour le moment.</p>}
          {dernieresAlertes.map((a) => (
            <div className="alert-item" key={a._id}>
              <strong>{a.parcelle?.nom}</strong> — {a.zone?.nom}
              <br />
              {a.message}
              <br />
              <small>{new Date(a.createdAt).toLocaleString("fr-FR")}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
