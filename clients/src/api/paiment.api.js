import api from "./axios";

export const initierPaiement    = (data) => api.post("/paiements", data).then(r => r.data);
export const confirmerPaiement  = (id)   => api.patch(`/paiements/${id}/confirmer`).then(r => r.data);
export const getMesRevenus      = ()     => api.get("/paiements/revenus").then(r => r.data);
export const getMesPaiements    = ()     => api.get("/paiements/mes-paiements").then(r => r.data);