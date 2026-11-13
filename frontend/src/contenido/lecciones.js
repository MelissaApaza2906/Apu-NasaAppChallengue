// Las 5 lecciones (pasos del Dr. Aker) + casos. Validación del contenido: Darwin.
export const LECCIONES = [
  { id: 'variable', nombre: 'VARIABLE', paso: 'Paso 1 · ¿Qué medimos?', conceptos: ['Qué es una variable', 'Qué mide cada satélite de NASA', 'Por qué la nieve importa para el agua'] },
  { id: 'region', nombre: 'REGIÓN', paso: 'Paso 2 · ¿Dónde miramos?', conceptos: ['Qué es un glaciar', 'Leer el globo 3D', 'Qué es una región en el mapa'] },
  { id: 'periodo', nombre: 'PERIODO', paso: 'Paso 3 · ¿Cuántos años?', conceptos: ['Qué es un periodo', 'Clima no es el tiempo del día', 'Por qué 25 años y no 5'] },
  { id: 'serie', nombre: 'SERIE DE TIEMPO', paso: 'Paso 4 · ¿Cómo cambió?', conceptos: ['Leer un gráfico de líneas', 'Quitar las estaciones', 'Ver la línea de tendencia'] },
  { id: 'significancia', nombre: 'SIGNIFICANCIA', paso: 'Paso 5 · ¿Es real?', conceptos: ['La prueba de la moneda', 'Qué es el valor p', 'Real o todavía no se sabe'] }
];
// Casos. datos: de qué archivo (public/datos/<region>.json) y variable salen el veredicto, la tendencia y p:
// esos números se LEEN del JSON (los calcula el backend), nunca se escriben aquí.
// tendencia: 'decada' (cambio por década, como el panel de la montaña) o 'anio' (por año: la masa de hielo).
// hipotesis y limites: el texto del informe (VER INFORME en #/casos).
export const CASOS = [
  {
    id: 'cordillera-real', nombre: 'Caso 01 · Cordillera Real', corto: 'Caso 1 · Nieve', variable: 'nieve', ayuda: 'con ayuda',
    datos: { region: 'cordillera-real', variable: 'nieve' }, tendencia: 'decada',
    hipotesis: 'La nieve de la Cordillera Real está bajando desde 2001.',
    limites: 'MODIS mira la nieve desde el espacio, a 500 m por píxel: las nubes tapan algunos días y el índice es el promedio de toda la cordillera, no de un solo glaciar. 25 años es poco para el clima: con más años, el resultado puede cambiar.'
  },
  {
    id: 'cordillera-real-lluvia', nombre: 'Caso 02 · La lluvia', corto: 'Caso 2 · Lluvia', variable: 'lluvia', ayuda: 'poca ayuda',
    datos: { region: 'cordillera-real', variable: 'lluvia' }, tendencia: 'decada',
    hipotesis: 'En la Cordillera Real llueve cada vez menos.',
    limites: 'GPM IMERG estima la lluvia con satélites, a unos 10 km por píxel, y en las montañas se equivoca más. Un año muy seco o muy lluvioso pesa mucho cuando hay pocos años de datos.'
  },
  {
    id: 'final', nombre: 'Caso final', corto: 'Caso final', variable: 'masa', ayuda: 'sin ayuda',
    datos: { region: 'antartida', variable: 'masa' }, tendencia: 'anio',
    hipotesis: 'La Antártida está perdiendo hielo.',
    limites: 'GRACE y GRACE-FO pesan el hielo con la gravedad, en bloques de unos 300 km: no ven glaciares sueltos. Entre los dos satélites hay un hueco de casi un año sin datos.'
  }
];
