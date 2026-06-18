import api from "./axios";

export const updateProfile   = (data) => api.patch("/users/profile", data).then(r => r.data);
export const updatePassword  = (data) => api.patch("/users/password", data).then(r => r.data);
export const updateAvatar    = (data) => api.patch("/users/avatar",   data).then(r => r.data);
export const deleteAccount   = ()     => api.delete("/users/me").then(r => r.data);