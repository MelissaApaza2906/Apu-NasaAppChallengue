// Pantalla: archivo de casos · #/casos (sesión). Mockup: docs/mockups/casos/casoV-0-archivo.jpg
// 11 expedientes de vidrio (contenido/casos.js) + "TU PROGRESO x / 11". Sello de neón:
//   RESUELTO verde · ABIERTO azul · CLASIFICADO rojo 🔒 · DATOS EN CAMINO (abierto, pero sin datos: no se abre)
// Desbloqueo: el 01 con las 10 lecciones; resolver un caso abre los 2 siguientes.
// De fondo, el globo 3D (servicios/escena3d.js) con los 11 glaciares marcados; pasar por un expediente vuela ahí.
import '../caso/caso.css';
import './casos.css';
import { ir } from '../../router.js';
import { leerProgreso, casosResueltos } from '../../servicios/progreso.js';
import { LECCIONES } from '../../contenido/lecciones.js';
import { CASOS } from '../../contenido/casos.js';
import { GLACIARES } from '../../contenido/glaciares.js';
import { cargarDatosCaso } from '../../servicios/casos-datos.js';
import { esc, logo, crearJukumari } from '../caso/comun.js';

let vivo = false;
let escena = null;

// Estado de cada caso (también lo usa #/caso para no dejar entrar a uno cerrado)
export function estadosCasos(p, conDatos) {
  const resueltos = casosResueltos(p);
  const lecciones = LECCIONES.every((l) => (p.lecciones ?? []).includes(l.id));
  return CASOS.map((c, i) => {
    if (resueltos.has(c.id)) return 'resuelto';
    const abierto = i === 0 ? lecciones : resueltos.has(CASOS[i - 1].id) || (i > 1 && resueltos.has(CASOS[i - 2].id));
    if (!abierto) return 'clasificado';
    return conDatos?.[i] === false ? 'camino' : 'abierto';
  });
}

const SELLO = { resuelto: 'RESUELTO', abierto: 'ABIERTO', clasificado: 'CLASIFICADO', camino: 'DATOS EN CAMINO' };
const AYUDA = { con: 'Con ayuda', poca: 'Poca ayuda', sin: 'Sin ayuda' };

export function montar(contenedor) {
  vivo = true;
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-caso pantalla-archivo';
  raiz.innerHTML = `
    <header class="caso-cabeza"></header>
    <main class="caso-cuerpo archivo-cuerpo">
      <p class="caso-ceja">ETAPA 2 · DETECTIVE · 11 CORDILLERAS DEL MUNDO</p>
      <h1 class="caso-titulo" tabindex="-1">Archivo de <em>casos</em></h1>
      <p class="caso-sub">Un expediente por cordillera, con datos de NASA. Cada caso que resuelves enciende su glaciar en el planeta.</p>
      <div class="archivo-grilla">
        ${CASOS.map((c) => `<button type="button" class="expediente clasificado" data-caso="${c.id}" disabled>
          <span class="expediente-foto"><span class="expediente-icono" aria-hidden="true">🔒</span></span>
          <span class="expediente-sello">CLASIFICADO</span>
          <span class="expediente-pie">
            <span class="expediente-exp">EXP. ${c.exp}</span><span class="expediente-ayuda">🕵 ${AYUDA[c.ayuda]}</span>
            <b>${esc(c.nombre)}</b><small>📍 ${esc(c.lugar)}</small>
          </span>
        </button>`).join('')}
        <div class="archivo-progreso">
          <p class="caso-ceja amarilla">TU PROGRESO</p>
          <p class="archivo-cuenta"><b data-resueltos>0</b> / ${CASOS.length}</p>
          <p class="caso-sub">cordilleras investigadas</p>
          <span class="archivo-barra"><i></i></span>
        </div>
      </div>
    </main>`;
  contenedor.append(raiz);
  raiz.querySelector('.caso-cabeza').append(logo('menu', 'Volver al menú'));
  const juku = crearJukumari(raiz, { ayuda: 'con' });
  juku.decir('¡Bienvenido al archivo, detective!', 'Cada cordillera esconde su propio misterio…');

  // El globo de fondo
  import('../../servicios/escena3d.js').then(({ api }) => {
    if (!vivo) return;
    escena = api;
    api.planeta('derecha');
    pintarMarcadores();
  }).catch((e) => console.info('APU: archivo sin globo 3D.', e?.message ?? e));

  let estados = CASOS.map(() => 'clasificado');
  const pintarMarcadores = (foco = null) => escena?.marcadores(CASOS.map((c, i) => {
    const g = GLACIARES.find((x) => x.id === c.glaciar);
    return { id: c.id, lat: g?.lat ?? 0, lon: g?.lon ?? 0, estado: estados[i], foco: foco === c.id };
  }));

  const pintar = () => {
    raiz.querySelectorAll('.expediente').forEach((b, i) => {
      const c = CASOS[i], e = estados[i];
      const g = GLACIARES.find((x) => x.id === c.glaciar);
      b.className = `expediente ${e}`;
      b.disabled = e === 'clasificado' || e === 'camino';
      b.querySelector('.expediente-sello').textContent = SELLO[e];
      b.querySelector('.expediente-foto').innerHTML = e === 'resuelto' && g?.foto
        ? `<img src="${esc(g.foto.src)}" alt="">`
        : `<span class="expediente-icono" aria-hidden="true">${e === 'clasificado' ? '🔒' : e === 'camino' ? '🛰' : '🏔'}</span>`;
      b.setAttribute('aria-label', `Expediente ${c.exp}: ${c.nombre}, ${c.lugar}. ${SELLO[e].toLowerCase()}${e === 'camino' ? ': todavía no tiene sus datos de NASA' : ''}.`);
    });
    const n = estados.filter((e) => e === 'resuelto').length;
    raiz.querySelector('[data-resueltos]').textContent = String(n);
    raiz.querySelector('.archivo-barra i').style.width = `${(n / CASOS.length) * 100}%`;
    const siguiente = CASOS.find((_, i) => estados[i] === 'abierto');
    if (siguiente) juku.decir(n ? `¡Abre ${siguiente.de ?? siguiente.nombre}, detective!` : `¡Tu primer caso: ${siguiente.nombre}!`, 'Cada cordillera esconde su propio misterio…');
    else if (estados[0] === 'clasificado') juku.decir(`Termina las ${LECCIONES.length} lecciones y se abre el primer expediente.`, '¿Me faltará alguna?');
    else if (n === CASOS.length) juku.decir('¡Resolviste las 11 cordilleras! Eres un detective del planeta.', '');
    else juku.decir('Los próximos casos esperan sus datos de NASA.', 'Datos en camino…');
    pintarMarcadores();
  };

  raiz.querySelector('.archivo-grilla').addEventListener('click', (e) => {
    const b = e.target.closest('.expediente');
    if (b && !b.disabled) ir(`caso/${b.dataset.caso}`);
  });
  // Pasar por un expediente → el globo vuela a esa cordillera
  let ultimo = null, reloj = 0;
  const enfocar = (e) => {
    const b = e.target.closest?.('.expediente');
    if (!b || b.dataset.caso === ultimo) return;
    ultimo = b.dataset.caso;
    clearTimeout(reloj);
    reloj = setTimeout(() => {
      const c = CASOS.find((x) => x.id === ultimo), g = GLACIARES.find((x) => x.id === c?.glaciar);
      if (g) { escena?.volarA(g.lat, g.lon); pintarMarcadores(c.id); }
    }, 180);
  };
  raiz.querySelector('.archivo-grilla').addEventListener('pointerover', enfocar);
  raiz.querySelector('.archivo-grilla').addEventListener('focusin', enfocar);

  Promise.all([leerProgreso(), Promise.all(CASOS.map((c) => cargarDatosCaso(c).then(Boolean)))]).then(([p, conDatos]) => {
    if (!vivo) return;
    estados = estadosCasos(p, conDatos);
    pintar();
  }).catch(() => {});
}

export function desmontar() {
  vivo = false;
  // Si no se va a otra pantalla de casos, el globo se esconde (no se destruye: se reutiliza)
  setTimeout(() => { if (!/^#\/casos?(\/|$)/.test(location.hash)) escena?.ocultar(); }, 0);
}
