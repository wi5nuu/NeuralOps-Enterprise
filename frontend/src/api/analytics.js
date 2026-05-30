import api from "./axios";

export const getDashboard = () => api.get("/api/analytics/dashboard");
export const getUsageMetrics = () => api.get("/api/analytics/usage");
