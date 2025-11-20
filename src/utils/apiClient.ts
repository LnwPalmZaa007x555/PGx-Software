import axios, { AxiosError, InternalAxiosRequestConfig, AxiosRequestHeaders } from "axios";

// Base URL can be overridden via env; default to local backend
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({ baseURL });

// Attach Authorization header from localStorage token if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh access token on 401 if refreshToken exists
apiClient.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError) => {
    const original = (error.config || {}) as RetriableConfig;
    const status = error.response?.status;

    if (typeof window !== "undefined" && status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      try {
        if (!refreshToken) throw new Error("No refresh token");
        const refreshResp = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken }
        );
        const { token: newToken, refreshToken: newRefresh } = refreshResp.data || {};
        if (!newToken) throw new Error("No token in refresh response");
        localStorage.setItem("token", newToken);
        if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

        // retry original with new token
        original.headers = (original.headers || {}) as AxiosRequestHeaders;
        original.headers["Authorization"] = `Bearer ${newToken}`;
        return apiClient.request(original);
      } catch {
        // refresh failed: clear tokens and propagate error
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
