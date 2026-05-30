import api from "./axios";

export const listCollections = () => api.get("/api/rag/collections");
export const createCollection = (data) => api.post("/api/rag/collections", data);
export const getCollection = (id) => api.get(`/api/rag/collections/${id}`);
export const updateCollection = (id, data) => api.put(`/api/rag/collections/${id}`, data);
export const deleteCollection = (id) => api.delete(`/api/rag/collections/${id}`);
export const listDocuments = (id) => api.get(`/api/rag/collections/${id}/documents`);
export const uploadDocument = (id, file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(`/api/rag/collections/${id}/documents/upload`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const queryRag = (data) => api.post("/api/rag/query", data);
