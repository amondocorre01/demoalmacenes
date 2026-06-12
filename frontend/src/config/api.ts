import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '';

// Crear instancia configurada de Axios
export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para inyectar automáticamente el token de seguridad en cada petición
api.interceptors.request.use(
  (config) => {
    // 1. Intentar obtener el token de localStorage (token o jwt)
    let token = localStorage.getItem('token') || localStorage.getItem('jwt');

    // 2. Si no existe, usar el token fallback hardcodeado para mantener la compatibilidad con la demo
    if (!token) {
      token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.W3siSURfVVNVQVJJTyI6MTAyLCJVU1VBUklPIjoiaHNpXHUwMGYxYW5pIiwiQ0kiOiI5NTE2NDYwIiwiTk9NQlJFIjoiSEVMRU4gViIsIkFQX1BBVEVSTk8iOiJTSVx1MDBkMUFOSSIsIkFQX01BVEVSTk8iOiJWRVJBIiwiRU1BSUwiOiJoZWxlbi40Zy5nbEBnbWFpbC5jb20iLCJDRUxVTEFSIjo3Njk5NzA4NiwiTk9NQlJFX0NPTVBMRVRPIjoiSEVMRU4gViBTSVx1MDBkMUFOSSBWRVJBIiwiU0VYTyI6IkYiLCJUSVBPX1VTVUFSSU8iOiJHbG9iYWwiLCJBQ0NFU09fSVAiOjAsIlZFUklGSUNBX1JFR0lTVFJPX0VRVUlQTyI6MCwiVkVSX1NVQ1VSU0FMIjowLCJQRVJGSUwiOiJHbG9iYWwiLCJJRF9WRU5UQVNfUEVSRklMIjo2LCJBQ0NFU09fSU5WRU5UQVJJTyI6MSwiQUNDRVNPX1NPTElDSVRVRCI6MSwiTk9USUZfREVTUEVSRElDSU9fQVJFQSI6MSwiTk9USUZfREVTUEVSRElDSU9fQUxNQUNFTiI6MSwiQ0xBVkUiOiJJbmpwWkUxUEx5cTM5TmZNNHVWVyJ9XQ.Qfydnm1Uad1_YmOHH7cPkc-GuoRYhfXiPqIXNXsqSKY';
    }

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
