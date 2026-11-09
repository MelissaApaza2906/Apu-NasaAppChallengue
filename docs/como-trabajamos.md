# Cómo trabajamos

## Quién trabaja dónde

| Persona | Carpeta principal |
|---|---|
| Diana | `frontend/src/pantallas/carga/`, `frontend/src/estilos/` |
| Luis | `pantallas/etapas/`, `pantallas/leccion/`, `pantallas/casos/`, `servicios/progreso.js` |
| Karen | `pantallas/caso/`, `pantallas/insignias/`, `pantallas/ajustes/` |
| Melissa | `pantallas/menu/`, `componentes/globo3d.js`, `servicios/`, `backend/` |
| Jhoel | `componentes/montanas3d.js` |
| Darwin | `backend/datos_crudos/`, `frontend/src/contenido/` (textos y validación) |
| (definir) | `pantallas/acceso/` + `servicios/auth.js` |

## Ramas

- `main`: lo que está publicado. **Nadie sube directo a `main`.**
- Una rama por tarea: `diana/pantalla-carga`, `luis/etapas`, `melissa/globo3d`…
- Al terminar: *pull request* a `main` y otra persona del equipo lo revisa.

```bash
git checkout main && git pull
git checkout -b tu-nombre/tu-tarea
# ... trabajas ...
git add . && git commit -m "Pantalla de carga: barra y botón"
git push -u origin tu-nombre/tu-tarea
# luego, en GitHub: "Compare & pull request"
```

## Reglas

1. **Estilos:** usa solo `src/estilos/` (colores, letras, `.btn-apu`). Nada de colores propios.
2. **Textos:** van en `src/contenido/`, no escritos sueltos en las pantallas.
3. **Datos:** ningún número inventado. Si no hay dato real, la pantalla dice "datos de ejemplo".
4. **Nunca** subas `.env.local`, contraseñas ni claves. Si pasa, avisa y cambia la clave.
5. **Celular y tablet: solo horizontal.** Prueba tu pantalla en 1440×900, 1180×820 y 844×390.
6. Cada noche, en el grupo: qué terminé, qué sigue, qué me traba.
