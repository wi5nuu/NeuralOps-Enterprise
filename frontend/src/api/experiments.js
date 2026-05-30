import api from "./axios";

export const listExperiments = () => api.get("/api/experiments/");
export const createExperiment = (data) => api.post("/api/experiments/", data);
export const getExperiment = (id) => api.get(`/api/experiments/${id}`);
export const updateExperiment = (id, data) => api.put(`/api/experiments/${id}`, data);
export const deleteExperiment = (id) => api.delete(`/api/experiments/${id}`);
export const createRun = (id, data) => api.post(`/api/experiments/${id}/runs`, data);
export const markRunBest = (expId, runId) => api.put(`/api/experiments/${expId}/runs/${runId}/best`);
export const logMetrics = (runId, data) => api.post(`/api/experiments/runs/${runId}/metrics`, data);
