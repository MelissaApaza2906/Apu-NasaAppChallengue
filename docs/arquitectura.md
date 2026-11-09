# Arquitectura de APU

## Cómo se conecta todo

```
                 ┌────────────────────── Vercel (servidor web) ──────────────────────┐
  Navegador  ──► │  frontend/  →  npm run build  →  dist/  (HTML, JS, CSS, imágenes)  │
  (PC, tablet,   └───────────────────────────────────────────────────────────────────┘
   celular)           │                    │                         │
                      │ lee                │ inicia sesión /         │ pide imágenes
                      ▼                    ▼ guarda progreso         ▼ por fecha
            public/datos/*.json     Firebase Auth + Firestore     NASA GIBS
            (resultados reales)     (usuarios y progreso)         (foto y nieve en vivo)
                      ▲
                      │ genera (una vez, cuando hay datos nuevos)
            backend/scripts/generar_json.py  ◄──  CSV de NASA (Giovanni / Earth Engine)
```

- **No hay servidor propio.** Vercel sirve la web; Firebase guarda usuarios y progreso.
- **El "backend" es el procesamiento de datos** en Python: convierte los CSV de NASA en JSON
  con tendencia, valor p y veredicto. Esos JSON quedan dentro de la web.
- **Lo que es "en vivo"**: las imágenes de NASA GIBS. **Lo que no**: la tendencia de 25 años.

## Carpetas

```
frontend/
├── index.html
├── vercel.json               Cabeceras de seguridad para Vercel
├── vite.config.js
├── .env.example              Variables de Firebase y Cesium (copiar a .env.local)
├── public/
│   ├── datos/                JSON con resultados reales (los genera el backend)
│   └── img/                  Logo, Jukumari, fondos
└── src/
    ├── main.js               Arranque: estilos + rutas
    ├── router.js             Cambia de pantalla según la dirección (#/menu, #/etapas…)
    ├── estilos/              Paleta, letras y botones de APU (todos los usan)
    ├── pantallas/            Una carpeta por pantalla, con su index.js y su .css
    │   ├── carga/            Pantalla de carga + EMPEZAR MISIÓN
    │   ├── acceso/           Entrar como invitado / Google / correo + registro (apodo)
    │   ├── menu/             Monitoreo glaciar: globo, panel de datos, carrusel de picos
    │   ├── etapas/           Ruta de aprendizaje: mundo + 6 etapas en arco
    │   ├── leccion/          Teoría, tarjetas y trivia
    │   ├── casos/            Lista de casos con candado
    │   ├── caso/             Expediente: los 5 pasos del Dr. Aker
    │   ├── insignias/
    │   └── ajustes/          Incluye "Borrar mi cuenta"
    ├── componentes/          Piezas reutilizables (globo 3D, gráficos, Jukumari, botones)
    ├── servicios/            Conexiones: Firebase, autenticación, progreso, datos, NASA GIBS
    ├── contenido/            Textos: lecciones, trivia, frases del Jukumari, "¿Sabías que…?"
    └── utilidades/

backend/
├── scripts/generar_json.py   CSV de NASA → JSON (Mann-Kendall, pendiente de Sen, valor p)
├── earth_engine/             Código para descargar la nieve de MODIS
├── datos_crudos/             CSV originales descargados de NASA
├── tests/                    Pruebas del cálculo
└── requirements.txt

firebase/
├── firestore.rules           Cada usuario solo lee y escribe SU documento
└── firebase.json
```

## Base de datos (Firestore)

Una colección, un documento por usuario:

```
usuarios/{uid}
  apodo:       "DetectiveAndino"     (2 a 20 caracteres; nada más de datos personales)
  lecciones:   ["variable", "region"]
  casos:       ["cordillera-real"]
  insignias:   ["lector-mapas"]
  actualizado: fecha del último cambio
```

## Pantallas y rutas

| Ruta | Pantalla | Necesita sesión |
|---|---|---|
| `#/` | carga | no |
| `#/acceso` | acceso y registro | no |
| `#/menu` | monitoreo glaciar | sí (invitado vale) |
| `#/etapas` | ruta de aprendizaje | sí |
| `#/leccion/:id` | lección | sí |
| `#/casos` | lista de casos | sí |
| `#/caso/:id` | expediente | sí |
| `#/insignias` · `#/ajustes` | | sí |

## Variables de entorno (Vercel → Settings → Environment Variables)

`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_APP_ID`, `VITE_CESIUM_TOKEN`.
Las que empiezan con `VITE_` llegan al navegador: **nunca** pongas ahí una clave secreta.

## Publicar en Vercel

1. *Add New Project* → importar el repositorio de GitHub **Apu-NasaAppChallengue**.
2. **Root Directory:** `frontend` · **Framework:** Vite · Build: `npm run build` · Output: `dist`.
3. Cargar las variables de entorno de arriba.
4. Cada *push* a `main` publica solo; cada *pull request* tiene su vista previa.

## Seguridad (resumen)

- Reglas de Firestore: `firebase/firestore.rules` (publicarlas en la consola de Firebase).
- Auth: solo Anónimo, Google y Correo. *Authorized domains*: dominio de Vercel + localhost.
- Plan gratuito de Firebase (Spark), sin tarjeta.
- Nada de secretos en GitHub (`.gitignore` + *Secret scanning*).
- Si Firebase no responde, el progreso se guarda en el navegador y se sincroniza después.
