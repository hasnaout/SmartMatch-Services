import api from "./axios";

export const getNotifications    = ()    => api.get("/notifications").then(r => r.data);
export const marquerLue          = (id)  => api.patch(`/notifications/${id}/lue`).then(r => r.data);
export const marquerToutesLues   = ()    => api.patch("/notifications/toutes-lues").then(r => r.data);
export const deleteNotification  = (id)  => api.delete(`/notifications/${id}`).then(r => r.data);