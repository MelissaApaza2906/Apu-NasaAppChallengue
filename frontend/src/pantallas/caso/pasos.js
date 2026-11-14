// Las 7 pistas de un caso (docs/mockups/casos/paso-0 … paso-6). PASOS[k](ctx) pinta la pista k en ctx.cuerpo.
// ctx: { caso, datos (servicios/casos-datos.js), est, juku, escena, ceja(), pie(), conectarPie(), completar(k, elecciones) }
// Ayuda del Jukumari: juku.decir() habla solo con ayuda 'con'; juku.pista() da el texto del botón "💡 Pistas" ('poca').
import { ir } from '../../router.js';
import { MESES_CORTOS, MESES_NOMBRES, recortesDe } from '../../contenido/casos.js';
import { GLACIARES, HISTORIAS, historiaDe } from '../../contenido/glaciares.js';
import { completarCaso, ganarInsignia } from '../../servicios/progreso.js';
import { pixelesDeCaja } from '../../servicios/casos-datos.js';
import { CAJAS } from '../../componentes/casos/capas-escena.js';
import { esc, fmt, fmtP, miles, rumboDatos, ICONO_RUMBO, sinMovimiento } from './comun.js';

const TIPOS = { dato: ['DATO', 'verde'], aclarar: ['HAY QUE ACLARAR', 'amarillo'], suposicion: ['SUPOSICIÓN', 'rojo'] };
const ORDEN = ['dato', 'aclarar', 'suposicion'];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const ventanaTexto = (v) => v.map((m) => MESES_NOMBRES[m - 1]).join(' y ');
const ventanaCorta = (v) => v.map((m) => MESES_NOMBRES[m - 1].slice(0, 3).toUpperCase()).join('–');
// La serie de la escena elegida (grande si la otra no tiene datos)
export const serieElegida = (ctx) => ctx.datos.escenas[ctx.est.elecciones.escena] ?? ctx.datos.escenas.grande;
const iso = (a, m, d) => `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const diasDelMes = (a, m) => new Date(Date.UTC(a, m, 0)).getUTCDate();
// Fechas de los meses permitidos, de la más cercana al centro a la más lejana (máx. n)
function fechasCercanas(anio, meses, centro, n = 10) {
  const todas = [];
  for (const m of meses) for (let d = 1; d <= diasDelMes(anio, m); d++) todas.push(iso(anio, m, d));
  const t0 = Date.parse(centro);
  return todas.sort((a, b) => Math.abs(Date.parse(a) - t0) - Math.abs(Date.parse(b) - t0)).slice(0, n);
}
const fechaBonita = (f) => { const [a, m, d] = f.split('-').map(Number); return `${d} de ${MESES_NOMBRES[m - 1]} de ${a}`; };

export const PASOS = [
  // ── 0 · Expediente: recortes con fuente para clasificar, la misión, la sospecha y la historia
  (ctx) => {
    const { caso, cuerpo, juku, est } = ctx;
    const recs = recortesDe(caso); // 01: los de la lección 5 · 02–11: los de su historia con fuente (todos DATO)
    const elegidos = recs.map((_, i) => est.elecciones.recortes?.[i] ?? null);
    const g = GLACIARES.find((x) => x.id === caso.glaciar);
    const historia = HISTORIAS[caso.id] ?? historiaDe(g);
    cuerpo.innerHTML = `
      <p class="caso-ceja">${esc(ctx.ceja('EXPEDIENTE'))}</p>
      <h1 class="caso-titulo" tabindex="-1">Expediente: <em>${esc(caso.titulo ?? caso.nombre)}</em></h1>
      <div class="exp-grilla" ${recs.length ? '' : 'style="grid-template-columns:1fr"'}>
        ${recs.map((r, i) => `<article class="recorte" data-i="${i}" style="grid-column:${(i % 2) + 1};grid-row:${Math.floor(i / 2) + 1}">
          <small>${esc(r.cuando.toUpperCase())}</small><b>${esc(r.texto)}</b>
          <span class="fuente">Fuente: ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.fuente)}</a>` : esc(r.fuente)}</span>
          <button type="button" class="chip-neon gris" data-r="${i}" aria-label="Clasificar: ${esc(r.texto)}">CLASIFICAR</button></article>`).join('')}
        <div class="vidrio-caso exp-mision" style="${recs.length ? 'grid-row:1' : ''}">
          <p class="caso-ceja">🎯 TU MISIÓN</p>
          <p>${esc(caso.pregunta).replace(esc(caso.de ?? caso.nombre), `<b>${esc(caso.de ?? caso.nombre)}</b>`)}</p>
          <p class="exp-sospecha">Tu sospecha: <span data-sospecha></span> · <button type="button" class="enlace" data-cambiar>cambiar</button></p>
        </div>
        <div class="vidrio-caso exp-historia" style="${recs.length ? 'grid-row:2' : ''}">
          <p class="caso-ceja">📜 HISTORIA</p>
          ${historia?.linea?.length ? `<ul>${historia.linea.map((h) => `<li class="${h.destacado ? 'destacado' : ''}"><b>${esc(h.cuando)}</b> ${esc(h.texto)}</li>`).join('')}</ul>` : '<p class="caso-nota">Historia en preparación.</p>'}
        </div>
      </div>
      ${ctx.pie('ABRIR PISTA 1: EVIDENCIA')}`;
    const sig = cuerpo.querySelector('[data-sig]');
    const pintarSospecha = () => {
      const s = ctx.sospecha;
      cuerpo.querySelector('[data-sospecha]').innerHTML = s ? `${ICONO_RUMBO[s] ?? ''} <b>${esc(s)}</b>` : '<b>—</b>';
    };
    cuerpo.querySelector('[data-cambiar]').addEventListener('click', () => {
      const ops = ctx.opcionesHipotesis, i = ops.indexOf(ctx.sospecha);
      ctx.cambiarSospecha(ops[(i + 1) % ops.length]);
      pintarSospecha();
    });
    pintarSospecha();
    // Clasificar: cada toque cambia la caja (DATO → HAY QUE ACLARAR → SUPOSICIÓN); al tenerlas todas, se revisa
    const pintar = (revisar) => {
      let bien = 0;
      cuerpo.querySelectorAll('.recorte').forEach((art, i) => {
        const t = elegidos[i], b = art.querySelector('[data-r]');
        b.textContent = t ? TIPOS[t][0] : 'CLASIFICAR';
        b.className = `chip-neon ${t ? TIPOS[t][1] : 'gris'}`;
        art.classList.remove('dato', 'aclarar', 'suposicion', 'mal');
        if (t) art.classList.add(t);
        const ok = t === recs[i].tipo;
        if (ok) bien += 1;
        if (revisar && t && !ok) { void art.offsetWidth; art.classList.add('mal'); }
      });
      const todos = elegidos.every(Boolean);
      sig.disabled = recs.length > 0 && bien < recs.length;
      if (revisar && todos) {
        if (bien === recs.length) juku.decir('¡Bien clasificado! Un detective separa datos de suposiciones.', 'Después: ¿qué vamos a medir?');
        else juku.decir(`${bien} de ${recs.length}. Revisa los que tiemblan: ¿tienen fuente? ¿se pueden comprobar?`, '¿Quién lo dice?');
      }
    };
    cuerpo.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.r);
      elegidos[i] = ORDEN[(ORDEN.indexOf(elegidos[i]) + 1) % ORDEN.length];
      ctx.anotar?.({ recortes: [...elegidos] }); // si sale a mitad, al volver siguen clasificados
      pintar(elegidos.every(Boolean));
    }));
    pintar(false);
    ctx.conectarPie(() => ctx.completar(0, { recortes: elegidos }));
    juku.decir(recs.length ? 'Clasifica cada recorte: ¿dato o suposición?' : 'Lee tu misión y la historia de esta cordillera.', 'Después: ¿qué vamos a medir?');
    juku.pista('Un dato tiene fuente y se puede comprobar. Si falta saber de qué habla, hay que aclarar. Si nadie dice de dónde sale, es una suposición.');
    ctx.escena?.montana(caso, { girar: false, frente: true, clase: 'oscura' });
  },

  // ── 1 · Evidencia: 3 tarjetas que giran
  (ctx) => {
    const { caso, cuerpo, juku, est } = ctx;
    const T = [
      { id: 'nieve', icono: '❄', nombre: 'Nieve', sat: '🛰 MODIS · Terra', det: '500 m · diario · desde 2000', chip: ['ELEGIDA', 'verde'], txt: 'Responde tu misión: MODIS ve la nieve casi todos los días.', dice: '¡Bien! La nieve es lo que MODIS ve mejor.' },
      { id: 'lluvia', icono: '🌧', nombre: 'Lluvia', sat: '🛰 GPM IMERG', det: '~10 km · cada 30 min', chip: ['COMPARAR', 'azul'], txt: 'No es la misión, pero sirve para comparar en el interrogatorio.', dice: 'La lluvia sirve para comparar, no para responder la misión.' },
      { id: 'litros', icono: '💧', nombre: 'Litros de agua', sat: '🛰 —', det: 'MODIS no lo mide', chip: ['NO SIRVE', 'rojo'], txt: 'Ningún satélite de APU cuenta litros: el tamaño del hielo no es agua.', dice: '¡Ojo! MODIS no mide litros de agua.' }
    ];
    let elegida = est.elecciones.variable ?? null;
    cuerpo.innerHTML = `
      <p class="caso-ceja">${esc(ctx.ceja('PISTA 1 · EVIDENCIA'))}</p>
      <h1 class="caso-titulo" tabindex="-1">¿Qué <em>medimos</em>?</h1>
      <p class="caso-sub">Elige la variable que responde tu misión. Gira una tarjeta para ver qué satélite la mide.</p>
      <div class="evid-tarjetas" style="margin-top:2cqh">${T.map((t) => `
        <button type="button" class="evid ${t.id}" data-v="${t.id}" aria-label="${t.nombre}: toca para girar">
          <span class="cara frente"><span class="icono" aria-hidden="true">${t.icono}</span><b>${t.nombre}</b><small>↻ Toca para girar</small></span>
          <span class="cara dorso"><b>${t.nombre}</b><small>${t.sat}</small><small>${t.det}</small><span class="chip-neon ${t.chip[1]}">${t.chip[0]}</span><p>${t.txt}</p></span>
        </button>`).join('')}</div>
      <p class="caso-aviso"><b>Índice de nieve (NDSI) de 0 a 100</b>, umbral 40. Solo cuentan los valores de 0 a 100: los avisos (250 nube, 211 noche) no.</p>
      ${ctx.pie('SIGUIENTE: ESCENA')}`;
    const sig = cuerpo.querySelector('[data-sig]');
    const pintar = () => {
      cuerpo.querySelectorAll('.evid').forEach((b) => {
        const t = T.find((x) => x.id === b.dataset.v);
        b.classList.toggle('girada', b.dataset.girada === '1');
        b.setAttribute('aria-label', b.dataset.girada === '1' ? `${t.nombre}: ${t.chip[0].toLowerCase()}. ${t.txt}` : `${t.nombre}: toca para girar`);
      });
      sig.disabled = elegida !== 'nieve';
    };
    cuerpo.querySelectorAll('.evid').forEach((b) => b.addEventListener('click', () => {
      b.dataset.girada = b.dataset.girada === '1' ? '0' : '1';
      const t = T.find((x) => x.id === b.dataset.v);
      if (b.dataset.girada === '1') { if (t.id === 'nieve') { elegida = 'nieve'; ctx.anotar?.({ variable: 'nieve' }); } juku.decir(t.dice, t.id === 'nieve' ? '¿Dónde miramos?' : '¿Recuerdas por qué no sirven los litros?'); }
      pintar();
    }));
    if (elegida === 'nieve') cuerpo.querySelector('[data-v="nieve"]').dataset.girada = '1';
    pintar();
    ctx.conectarPie(() => ctx.completar(1, { variable: 'nieve' }));
    juku.decir('Gira las tarjetas: ¿cuál responde tu misión?', '¿Qué ve MODIS desde el espacio?');
    juku.pista('Tu misión pregunta por la nieve. ¿Qué tarjeta tiene un satélite que la mida casi todos los días?');
    ctx.escena?.montana(caso, { girar: true, clase: 'oscura' });
  },

  // ── 2 · Escena: la montaña 3D con los recuadros (componentes/casos/capas-escena.js)
  //   Medio: se activa si hay caja medio Y series.json trae "medio". Solo glaciares: si hay contornos GLIMS
  //   Y series.json trae "glaciares". Si falta alguno, "datos en camino".
  (ctx) => {
    const { caso, cuerpo, juku, est, datos } = ctx;
    const cajas = CAJAS[caso.id] ?? {};
    let hayGlims = false;
    const disponible = (e) => e === 'grande' || (e === 'medio' && Boolean(cajas.medio && datos.escenas.medio)) || (e === 'glaciares' && hayGlims && Boolean(datos.escenas.glaciares));
    let escena = est.elecciones.escena ?? 'grande';
    if (escena !== 'grande' && !datos.escenas[escena]) escena = 'grande';
    const nombre = { grande: 'Grande', medio: 'Medio', glaciares: 'Solo glaciares' };
    cuerpo.innerHTML = `
      <p class="caso-ceja">${esc(ctx.ceja('PISTA 2 · ESCENA'))}</p>
      <h1 class="caso-titulo" tabindex="-1">¿<em>Dónde</em> miramos?</h1>
      <div class="caso-ventana3d" aria-label="La montaña 3D de ${esc(caso.nombre)}">
        <span class="marco-grande" aria-hidden="true"></span>
        <span class="rotulo" data-rotulo></span>
        <span class="ayuda3d" data-ayuda3d>✋ arrastra para girar · rueda para acercar</span>
      </div>
      <div class="escena-botones" role="radiogroup" aria-label="Recuadro">
        <button type="button" role="radio" data-e="grande">Grande</button>
        ${cajas.medio ? '<button type="button" role="radio" data-e="medio">Medio</button>' : ''}
        <button type="button" role="radio" data-e="glaciares">Solo glaciares</button>
        <small data-fuente3d>Montaña 3D real (Cesium)</small>
      </div>
      ${ctx.pie('SIGUIENTE: TIEMPO')}`;
    const pintar = () => {
      if (!disponible(escena)) escena = 'grande';
      cuerpo.querySelectorAll('[data-e]').forEach((b) => {
        const e = b.dataset.e, ok = disponible(e), elegido = e === escena;
        b.disabled = !ok;
        b.setAttribute('aria-pressed', String(elegido)); b.setAttribute('aria-checked', String(elegido));
        b.textContent = `${elegido ? '✓ ' : ''}${nombre[e]}${ok ? (e === 'glaciares' ? ' · GLIMS' : '') : ' · datos en camino'}`;
      });
      const s = datos.escenas[escena];
      const px = escena === 'grande' ? s.pixeles : escena === 'medio' ? pixelesDeCaja(cajas.medio) : null;
      cuerpo.querySelector('[data-rotulo]').textContent = px ? `${nombre[escena].toUpperCase()} · ≈${miles(px)} PÍXELES` : `${nombre[escena].toUpperCase()} · ${s.anios.length} AÑOS`;
      const real = s.stats?.p < 0.05;
      juku.decir(escena === 'grande' ? (real ? 'El grande diluye la señal… ¡y aun así se nota!' : 'El grande diluye la señal: mira bien.') : 'Más ajustado: casi todo es hielo.', '¿Qué meses vamos a comparar?');
    };
    cuerpo.querySelectorAll('[data-e]').forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      escena = b.dataset.e;
      ctx.anotar?.({ escena });
      pintar();
      ctx.escena?.escenaElegir(caso, escena); // resalta su borde y vuela a encuadrarlo
    }));
    const hay3d = ctx.escena?.montana(caso, { girar: false, interactivo: true, clase: 'clara' });
    if (hay3d) {
      document.body.classList.add('escena3d-interactiva');
      // Al entrar: grande punteado, medio ámbar y los contornos GLIMS (si el archivo existe)
      ctx.escena.escenaEntrar(caso).then((r) => { if (!ctx.vivo()) return; hayGlims = r.glims; pintar(); });
    } else { cuerpo.querySelector('[data-ayuda3d]').textContent = 'Foto de la cordillera (sin 3D)'; cuerpo.querySelector('[data-fuente3d]').textContent = 'Foto de respaldo'; }
    const salir = () => { document.body.classList.remove('escena3d-interactiva'); ctx.escena?.escenaSalir(); };
    ctx.alSalir(salir);
    pintar();
    juku.pista('El recuadro grande mete roca y pasto que no cambian: la señal se diluye. Si hay datos, el ajustado a los glaciares la muestra más fuerte.');
    ctx.conectarPie(() => { salir(); ctx.completar(2, { escena }); });
  },
  // ── 3 · Tiempo: anillo de 12 meses (la ventana resaltada) + los años
  (ctx) => {
    const { caso, cuerpo, juku, est, datos } = ctx;
    const v = datos.ventana, s = serieElegida(ctx);
    const conDato = s.valores.filter(Number.isFinite).length;
    let mes = est.elecciones.mes ?? null;
    const fin = v.length && v.every((m) => caso.meses.includes(m));
    cuerpo.innerHTML = `
      <p class="caso-ceja">${esc(ctx.ceja('PISTA 3 · TIEMPO'))}</p>
      <h1 class="caso-titulo" tabindex="-1">¿<em>Cuándo</em>?</h1>
      <div class="tiempo-grilla">
        <div class="vidrio-caso"><div class="anillo" role="group" aria-label="Los 12 meses: toca uno para ver su nieve en la montaña">
          ${MESES_CORTOS.map((m, i) => { const a = (-90 + i * 30) * Math.PI / 180; return `<button type="button" class="mes ${v.includes(i + 1) ? 'ventana' : 'trampa'}" data-m="${i + 1}" style="left:${50 + 40 * Math.cos(a)}%;top:${50 + 40 * Math.sin(a)}%" aria-pressed="false" aria-label="${MESES_NOMBRES[i]}${v.includes(i + 1) ? ', en la ventana' : ''}">${m}</button>`; }).join('')}
          <div class="centro"><b>${ventanaCorta(v)}</b><small>${fin ? 'fin de la temporada' : 'la ventana'}</small></div>
        </div></div>
        <div>
          <div class="vidrio-caso"><p class="caso-ceja">AÑOS</p>
            <div class="anios-puntos" role="img" aria-label="${conDato} años con dato de ${s.anios.length}">${s.valores.map((x) => `<i class="${Number.isFinite(x) ? '' : 'vacio'}"></i>`).join('')}</div>
            <p class="tramo"><b>${s.anios[0]}</b><em>${conDato} años ${conDato >= 10 ? '✓' : '⚠'}</em><b>${s.anios[s.anios.length - 1]}</b></p>
          </div>
          <div class="caso-aviso rojo" data-trampa aria-live="polite" style="margin-top:1.4cqh"></div>
          <p class="caso-nota" data-nieve aria-live="polite"></p>
        </div>
      </div>
      ${ctx.pie('SIGUIENTE: HUELLAS')}`;
    const trampa = cuerpo.querySelector('[data-trampa]'), nota = cuerpo.querySelector('[data-nieve]');
    const avisoBase = conDato < 10
      ? `<b>⚠ Pocos años</b><br>Con menos de 10 años, un año raro puede engañarte.`
      : `<b>⚠ Trampa de la estación</b><br>Si eliges un mes fuera de ${ventanaTexto(v)}, el Jukumari te avisa: comparar meses distintos no es justo.`;
    trampa.innerHTML = avisoBase;
    const anio = s.anios[s.anios.length - 1];
    let pedido = 0;
    const elegir = async (m) => {
      mes = m;
      ctx.anotar?.({ mes: m });
      cuerpo.querySelectorAll('.mes').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.m) === m)));
      const dentro = v.includes(m);
      if (dentro) { juku.decir('Misma ventana cada año = comparación justa.', `Ahora juntamos ${conDato} años de datos…`); trampa.innerHTML = avisoBase; }
      else {
        trampa.innerHTML = `<b>⚠ ¡Trampa de la estación!</b><br>${MESES_NOMBRES[m - 1][0].toUpperCase()}${MESES_NOMBRES[m - 1].slice(1)} no es fin de la temporada: ahí la nieve cambia por la estación, no por los años. Usamos ${ventanaTexto(v)}.`;
        juku.decir(`¡Cuidado! En ${MESES_NOMBRES[m - 1]} la nieve cambia por la estación.`, 'Comparar meses distintos no es justo.', { siempre: true });
      }
      const yo = ++pedido;
      nota.textContent = ctx.escena?.hay3d() ? 'Buscando la nieve de NASA GIBS de ese mes…' : '';
      const dia = await ctx.escena?.nieve(caso, fechasCercanas(anio, [m], iso(anio, m, 15), 8));
      if (yo !== pedido || !ctx.vivo()) return;
      nota.textContent = dia ? `En la montaña: nieve MODIS del ${fechaBonita(dia)} · datos de NASA (GIBS)` : (ctx.escena?.hay3d() ? 'NASA GIBS no tiene imagen de esos días (nubes): prueba otro mes.' : '');
    };
    cuerpo.querySelectorAll('.mes').forEach((b) => b.addEventListener('click', () => elegir(Number(b.dataset.m))));
    ctx.escena?.montana(caso, { girar: false, clase: 'clara' });
    if (mes) elegir(mes);
    juku.decir('Toca un mes del anillo y mira su nieve en la montaña.', 'Misma ventana cada año…');
    juku.pista(`Elige un mes amarillo: ${ventanaTexto(v)} es el fin de la temporada, cuando queda la nieve que dura.`);
    ctx.conectarPie(() => ctx.completar(3, { mes: mes ?? v[0] }));
  },

  // ── 4 · Huellas: barras por año (sin dato = punteada) + ▶ sincronizado con la montaña
  (ctx) => {
    const { caso, cuerpo, juku, datos } = ctx;
    const s = serieElegida(ctx), v = datos.ventana;
    const max = Math.max(...s.valores.filter(Number.isFinite));
    const hay3d = ctx.escena?.montana(caso, { girar: false, clase: 'clara' });
    cuerpo.innerHTML = `
      <p class="caso-ceja">${esc(ctx.ceja('PISTA 4 · HUELLAS'))}</p>
      <h1 class="caso-titulo" tabindex="-1">La <em>serie</em> de ${s.valores.filter(Number.isFinite).length} años</h1>
      <div class="huellas-grilla">
        <div class="vidrio-caso huellas-graf">
          <header><span>${esc(datos.unidad)} · ${ventanaCorta(v).toLowerCase()} · ${esc(datos.region)}</span><span class="real">● datos reales ${esc(datos.fuente.split(' ')[0])}</span></header>
          <div class="barras-anios" role="img" aria-label="${esc(s.anios.map((a, i) => `${a}: ${Number.isFinite(s.valores[i]) ? fmt(s.valores[i], 2) : 'sin dato'}`).join(', '))}">
            ${s.valores.map((x) => `<i class="${Number.isFinite(x) ? '' : 'vacio'}" style="height:${Number.isFinite(x) ? Math.max(3, x / max * 100) : 70}%"></i>`).join('')}</div>
          <div class="huellas-ejes"><b>${s.anios[0]}</b><span>sin dato = barra punteada, nunca 0</span><b>${s.anios[s.anios.length - 1]}</b></div>
          <div class="reproductor"><button type="button" class="play" aria-label="Reproducir año por año">▶</button><span class="pista-barra"><i></i></span><output aria-live="polite">—</output></div>
        </div>
        <div>
          <div class="huellas-ventana ${hay3d ? '' : 'sin3d'}" ${hay3d ? '' : `style="background-image:url(${esc(ctx.escena?.foto(caso) ?? '')})"`}>
            <span class="rotulo" data-rotulo>${hay3d ? 'MONTAÑA 3D' : 'FOTO'}</span><span class="dia" data-dia></span></div>
          <p class="caso-aviso">El gráfico y la montaña avanzan <b>juntos</b>: la nieve del 3D cambia con el año que suena.</p>
        </div>
      </div>
      ${ctx.pie('SIGUIENTE: INTERROGATORIO')}`;
    const barras = [...cuerpo.querySelectorAll('.barras-anios i')], play = cuerpo.querySelector('.play');
    const salida = cuerpo.querySelector('output'), progreso = cuerpo.querySelector('.pista-barra i');
    const rotulo = cuerpo.querySelector('[data-rotulo]'), dia = cuerpo.querySelector('[data-dia]');
    let sonando = false, i = 0;
    const mostrar = async (k) => {
      const a = s.anios[k];
      barras.forEach((b, j) => { b.classList.toggle('aqui', j === k); b.classList.toggle('ya', j <= k); });
      salida.textContent = String(a);
      progreso.style.width = `${((k + 1) / s.anios.length) * 100}%`;
      rotulo.textContent = `${hay3d ? 'MONTAÑA 3D' : 'FOTO'} · ${a}`;
      if (!hay3d) return;
      const centro = iso(a, v[0], diasDelMes(a, v[0]));
      const fechas = fechasCercanas(a, v, centro, 8);
      const usado = await ctx.escena.nieve(caso, fechas);
      if (!ctx.vivo()) return;
      dia.textContent = usado ? (usado === fechas[0] ? `nieve MODIS del ${fechaBonita(usado)}` : `nieve MODIS del ${fechaBonita(usado)} (el día útil más cercano: nubes)`) : 'GIBS sin imagen en la ventana (nubes)';
    };
    const tocar = async () => {
      if (sonando) { sonando = false; play.textContent = '▶'; play.setAttribute('aria-label', 'Reproducir año por año'); return; }
      sonando = true; play.textContent = '❚❚'; play.setAttribute('aria-label', 'Pausar');
      cuerpo.querySelector('.barras-anios').classList.add('sonando');
      if (i >= s.anios.length) i = 0;
      while (sonando && i < s.anios.length && ctx.vivo()) {
        await mostrar(i);
        i += 1;
        await espera(sinMovimiento() ? 400 : 1100);
      }
      if (i >= s.anios.length) { sonando = false; play.textContent = '▶'; juku.decir('¿Ves el rumbo? Ahora hay que interrogarlo.', '¿Baja de verdad o es suerte?'); }
    };
    play.addEventListener('click', tocar);
    ctx.alSalir(() => { sonando = false; });
    juku.decir('Dale ▶ y mira cómo cambia la montaña.', '¿Baja de verdad o es suerte?');
    juku.pista('Mira la forma de punta a punta, no un solo año. Un año sin dato no es cero: queda vacío.');
    ctx.conectarPie(() => { sonando = false; ctx.completar(4, {}); });
  },

  // ── 5 · Interrogatorio: pendiente de Sen, valor p de Mann-Kendall y las 5 pruebas
  (ctx) => {
    const { caso, cuerpo, juku, est, datos } = ctx;
    const st = serieElegida(ctx).stats;
    const pend = st.pendientePorDecada, p = st.p;
    // Medidores: la pendiente en una escala simétrica; p de 0 a 1 (zona verde hasta 0,05)
    const escalaPend = Math.max(0.5, Math.abs(pend) * 2);
    const arco = (frac) => { const a = Math.PI * (1 - frac); return `${(50 + 40 * Math.cos(a)).toFixed(2)} ${(50 - 40 * Math.sin(a)).toFixed(2)}`; };
    const medPend = (0.5 + pend / escalaPend / 2);
    const medP = Math.min(1, p);
    const yaCorrio = (est.pista ?? 0) > 5;
    const lluvia = datos.pruebas.find((x) => x.id === 'lluvia' && x.estado !== 'camino');
    cuerpo.innerHTML = `
      <p class="caso-ceja">${esc(ctx.ceja('PISTA 5 · INTERROGATORIO'))}</p>
      <h1 class="caso-titulo" tabindex="-1">¿Real o <em>casualidad</em>?</h1>
      <div class="interro-grilla">
        <div class="vidrio-caso medidor"><p class="caso-ceja">PENDIENTE</p>
          <svg viewBox="0 0 100 56" aria-hidden="true"><path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="rgba(169,180,204,.25)" stroke-width="8" stroke-linecap="round"/>
          <path d="M${arco(0.5)} A40 40 0 0 ${medPend < 0.5 ? 0 : 1} ${arco(medPend)}" fill="none" stroke="${pend < 0 ? '#F8AE05' : '#4F8DFF'}" stroke-width="8" stroke-linecap="round"/>
          <line x1="50" y1="4" x2="50" y2="14" stroke="#F2F4F8" stroke-width="1.5"/></svg>
          <span class="valor azul">${fmt(pend, 2)}</span><small>puntos cada 10 años</small></div>
        <div class="vidrio-caso medidor"><p class="caso-ceja verde">VALOR p</p>
          <svg viewBox="0 0 100 56" aria-hidden="true"><path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="rgba(169,180,204,.25)" stroke-width="8" stroke-linecap="round"/>
          <path d="M10 50 A40 40 0 0 1 ${arco(0.05)}" fill="none" stroke="#2BC56B" stroke-width="8"/>
          <path d="M${arco(0.05)} A40 40 0 0 1 ${arco(Math.max(0.05, medP))}" fill="none" stroke="#F8AE05" stroke-width="8"/></svg>
          <span class="valor ${p < 0.05 ? 'verde' : 'amarillo'}">${fmtP(p)}</span><small>${p < 0.05 ? 'menor que 0,05 ✓' : 'mayor que 0,05'}</small></div>
        <div class="vidrio-caso"><p class="caso-ceja amarilla">🚦 PONLO A PRUEBA</p>
          <ul class="pruebas">${datos.pruebas.map((x) => `<li class="esperando" data-id="${x.id}"><i class="luz" aria-hidden="true"></i><span>${esc(x.nombre)}</span><small>sin correr</small></li>`).join('')}</ul>
          <div class="caso-pie" style="margin-top:1.2cqh"><button type="button" class="btn-apu secundario" data-correr>CORRER PRUEBAS</button></div></div>
      </div>
      <div class="moneda"><span aria-hidden="true">🪙</span><span>¿Y si fue suerte? El valor p responde: si la nieve <b>no</b> cambiara, ¿qué tan raro sería ver este dibujo? Con <b class="verde">p menor que 0,05</b>, muy raro.</span></div>
      <p class="caso-nota">Fuente: ${esc(datos.fuente)}${lluvia ? ' y GPM IMERG (NASA)' : ''}, ${datos.desde}–${datos.hasta} · prueba de Mann-Kendall y pendiente de Sen.</p>
      ${ctx.pie('SIGUIENTE: VEREDICTO')}`;
    const sig = cuerpo.querySelector('[data-sig]');
    const NOTA = { verde: 'superada', amarillo: 'más débil', rojo: 'no pasa', camino: 'datos en camino' };
    const poner = (li, x) => { li.className = x.estado; li.querySelector('small').textContent = x.nota || NOTA[x.estado]; };
    const correr = async () => {
      const b = cuerpo.querySelector('[data-correr]'); b.disabled = true;
      for (const x of datos.pruebas) {
        const li = cuerpo.querySelector(`[data-id="${x.id}"]`);
        li.className = 'corriendo'; li.querySelector('small').textContent = 'corriendo…';
        await espera(sinMovimiento() ? 150 : 700);
        if (!ctx.vivo()) return;
        poner(li, x);
      }
      sig.disabled = false;
      const ok = datos.nOk, n = datos.nPruebas;
      juku.decir(`Superó ${ok} de ${n} pruebas listas. ${n < datos.pruebas.length ? 'Las demás esperan sus datos.' : ''}`, '¿Listo para el veredicto?');
    };
    cuerpo.querySelector('[data-correr]').addEventListener('click', correr);
    if (yaCorrio) { datos.pruebas.forEach((x) => poner(cuerpo.querySelector(`[data-id="${x.id}"]`), x)); cuerpo.querySelector('[data-correr]').disabled = true; }
    else sig.disabled = true;
    juku.decir('Interroga a los datos: ¡un detective desconfía!', '¿Aguantará con otro umbral?');
    juku.pista('Si p es menor que 0,05, sería muy raro ver ese dibujo por pura suerte. Corre las pruebas: si el rumbo se mantiene, el resultado es más confiable.');
    ctx.escena?.montana(caso, { girar: true, clase: 'desenfocada' });
    ctx.conectarPie(() => ctx.completar(5, {}));
  },

  // ── 6 · Veredicto: plantilla con desplegables, sospecha vs. datos, palabras justas y firma
  (ctx) => {
    const { caso, cuerpo, juku, est, datos } = ctx;
    const st = serieElegida(ctx).stats;
    const datosDicen = rumboDatos(st);
    const RUMBOS = ['bajó', 'no cambió de forma clara', 'subió'];
    const PALABRAS = ['va de acuerdo con', 'no alcanza para afirmar', 'demuestra'];
    const previo = est.veredicto ?? {};
    cuerpo.innerHTML = `
      <p class="caso-ceja">${esc(ctx.ceja('VEREDICTO'))}</p>
      <h1 class="caso-titulo" tabindex="-1">Tu <em>veredicto</em></h1>
      <div class="vered-grilla">
        <div class="vered-hoja">
          <p class="caso-ceja">⚖ ESCRIBE TU VEREDICTO</p>
          <p class="texto">Entre <b>${datos.desde}</b> y <b>${datos.hasta}</b>, la nieve de <b>${esc(caso.de ?? caso.nombre)}</b> en ${ventanaTexto(datos.ventana)}
            <select data-rumbo aria-label="Qué pasó con la nieve">${RUMBOS.map((r) => `<option ${previo.rumbo === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
            <b>${fmt(st.pendientePorDecada, 2)}</b> puntos cada 10 años (p = <b>${fmtP(st.p)}</b>). Superó <b>${datos.nOk}</b> de <b>${datos.nPruebas}</b> pruebas listas. Esto
            <select data-palabras aria-label="Qué tan fuerte es la conclusión">${PALABRAS.map((r) => `<option ${previo.palabras === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
            ${esc(caso.consecuencia ?? `un cambio en el hielo de ${caso.de ?? caso.nombre}`)}.</p>
          <p class="caso-nota">Límites: ${ctx.limites.map((x) => esc(x.toLowerCase())).join(' · ')}</p>
        </div>
        <div class="vered-lado">
          <div class="vidrio-caso"><p class="caso-ceja">TU SOSPECHA VS. LOS DATOS</p>
            <div class="versus"><span><span class="ic" aria-hidden="true">${ICONO_RUMBO[ctx.sospecha] ?? '❔'}</span><b>${esc(ctx.sospecha ?? '—')}</b><small>creías</small></span>
              <span class="flecha" aria-hidden="true">⇄</span>
              <span><span class="ic" aria-hidden="true">📊</span><b class="${ctx.sospecha && datosDicen?.startsWith(ctx.sospecha) ? 'verde' : ''}">${esc(datosDicen ?? '—')}${ctx.sospecha && datosDicen?.startsWith(ctx.sospecha) ? ' ✓' : ''}</b><small>los datos</small></span></div></div>
          <div class="caso-aviso rojo" data-justas><b>⚠ Palabras justas</b><br>Si eliges “demuestra” o dices “bajó” con p mayor que 0,05, el Jukumari te avisa antes de firmar.</div>
          <div class="vidrio-caso firma"><p class="caso-ceja">FIRMA</p><p class="nombre">${esc(ctx.apodo)}</p></div>
        </div>
      </div>
      <div class="caso-pie"><button type="button" class="btn-apu secundario" data-constelacion>‹ CONSTELACIÓN</button>
        <button type="button" class="btn-apu" data-firmar>✍ FIRMAR Y CERRAR EL CASO</button></div>`;
    const rumbo = cuerpo.querySelector('[data-rumbo]'), palabras = cuerpo.querySelector('[data-palabras]'), justas = cuerpo.querySelector('[data-justas]');
    // Con ayuda 'sin', el Jukumari recién habla aquí
    juku.decir('Usa palabras justas: “va de acuerdo con”.', '¡Falta la firma para cerrar el caso!', { siempre: true });
    cuerpo.querySelector('[data-constelacion]').addEventListener('click', () => ir(`caso/${caso.id}`));
    const revisar = () => {
      const r = rumbo.value, w = palabras.value;
      if (w === 'demuestra') return 'Medimos nieve, no litros de agua: “demuestra” es demasiado. Elige “va de acuerdo con” o “no alcanza para afirmar”.';
      if (st.p >= 0.05 && r !== 'no cambió de forma clara') return `Con p = ${fmtP(st.p)} (mayor que 0,05) no puedes decir “${r}”: todavía no se sabe. Elige “no cambió de forma clara”.`;
      if (st.p < 0.05 && r !== datosDicen) return `Mira los datos: la pendiente es ${fmt(st.pendientePorDecada, 2)} con p = ${fmtP(st.p)}. La nieve ${datosDicen}.`;
      if (st.p < 0.05 && w !== 'va de acuerdo con') return 'Con p menor que 0,05 y las pruebas superadas, la frase justa es “va de acuerdo con”.';
      if (st.p >= 0.05 && w !== 'no alcanza para afirmar') return 'Si la nieve no cambió de forma clara, la frase justa es “no alcanza para afirmar”.';
      return null;
    };
    [rumbo, palabras].forEach((s) => s.addEventListener('change', () => { justas.classList.remove('activo'); ctx.guardar({ veredicto: { rumbo: rumbo.value, palabras: palabras.value } }); }));
    cuerpo.querySelector('[data-firmar]').addEventListener('click', () => {
      const error = revisar();
      if (error) {
        justas.innerHTML = `<b>⚠ Palabras justas</b><br>${esc(error)}`;
        juku.decir(error, '¡Casi! Revisa antes de firmar.', { siempre: true });
        return;
      }
      const veredicto = { rumbo: rumbo.value, palabras: palabras.value };
      // La foto del informe: la montaña 3D justo ahora
      const foto = ctx.escena?.captura();
      try { if (foto) sessionStorage.setItem(`apu-informe-foto-${caso.id}`, foto); } catch { /* sin espacio: el informe usa la foto de respaldo */ }
      ctx.est.resuelto = true; ctx.est.veredicto = veredicto; ctx.est.pista = 7;
      completarCaso(caso.id, veredicto).catch(() => {});
      ganarInsignia(`guardian-${caso.id}`).catch(() => {}); // "Guardián de …" (contenido/insignias.js); la anima la pantalla de caso resuelto
      ir(`caso/${caso.id}/resuelto`);
    });
    ctx.escena?.montana(caso, { girar: true, clase: 'desenfocada' });
  }
];
