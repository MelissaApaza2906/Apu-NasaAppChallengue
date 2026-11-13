// Pantalla: ajustes · #/ajustes (sesión)
// Apodo (2 a 20 letras o números) y avatar (6 círculos; el elegido con aro rojo) → GUARDAR (guardarPerfil).
// DATOS: de dónde salen los datos de APU. SESIÓN: "Cerrar sesión", con una ventana que dice qué se borra
// y que no se puede deshacer. Sin sonido.
// Solo estilos existentes: fondo, marco, vidrio y "volver" de etapas.css; la tarjeta, el campo, los avatares
// y los rótulos de acceso.css; la ventana de insignias.css. ajustes.css solo coloca y mide.
import '../etapas/etapas.css';
import '../acceso/acceso.css';
import '../insignias/insignias.css'; // la ventana de confirmación (.expediente-ventana)
import './ajustes.css';
import { ir } from '../../router.js';
import { leerProgreso, guardarPerfil } from '../../servicios/progreso.js';
import { cerrarSesion } from '../../servicios/auth.js';
import { AVATARES } from '../../contenido/avatares.js';

const APODO_VALIDO = /^[\p{L}\p{N} _-]{2,20}$/u; // el mismo que el registro y tienePerfil()
const FRASE_ADIOS = '¡Hasta pronto, detective!';
const DATOS = 'APU usa datos abiertos de NASA: MODIS (nieve), GPM IMERG (lluvia), GRACE-FO (hielo de la Antártida) y capas de GIBS. Relieve: Cesium World Terrain.';
let vivo = false;

export function montar(contenedor) {
  vivo = true;
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-etapas pantalla-ajustes';
  raiz.innerHTML = `
    <div class="etapas-fondo" aria-hidden="true"></div>
    <div class="etapas-velo" aria-hidden="true"></div>
    <div class="etapas-nieve" aria-hidden="true"></div>
    <span class="esq" aria-hidden="true" style="left:1.4cqh;top:1.4cqh;border-right:none;border-bottom:none"></span>
    <span class="esq" aria-hidden="true" style="right:1.4cqh;top:1.4cqh;border-left:none;border-bottom:none"></span>
    <span class="esq" aria-hidden="true" style="left:1.4cqh;bottom:1.4cqh;border-right:none;border-top:none"></span>
    <span class="esq" aria-hidden="true" style="right:1.4cqh;bottom:1.4cqh;border-left:none;border-top:none"></span>

    <button type="button" class="etapas-volver vidrio" aria-label="Volver al menú">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>
    </button>
    <img class="etapas-logo" src="/img/logo-apu.png" alt="APU">

    <form class="acceso-tarjeta ajustes-tarjeta" novalidate aria-labelledby="ajustes-titulo">
      <h1 id="ajustes-titulo"><span class="barras" aria-hidden="true">//</span> AJUSTES</h1>

      <label class="campo">TU APODO
        <span class="ajustes-apodo">
          <input name="apodo" maxlength="20" autocomplete="nickname" required placeholder="Ej.: CondorRojo" aria-describedby="ajustes-aviso">
          <button class="btn-apu" type="submit" disabled>GUARDAR</button>
        </span>
      </label>

      <fieldset class="avatares">
        <legend>TU AVATAR DE DETECTIVE</legend>
        <div class="grilla-avatares" role="radiogroup" aria-label="Tu avatar de detective">
          ${AVATARES.map((a) => `
            <button type="button" class="avatar" role="radio" aria-checked="false" tabindex="-1" data-avatar="${a.id}">
              <img src="${a.cara}" alt="" width="320" height="320">
              <span>${a.nombre}</span>
            </button>`).join('')}
        </div>
      </fieldset>
      <p class="error" id="ajustes-aviso" role="status"></p>

      <fieldset class="avatares">
        <legend>DATOS</legend>
        <p class="nota ajustes-texto">${DATOS}</p>
      </fieldset>

      <fieldset class="avatares">
        <legend>SESIÓN</legend>
        <button type="button" class="btn-apu secundario ajustes-salir">CERRAR SESIÓN</button>
      </fieldset>
    </form>

    <dialog class="expediente-ventana vidrio" aria-labelledby="salir-titulo" aria-describedby="salir-texto">
      <h2 id="salir-titulo">CERRAR SESIÓN</h2>
      <p id="salir-texto">Se borran tu apodo, tu avatar, tus lecciones, tus casos y tus insignias, de este dispositivo y de la nube. No se puede deshacer. ¿Seguro?</p>
      <p class="expediente-error" role="alert"></p>
      <div class="expediente-acciones">
        <button type="button" class="btn-apu secundario" data-cancelar autofocus>CANCELAR</button>
        <button type="button" class="btn-apu" data-salir>CERRAR SESIÓN</button>
      </div>
    </dialog>
  `;
  contenedor.append(raiz);
  const $ = (s) => raiz.querySelector(s);
  $('.etapas-volver').addEventListener('click', () => ir('menu'));

  // Nieve (igual que etapas, insignias y perfil)
  const nieve = $('.etapas-nieve');
  for (let i = 0; i < 42; i++) {
    const t = 1.5 + Math.random() * 3.5, dur = 9 + Math.random() * 12, c = document.createElement('span');
    c.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;width:${t.toFixed(1)}px;height:${t.toFixed(1)}px;opacity:${(0.35 + Math.random() * 0.55).toFixed(2)};animation-duration:${dur.toFixed(1)}s;animation-delay:-${(Math.random() * dur).toFixed(1)}s;--dx:${((Math.random() - 0.5) * 16).toFixed(1)}cqw`;
    nieve.append(c);
  }

  // ---------- Apodo + avatar → GUARDAR ----------
  const form = $('form');
  const aviso = $('#ajustes-aviso');
  const guardar = form.querySelector('button[type="submit"]');
  const opciones = [...raiz.querySelectorAll('.avatar')];
  let guardado = { apodo: '', avatar: null }; // lo que hay guardado: GUARDAR se activa al cambiar algo
  let avatar = null;
  const apodo = () => form.apodo.value.trim();
  const cambio = () => apodo() !== guardado.apodo || avatar !== guardado.avatar;
  const actualizar = () => {
    guardar.disabled = !(APODO_VALIDO.test(apodo()) && avatar && cambio());
  };
  const decir = (texto, esError = false) => {
    aviso.textContent = texto;
    aviso.style.color = esError ? '' : 'var(--dato-nieve)'; // verde-azul de "listo"; el rojo es el de .error
  };

  function elegir(id, enfocar) {
    avatar = id;
    opciones.forEach((b) => {
      const si = b.dataset.avatar === id;
      b.setAttribute('aria-checked', String(si));
      b.tabIndex = si ? 0 : -1;
      if (si && enfocar) b.focus();
    });
    if (aviso.textContent && !aviso.style.color) decir('');
    actualizar();
  }
  opciones[0].tabIndex = 0;
  opciones.forEach((b, i) => {
    b.addEventListener('click', () => elegir(b.dataset.avatar));
    b.addEventListener('keydown', (e) => {
      const paso = { ArrowRight: 1, ArrowDown: 3, ArrowLeft: -1, ArrowUp: -3 }[e.key];
      if (!paso) return;
      e.preventDefault();
      elegir(opciones[(i + paso + opciones.length) % opciones.length].dataset.avatar, true);
    });
  });
  form.apodo.addEventListener('input', () => {
    if (aviso.textContent) decir('');
    actualizar();
  });
  form.apodo.addEventListener('blur', () => {
    if (apodo() && !APODO_VALIDO.test(apodo())) decir('El apodo debe tener entre 2 y 20 letras o números.', true);
  });

  leerProgreso().then((p) => {
    if (!vivo) return;
    guardado = { apodo: String(p.apodo ?? '').trim(), avatar: AVATARES.some((a) => a.id === p.avatar) ? p.avatar : null };
    form.apodo.value = guardado.apodo;
    if (guardado.avatar) elegir(guardado.avatar);
    actualizar();
  }).catch(() => {});

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!APODO_VALIDO.test(apodo())) { decir('El apodo debe tener entre 2 y 20 letras o números.', true); return; }
    if (!avatar) { decir('Elige un avatar.', true); return; }
    guardar.disabled = true;
    try {
      await guardarPerfil({ apodo: apodo(), avatar }); // navegador y, si hay conexión, Firestore
      guardado = { apodo: apodo(), avatar };
      decir('¡Guardado!');
    } catch (err) {
      console.warn(err);
      decir('No se pudo guardar. Inténtalo otra vez.', true);
    }
    actualizar();
  });

  // ---------- Cerrar sesión: ventana propia (no confirm()) ----------
  const ventana = $('.expediente-ventana');
  const salir = $('[data-salir]');
  const cancelar = $('[data-cancelar]');
  const error = $('.expediente-error');
  let saliendo = false;

  $('.ajustes-salir').addEventListener('click', () => { error.textContent = ''; ventana.showModal(); });
  cancelar.addEventListener('click', () => ventana.close());
  ventana.addEventListener('cancel', (e) => { if (saliendo) e.preventDefault(); }); // Esc no corta la salida
  ventana.addEventListener('click', (e) => { if (e.target === ventana && !saliendo) ventana.close(); }); // toque fuera

  salir.addEventListener('click', async () => {
    saliendo = true;
    salir.disabled = cancelar.disabled = true;
    salir.textContent = 'SALIENDO…';
    try {
      await cerrarSesion();
    } catch (e) {
      console.warn('APU: no se pudo cerrar la sesión.', e);
      saliendo = false;
      salir.disabled = cancelar.disabled = false;
      salir.textContent = 'CERRAR SESIÓN';
      error.textContent = 'No se pudo cerrar la sesión. Revisa tu conexión e inténtalo otra vez.';
      return;
    }
    ventana.close();
    // Al llegar al planeta, el Jukumari se despide
    window.addEventListener('hashchange', () => setTimeout(() => window.dispatchEvent(
      new CustomEvent('apu:jukumari', { detail: { texto: FRASE_ADIOS, abrir: true } }))), { once: true });
    ir('menu');
  });
}

export function desmontar() {
  vivo = false;
}
