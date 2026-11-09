// Las 5 lecciones (pasos del Dr. Aker) + casos. Validación del contenido: Darwin.
export const LECCIONES = [
  { id: 'variable', nombre: 'VARIABLE', paso: 'Paso 1 · ¿Qué medimos?', conceptos: ['Qué es una variable', 'Qué mide cada satélite de NASA', 'Por qué la nieve importa para el agua'] },
  { id: 'region', nombre: 'REGIÓN', paso: 'Paso 2 · ¿Dónde miramos?', conceptos: ['Qué es un glaciar', 'Leer el globo 3D', 'Qué es una región en el mapa'] },
  { id: 'periodo', nombre: 'PERIODO', paso: 'Paso 3 · ¿Cuántos años?', conceptos: ['Qué es un periodo', 'Clima no es el tiempo del día', 'Por qué 25 años y no 5'] },
  { id: 'serie', nombre: 'SERIE DE TIEMPO', paso: 'Paso 4 · ¿Cómo cambió?', conceptos: ['Leer un gráfico de líneas', 'Quitar las estaciones', 'Ver la línea de tendencia'] },
  { id: 'significancia', nombre: 'SIGNIFICANCIA', paso: 'Paso 5 · ¿Es real?', conceptos: ['La prueba de la moneda', 'Qué es el valor p', 'Real o todavía no se sabe'] }
];
export const CASOS = [
  { id: 'cordillera-real', nombre: 'Caso 01 · Cordillera Real', variable: 'nieve', ayuda: 'con ayuda' },
  { id: 'cordillera-real-lluvia', nombre: 'Caso 02 · La lluvia', variable: 'lluvia', ayuda: 'poca ayuda' },
  { id: 'final', nombre: 'Caso final', variable: null, ayuda: 'sin ayuda' }
];
