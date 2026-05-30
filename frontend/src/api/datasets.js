import api from "./axios";

export const listDatasets = () => api.get("/api/datasets/");
export const createDataset = (data) => api.post("/api/datasets/", data);
export const getDataset = (id) => api.get(`/api/datasets/${id}`);
export const updateDataset = (id, data) => api.put(`/api/datasets/${id}`, data);
export const deleteDataset = (id) => api.delete(`/api/datasets/${id}`);
export const getDatasetVersions = (id) => api.get(`/api/datasets/${id}/versions`);
