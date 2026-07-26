/**
 * Moteur de calcul de l'etat nutritionnel d'une zone.
 *
 * Principe :
 * 1. On recupere les besoins NPK de la culture au stade actuel de la parcelle.
 * 2. On calcule le pourcentage de couverture pour chaque nutriment :
 *      pourcentage = (valeur mesuree / besoin) * 100, plafonne a 150%.
 * 3. Le nutriment "deficient" est celui dont le pourcentage est le plus bas.
 * 4. L'etat global de la zone (vert/jaune/rouge) est determine par le
 *    nutriment le plus deficient, compare aux seuils (specifiques a la
 *    culture si definis, sinon seuils globaux .env).
 *
 * Important (voir prompt initial) : la couleur reflete l'etat REEL du sol
 * mesure par les capteurs, jamais la quantite d'engrais appliquee. Les
 * fertilisations ne servent qu'a l'historique / au suivi des interventions.
 */

function trouverBesoinsPourStade(culture, stade) {
  const besoins = culture.besoinsParStade.find((b) => b.stade === stade);
  if (besoins) return besoins;
  // Si le stade exact n'est pas trouve, on retombe sur le premier stade defini
  // pour eviter un crash - mais on log un avertissement.
  if (culture.besoinsParStade.length > 0) {
    console.warn(
      `Stade "${stade}" non trouve pour la culture ${culture.nom}, utilisation du stade "${culture.besoinsParStade[0].stade}" par defaut.`
    );
    return culture.besoinsParStade[0];
  }
  throw new Error(`Aucun besoin NPK defini pour la culture ${culture.nom}.`);
}

function calculerPourcentages(mesure, besoins) {
  const clamp = (v) => Math.max(0, Math.min(150, v));
  return {
    N: clamp((mesure.N / besoins.N) * 100),
    P: clamp((mesure.P / besoins.P) * 100),
    K: clamp((mesure.K / besoins.K) * 100),
  };
}

function determinerNutrimentDeficient(pourcentages) {
  const entries = Object.entries(pourcentages); // [["N", x], ["P", y], ["K", z]]
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0]; // nutriment avec le pourcentage le plus bas
}

function determinerEtat(pourcentageMin, culture) {
  const seuilVert = culture.seuilVert ?? Number(process.env.THRESHOLD_VERT ?? 80);
  const seuilJaune = culture.seuilJaune ?? Number(process.env.THRESHOLD_JAUNE ?? 50);

  if (pourcentageMin >= seuilVert) return "vert";
  if (pourcentageMin >= seuilJaune) return "jaune";
  return "rouge";
}

/**
 * Calcule l'etat nutritionnel complet d'une mesure.
 * @param {Object} mesure - { N, P, K } valeurs mesurees par le capteur
 * @param {Object} culture - document Culture (avec besoinsParStade, seuils)
 * @param {String} stade - stade de developpement actuel de la parcelle
 * @returns {{etat: string, nutrimentDeficient: string, pourcentages: object}}
 */
function calculerEtatNutritionnel(mesure, culture, stade) {
  const besoins = trouverBesoinsPourStade(culture, stade);
  const pourcentages = calculerPourcentages(mesure, besoins);
  const nutrimentDeficient = determinerNutrimentDeficient(pourcentages);
  const pourcentageMin = pourcentages[nutrimentDeficient];
  const etat = determinerEtat(pourcentageMin, culture);

  return {
    etat,
    // On ne remonte le "nutriment deficient" que si l'etat n'est pas optimal,
    // pour eviter d'afficher une carence sur une zone globalement saine.
    nutrimentDeficient: etat === "vert" ? null : nutrimentDeficient,
    pourcentages,
  };
}

const RANG_ETAT = { vert: 0, jaune: 1, rouge: 2 };

/**
 * Determine si une transition d'etat justifie une alerte, et de quel type.
 * @param {string} ancienEtat
 * @param {string} nouvelEtat
 * @returns {string|null} type d'alerte a creer, ou null si rien a signaler
 */
function typeAlertePourTransition(ancienEtat, nouvelEtat) {
  if (!ancienEtat || ancienEtat === "inconnu") return null;
  const ancienRang = RANG_ETAT[ancienEtat];
  const nouveauRang = RANG_ETAT[nouvelEtat];

  if (nouveauRang <= ancienRang) return null; // pas de degradation

  if (ancienEtat === "vert" && nouvelEtat === "jaune") return "degradation_vert_jaune";
  if (ancienEtat === "jaune" && nouvelEtat === "rouge") return "degradation_jaune_rouge";
  if (nouvelEtat === "rouge") return "nutriment_critique";
  return null;
}

module.exports = {
  calculerEtatNutritionnel,
  typeAlertePourTransition,
};
