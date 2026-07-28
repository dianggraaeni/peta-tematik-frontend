import axios from "axios";

const api = axios.create({
  baseURL: "https://backend-webgis-simoanginangin.vercel.app",
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token-simoanginangin") || localStorage.getItem("token-pusat") || localStorage.getItem("token-desa-cantik");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

