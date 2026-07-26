import { useEffect, useState } from "react";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const LABELS_STADE = {
  levee: "Levée",
  croissance: "Croissance",
  floraison: "Floraison",
  recolte: "Récolte",
};

function CultureDetail({ culture }) {
  const [stadeActif, setStadeActif] = useState(culture.besoinsParStade[0]?.stade || "levee");

  const besoins = culture.besoinsParStade.find((b) => b.stade === stadeActif);
  const maxValeur = besoins ? Math.max(besoins.N, besoins.P, besoins.K, 1) : 1;

  return (
    <div className="culture-detail" style={{ borderColor: culture.couleur }}>
      <div className="culture-detail-stades">
        {culture.besoinsParStade.map((b) => (
          <button
            key={b.stade}
            className={`stade-pill ${stadeActif === b.stade ? "stade-pill-active" : ""}`}
            style={stadeActif === b.stade ? { background: culture.couleur } : {}}
            onClick={() => setStadeActif(b.stade)}
          >
            {LABELS_STADE[b.stade] || b.stade}
          </button>
        ))}
      </div>

      {besoins && (
        <div className="npk-bars">
          {["N", "P", "K"].map((n) => (
            <div className="npk-bar-row" key={n}>
              <span className="npk-bar-label">{n}</span>
              <div className="npk-bar-track">
                <div
                  className="npk-bar-fill"
                  style={{ width: `${(besoins[n] / maxValeur) * 100}%`, background: culture.couleur }}
                />
              </div>
              <span className="npk-bar-value">{besoins[n]}</span>
            </div>
          ))}
        </div>
      )}

      <p className="culture-detail-ph">
        pH optimal : {culture.phOptimalMin} — {culture.phOptimalMax}
      </p>
      {culture.notes && <p className="culture-detail-notes">{culture.notes}</p>}

      {culture.besoinsParStade.some((b) => b.dureeJours) && (
        <div className="calendrier-cultural">
          <h5>📅 Calendrier cultural</h5>
          {culture.periodeSemis && (
            <p className="calendrier-semis">Période de semis : {culture.periodeSemis}</p>
          )}
          <div className="calendrier-timeline">
            {culture.besoinsParStade.map((b) => {
              const dureeTotale = culture.besoinsParStade.reduce(
                (acc, s) => acc + (s.dureeJours || 0),
                0
              );
              const largeur = dureeTotale ? ((b.dureeJours || 0) / dureeTotale) * 100 : 25;
              return (
                <div
                  key={b.stade}
                  className="calendrier-segment"
                  style={{ width: `${largeur}%`, background: culture.couleur }}
                  title={`${LABELS_STADE[b.stade]} — ${b.dureeJours || "?"} jours`}
                >
                  <span className="calendrier-segment-label">{LABELS_STADE[b.stade]}</span>
                  <span className="calendrier-segment-jours">{b.dureeJours}j</span>
                </div>
              );
            })}
          </div>
          <p className="calendrier-total">
            Cycle complet : environ{" "}
            {culture.besoinsParStade.reduce((acc, s) => acc + (s.dureeJours || 0), 0)} jours
          </p>
        </div>
      )}
    </div>
  );
}

export default function CulturesPage() {
  const [cultures, setCultures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [ouverte, setOuverte] = useState(null);

  useEffect(() => {
    api
      .get("/cultures")
      .then((res) => setCultures(res.data))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <LoadingSpinner texte="Chargement des cultures..." />;

  return (
    <div>
      <h2>Cultures & besoins NPK</h2>
      <p className="dashboard-subtitle">
        Catalogue des cultures disponibles et de leurs besoins indicatifs en azote (N), phosphore (P) et
        potassium (K) selon le stade de développement.
      </p>

      <div className="culture-grid">
        {cultures.map((c) => (
          <div key={c._id}>
            <div
              className={`culture-card ${ouverte === c._id ? "culture-card-active" : ""}`}
              style={{ borderTopColor: c.couleur }}
              onClick={() => setOuverte(ouverte === c._id ? null : c._id)}
            >
              <div className="culture-card-icon" style={{ background: c.couleur + "22" }}>
                {c.icone}
              </div>
              <div>
                <h4>{c.nom}</h4>
                <p className="culture-card-sci">{c.nomScientifique}</p>
              </div>
            </div>
            {ouverte === c._id && <CultureDetail culture={c} />}
          </div>
        ))}
      </div>
    </div>
  );
}
