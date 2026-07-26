import { Sprout as SproutIcon, AlertTriangle, Leaf, Clock } from "lucide-react";

export default function StatsCards({ stats }) {
  if (!stats) return null;

  const items = [
    {
      icon: <SproutIcon size={20} />,
      color: "green",
      value: `${stats.pourcentages.vert}%`,
      label: "Zones en vert",
    },
    {
      icon: <SproutIcon size={20} />,
      color: "yellow",
      value: `${stats.pourcentages.jaune}%`,
      label: "Zones en jaune",
    },
    {
      icon: <AlertTriangle size={20} />,
      color: "red",
      value: `${stats.pourcentages.rouge}%`,
      label: "Zones en rouge",
    },
    {
      icon: <AlertTriangle size={20} />,
      color: "red",
      value: stats.nombreZonesCritiques,
      label: "Zones critiques",
    },
    {
      icon: <Leaf size={20} />,
      color: "blue",
      value: stats.nutrimentPlusDeficient || "—",
      label: "Nutriment le plus déficient",
    },
    {
      icon: <Clock size={20} />,
      color: "blue",
      value: stats.derniereMesureAt ? new Date(stats.derniereMesureAt).toLocaleDateString("fr-FR") : "—",
      label: "Dernière mesure",
    },
    {
      icon: <Clock size={20} />,
      color: "blue",
      value: stats.derniereFertilisationAt
        ? new Date(stats.derniereFertilisationAt).toLocaleDateString("fr-FR")
        : "—",
      label: "Dernière fertilisation",
    },
  ];

  return (
    <div className="kpi-grid">
      {items.map((item, i) => (
        <div className="kpi-card" key={item.label} style={{ animationDelay: `${i * 0.04}s` }}>
          <div className={`kpi-icon kpi-icon-${item.color}`}>{item.icon}</div>
          <div>
            <div className="kpi-value">{item.value}</div>
            <div className="kpi-label">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
