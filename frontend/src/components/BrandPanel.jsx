import logoSite from "../assets/logo-site.png";

const POINTS_FORTS = [
  { icone: "🌱", label: "Surveiller en temps réel" },
  { icone: "📊", label: "Analyser les données" },
  { icone: "📍", label: "Cartographier vos parcelles" },
  { icone: "🔔", label: "Alerter à temps" },
  { icone: "✅", label: "Agir efficacement" },
];

export default function BrandPanel() {
  return (
    <div className="brand-panel">
      <div className="brand-panel-bg-shape brand-panel-bg-shape-1" />
      <div className="brand-panel-bg-shape brand-panel-bg-shape-2" />

      <div className="brand-panel-content">
        <img src={logoSite} alt="AgroTIC Smart P6" className="brand-logo-complet" />

        <p className="brand-tagline">
          SURVEILLER <span className="brand-tagline-dot">•</span> ANALYSER{" "}
          <span className="brand-tagline-dot">•</span> AGIR{" "}
          <span className="brand-tagline-dot">•</span> RÉCOLTER MIEUX
        </p>

        <ul className="brand-features">
          {POINTS_FORTS.map((p, i) => (
            <li key={p.label} style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
              <span className="brand-feature-icon">{p.icone}</span>
              <span className="brand-feature-label">{p.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
