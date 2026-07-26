import { useEffect, useState } from "react";

const CODES_METEO = {
  0: { label: "Ciel dégagé", icone: "☀️" },
  1: { label: "Plutôt dégagé", icone: "🌤️" },
  2: { label: "Partiellement nuageux", icone: "⛅" },
  3: { label: "Couvert", icone: "☁️" },
  45: { label: "Brouillard", icone: "🌫️" },
  48: { label: "Brouillard givrant", icone: "🌫️" },
  51: { label: "Bruine légère", icone: "🌦️" },
  53: { label: "Bruine", icone: "🌦️" },
  55: { label: "Bruine dense", icone: "🌦️" },
  61: { label: "Pluie légère", icone: "🌧️" },
  63: { label: "Pluie", icone: "🌧️" },
  65: { label: "Pluie forte", icone: "🌧️" },
  80: { label: "Averses", icone: "🌦️" },
  81: { label: "Averses fortes", icone: "🌧️" },
  95: { label: "Orage", icone: "⛈️" },
};

export default function WeatherWidget() {
  const [meteo, setMeteo] = useState(null);
  const [statut, setStatut] = useState("chargement"); // chargement | ok | refuse | erreur

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatut("erreur");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
          const res = await fetch(url);
          const data = await res.json();
          setMeteo(data.current);
          setStatut("ok");
        } catch (err) {
          setStatut("erreur");
        }
      },
      () => setStatut("refuse")
    );
  }, []);

  if (statut === "chargement") return <div className="weather-widget">📡 Localisation en cours...</div>;
  if (statut === "refuse")
    return (
      <div className="weather-widget weather-widget-muted">
        Active la géolocalisation pour voir la météo de ta parcelle.
      </div>
    );
  if (statut === "erreur" || !meteo) return null;

  const info = CODES_METEO[meteo.weather_code] || { label: "Conditions inconnues", icone: "🌡️" };

  return (
    <div className="weather-widget">
      <span className="weather-icon">{info.icone}</span>
      <div>
        <strong>{Math.round(meteo.temperature_2m)}°C</strong> — {info.label}
        <div className="weather-details">
          Humidité : {meteo.relative_humidity_2m}% · Vent : {Math.round(meteo.wind_speed_10m)} km/h
        </div>
      </div>
    </div>
  );
}
