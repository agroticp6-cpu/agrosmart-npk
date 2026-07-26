import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import BrandPanel from "../components/BrandPanel.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur de connexion.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="auth-page">
      <BrandPanel />

      <div className="auth-form-panel">
        <div className="auth-form-wrapper">
          <h2>Bienvenue</h2>
          <p className="auth-subtitle">Connectez-vous pour suivre vos parcelles.</p>

          <form onSubmit={handleSubmit}>
            <input
              placeholder="Identifiant"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {erreur && <p className="auth-error">{erreur}</p>}
            <button type="submit" disabled={chargement}>
              {chargement ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="auth-switch">
            Pas encore de compte ? <Link to="/register">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
