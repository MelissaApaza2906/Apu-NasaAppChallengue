// Contenido del Jukumari asistente (APU).
// El Jukumari es el EXPLORADOR de la Cordillera; el usuario es el DETECTIVE.
// NO incluye lecciones ni casos (eso lo escribe Darwin en contenido/lecciones.js y casos).
// Cifras de APU = resultados reales de frontend/public/datos/cordillera-real.json.

// ─────────────────────────────────────────────────────────────
// 1. POR PANTALLA: saludo (primera vez), "¿Qué hago aquí?", conceptos sugeridos y consejos
// ─────────────────────────────────────────────────────────────
export const PANTALLAS = {
  carga: {
    saludo: '¡Hola! Soy el Jukumari, explorador de la Cordillera. Toca «Empezar misión» y vamos.',
    queHago: 'Estamos preparando la expedición. Mientras carga, lee los «¿Sabías que…?» de abajo.',
    conceptos: ['satelite', 'nasa'],
    consejos: ['Si me tocas, te cuento algo.']
  },
  menu: {
    saludo: 'Este es nuestro planeta, visto desde el espacio. ¡Toca un glaciar para conocer su historia!',
    queHago: 'Gira el planeta con el dedo y toca un pin. El rojo es la Cordillera Real de Bolivia, nuestro caso. Después puedes ver su montaña en 3D.',
    conceptos: ['glaciar', 'glaciarTropical', 'satelite', 'orbita', 'terra', 'eonet', 'blueMarble', 'gibs'],
    consejos: [
      'Los pines oscuros con un copo son glaciares del mundo.',
      'La línea punteada es la órbita del satélite: da vueltas a la Tierra tomando fotos.',
      'El botón de capas (arriba a la derecha) muestra las nubes reales de ayer.'
    ]
  },
  glaciar: { // pestaña lateral de un glaciar
    saludo: 'Aquí está su historia. Si quieres ver cómo cambió su nieve, toca «Ver montaña en 3D».',
    queHago: 'Lee su línea de tiempo y su dato más importante. Luego entra a la montaña para ver los datos de NASA.',
    conceptos: ['glaciar', 'latitudLongitud', 'msnm'],
    consejos: ['Cada dato tiene su fuente en letra pequeña: así trabajan los detectives.']
  },
  montana: { // vista de la montaña con datos
    saludo: 'Yo conozco estas cumbres. Tú investiga los datos: ¿la nieve está cambiando?',
    queHago: 'Mira el panel de la derecha: el gráfico muestra 25 años de nieve medidos por satélite. Usa la máquina del tiempo para comparar años.',
    conceptos: ['ndsi', 'modis', 'gpm', 'serieTiempo', 'tendencia', 'valorP', 'promedio'],
    conceptosMasa: ['grace', 'gigatonelada'], // solo si la región abierta tiene variables.masa (Antártida)
    consejos: [
      'Cambia entre Nieve y Lluvia arriba del panel.',
      'Con la nieve, la tendencia es real (p = 0,03). Con la lluvia, todavía no se sabe (p = 0,47).',
      'Nevada y Lluvia muestran cuánto cayó en el mes elegido, según el dato real.'
    ]
  },
  acceso: {
    saludo: 'Soy el Jukumari, explorador de la Cordillera. ¿Cómo te llamo, detective?',
    queHago: 'Escribe un apodo (no tu nombre real) y elige tu avatar. Así guardo tus lecciones e insignias.',
    conceptos: [],
    consejos: ['No pedimos correo, edad ni fotos. Solo tu apodo.']
  },
  etapas: {
    saludo: '¡A entrenar! Cada etapa es un paso del detective.',
    queHago: 'Empieza por la etapa que late en rojo. Al terminarla, se abre la siguiente.',
    conceptos: ['variable', 'region', 'periodo', 'serieTiempo', 'valorP'],
    consejos: ['El número rojo de cada etapa dice cuántas actividades tiene.']
  },
  insignias: {
    saludo: 'Aquí guardas todo lo que ganaste en la expedición.',
    queHago: 'Mira tus insignias y tu avance. Las grises todavía te faltan.',
    conceptos: [],
    consejos: ['Si tocas «Cerrar sesión», tus insignias se borran de este dispositivo.']
  },
  ajustes: {
    saludo: 'Aquí puedes cambiar tu apodo o tu avatar.',
    queHago: 'Tu progreso se guarda con tu apodo, sin correo ni contraseña.',
    conceptos: [],
    consejos: ['«Borrar mi cuenta» elimina tu apodo y tu progreso para siempre.']
  }
};

// ─────────────────────────────────────────────────────────────
// 2. GLOSARIO: «Explícame…» (texto simple para 12 años + versión para curiosos)
// ─────────────────────────────────────────────────────────────
export const GLOSARIO = {
  // La Tierra y el hielo
  glaciar: { titulo: 'Glaciar', simple: 'Es un río de hielo muy lento. Se forma cuando cae más nieve de la que se derrite, año tras año, y se aplasta hasta volverse hielo.', mas: 'Un glaciar se mueve por su propio peso, unos centímetros o metros por día.' },
  glaciarTropical: { titulo: 'Glaciar tropical', simple: 'Es un glaciar cerca del ecuador, donde hace calor abajo pero mucho frío en las cumbres altas. La Cordillera Real tiene glaciares tropicales.', mas: 'Son muy sensibles a los cambios del clima porque reciben sol fuerte todo el año.' },
  nieve: { titulo: 'Nieve', simple: 'Es agua que se congela en las nubes y cae en copos. Sobre las montañas se acumula y alimenta a los glaciares.', mas: 'La nieve fresca refleja casi toda la luz del sol; por eso se ve tan blanca desde el espacio.' },
  epocas: { titulo: 'Época seca y de lluvias', simple: 'En La Paz casi toda la lluvia cae entre diciembre y marzo. De mayo a agosto casi no llueve: es la época seca.', mas: 'En la época seca, el agua que baja de los glaciares es muy importante para las ciudades.' },
  aguaGlaciar: { titulo: 'Agua de los glaciares', simple: 'Cuando el hielo se derrite poco a poco, baja como agua a los ríos y llega a las ciudades.', mas: 'Los glaciares dan cerca del 15 % del agua de La Paz en el año y hasta el 27 % en la época seca (Soruco et al., 2015).' },
  clima: { titulo: 'Clima y tiempo', simple: 'El tiempo es lo que pasa hoy: si llueve o hace sol. El clima es cómo suele ser un lugar durante muchos años.', mas: 'Para hablar de clima se necesitan muchos años de datos, no una semana.' },
  msnm: { titulo: 'm s. n. m.', simple: 'Significa «metros sobre el nivel del mar»: cuánto más alto está un lugar que la orilla del mar.', mas: 'El Illimani mide 6 438 m s. n. m.' },
  latitudLongitud: { titulo: 'Latitud y longitud', simple: 'Son la «dirección» de un lugar en la Tierra. La latitud dice qué tan al norte o al sur está; la longitud, qué tan al este u oeste.', mas: 'La Cordillera Real está cerca de 16° Sur y 68° Oeste.' },

  // Satélites y datos de NASA
  nasa: { titulo: 'NASA', simple: 'Es la agencia espacial de Estados Unidos. Tiene satélites que miran la Tierra todos los días y comparte sus datos gratis con todo el mundo.', mas: 'APU usa datos abiertos de NASA: cualquiera puede revisarlos.' },
  satelite: { titulo: 'Satélite', simple: 'Es una máquina que da vueltas alrededor de la Tierra y toma fotos y medidas desde el espacio.', mas: 'Desde arriba puede ver lugares a los que es muy difícil llegar, como las cumbres nevadas.' },
  orbita: { titulo: 'Órbita', simple: 'Es el camino que sigue un satélite alrededor de la Tierra, una y otra vez.', mas: 'Mientras la Tierra gira debajo, el satélite va fotografiando franjas distintas cada vez.' },
  pixel: { titulo: 'Píxel', simple: 'Es cada cuadradito de una imagen. En una imagen de satélite, cada píxel es un pedazo de terreno.', mas: 'En el dato de nieve de MODIS, cada píxel mide unos 500 m de lado.' },
  modis: { titulo: 'MODIS', simple: 'Es una cámara especial que va en los satélites Terra y Aqua de NASA. Mira toda la Tierra casi cada día.', mas: 'Con MODIS medimos la nieve de la Cordillera Real desde 2001 hasta 2025.' },
  ndsi: { titulo: 'Índice de nieve (NDSI)', simple: 'Es un número que dice cuánta nieve ve el satélite en un lugar. Va de 0 (nada de nieve) a 100 (todo nieve).', mas: 'Funciona porque la nieve brilla mucho en luz visible pero se ve oscura en una luz infrarroja que nuestros ojos no ven.' },
  gpm: { titulo: 'GPM IMERG', simple: 'Son datos de lluvia de la misión GPM de NASA. Junta lo que miden muchos satélites para saber cuánta lluvia cayó.', mas: 'Se mide en milímetros: 1 mm de lluvia es como cubrir el suelo con una capa de agua de 1 milímetro.' },
  blueMarble: { titulo: 'Blue Marble', simple: 'Es la foto de la Tierra completa que hizo NASA juntando muchas imágenes sin nubes. Es el planeta que ves en APU.', mas: '«Blue Marble» significa «canica azul».' },
  gibs: { titulo: 'NASA GIBS', simple: 'Es el servicio de NASA que envía las imágenes de satélite por partes, según cuánto te acerques.', mas: 'Gracias a GIBS, el globo de APU muestra imágenes reales sin descargarlas todas.' },
  terra: { titulo: 'Terra', simple: 'Terra es un satélite de NASA lanzado en 1999. Lleva la cámara MODIS, con la que medimos la nieve.', mas: 'Da una vuelta a la Tierra cada 99 minutos, a unos 700 km de altura. En el menú lo ves volar en vivo.' },
  eonet: { titulo: 'NASA EONET', simple: 'Es el servicio de NASA que avisa de eventos naturales en el mundo: icebergs, volcanes, tormentas e incendios.', mas: 'En el globo, los rombos celestes son icebergs y los triángulos naranjas, volcanes activos.' },
  grace: { titulo: 'GRACE', simple: 'GRACE y GRACE-FO son satélites gemelos de NASA que pesan el hielo: miden cómo cambia la gravedad cuando el hielo se pierde.' },
  gigatonelada: { titulo: 'Gigatonelada', simple: 'Mil millones de toneladas. Una gigatonelada de hielo llenaría unas 400 000 piscinas olímpicas.' },
  nubesHoy: { titulo: 'Nubes de hoy', simple: 'Son fotos reales de ayer tomadas por varios satélites (MODIS y VIIRS). Por eso a veces faltan franjas: el satélite aún no pasó por ahí.', mas: 'Juntamos varios satélites para tapar esos huecos.' },

  // Investigar con datos
  variable: { titulo: 'Variable', simple: 'Es algo que se puede medir y que cambia: la nieve, la lluvia o la temperatura.', mas: 'En APU medimos dos: la nieve y la lluvia.' },
  region: { titulo: 'Región', simple: 'Es la zona del mapa que vamos a estudiar. La marcamos con una caja alrededor de las montañas.', mas: 'Nuestra caja cubre la Cordillera Real, de 68,7° a 67,6° Oeste y de 16,8° a 15,7° Sur.' },
  periodo: { titulo: 'Periodo', simple: 'Son los años que miramos. Con pocos años, un año raro puede engañarte; por eso usamos 25.', mas: 'Nieve: 2001–2025. Lluvia: 2001–2024 completos.' },
  serieTiempo: { titulo: 'Serie de tiempo', simple: 'Es una fila de datos ordenados por fecha, como un diario. En el gráfico, cada punto es un año.', mas: 'Con ella vemos si algo sube, baja o se queda igual con los años.' },
  promedio: { titulo: 'Promedio', simple: 'Es sumar todos los valores y dividir entre cuántos son. Sirve para resumir muchos datos en uno.', mas: 'Comparamos el promedio de 2001–2005 con el de 2021–2025.' },
  anomalia: { titulo: 'Anomalía', simple: 'Es cuánto se aleja un mes de lo normal para ese mes. Un enero con menos nieve que otros eneros tiene anomalía negativa.', mas: 'Así quitamos el efecto de las estaciones y vemos el cambio real.' },
  tendencia: { titulo: 'Tendencia', simple: 'Es hacia dónde van los datos con los años: si suben, bajan o se quedan igual. En el gráfico es la línea amarilla.', mas: 'La nieve de la Cordillera Real baja 0,21 puntos por década.' },
  valorP: { titulo: 'Valor p', simple: 'Dice qué tan probable es ver un cambio así por pura casualidad. Si es menor que 0,05, decimos que el cambio es real.', mas: 'Nieve: p = 0,03 → real. Lluvia: p = 0,47 → todavía no se sabe.' },
  noSeSabe: { titulo: '«Todavía no se sabe»', simple: 'No significa que no haya cambiado. Significa que con estos datos no podemos estar seguros. Hacen falta más años.', mas: 'Es como tirar una moneda pocas veces: no alcanza para saber si está cargada.' },
  manKendall: { titulo: 'Prueba de Mann-Kendall', simple: 'Compara cada año con todos los siguientes y cuenta cuántas veces bajó y cuántas subió.', mas: 'Con la nieve: bajó 197 veces y subió 103.' }
};

// ─────────────────────────────────────────────────────────────
// 3. ¿SABÍAS QUE…? generales (además de los de la carga)
// ─────────────────────────────────────────────────────────────
export const CURIOSOS = [
  { texto: 'Según los datos de MODIS, 2016 fue el año con menos nieve en la Cordillera Real desde 2001.', fuente: 'Datos de APU (MODIS MOD10A1)' },
  { texto: 'Según GPM IMERG, 2022 fue el año más seco en la Cordillera Real desde 2001.', fuente: 'Datos de APU (GPM IMERG)' },
  { texto: 'El índice de nieve promedio bajó de 2,17 (2001–2005) a 1,68 (2021–2025).', fuente: 'Datos de APU (MODIS MOD10A1)' },
  { texto: 'En el Chacaltaya estuvo la pista de esquí más alta del mundo. Su glaciar desapareció en 2009.', fuente: 'Inside Climate News, 2009' },
  { texto: 'El Illimani mide 6 438 m y protege a La Paz según la tradición aimara.', fuente: 'Peakbook / Conway, 1899' }
];

// ─────────────────────────────────────────────────────────────
// 4. RESPUESTAS RÁPIDAS (preguntas frecuentes)
// ─────────────────────────────────────────────────────────────
export const PREGUNTAS = [
  { p: '¿De dónde salen los datos?', r: 'De satélites de NASA: MODIS para la nieve y GPM IMERG para la lluvia. Los descargamos y calculamos la tendencia nosotros.' },
  { p: '¿Los datos son reales?', r: 'Sí. Cada número viene de NASA. Si algo es solo una ilustración, la app lo dice.' },
  { p: '¿Por qué la lluvia «todavía no se sabe»?', r: 'Porque la lluvia cambia mucho de un año a otro. Con 24 años no alcanza para estar seguros de que baja.' },
  { p: '¿Qué puedo hacer yo?', r: 'Cuidar el agua, compartir lo que aprendiste y seguir investigando. ¡Un detective informado ayuda a su ciudad!' },
  { p: '¿Quién es el Jukumari?', r: 'Soy el oso andino de la Diablada de Oruro. Conozco las montañas y te acompaño en la expedición.' }
];
