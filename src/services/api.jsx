import axios from "axios";


const SERVERS = [
   "https://bebosystembackend.vercel.app/v1",
];
let currentServer = 0;

export const api = axios.create({
  baseURL: SERVERS[currentServer],
  withCredentials: true,
  
});

/* ================= REQUEST INTERCEPTOR ================= */

api.interceptors.request.use(
  (config) => {
    config.baseURL = SERVERS[currentServer];

    const token = localStorage.getItem("token");

    const financialToken = localStorage.getItem("financialToken");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token} ${financialToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ==========================
    // Server Failover
    // ==========================
    if (
      !originalRequest._serverRetry &&
      (
        !error.response ||
        error.code === "ECONNABORTED" ||
        error.response?.status >= 500
      )
    ) {
      originalRequest._serverRetry = true;

      currentServer = (currentServer + 1) % SERVERS.length;

      api.defaults.baseURL = SERVERS[currentServer];
      originalRequest.baseURL = SERVERS[currentServer];

      return api(originalRequest);
    }

    // ==========================
    // Refresh Token
    // ==========================
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // نجرب على السيرفر الحالي
        let refreshRes;

        try {
          refreshRes = await axios.post(
            `${SERVERS[currentServer]}/users/refresh-token`,
            {},
            {
              withCredentials: true,
            }
          );
        } catch (refreshError) {
          // لو السيرفر وقع أثناء الـ Refresh
          if (
            !refreshError.response ||
            refreshError.code === "ECONNABORTED" ||
            refreshError.response?.status >= 500
          ) {
            currentServer = (currentServer + 1) % SERVERS.length;

            api.defaults.baseURL = SERVERS[currentServer];

            refreshRes = await axios.post(
              `${SERVERS[currentServer]}/users/refresh-token`,
              {},
              {
                withCredentials: true,
              }
            );
          } else {
            throw refreshError;
          }
        }

        const newToken = refreshRes.data.accessToken;

        localStorage.setItem("token", newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        originalRequest.baseURL = SERVERS[currentServer];

        return api(originalRequest);

      } catch (err) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
