import api from "./axios";

export const listTasks = () => api.get("/api/tasks/");
export const createTask = (data) => api.post("/api/tasks/", data);
export const getTask = (id) => api.get(`/api/tasks/${id}`);
export const updateTask = (id, data) => api.put(`/api/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/api/tasks/${id}`);
export const batchUpdateTasks = (data) => api.put("/api/tasks/batch/update", data);
