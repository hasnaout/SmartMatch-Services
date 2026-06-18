export const CATEGORIES_EN_LIGNE = [
  'Informatique',
  'Design',
  'Marketing',
  'Traduction',
];

export const formatMontant = (montant, devise = 'MAD') =>
  `${Number(montant).toLocaleString('fr-FR')} ${devise}`;
