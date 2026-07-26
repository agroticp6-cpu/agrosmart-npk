/**
 * Convertit un tableau d'objets en texte CSV simple (separateur virgule,
 * valeurs entre guillemets pour eviter les soucis avec les virgules internes).
 * @param {Array<Object>} rows
 * @param {Array<{key: string, label: string}>} colonnes
 */
function versCSV(rows, colonnes) {
  const echapper = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const entete = colonnes.map((c) => echapper(c.label)).join(",");
  const lignes = rows.map((row) => colonnes.map((c) => echapper(row[c.key])).join(","));

  return [entete, ...lignes].join("\n");
}

module.exports = { versCSV };
