export const ROLES = {
  CLIENT:      "client",
  PRESTATAIRE: "prestataire",
  ADMIN:       "admin",
};

export const STATUTS_DEMANDE = {
  PUBLIEE:   "publiée",
  EN_COURS:  "en_cours",
  TERMINEE:  "terminée",
  ANNULEE:   "annulée",
};

export const URGENCES = {
  FAIBLE:  "faible",
  NORMALE: "normale",
  HAUTE:   "haute",
  URGENTE: "urgente",
};

export const METHODES_PAIEMENT = {
  EN_LIGNE: "en_ligne",
  ESPECES:  "espèces",
  VIREMENT: "virement",
  CARTE:    "carte",
};

export const API_URL    = import.meta.env.VITE_API_URL    || "http://localhost:5000/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";