import logoDark from "../assets/logo-dark.png";

export default function LoadingSpinner({ texte = "Chargement..." }) {
  return (
    <div className="loading-overlay">
      <img src={logoDark} alt="Chargement" className="loading-logo" />
      <p>{texte}</p>
    </div>
  );
}
