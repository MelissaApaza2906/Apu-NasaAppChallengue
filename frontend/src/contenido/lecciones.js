// APU · Contenido de las 9 lecciones (ruta de aprendizaje).
// Base: documento de Darwin "APU: diseño de la app" v2 + su ruta de 9 lecciones, revisado y corregido.
// Estructura de Luis: cada lección = teoría → tarjetas (5) → trivia (5) → resultado.
//
// Reglas:
// - Nunca escribir números de datos a mano. Los textos usan {marcas} que la pantalla llena
//   leyendo los JSON reales (frontend/public/datos/...). Si el dato no existe, se muestra "—".
//   Marcas: {apodo} {region} {desde} {hasta} {pendiente_decada} {p} {veredicto_texto}
//           {n_ok} {n_pruebas} {hipotesis}
// - "datos" indica qué JSON necesita la actividad de la lección (si existe).
// - insignia: id del catálogo src/contenido/insignias.js (null = la lección no da insignia propia).
// - Aprobar la trivia: 3 de 5 (60 %).
// - Público: desde 12 años. Frases cortas, palabras simples; los nombres técnicos van en "paraCuriosos" o en el glosario.
//
// Fuentes de las cifras fijas: ver docs del proyecto "ruta-aprendizaje-revision.md".

export const LECCIONES = [
  // ───────────────────────────── 1
  {
    id: 'academia',
    numero: 1,
    titulo: 'Academia del detective',
    paso: 'Antes de empezar',
    teoria: {
      intro: 'Una <b>tendencia</b> es un cambio que dura muchos años, como una escalera que baja poco a poco. Ojo: no todo cambio es tendencia. A veces son subidas y bajadas por pura suerte (<b>ruido</b>), o algo que se repite cada año, como la época de lluvias (<b>estaciones</b>). Los científicos siguen siempre los mismos pasos para no equivocarse.',
      tarjetas: [
        { icono: '📈', titulo: 'Tendencia', texto: 'Un rumbo que se mantiene: sube o baja a lo largo de los años.' },
        { icono: '🎲', titulo: 'Ruido', texto: 'Subidas y bajadas al azar, sin rumbo. Un año raro no es una tendencia.' },
        { icono: '🔁', titulo: 'Estaciones', texto: 'Un ciclo que se repite cada año: época de lluvias y época seca.' }
      ],
      metodo: 'Método del detective en 5 pasos (+ validación y veredicto)',
      pasos: ['Variable · ¿qué mido?', 'Región · ¿dónde?', 'Periodo · ¿cuándo, y es comparable?', 'Serie · ¿son confiables mis datos?', 'Significancia · ¿es real o casualidad?', 'Validación · ¿resiste pruebas?', 'Veredicto · ¿qué puedo afirmar?'],
      vocabulario: [
        { palabra: 'Hipótesis', significa: 'Lo que crees que pasó, antes de mirar los datos.' },
        { palabra: 'Serie de tiempo', significa: 'Una lista de medidas, una por año (o por día), en orden.' },
        { palabra: 'Píxel', significa: 'Cada cuadrito de la foto del satélite. En MODIS mide 500 m de lado.' },
        { palabra: 'Umbral', significa: 'El límite que decides: desde cuánto blanco un cuadrito cuenta como nieve.' },
        { palabra: 'Pendiente', significa: 'Cuánto sube o baja algo cada año.' },
        { palabra: 'Valor p', significa: 'Qué tan raro sería ver ese cambio por pura suerte.' },
        { palabra: 'Correlación y causa', significa: 'Que dos cosas cambien juntas no quiere decir que una cause la otra.' }
      ],
      paraPensar: 'Cada satélite responde una pregunta distinta. Elegir el correcto es medio trabajo del detective.'
    },
    satelites: [
      { nombre: 'MODIS MOD10A1', enApu: true, mide: 'Dónde hay nieve: ¿cuánta superficie cubre?', desde: '2000', detalle: 'Mira la Tierra todos los días; cada cuadrito de la foto mide 500 m' },
      { nombre: 'MODIS albedo (MCD43)', enApu: false, mide: 'Cuánta luz rebota en el suelo: ¿el hielo se pone más oscuro?', desde: '2000', detalle: 'Cuadritos de 500 m' },
      { nombre: 'Landsat', enApu: false, mide: 'Fotos detalladas: ¿cuánto se redujo el área?', desde: '1972 (útil para glaciares desde los años 80)', detalle: 'Una foto cada 16 días' },
      { nombre: 'ICESat-2', enApu: false, mide: 'La altura del hielo con un láser', desde: '2018', detalle: 'Ve si el hielo adelgaza' },
      { nombre: 'GPM IMERG', enApu: true, mide: 'La lluvia y la nieve que caen', desde: '2000', detalle: 'Cada media hora' },
      { nombre: 'GRACE / GRACE-FO', enApu: true, mide: 'Cuánto pesa el hielo y el agua', desde: '2002', detalle: 'Solo ve zonas enormes, de unos 300 km' },
      { nombre: 'GLIMS', enApu: true, mide: 'El dibujo del borde de cada glaciar: ¿dónde está el hielo?', desde: 'Mapa mundial', detalle: 'Hecho por científicos de todo el mundo, con apoyo de NASA' }
    ],
    nota3d: 'En APU usamos: MODIS (nieve de los 11 glaciares), GPM (lluvia de la Cordillera Real), GRACE (solo la Antártida) y GLIMS (bordes de glaciares). El relieve 3D viene de Cesium World Terrain (no es de NASA).',

    tarjetas: [
      { pregunta: '¿Qué es una tendencia?', respuesta: 'Un cambio que dura muchos años, aunque haya subidas y bajadas en el camino.' },
      { pregunta: '¿Un año muy seco es una tendencia?', respuesta: 'No. Un solo año raro no alcanza: la tendencia se ve en muchos años.' },
      { pregunta: '¿Cuáles son los 5 pasos del método del detective?', respuesta: 'Variable, región, periodo, serie y significancia. Después: validación y veredicto.' },
      { pregunta: '¿Qué satélite ve dónde hay nieve cada día?', respuesta: 'MODIS, a bordo del satélite Terra de NASA.' },
      { pregunta: '¿Qué es la estacionalidad?', respuesta: 'Algo que se repite cada año, como la época de lluvias y la época seca. No es una tendencia.' }
    ],
    trivia: [
      { pregunta: 'Un gráfico sube y baja, pero en general va hacia arriba durante 20 años. ¿Qué es?', opciones: ['Una tendencia', 'Puro azar', 'Un año raro', 'Las estaciones'], correcta: 0, explicacion: 'Ignora los saltos pequeños y mira el rumbo general: si se mantiene muchos años, es una tendencia.' },
      { pregunta: '¿Cuál es el primer paso del método del detective?', opciones: ['Calcular el valor p', 'Elegir la variable: qué voy a medir', 'Escribir el veredicto', 'Elegir el periodo'], correcta: 1, explicacion: 'Primero se decide qué medir; después dónde, cuándo y cómo.' },
      { pregunta: '¿Qué satélite responde "¿cuánta superficie tiene nieve cada día?"', opciones: ['ICESat-2', 'GPM', 'MODIS', 'GRACE'], correcta: 2, explicacion: 'MODIS saca fotos todos los días y distingue la nieve del suelo.' },
      { pregunta: '¿Qué satélite mide si el hielo se está adelgazando?', opciones: ['ICESat-2', 'GPM', 'MODIS', 'Landsat'], correcta: 0, explicacion: 'ICESat-2 mide la altura del hielo con un rayo láser, desde 2018.' },
      { pregunta: '¿Qué satélite pesa el hielo directamente? ¿Sirve para la Cordillera Real?', opciones: ['MODIS, sí sirve', 'GRACE, pero no a esta escala', 'GPM, sí sirve', 'Landsat, sí sirve'], correcta: 1, explicacion: 'GRACE pesa el hielo, pero solo en zonas enormes de unos 300 km. La cordillera es mucho más angosta. Elegir la herramienta según el tamaño del lugar es medio trabajo del detective.' }
    ],
    jukumari: { inicio: 'Antes de buscar pistas, aprendamos a reconocer una tendencia.', acierto: '¡Buen ojo, detective!', fallo: 'Casi. Mira el rumbo general, no los saltos pequeños.' },
    insignia: 'aprendiz',
    datos: null
  },

  // ───────────────────────────── 2
  {
    id: 'caso',
    numero: 2,
    titulo: 'El caso',
    paso: 'Hipótesis',
    teoria: {
      intro: 'Llegó un expediente sobre el agua de La Paz. Antes de investigar, separamos lo que <b>sabemos</b> (tiene fuente), lo que hay que <b>aclarar</b> y lo que solo <b>suponemos</b>. Después escribes tu <b>hipótesis</b>: lo que crees que pasó. Los datos dirán si tenías razón.',
      tarjetas: [
        { icono: '📰', titulo: 'Dato', texto: '"En 2016, La Paz sufrió racionamiento de agua por la sequía." Tiene fuente.' },
        { icono: '🔎', titulo: 'Hay que aclarar', texto: '"Los glaciares perdieron 42 %." Es de todos los Andes tropicales, entre 1990 y 2020, y mide el tamaño del hielo, no el agua.' },
        { icono: '🔎', titulo: 'Hay que aclarar', texto: '"En agosto de 2026 La Paz declaró alerta roja por sequía, pero EPSAS dijo que las represas estaban bien." Dos fuentes, dos mensajes distintos.' },
        { icono: '💭', titulo: 'Suposición', texto: '"La culpa es del cambio climático." Puede ser, pero con nuestros datos todavía no lo probamos.' }
      ],
      paraPensar: 'Que el hielo ocupe menos lugar no dice cuánta agua se perdió. Lo recordaremos todo el caso.',
      fuentes: [
        { texto: 'Racionamiento de 2016', url: 'https://www.lostiempos.com/actualidad/local/20161112/semapa-racionara-agua-mes-mas-crisis-llega-paz' },
        { texto: 'Alerta roja y EPSAS (eju.tv, 11/08/2026)', url: 'https://eju.tv/?p=5060524' },
        { texto: '42 % Andes tropicales (MapBiomas / EFE, 2022)', url: 'https://www.expreso.ec/actualidad/mundo/glaciares-andinos-reducen-42-superficie-127878.html' }
      ]
    },
    hipotesis: { pregunta: 'Entre 2001 y 2025, la nieve de la Cordillera Real…', opciones: ['bajó', 'no cambió', 'subió'] },
    tarjetas: [
      { pregunta: '¿Qué es una hipótesis?', respuesta: 'Una corazonada que se puede comprobar con datos. Puede estar equivocada, ¡y eso está bien!' },
      { pregunta: '¿Qué diferencia hay entre un dato y una suposición?', respuesta: 'El dato se puede medir y tiene fuente. La suposición todavía no está comprobada.' },
      { pregunta: '¿El 42 % de los glaciares andinos es de agua?', respuesta: 'No. Es del tamaño del hielo. Tamaño no es lo mismo que agua.' },
      { pregunta: '¿Qué te haría cambiar de opinión?', respuesta: 'Una serie de datos de satélite, no la opinión de un vecino ni una foto aislada.' },
      { pregunta: '¿Por qué importa la nieve de la cordillera para La Paz?', respuesta: 'Porque en la época seca, parte del agua de la ciudad viene del deshielo de los glaciares.' }
    ],
    trivia: [
      { pregunta: '"En 2016 La Paz tuvo racionamiento de agua." ¿Qué es?', opciones: ['Un dato con fuente', 'Una suposición', 'Una hipótesis', 'Un rumor'], correcta: 0, explicacion: 'Está documentado en noticias de esa época: es un dato.' },
      { pregunta: '"Alerta roja por sequía, pero las represas están bien." ¿En qué caja va?', opciones: ['Dato', 'Hay que aclarar', 'Suposición', 'Basura'], correcta: 1, explicacion: 'Alerta roja no es lo mismo que represas vacías. Dos fuentes, dos mensajes: hay que aclarar.' },
      { pregunta: '"La causa es el cambio climático." En este caso, ¿qué es?', opciones: ['Un dato medido', 'Una suposición todavía no probada con nuestros datos', 'Algo falso', 'Una fuente'], correcta: 1, explicacion: 'Puede ser cierto, pero nuestra investigación aún no lo prueba.' },
      { pregunta: '¿Qué te haría cambiar tu hipótesis?', opciones: ['La opinión de un vecino', 'Una foto de un día', 'Una serie de datos de satélite de muchos años', 'Un meme'], correcta: 2, explicacion: 'Solo una serie larga de datos puede confirmar o desmentir una tendencia.' },
      { pregunta: 'Si los datos dicen lo contrario a tu hipótesis, ¿perdiste?', opciones: ['Sí', 'No: así avanza la ciencia', 'Depende del puntaje', 'Hay que cambiar los datos'], correcta: 1, explicacion: 'Una hipótesis equivocada también es un hallazgo. Nunca se cambian los datos.' }
    ],
    jukumari: { inicio: 'Llegó una carpeta. Separemos lo que sabemos de lo que suponemos.', acierto: 'Buen olfato.', fallo: 'Pregúntate: ¿esto se puede medir y comprobar?' },
    insignia: null,
    datos: null
  },

  // ───────────────────────────── 3
  {
    id: 'variable',
    numero: 3,
    titulo: 'Variable',
    paso: 'Paso 1 · ¿Qué mido?',
    teoria: {
      intro: 'Una <b>variable</b> es algo del ambiente que se puede <b>medir</b> y que <b>cambia</b> con el tiempo o el lugar. Hay variables que miden el fenómeno y otras que ayudan a explicar por qué pasa.',
      tarjetas: [
        { icono: '❄', titulo: 'Nieve · MODIS', texto: 'Mide el fenómeno: dónde hay nieve y cuánta superficie cubre.', etiqueta: 'Mide el fenómeno' },
        { icono: '💧', titulo: 'Lluvia · GPM', texto: 'Ayuda a explicar: si cae menos agua, hay menos nieve.', etiqueta: 'Explica el porqué' },
        { icono: '⚖', titulo: 'Peso del hielo · GRACE', texto: 'Pesa el hielo, pero solo en zonas enormes de unos 300 km. Aquí no sirve: lo usamos solo en la Antártida.', etiqueta: 'No sirve a esta escala' }
      ],
      paraPensar: 'Usaremos la nieve que ve MODIS: hay fotos de todos los días desde el año 2000. La lluvia (GPM) será nuestra testigo.',
      paraCuriosos: 'El producto exacto se llama MOD10A1, versión 6.1.'
    },
    tarjetas: [
      { pregunta: '¿Qué es una variable?', respuesta: 'Algo del ambiente que se puede medir y que toma valores distintos en el tiempo o el lugar.' },
      { pregunta: '¿Qué variable mide el fenómeno de este caso?', respuesta: 'La nieve, medida por MODIS.' },
      { pregunta: '¿Para qué sirve la lluvia en este caso?', respuesta: 'Para intentar explicar por qué cambia la nieve.' },
      { pregunta: '¿Desde cuándo hay datos diarios de nieve de MODIS?', respuesta: 'Desde el año 2000. Nosotros usamos los años completos: 2001 a 2025.' },
      { pregunta: '¿MODIS distingue nieve de hielo de glaciar?', respuesta: 'No. Ve superficie blanca: nieve o hielo. Por eso hablamos de "nieve".' }
    ],
    trivia: [
      { pregunta: '¿Qué satélite mide la nieve de la Cordillera Real?', opciones: ['GPM', 'MODIS', 'GRACE', 'Ninguno'], correcta: 1, explicacion: 'MODIS ve dónde hay nieve cada día. GPM mide lluvia y GRACE solo sirve en zonas enormes.' },
      { pregunta: 'La lluvia de GPM, en este caso, sirve para…', opciones: ['Medir la nieve', 'Explicar por qué cambia la nieve', 'Nada', 'Pesar el hielo'], correcta: 1, explicacion: 'Es un testigo: ayuda a explicar, no mide el fenómeno.' },
      { pregunta: '¿Por qué no usamos GRACE en la cordillera?', opciones: ['Es muy caro', 'Ve manchas de ~300 km: la cordillera es mucho más angosta', 'No es de NASA', 'Solo mide lluvia'], correcta: 1, explicacion: 'La escala importa: la cordillera "no cabe" en una mancha de GRACE.' },
      { pregunta: '¿Qué es una variable?', opciones: ['Un valor que nunca cambia', 'Algo que se puede medir y cambia', 'Un tipo de satélite', 'Una foto decorativa'], correcta: 1, explicacion: 'Si se puede medir y cambia, es una variable.' },
      { pregunta: '¿Desde qué año usamos los datos de nieve?', opciones: ['1950', '2001', '2018', '2025'], correcta: 1, explicacion: 'MODIS empezó en febrero de 2000; usamos años completos desde 2001.' }
    ],
    jukumari: { inicio: 'Vamos a elegir qué medir.', acierto: '¡Ojo de águila!', fallo: 'Recuerda la escala: ¿cabe la cordillera en una mancha de 300 km?' },
    insignia: 'variable',
    datos: null
  },

  // ───────────────────────────── 4
  {
    id: 'region',
    numero: 4,
    titulo: 'Región',
    paso: 'Paso 2 · ¿Dónde?',
    teoria: {
      intro: 'El lugar que eliges importa. Si miras un terreno demasiado grande, las pistas se pierden entre la roca y los lagos. Compara tres recuadros: <b>grande</b>, <b>medio</b> (del Huayna Potosí al Tuni-Condoriri) y <b>solo glaciares</b> (solo donde hubo hielo).',
      tarjetas: [
        { icono: '⬛', titulo: 'Grande', texto: 'Toda la caja de la cordillera: mucha roca y lagos.' },
        { icono: '◼', titulo: 'Medio', texto: 'Huayna Potosí a Tuni-Condoriri.' },
        { icono: '❄', titulo: 'Solo glaciares', texto: 'Solo donde hubo hielo según los contornos GLIMS.' }
      ],
      paraPensar: 'Un recuadro grande no miente, pero "agua" el cambio, como echar jugo en un balde de agua.',
      paraCuriosos: 'Los bordes de los glaciares vienen de GLIMS, un mapa mundial de glaciares.'
    },
    actividad: { tipo: 'recuadros', descripcion: 'Elegir recuadro y ver su curva y su pendiente (series.json, umbral 40, cobertura 50).' },
    tarjetas: [
      { pregunta: '¿Por qué importa el tamaño de la región?', respuesta: 'Porque si incluye mucha roca y lagos, el cambio del hielo se nota menos.' },
      { pregunta: '¿Qué significa que la señal "se diluye"?', respuesta: 'Que el cambio queda mezclado con zonas que no tienen nieve y se ve más débil.' },
      { pregunta: '¿Qué es GLIMS?', respuesta: 'Un inventario mundial de contornos de glaciares (NSIDC, con apoyo de NASA).' },
      { pregunta: '¿Qué recuadro usamos en el resto del caso?', respuesta: 'Solo glaciares, salvo que elijas otro.' },
      { pregunta: '¿Un recuadro grande da un resultado falso?', respuesta: 'No. Da el mismo rumbo, pero más débil.' }
    ],
    trivia: [
      { pregunta: 'Tu recuadro incluye lagos y roca sin hielo. ¿Qué le pasa a la señal?', opciones: ['Se amplifica', 'Se diluye', 'Queda igual', 'Desaparece siempre'], correcta: 1, explicacion: 'Los cuadritos sin hielo no cambian y hacen que el cambio se note menos.' },
      { pregunta: '¿Con qué recuadro se ve más claro el cambio del hielo?', opciones: ['Grande', 'Medio', 'Solo glaciares', 'Da igual'], correcta: 2, explicacion: 'Tiene menos roca y lagos que diluyan la señal.' },
      { pregunta: '¿Qué pico está en el recuadro medio?', opciones: ['Illimani', 'Huayna Potosí', 'Kilimanjaro', 'Everest'], correcta: 1, explicacion: 'El recuadro medio va del Huayna Potosí al Tuni-Condoriri.' },
      { pregunta: '¿De dónde salen los contornos de "solo glaciares"?', opciones: ['GLIMS', 'Google Maps', 'Un dibujo a mano', 'GPM'], correcta: 0, explicacion: 'GLIMS es el inventario mundial de glaciares.' },
      { pregunta: 'Un recuadro grande muestra un cambio pequeño. ¿Es mentira?', opciones: ['Sí', 'No, solo diluye', 'Hay que borrarlo', 'Depende del color'], correcta: 1, explicacion: 'El rumbo es el mismo; solo se ve más débil.' }
    ],
    jukumari: { inicio: '¿Qué recuadro mostrará mejor el cambio? Primero adivina.', acierto: '¡Cartógrafo nato!', fallo: 'Piensa en cuántos cuadritos del recuadro pueden tener hielo.' },
    insignia: 'region',
    datos: ['lecciones/series.json']
  },

  // ───────────────────────────── 5
  {
    id: 'periodo',
    numero: 5,
    titulo: 'Periodo',
    paso: 'Paso 3 · ¿Cuándo?',
    repaso: { pregunta: '¿Por qué GRACE no servía en la cordillera?', opciones: ['Por la escala', 'Por el color', 'Porque es nuevo'], correcta: 0 },
    teoria: {
      intro: 'La montaña "cambia de ropa" cada estación: en la época de lluvias se acumula nieve y en la época seca se derrite. Comparar marzo de un año con septiembre de otro es <b>injusto</b>. Lo justo es comparar <b>los mismos meses</b> en años distintos.',
      tarjetas: [
        { icono: '🌧', titulo: 'Época de lluvias', texto: 'Cae nieve nueva que dura poco.' },
        { icono: '☀', titulo: 'Época seca', texto: 'Se derrite la nieve de temporada.' },
        { icono: '📅', titulo: 'Agosto y septiembre', texto: 'Fin de la época seca: queda el hielo más duradero. Es nuestra ventana.' }
      ],
      paraPensar: 'Los colores de los meses salen de nuestro gráfico real de 12 meses, no de un texto fijo.'
    },
    actividad: { tipo: 'meses', descripcion: 'Gráfico de 12 meses con el % de nieve promedio (mensual.json). Tocar un mes muestra su valor.' },
    tarjetas: [
      { pregunta: '¿Por qué la nieve sube y baja durante el año?', respuesta: 'Por las estaciones: se acumula en la época de lluvias y se derrite en la seca.' },
      { pregunta: '¿Qué comparación es justa?', respuesta: 'El mismo mes (o los mismos meses) en años distintos.' },
      { pregunta: '¿Qué ventana usamos?', respuesta: 'Agosto y septiembre, el fin de la época seca.' },
      { pregunta: '¿Por qué agosto y septiembre?', respuesta: 'Porque la nieve de temporada casi no estorba y se ve mejor el hielo duradero.' },
      { pregunta: '¿Comparar marzo de 2001 con septiembre de 2024 es justo?', respuesta: 'No: es comparar la época de lluvias con la seca.' }
    ],
    trivia: [
      { pregunta: '¿Cuál es la comparación justa?', opciones: ['Marzo con septiembre', 'El mismo mes en años distintos', 'Cualquier mes con pocas nubes', 'El primer día de cada año'], correcta: 1, explicacion: 'Así la estación no engaña.' },
      { pregunta: 'Si comparo marzo de 2001 con septiembre de 2024, la caída que veo es…', opciones: ['Una tendencia segura', 'Una trampa de las estaciones', 'Un error del satélite', 'Imposible'], correcta: 1, explicacion: 'Comparaste lluvias con época seca.' },
      { pregunta: '¿Qué ventana usamos en el caso?', opciones: ['Enero', 'Agosto y septiembre', 'Todo el año mezclado', 'Solo diciembre'], correcta: 1, explicacion: 'Fin de la época seca: queda el hielo duradero.' },
      { pregunta: 'En la época de lluvias, la nieve…', opciones: ['Se acumula', 'Desaparece', 'No cambia', 'Se vuelve roca'], correcta: 0, explicacion: 'Cae nieve nueva que luego se derrite.' },
      { pregunta: '¿Qué años comparamos?', opciones: ['Solo 2025', '2001 a 2025', '1900 a 1950', 'Uno al azar'], correcta: 1, explicacion: 'Todos los años completos que tiene MODIS.' }
    ],
    jukumari: { inicio: 'La nieve sube y baja con las estaciones. Toca los meses y mira.', acierto: '¡Maestro del calendario!', fallo: '¿Estamos comparando épocas equivalentes?' },
    insignia: 'periodo',
    datos: ['lecciones/mensual.json']
  },

  // ───────────────────────────── 6
  {
    id: 'serie',
    numero: 6,
    titulo: 'Serie',
    paso: 'Paso 4 · ¿Son buenos mis datos?',
    teoria: {
      intro: 'El satélite no ve a través de las nubes, y en los Andes hay muchas. Tú decides dos cosas: <b>cuántas nubes aceptar</b> en un día y <b>qué tan blanco</b> debe verse un cuadrito para decir "aquí hay nieve".',
      tarjetas: [
        { icono: '☁', titulo: 'Números del satélite', texto: 'A cada cuadrito le pone un número: de 0 a 100 dice cuánta nieve parece haber. Otros números son avisos: 250 = nube, 211 = noche.' },
        { icono: '🎚', titulo: 'Umbral', texto: 'Un cuadrito puede tener nieve y roca a la vez. El umbral es tu límite: desde qué número cuenta como nieve. Si lo subes, cuentan menos cuadritos.' },
        { icono: '✅', titulo: 'Día útil', texto: 'Un día con suficiente cielo despejado para confiar en la foto.' }
      ],
      paraPensar: 'Si exiges poco, entran días dudosos. Si exiges mucho, casi no quedan días.',
      paraCuriosos: 'Lista completa de MOD10A1: 0–100 índice de nieve (NDSI) · 200 sin dato · 201 sin decisión · 211 noche · 237 agua de lagos · 239 océano · 250 nube · 254 sensor saturado · 255 relleno. Umbrales: 30, 40 o 50. Cielo despejado mínimo: 30, 50 o 70 %.'
    },
    actividad: { tipo: 'nubes-umbral', descripcion: 'Cuadrícula de 61 días (dias_ejemplo.json): nieve / sin nieve / nube. Luego sliders de cobertura y umbral con la serie anual (series.json). Misión: al menos 10 días útiles cada año.' },
    tarjetas: [
      { pregunta: '¿Puede el satélite ver nieve debajo de una nube?', respuesta: 'No. Por eso descartamos los días muy nublados.' },
      { pregunta: '¿Qué es el umbral?', respuesta: 'El límite que decides: desde qué número un cuadrito cuenta como nieve.' },
      { pregunta: 'Si subo el umbral de 40 a 50, ¿qué pasa?', respuesta: 'Menos cuadritos cuentan como nieve.' },
      { pregunta: '¿Qué es un día útil?', respuesta: 'Un día con suficiente cielo despejado para confiar en el dato.' },
      { pregunta: '¿Qué valores de MODIS son nieve válida?', respuesta: 'De 0 a 100 (0 = sin nieve). Los demás son avisos: 250 nube, 211 noche…' }
    ],
    trivia: [
      { pregunta: 'Un día en que las nubes tapan 9 de cada 10 cuadritos, ¿confiarías en él?', opciones: ['Sí', 'No', 'Solo si es lunes', 'Siempre'], correcta: 1, explicacion: 'Casi todo está tapado: ese día no nos cuenta casi nada del hielo.' },
      { pregunta: 'Subir el umbral de 40 a 50 hace que…', opciones: ['Más cuadritos cuenten como nieve', 'Menos cuadritos cuenten como nieve', 'No cuente nada', 'Cambie el satélite'], correcta: 1, explicacion: 'Pides que el cuadrito se vea más blanco.' },
      { pregunta: 'En MODIS, el valor 250 significa…', opciones: ['Mucha nieve', 'Nube', 'Agua', 'Roca'], correcta: 1, explicacion: 'Es un código de nube. Solo de 0 a 100 son valores de nieve.' },
      { pregunta: 'Si exiges 90 % de cielo despejado, ¿qué pasa?', opciones: ['Sobran días', 'Casi no quedan días', 'Nada cambia', 'Aparece nieve'], correcta: 1, explicacion: 'En los Andes casi siempre hay alguna nube.' },
      { pregunta: '¿Existe un umbral perfecto?', opciones: ['Sí, el 100', 'No, pero sí uno razonable', 'Sí, el 0', 'Solo NASA lo sabe'], correcta: 1, explicacion: 'Se elige uno razonable y luego se prueba que el resultado no dependa de él.' }
    ],
    jukumari: { inicio: 'Tú decides cuánto cielo despejado exigir.', acierto: '¡Cazador de nubes!', fallo: 'Un día tapado casi por completo, ¿qué nos cuenta del hielo?' },
    insignia: 'serie',
    datos: ['lecciones/dias_ejemplo.json', 'lecciones/series.json']
  },

  // ───────────────────────────── 7
  {
    id: 'significancia',
    numero: 7,
    titulo: 'Significancia',
    paso: 'Paso 5 · ¿Real o casualidad?',
    repaso: { pregunta: '¿Por qué elegimos agosto y septiembre?', opciones: ['Fin de la época seca', 'Hay más turistas', 'Es invierno en Europa'], correcta: 0 },
    teoria: {
      intro: 'La suerte también dibuja subidas y bajadas que parecen tendencias. El <b>valor p</b> responde: si la nieve en verdad no cambiara, ¿qué tan raro sería ver este dibujo por pura suerte? Si p es menor que 0,05 (menos de 5 en 100), decimos que es muy difícil que sea solo suerte.',
      tarjetas: [
        { icono: '🎲', titulo: 'Azar', texto: 'Series al azar pueden parecer tendencias.' },
        { icono: '📉', titulo: 'Pendiente', texto: 'Cuánto sube o baja la nieve cada año. En tu serie: {pendiente_decada} cada 10 años.' },
        { icono: '⚖', titulo: 'Valor p', texto: 'En tu serie: p = {p}. Ojo: que no sea suerte no dice si el cambio es grande ni por qué pasa.' }
      ],
      paraPensar: 'Si los datos no alcanzan para decidir, también es un hallazgo.',
      paraCuriosos: 'Usamos la prueba de Mann-Kendall y la pendiente de Sen, con un margen de error del 95 %.'
    },
    actividad: { tipo: 'juez-azar', descripcion: '6 minigráficos: 5 al azar (generados en el navegador) y 1 real (series.json), en orden aleatorio. Después: serie real con línea de tendencia, banda de 95 % e interruptor "quitar los 3 años más extremos".' },
    tarjetas: [
      { pregunta: '¿Qué mide el valor p?', respuesta: 'Qué tan raro sería ver un patrón así si en realidad no hubiera tendencia.' },
      { pregunta: '¿Qué significa p menor que 0,05?', respuesta: 'Que es muy difícil que el cambio sea solo suerte.' },
      { pregunta: '¿Significativo quiere decir importante?', respuesta: 'No. También importa qué tan grande es la pendiente.' },
      { pregunta: '¿Qué es la pendiente?', respuesta: 'Cuánto sube o baja la nieve cada año. Se calcula de forma que un año raro no la engañe.' },
      { pregunta: '¿Y si p es mayor que 0,05?', respuesta: 'No podemos asegurar que sea más que azar. Es un resultado no concluyente.' }
    ],
    trivia: [
      { pregunta: 'Tu valor p es {p}. ¿Qué significa?', opciones: ['Si no hubiera tendencia real, ver un patrón así sería poco común', 'Hay {p} de probabilidad de que sea azar', 'El glaciar perdió {p}', 'El satélite falló'], correcta: 0, explicacion: 'El valor p no es la probabilidad de que sea azar: mide qué tan raro sería el patrón sin tendencia.' },
      { pregunta: '¿Un resultado significativo es siempre importante?', opciones: ['Sí', 'No: depende también del tamaño de la pendiente', 'Solo si es rojo', 'Siempre que p = 0'], correcta: 1, explicacion: 'Un cambio puede ser real pero muy pequeño.' },
      { pregunta: 'Significativo, ¿quiere decir que sabemos la causa?', opciones: ['Sí', 'No', 'Solo con nieve', 'Solo en Bolivia'], correcta: 1, explicacion: 'Dice que el cambio no es solo azar; no dice por qué ocurre.' },
      { pregunta: 'Varios gráficos al azar parecían tendencias. ¿Qué aprendemos?', opciones: ['Que el azar engaña al ojo', 'Que los datos no sirven', 'Que todo es tendencia', 'Nada'], correcta: 0, explicacion: 'Por eso usamos una prueba estadística y no solo la vista.' },
      { pregunta: 'Si quitamos los 3 años más extremos y la tendencia sigue, ¿qué significa?', opciones: ['Que no depende de unos pocos años raros', 'Que está mal', 'Que hay que quitar más', 'Nada'], correcta: 0, explicacion: 'Un resultado robusto no depende de un par de años.' }
    ],
    jukumari: { inicio: 'Cuidado: el azar también dibuja tendencias. Toca las que creas reales.', acierto: '¡Juez del azar!', fallo: 'Recuerda: p mide lo raro del patrón si no pasara nada.' },
    insignia: 'significancia',
    datos: ['lecciones/series.json']
  },

  // ───────────────────────────── 8
  {
    id: 'validacion',
    numero: 8,
    titulo: 'Validación',
    paso: 'Paso 6 · ¿Resiste pruebas?',
    repaso: { pregunta: 'Un día casi todo tapado por nubes, ¿lo usamos?', opciones: ['No', 'Sí', 'A veces'], correcta: 0 },
    teoria: {
      intro: 'Un buen detective desconfía de su propio resultado. Lo ponemos a prueba: cambiar el umbral, exigir más cielo despejado, revisar si los años se copian entre sí y quitar los años de <b>El Niño fuerte</b>. Al final: <b>{n_ok} de {n_pruebas}</b> pruebas superadas.',
      tarjetas: [
        { icono: '🟢', titulo: 'Verde', texto: 'Pasó: el rumbo se mantiene.' },
        { icono: '🟡', titulo: 'Amarillo', texto: 'Sobrevive, pero más débil.' },
        { icono: '🔴', titulo: 'Rojo', texto: 'No pasó: es un límite que va en tu informe.' }
      ],
      paraPensar: 'El Niño es un calentamiento natural del océano Pacífico que vuelve cada pocos años. En el Altiplano suele traer menos lluvia.',
      paraCuriosos: 'El índice de El Niño (ONI) es de NOAA, no de NASA. Los años que se copian se corrigen con la prueba de Hamed y Rao.'
    },
    actividad: { tipo: 'pruebas', descripcion: '5 botones "Probar" con semáforo (pruebas.json). Luego la pregunta de correlación y causa con la lluvia (cordillera-real.json, variable lluvia).' },
    tarjetas: [
      { pregunta: '¿Por qué probar otro umbral?', respuesta: 'Para ver que el resultado no depende de una sola decisión nuestra.' },
      { pregunta: '¿Qué es El Niño?', respuesta: 'Un calentamiento natural del Pacífico que en el Altiplano suele traer menos lluvia.' },
      { pregunta: '¿Para qué quitamos los años de El Niño fuerte?', respuesta: 'Para ver si la tendencia era solo por esos años.' },
      { pregunta: '¿Si dos cosas cambian juntas, una causa la otra?', respuesta: 'No siempre. Ejemplo: en verano se venden más helados y hay más quemaduras de sol, pero los helados no queman.' },
      { pregunta: 'Si descarto la lluvia como explicación, ¿ya sé la causa?', respuesta: 'No. Descartar una explicación no es demostrar otra.' }
    ],
    trivia: [
      { pregunta: 'La lluvia no cambió de forma clara, pero la nieve baja. ¿Qué sugiere?', opciones: ['La falta de lluvia no basta para explicarlo', 'El calentamiento es la causa demostrada', 'Los datos están mal', 'Nada'], correcta: 0, explicacion: 'Descartamos una explicación; para hablar de causa hacen falta más pistas.' },
      { pregunta: 'En los años de El Niño fuerte la nieve fue menor. ¿Eso prueba que El Niño causa la tendencia?', opciones: ['Sí', 'No, pudo coincidir', 'Solo si es en Perú', 'Siempre'], correcta: 1, explicacion: 'Correlación no es causa. Por eso los quitamos y volvemos a probar.' },
      { pregunta: 'Una prueba sale en rojo. ¿Qué haces?', opciones: ['La escondes', 'La pones como límite en tu informe', 'Cambias los datos', 'Repites hasta que salga verde'], correcta: 1, explicacion: 'Un límite honesto hace más fuerte tu informe.' },
      { pregunta: '¿Por qué revisamos si los años se copian entre sí?', opciones: ['Porque si un año se parece mucho al anterior, no es una prueba nueva', 'Para borrar nubes', 'Para cambiar el satélite', 'Para subir la nieve'], correcta: 0, explicacion: 'Si los años se parecen a sus vecinos, ajustamos el valor p para no exagerar.' },
      { pregunta: '¿De dónde viene el índice de El Niño (ONI)?', opciones: ['NOAA', 'MODIS', 'GPM', 'Google'], correcta: 0, explicacion: 'Es de NOAA, la agencia del clima y los océanos de EE. UU.' }
    ],
    jukumari: { inicio: 'Sometamos tu hallazgo a pruebas.', acierto: '¡Escéptico profesional!', fallo: '¿Hemos probado el calentamiento, o solo descartado la lluvia?' },
    insignia: null,
    datos: ['lecciones/pruebas.json', 'cordillera-real.json']
  },

  // ───────────────────────────── 9
  {
    id: 'veredicto',
    numero: 9,
    titulo: 'Veredicto e informe',
    paso: 'Paso 7 · ¿Qué puedo afirmar?',
    repaso: { pregunta: '¿Qué quiere decir un valor p pequeño?', opciones: ['El patrón sería raro si no pasara nada', 'Que hay poca nieve', 'Que el satélite es pequeño'], correcta: 0 },
    teoria: {
      intro: 'Comparamos tu corazonada con los datos. Lo que creías: <b>{hipotesis}</b>. Lo que dicen los datos: <b>{pendiente_decada} por década, p = {p}</b> ({veredicto_texto}). Ahora escribes tu veredicto con palabras honestas y sus límites.',
      tarjetas: [
        { icono: '💭', titulo: 'Tu hipótesis', texto: '{hipotesis}' },
        { icono: '📊', titulo: 'Los datos', texto: '{pendiente_decada} por década · p = {p}' },
        { icono: '⚠', titulo: 'Límites', texto: 'El satélite ve nieve, no el glaciar · cuadritos de 500 m · tamaño no es agua · una sola fuente de datos.' }
      ],
      plantilla: 'Entre {desde} y {hasta}, la nieve de {region} en agosto-septiembre [disminuyó / aumentó / no cambió de forma clara] a un ritmo de {pendiente_decada} puntos cada 10 años (p = {p}). El resultado [superó / superó en parte / no superó] las pruebas ({n_ok} de {n_pruebas}). Esto [va de acuerdo con / no alcanza para afirmar] una pérdida de agua para La Paz.',
      paraPensar: 'MODIS mide cuánto lugar ocupa la nieve, no cuántos litros de agua hay. "Demuestra" es una palabra demasiado fuerte para este caso.'
    },
    actividad: { tipo: 'veredicto', descripcion: 'Plantilla con menús y al menos 2 límites marcados. Control de honestidad: si elige "demuestra", o "disminuyó" con p ≥ 0,05, el Jukumari le pide otra palabra. Al terminar: informe del caso (Mis casos).' },
    tarjetas: [
      { pregunta: '¿Qué es un veredicto?', respuesta: 'Lo que puedes afirmar con tus datos, con palabras justas y sus límites.' },
      { pregunta: '¿Por qué no decir "demuestra"?', respuesta: 'Porque MODIS mide superficie de nieve, no litros de agua.' },
      { pregunta: '¿Qué es un límite del estudio?', respuesta: 'Algo que tus datos no pueden decir. Escribirlo hace tu informe más confiable.' },
      { pregunta: 'Si los datos contradicen tu hipótesis, ¿qué pasa?', respuesta: 'Nada malo: así avanza la ciencia.' },
      { pregunta: '¿Este método sirve para otros glaciares?', respuesta: 'Sí, pero cada montaña se analiza con sus propios datos.' }
    ],
    trivia: [
      { pregunta: '¿Qué palabra es honesta si la nieve bajó con p < 0,05?', opciones: ['Demuestra pérdida de agua', 'Va de acuerdo con una pérdida de agua', 'Prueba el cambio climático', 'No dice nada'], correcta: 1, explicacion: 'Medimos nieve, no agua: "va de acuerdo con" es lo justo.' },
      { pregunta: 'Si p ≥ 0,05, ¿puedes decir "la nieve disminuyó"?', opciones: ['Sí', 'No, el resultado no es concluyente', 'Solo los lunes', 'Sí, si lo crees'], correcta: 1, explicacion: 'Con esos datos no podemos asegurarlo.' },
      { pregunta: '¿Cuál es un límite real de este caso?', opciones: ['MODIS no distingue nieve de hielo', 'El satélite es rojo', 'No hay internet', 'El Jukumari no sabe'], correcta: 0, explicacion: 'Ve superficie blanca, no el glaciar en sí.' },
      { pregunta: '¿Por qué los cuadritos de 500 m son un límite?', opciones: ['No ven glaciares muy pequeños', 'Son muy caros', 'Son de colores', 'No son de NASA'], correcta: 0, explicacion: 'Un glaciar más chico que un cuadrito se mezcla con la roca.' },
      { pregunta: '¿Un resultado de La Paz se puede copiar a otra montaña?', opciones: ['Sí, igual', 'No: hay que analizar sus propios datos', 'Solo en Perú', 'Solo si es más alta'], correcta: 1, explicacion: 'Cada montaña tiene su clima y su historia.' }
    ],
    jukumari: { inicio: 'Llegó la hora del veredicto, {apodo}.', acierto: '¡Informe listo! Cada cifra tiene su fuente.', fallo: 'Ojo: con tus pruebas no podemos afirmar tanto. ¿Qué palabra usarías?' },
    insignia: 'caso-nieve',
    datos: ['lecciones/series.json', 'lecciones/pruebas.json']
  }
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
