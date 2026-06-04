import api from "./axios";

export const getConversations  = ()              => api.get("/messages/conversations").then(r => r.data);
export const getMessages       = (demandeId, userId) =>
  api.get(`/messages/${demandeId}/${userId}`).then(r => r.data);
export const sendMessage       = (data)          => api.post("/messages", data).then(r => r.data);
export const getNonLus         = ()              => api.get("/messages/non-lus").then(r => r.data);