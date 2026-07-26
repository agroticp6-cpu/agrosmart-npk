import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import BrandPanel from "../components/BrandPanel.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmation: "" });
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur("");

    if (form.password !== form.confirmation) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }
    if (form.password.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setChargement(true);
    try {
      await register(form.username, form.password, form.email);
      navigate("/");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="auth-page">
      <BrandPanel />

      <div className="auth-form-panel">
        <div className="auth-form-wrapper">
          <h2>Créer un compte</h2>
          <p className="auth-subtitle">Rejoignez AgroTIC Smart P6 pour suivre vos parcelles.</p>

          <form onSubmit={handleSubmit}>
            <input
              placeholder="Identifiant"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email (optionnel)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Mot de passe (6 caractères min.)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={form.confirmation}
              onChange={(e) => setForm({ ...form, confirmation: e.target.value })}
              required
            />
            {erreur && <p className="auth-error">{erreur}</p>}
            <button type="submit" disabled={chargement}>
              {chargement ? "Création..." : "Créer mon compte"}
            </button>
          </form>

          <p className="auth-switch">
            Déjà un compte ? <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
