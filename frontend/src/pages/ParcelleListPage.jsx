import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function ParcelleListPage() {
  const navigate = useNavigate();
  const [parcelles, setParcelles] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [afficherForm, setAfficherForm] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    culture: "",
    stadeActuel: "levee",
    latitude: "",
    longitude: "",
  });

  async function chargerDonnees() {
    const [resParcelles, resCultures] = await Promise.all([
      api.get("/parcelles"),
      api.get("/cultures"),
    ]);
    setParcelles(resParcelles.data);
    setCultures(resCultures.data);
    setChargement(false);
  }

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    await api.post("/parcelles", {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    });
    setAfficherForm(false);
    setForm({ nom: "", culture: "", stadeActuel: "levee", latitude: "", longitude: "" });
    chargerDonnees();
  }

  if (chargement) return <LoadingSpinner texte="Chargement de tes parcelles..." />;

  return (
    <div>
      <div className="section-header">
        <h2>Mes parcelles</h2>
        <button onClick={() => setAfficherForm(!afficherForm)}>
          {afficherForm ? <><X size={15} /> Annuler</> : <><Plus size={15} /> Ajouter une parcelle</>}
        </button>
      </div>

      {afficherForm && (
        <form className="inline-form" onSubmit={handleCreate} style={{ marginTop: 16 }}>
          <input
            placeholder="Nom de la parcelle"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
          />
          <select
            value={form.culture}
            onChange={(e) => setForm({ ...form, culture: e.target.value })}
            required
          >
            <option value="">Choisir une culture</option>
            {cultures.map((c) => (
              <option key={c._id} value={c._id}>
                {c.icone} {c.nom}
              </option>
            ))}
          </select>
          {cultures.length === 0 && (
            <p className="settings-message">
              Aucune culture disponible pour le moment — patiente quelques secondes après le premier
              démarrage du serveur puis recharge la page.
            </p>
          )}
          <select
            value={form.stadeActuel}
            onChange={(e) => setForm({ ...form, stadeActuel: e.target.value })}
          >
            <option value="levee">Levée</option>
            <option value="croissance">Croissance</option>
            <option value="floraison">Floraison</option>
            <option value="recolte">Récolte</option>
          </select>
          <input
            placeholder="Latitude (ex: 14.6928)"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            required
          />
          <input
            placeholder="Longitude (ex: -17.4467)"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            required
          />
          <button type="submit">Créer la parcelle</button>
        </form>
      )}

      <div className="parcelle-cards-grid" style={{ marginTop: 20 }}>
        {parcelles.length === 0 && (
          <div className="empty-state">
            <p>Aucune parcelle pour le moment.</p>
          </div>
        )}
        {parcelles.map((p) => (
          <div
            key={p._id}
            className="parcelle-card parcelle-card-riche"
            style={{ borderTopColor: p.culture?.couleur || "#4c9a2a" }}
            onClick={() => navigate(`/parcelles/${p._id}`)}
          >
            <div className="parcelle-card-top">
              <div
                className="parcelle-card-icon"
                style={{ background: (p.culture?.couleur || "#4c9a2a") + "22" }}
              >
                {p.culture?.icone || "🌱"}
              </div>
              <div>
                <h4>{p.nom}</h4>
                <p className="parcelle-card-meta">
                  {p.culture?.nom} · {p.stadeActuel}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
