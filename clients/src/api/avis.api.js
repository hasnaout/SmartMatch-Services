import api from "./axios";

export const creerAvis     = (data)  => api.post("/avis", data).then(r => r.data);
export const getAvisClient = ()      => api.get("/avis/mes-avis").then(r => r.data);
export const getAvis       = (pId)   => api.get(`/avis/prestataire/${pId}`).then(r => r.data);
export const deleteAvis    = (id)    => api.delete(`/avis/${id}`).then(r => r.data);