import axios from "axios";

const api4 = axios.create({
  baseURL: "https://backend-webgis-grogol.vercel.app",
});

// Add a request interceptor
api4.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token-grogol") || localStorage.getItem("token-pusat") || localStorage.getItem("token-desa-cantik");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api4;

