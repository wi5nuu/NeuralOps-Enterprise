import api from "./axios";

export const getUnreadCount = () => api.get("/api/notifications/unread-count").then(r => r.data);
