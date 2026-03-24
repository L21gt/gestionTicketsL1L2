import axios from "axios";

// Configuración base para el entorno de desarrollo local
const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Interceptor para inyectar el token JWT en peticiones protegidas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
