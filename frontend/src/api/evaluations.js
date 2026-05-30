import api from "./axios";

export const listEvaluations = () => api.get("/api/evaluations/");
export const createEvaluation = (data) => api.post("/api/evaluations/", data);
export const getEvaluationStats = () => api.get("/api/evaluations/stats");
