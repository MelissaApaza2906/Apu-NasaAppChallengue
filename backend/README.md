# Backend de datos (Python)

Convierte las series de NASA (CSV) en los JSON que lee la app. Solo usa Python, sin instalar nada.

## Flujo

1. **Descargar** (una vez):
   - Lluvia → Giovanni: *Time Series, Area-Averaged*, GPM IMERG mensual (mm/month), caja `-68.7,-16.8,-67.6,-15.7`.
   - Nieve → Google Earth Engine: pegar `earth_engine/nieve_modis.js` en code.earthengine.google.com.
2. **Guardar** los CSV en `datos_crudos/`.
3. **Procesar**:

```bash
python scripts/generar_json.py nieve  datos_crudos/nieve_cordillera_real.csv  ../frontend/public/datos/cordillera-real.json
python scripts/generar_json.py lluvia datos_crudos/lluvia_cordillera_real.csv ../frontend/public/datos/cordillera-real.json
```

4. **Probar**: `python -m unittest discover tests`

## Qué calcula

Promedio mensual → anomalías (sin estaciones) → valor anual → Mann-Kendall (bajó / subió, valor p)
→ pendiente de Sen (tendencia por década) → veredicto: `real` si p < 0.05, si no `todavia_no_se_sabe`.

## Resultados actuales (Cordillera Real)

| Variable | Bajó / subió | Tendencia por década | p | Veredicto |
|---|---|---|---|---|
| Nieve (MODIS) | 197 / 103 | −0.21 puntos del índice | 0.03 | Real |
| Lluvia (GPM) | 153 / 123 | −31.6 mm al año | 0.47 | Todavía no se sabe |
