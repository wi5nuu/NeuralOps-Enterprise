import api from "./axios";

export const login = (data) => api.post("/api/auth/login", data);
export const register = (data) => api.post("/api/auth/register", data);
export const refreshToken = (data) => api.post("/api/auth/refresh", data);
export const getMe = () => api.get("/api/users/me");
export const updateMe = (data) => api.put("/api/users/me", data);
export const listUsers = () => api.get("/api/users/");
export const updateUser = (id, data) => api.put(`/api/users/${id}`, data);
export const getOrganization = () => api.get("/api/organizations/current");
export const updateOrganization = (data) => api.put("/api/organizations/current", data);
export const listProjects = () => api.get("/api/projects/");
export const createProject = (data) => api.post("/api/projects/", data);
export const getProject = (id) => api.get(`/api/projects/${id}`);
export const updateProject = (id, data) => api.put(`/api/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/api/projects/${id}`);
