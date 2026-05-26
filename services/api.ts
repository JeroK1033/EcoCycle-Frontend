import axios from 'axios';

// ⚠️ Reemplaza esto con tu URL real de Vercel
const API_URL = 'https://ecocycled.vercel.app/';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s para dar tiempo a Gemini
  headers: { 'Content-Type': 'application/json' },
});

// Inyecta el token JWT en cada request si existe
api.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── AUTH ────────────────────────────────────────────────────────────────────

export type RegisterPayload = { email: string; password: string; nombre: string };
export type LoginPayload = { email: string; password: string };

export const authAPI = {
  register: (data: RegisterPayload) =>
    api.post('/auth/register', data),

  login: (data: LoginPayload) =>
    api.post<{ status: string; access_token: string; user_id: string; email: string }>(
      '/auth/login', data
    ),
};

// ─── RESIDUOS ────────────────────────────────────────────────────────────────

export type AnalysisResult = {
  objeto: string;
  material: string;
  clasificacion: 'Reciclable' | 'Orgánico' | 'No Aprovechable';
  instruccion: string;
  puntos_ganados: number;
  saldo_anterior: number;
  saldo_nuevo: number;
};

export const residuosAPI = {
  analizar: (imagen_base64: string, perfil_id: string) =>
    api.post<{ status: string; resultado: AnalysisResult }>(
      '/residuos/analizar',
      { imagen_base64, perfil_id }
    ),
};

// ─── PUNTOS ──────────────────────────────────────────────────────────────────

export type Recompensa = {
  id: string;
  titulo: string;
  descripcion: string;
  costo_puntos: number;
  stock: number;
};

export const puntosAPI = {
  getSaldo: (perfil_id: string) =>
    api.get<{ perfil_id: string; puntos: number }>(
      `/puntos/saldo/${perfil_id}`
    ),

  getRecompensas: () =>
    api.get<{ recompensas: Recompensa[] }>('/puntos/recompensas'),

  canjear: (perfil_id: string, recompensa_id: string) =>
    api.post('/puntos/canjear', { perfil_id, recompensa_id }),
};

// Import lazy para evitar circular dependency
import { authStore } from '../store/authStore';
