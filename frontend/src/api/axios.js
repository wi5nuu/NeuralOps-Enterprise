import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("auth-storage");
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {}
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const stored = localStorage.getItem("auth-storage");
      if (stored) {
        try {
          const { state } = JSON.parse(stored);
          if (state?.refreshToken) {
            const res = await axios.post(`${API_BASE}/api/auth/refresh`, {
              refresh_token: state.refreshToken,
            });
            const newTokens = res.data;
            const updated = {
              ...JSON.parse(stored),
              state: {
                ...state,
                token: newTokens.access_token,
                refreshToken: newTokens.refresh_token,
              },
            };
            localStorage.setItem("auth-storage", JSON.stringify(updated));
            error.config.headers.Authorization = `Bearer ${newTokens.access_token}`;
            return axios(error.config);
          }
        } catch {
          localStorage.removeItem("auth-storage");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
