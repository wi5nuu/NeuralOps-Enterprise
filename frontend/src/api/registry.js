import api from "./axios";

export const listModels = () => api.get("/api/registry/models");
export const registerModel = (data) => api.post("/api/registry/models", data);
export const getModel = (id) => api.get(`/api/registry/models/${id}`);
export const updateModel = (id, data) => api.put(`/api/registry/models/${id}`, data);
export const deleteModel = (id) => api.delete(`/api/registry/models/${id}`);
