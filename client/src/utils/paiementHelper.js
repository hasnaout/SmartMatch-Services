export const CATEGORIES_EN_LIGNE = [
  'Informatique', 'Design', 'Développement web',
  'Rédaction', 'Marketing', 'Traduction',
];

export const CATEGORIES_PRESENTIELLES = [
  'Plomberie', 'Électricité', 'Jardinage',
  'Peinture', 'Maçonnerie', 'Menuiserie',
  'Climatisation', 'Déménagement', 'Nettoyage', 'Cuisine',
];

export const getTypePaiement = (categorie) => {
  return CATEGORIES_EN_LIGNE.includes(categorie) ? 'en_ligne' : 'presenciel';
};

export const formatMontant = (montant, devise = 'MAD') => {
  return `${montant.toLocaleString('fr-MA')} ${devise}`;
};