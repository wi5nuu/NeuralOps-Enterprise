import api from "./axios";

export const listServices = () => api.get("/api/services/");
export const createService = (data) => api.post("/api/services/", data);
export const getService = (id) => api.get(`/api/services/${id}`);
export const updateService = (id, data) => api.put(`/api/services/${id}`, data);
export const deleteService = (id) => api.delete(`/api/services/${id}`);
export const healthCheckService = (id) => api.post(`/api/services/${id}/health-check`);
export const getServiceLogs = (id, limit = 50) => api.get(`/api/services/${id}/logs?limit=${limit}`);
