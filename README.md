# APU · Detectives del agua de montaña (Apu-NasaAppChallengue)

App de aprendizaje gamificada (NASA Space Apps 2026, reto *Be an Earth System Trend Detective!*).
Enseña a cualquier persona a investigar, con datos reales de NASA, si los glaciares están cambiando.
Caso principal: la Cordillera Real de Bolivia (La Paz).

## Estructura

```
Apu-NasaAppChallengue/
├── frontend/      Web (Vite + CesiumJS + Firebase). Se publica en Vercel.
├── backend/       Procesamiento de datos de NASA en Python (CSV → JSON).
├── firebase/      Reglas de seguridad de la base de datos (Firestore).
├── docs/          Arquitectura, datos y guía de trabajo.
└── .github/       Revisión automática de cada cambio (CI).
```

Detalle completo: [docs/arquitectura.md](docs/arquitectura.md)

## Empezar

```bash
# 1. Frontend
cd frontend
cp .env.example .env.local      # pega aquí la configuración de Firebase (ver docs)
npm install
npm run dev                     # abre http://localhost:5173

# 2. Datos (solo cuando hay CSV nuevos de NASA)
cd backend
python scripts/generar_json.py nieve  datos_crudos/nieve_cordillera_real.csv  ../frontend/public/datos/cordillera-real.json
python scripts/generar_json.py lluvia datos_crudos/lluvia_cordillera_real.csv ../frontend/public/datos/cordillera-real.json
```

## Cómo trabajamos

Lee [docs/como-trabajamos.md](docs/como-trabajamos.md) antes de tu primer cambio.

## Datos

- Nieve: NASA MODIS MOD10A1 (Google Earth Engine), 2001–2025.
- Lluvia: NASA GPM IMERG mensual (Giovanni), 2001–2025.
- Imágenes del globo: NASA GIBS, en vivo.

Licencia: MIT.
