# EcoCycle Mobile 📱

App móvil de EcoCycle construida con **React Native + Expo Router**.

## Estructura

```
app/
  _layout.tsx          ← Guard de autenticación
  (auth)/
    login.tsx          ← Pantalla de login  → POST /auth/login
    register.tsx       ← Pantalla de registro → POST /auth/register
  (tabs)/
    scanner.tsx        ← Cámara + IA  → POST /residuos/analizar ⭐
    historial.tsx      ← Historial    → GET /puntos/saldo + Supabase REST
    recompensas.tsx    ← Tienda       → GET /puntos/recompensas + POST /puntos/canjear
    perfil.tsx         ← Perfil       → GET /puntos/saldo
services/
  api.ts               ← Todos los llamados al backend en Vercel
store/
  authStore.ts         ← JWT guardado con expo-secure-store
constants/
  theme.ts             ← Colores, espaciado, radios
```

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tu URL de Vercel y credenciales de Supabase

# 3. En services/api.ts, actualiza API_URL con tu URL de Vercel
# const API_URL = 'https://TU-PROYECTO.vercel.app';

# 4. Correr en desarrollo
npx expo start

# Escanea el QR con la app Expo Go en tu teléfono
```

## Flujo principal (Scanner)

1. Usuario abre Scanner → solicita permiso de cámara
2. Captura foto → se comprime a 800px / 70% calidad (evita límite 4.5MB de Vercel)
3. Imagen se convierte a Base64
4. POST `/residuos/analizar` → Gemini clasifica el residuo → Supabase guarda y suma puntos
5. Modal muestra: objeto, clasificación, instrucción y puntos ganados

## Pantallas

| Pantalla | Endpoint backend |
|---|---|
| Login | `POST /auth/login` |
| Registro | `POST /auth/register` |
| Scanner | `POST /residuos/analizar` |
| Historial | `GET /puntos/saldo/{id}` + Supabase REST |
| Recompensas | `GET /puntos/recompensas` + `POST /puntos/canjear` |
| Perfil | `GET /puntos/saldo/{id}` |
