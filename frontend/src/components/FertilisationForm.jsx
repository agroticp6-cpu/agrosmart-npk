import { useState } from "react";
import api from "../api/axios";

export default function FertilisationForm({ zoneId, onSuccess }) {
  const [form, setForm] = useState({ typeEngrais: "", nutrimentApporte: "NPK", quantiteKg: "" });
  const [envoi, setEnvoi] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnvoi(true);
    try {
      await api.post("/fertilisations", {
        zoneId,
        typeEngrais: form.typeEngrais,
        nutrimentApporte: form.nutrimentApporte,
        quantiteKg: Number(form.quantiteKg),
      });
      setForm({ typeEngrais: "", nutrimentApporte: "NPK", quantiteKg: "" });
      onSuccess?.();
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <strong>Enregistrer une fertilisation</strong>
      <input
        placeholder="Type d'engrais (ex: Urée 46%)"
        value={form.typeEngrais}
        onChange={(e) => setForm({ ...form, typeEngrais: e.target.value })}
        required
      />
      <select
        value={form.nutrimentApporte}
        onChange={(e) => setForm({ ...form, nutrimentApporte: e.target.value })}
      >
        <option value="NPK">NPK complet</option>
        <option value="N">Azote (N)</option>
        <option value="P">Phosphore (P)</option>
        <option value="K">Potassium (K)</option>
        <option value="autre">Autre</option>
      </select>
      <input
        type="number"
        step="0.1"
        placeholder="Quantité (kg)"
        value={form.quantiteKg}
        onChange={(e) => setForm({ ...form, quantiteKg: e.target.value })}
        required
      />
      <button type="submit" disabled={envoi}>
        {envoi ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
