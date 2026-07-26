import { useEffect, useState } from "react";
import api from "../api/axios";
import FertilisationForm from "./FertilisationForm.jsx";

export default function ZonePanel({ zone, onFertilisationAjoutee }) {
  const [detail, setDetail] = useState(null);
  const [idCopie, setIdCopie] = useState(false);

  useEffect(() => {
    if (!zone) return;
    api.get(`/zones/${zone._id}`).then((res) => setDetail(res.data));
  }, [zone]);

  function copierId() {
    navigator.clipboard.writeText(zone._id);
    setIdCopie(true);
    setTimeout(() => setIdCopie(false), 2000);
  }

  if (!zone) {
    return (
      <div className="zone-panel">
        <p>Sélectionnez une zone sur la carte pour voir ses détails.</p>
      </div>
    );
  }

  const [lng, lat] = zone.position.coordinates;

  return (
    <div className="zone-panel">
      <h3>
        Zone {zone.nom}{" "}
        <span className={`badge badge-${zone.etatActuel}`}>{zone.etatActuel}</span>
      </h3>
      <p>Coordonnées GPS : {lat.toFixed(5)}, {lng.toFixed(5)}</p>
      {zone.nutrimentDeficient && <p>Nutriment déficient : <strong>{zone.nutrimentDeficient}</strong></p>}
      <p>
        Dernière mesure :{" "}
        {zone.derniereMesureAt ? new Date(zone.derniereMesureAt).toLocaleString("fr-FR") : "aucune"}
      </p>
      <p>
        Dernière fertilisation :{" "}
        {zone.derniereFertilisationAt
          ? new Date(zone.derniereFertilisationAt).toLocaleString("fr-FR")
          : "aucune"}
      </p>

      <div className="zone-id-box">
        <span>ID technique (à mettre dans le firmware ESP32 de cette zone) :</span>
        <div className="zone-id-row">
          <code>{zone._id}</code>
          <button onClick={copierId}>{idCopie ? "Copié !" : "Copier"}</button>
        </div>
      </div>

      <FertilisationForm
        zoneId={zone._id}
        onSuccess={() => {
          api.get(`/zones/${zone._id}`).then((res) => setDetail(res.data));
          onFertilisationAjoutee?.();
        }}
      />

      {detail && (
        <>
          <h4>Historique des mesures</h4>
          <ul>
            {detail.historiqueMesures.slice(0, 5).map((m) => (
              <li key={m._id}>
                {new Date(m.dateMesure).toLocaleString("fr-FR")} — N:{m.N} P:{m.P} K:{m.K} → {m.etatCalcule}
              </li>
            ))}
          </ul>

          <h4>Historique des fertilisations</h4>
          <ul>
            {detail.historiqueFertilisations.slice(0, 5).map((f) => (
              <li key={f._id}>
                {new Date(f.dateApplication).toLocaleString("fr-FR")} — {f.typeEngrais} ({f.quantiteKg} kg)
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
