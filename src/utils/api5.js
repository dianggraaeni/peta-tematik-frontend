import axios from "axios";

const api5 = axios.create({
  baseURL: "http://localhost:5003",
});

// Add a request interceptor
api5.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token-desa-cantik") || localStorage.getItem("token-pusat");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api5;
