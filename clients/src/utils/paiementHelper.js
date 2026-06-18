export const CATEGORIES_EN_LIGNE = [
  "Informatique",
  "Design",
  "Marketing",
  "Traduction",
];

export function formatMontant(montant = 0, devise = "MAD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
    maximumFractionDigits: 2,
  }).format(Number(montant) || 0);
}
