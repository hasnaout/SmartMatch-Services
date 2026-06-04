import api from "./axios";

export const creerDemande       = (data)          => api.post("/demandes", data).then(r => r.data);
export const getMesDemandes     = ()              => api.get("/demandes/mes-demandes").then(r => r.data);
export const getDemandeById     = (id)            => api.get(`/demandes/${id}`).then(r => r.data);
export const getDemandesDispos  = (params)        => api.get("/demandes/disponibles", { params }).then(r => r.data);
export const choisirPrestataire = (id, pId)       => api.patch(`/demandes/${id}/choisir/${pId}`).then(r => r.data);
export const terminerDemande    = (id)            => api.patch(`/demandes/${id}/terminer`).then(r => r.data);
export const annulerDemande     = (id)            => api.patch(`/demandes/${id}/annuler`).then(r => r.data);