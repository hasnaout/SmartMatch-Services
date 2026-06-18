import api from "./axios";

export const getPrestataires      = (params) => api.get("/prestataires", { params }).then(r => r.data);
export const getPrestataireById   = (id)     => api.get(`/prestataires/${id}`).then(r => r.data);
export const updateMonProfil      = (data)   => api.patch("/prestataires/profil", data).then(r => r.data);
export const addPortfolioItem     = (data)   => api.post("/prestataires/portfolio", data).then(r => r.data);
export const deletePortfolioItem  = (itemId) => api.delete(`/prestataires/portfolio/${itemId}`).then(r => r.data);
export const updateDisponibilite  = (data)   => api.patch("/prestataires/disponibilite", data).then(r => r.data);