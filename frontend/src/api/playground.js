import api from "./axios";

export const listConversations = () => api.get("/api/playground/conversations");
export const createConversation = (data) => api.post("/api/playground/conversations", data);
export const getConversation = (id) => api.get(`/api/playground/conversations/${id}`);
export const deleteConversation = (id) => api.delete(`/api/playground/conversations/${id}`);
export const sendMessage = (id, data) => api.post(`/api/playground/conversations/${id}/messages`, data);
export const listPrompts = () => api.get("/api/playground/prompts");
export const getStreamUrl = (conversationId, content) =>
  `${api.defaults.baseURL}/api/playground/conversations/${conversationId}/stream?content=${encodeURIComponent(content)}`;
