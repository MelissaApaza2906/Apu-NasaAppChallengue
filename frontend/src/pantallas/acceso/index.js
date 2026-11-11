// Pantalla: registro del detective (apodo + avatar) · #/acceso/<ruta a la que volver>
// Aparece solo cuando una ruta necesita perfil (etapas, lecciones, casos, insignias). La sesión ya
// existe (anónima, se crea sola al iniciar la app): aquí no hay correo ni contraseña.
// Al terminar, vuelve a la ruta pedida (o al menú). El Jukumari que saluda aquí es el asistente de la app.
// Arriba a la izquierda, "‹" (o Esc) vuelve al planeta (#/menu) sin registrarse.
import '../carga/carga.css'; // la nieve de la pantalla de carga
import './acceso.css';
import { ir } from '../../router.js';
import { crearCopos } from '../carga/index.js';
import { guardarPerfil, leerProgreso } from '../../servicios/progreso.js';
import { AVATARES } from '../../contenido/avatares.js';

const APODO_VALIDO = /^[\p{L}\p{N} _-]{2,20}$/u;
const FRASE_VOLVER = '¡Cuando quieras entrenar, aquí estaré!';
let quitarAlSalir = null; // el Esc de esta pantalla

export function desmontar() {
  quitarAlSalir?.();
  quitarAlSalir = null;
}

export function montar(contenedor, params = []) {
  const destino = params.filter(Boolean).join('/') || 'menu';
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-acceso';
  raiz.innerHTML = `
    <div class="acceso-fondo" aria-hidden="true"></div>
    <div class="carga-nieve" aria-hidden="true"></div>
    <div class="acceso-velo" aria-hidden="true"></div>

    <button type="button" class="acceso-volver hud" aria-label="Volver al planeta" title="Volver al planeta">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>
    </button>
    <img class="acceso-logo-arriba" src="/img/logo-apu.png" alt="APU">

    <form class="acceso-tarjeta" novalidate aria-labelledby="acceso-titulo">
      <img src="/img/logo-apu.png" alt="APU" class="logo">
      <h1 id="acceso-titulo"><span class="barras" aria-hidden="true">//</span> TU IDENTIDAD DE DETECTIVE</h1>
      <p class="sub">Elige tu apodo y tu foto de perfil</p>
      <label class="campo">TU APODO
        <input name="apodo" maxlength="20" autocomplete="nickname" required placeholder="Ej.: CondorRojo" aria-describedby="acceso-error">
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
      <button class="btn-apu" type="submit" disabled>EMPEZAR MI ENTRENAMIENTO</button>
      <p class="error" id="acceso-error" role="alert"></p>
      <p class="nota">Sin correo ni contraseña. Solo guardamos tu apodo y tu progreso. Después podrás proteger tus insignias con tu correo, si quieres.</p>
    </form>`;
  contenedor.append(raiz);
  crearCopos(raiz.querySelector('.carga-nieve'));

  const form = raiz.querySelector('form');
  const error = raiz.querySelector('.error');
  const boton = raiz.querySelector('.btn-apu');
  const opciones = [...raiz.querySelectorAll('.avatar')];
  let avatar = null; // por defecto, ninguno elegido
  const apodo = () => form.apodo.value.trim();
  const listo = () => APODO_VALIDO.test(apodo()) && Boolean(avatar);
  const actualizarBoton = () => {
    boton.disabled = !listo();
    boton.title = boton.disabled ? 'Escribe tu apodo y elige un avatar' : '';
  };
  actualizarBoton();

  // Volver al planeta (botón o Esc): siempre al menú, no a la ruta pedida. Al llegar, el Jukumari
  // asistente lo dice (después de que cambió de pantalla, para que no se pierda la frase)
  function volver() {
    window.addEventListener('hashchange', () => setTimeout(() => window.dispatchEvent(
      new CustomEvent('apu:jukumari', { detail: { texto: FRASE_VOLVER, abrir: true } }))), { once: true });
    ir('menu');
  }
  raiz.querySelector('.acceso-volver').addEventListener('click', volver);
  const conTeclado = (e) => { if (e.key === 'Escape') volver(); };
  document.addEventListener('keydown', conTeclado);
  quitarAlSalir = () => document.removeEventListener('keydown', conTeclado);

  // Avatares: grupo de opciones (un solo elegido); con el teclado, flechas para moverse
  function elegir(id, enfocar) {
    avatar = id;
    opciones.forEach((b) => {
      const si = b.dataset.avatar === id;
      b.setAttribute('aria-checked', String(si));
      b.tabIndex = si ? 0 : -1;
      if (si && enfocar) b.focus();
    });
    actualizarBoton();
  }
  opciones[0].tabIndex = 0; // se entra al grupo por el primero mientras no hay ninguno elegido
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
    actualizarBoton();
    if (error.textContent && APODO_VALIDO.test(apodo())) error.textContent = '';
  });
  form.apodo.addEventListener('blur', () => {
    if (apodo() && !APODO_VALIDO.test(apodo())) error.textContent = 'El apodo debe tener entre 2 y 20 letras o números.';
  });

  // Si ya tenía apodo o avatar (por ejemplo, de antes de los avatares), se proponen
  leerProgreso().then((p) => {
    if (!form.isConnected) return;
    if (p.apodo && !form.apodo.value) form.apodo.value = p.apodo;
    if (AVATARES.some((a) => a.id === p.avatar)) elegir(p.avatar);
    actualizarBoton();
  }).catch(() => {});

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!listo()) return;
    boton.disabled = true;
    error.textContent = '';
    try {
      await guardarPerfil({ apodo: apodo(), avatar }); // navegador y, si hay conexión, Firestore
      ir(destino);
    } catch (err) {
      console.warn(err);
      error.textContent = 'No se pudo guardar. Inténtalo otra vez.';
      actualizarBoton();
    }
  });
}
