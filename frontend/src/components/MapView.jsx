import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

const COULEURS = {
  vert: "#2ecc71",
  jaune: "#f1c40f",
  rouge: "#e74c3c",
  inconnu: "#999999",
};

export default function MapView({ centre, zones, onSelectZone }) {
  if (!centre) return null;

  return (
    <div className="map-container">
      <MapContainer center={centre} zoom={17} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {zones.map((zone) => {
          const [lng, lat] = zone.position.coordinates;
          return (
            <CircleMarker
              key={zone._id}
              center={[lat, lng]}
              radius={16}
              pathOptions={{
                color: "#333",
                weight: 1,
                fillColor: COULEURS[zone.etatActuel] || COULEURS.inconnu,
                fillOpacity: 0.85,
              }}
              eventHandlers={{
                click: () => onSelectZone(zone),
              }}
            >
              <Popup>
                <strong>{zone.nom}</strong>
                <br />
                État : {zone.etatActuel}
                {zone.nutrimentDeficient && (
                  <>
                    <br />
                    Carence : {zone.nutrimentDeficient}
                  </>
                )}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
