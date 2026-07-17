import axios from "axios";

const api6 = axios.create({
  baseURL: "https://peta-tematik-backend.vercel.app",
});

// Add a request interceptor
api6.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token-sidokepung") || localStorage.getItem("token-pusat");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api6;
