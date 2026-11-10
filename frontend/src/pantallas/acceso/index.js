// Pantalla: acceso y registro · Responsable: (por definir)
// Solo pedimos un APODO y un AVATAR (un animal de los Andes). Correo y Google son opcionales.
import './acceso.css';
import { ir } from '../../router.js';
import { entrarComoInvitado, entrarConGoogle, registrarConCorreo, entrarConCorreo } from '../../servicios/auth.js';
import { AVATARES } from '../../contenido/avatares.js';

const APODO_VALIDO = /^[\p{L}\p{N} _-]{2,20}$/u;

export function montar(contenedor) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-acceso';
  raiz.innerHTML = `
    <form class="panel-apu acceso" novalidate>
      <img src="/img/logo-apu.png" alt="APU" class="logo">
      <h1 class="titulo-apu">ACCESO</h1>
      <label>Tu apodo de detective
        <input name="apodo" maxlength="20" autocomplete="nickname" required placeholder="Ej.: CondorRojo">
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
      <p class="aviso">Solo guardamos tu apodo, tu avatar y tu progreso. Nada más.</p>
      <button class="btn-apu" data-accion="invitado" disabled>EMPEZAR MI ENTRENAMIENTO</button>
      <button class="btn-apu secundario" data-accion="google" type="button">CONTINUAR CON GOOGLE</button>
      <details>
        <summary>Usar correo y contraseña</summary>
        <label>Correo <input name="correo" type="email" autocomplete="email"></label>
        <label>Contraseña (mín. 8) <input name="clave" type="password" minlength="8" autocomplete="current-password"></label>
        <div class="fila">
          <button class="btn-apu secundario" data-accion="entrar" type="button">ENTRAR</button>
          <button class="btn-apu secundario" data-accion="registrar" type="button">CREAR CUENTA</button>
        </div>
      </details>
      <p class="error" role="alert"></p>
    </form>`;
  contenedor.append(raiz);

  const form = raiz.querySelector('form'), error = raiz.querySelector('.error');
  const botonEmpezar = raiz.querySelector('[data-accion="invitado"]');
  const opciones = [...raiz.querySelectorAll('.avatar')];
  let avatar = null; // por defecto, ninguno elegido
  const apodo = () => form.apodo.value.trim();
  const listo = () => APODO_VALIDO.test(apodo()) && Boolean(avatar);
  const actualizarBoton = () => { botonEmpezar.disabled = !listo(); };

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
  form.apodo.addEventListener('input', actualizarBoton);

  const ejecutar = async (accion) => {
    error.textContent = '';
    try {
      if ((accion === 'invitado' || accion === 'registrar') && !APODO_VALIDO.test(apodo())) {
        error.textContent = 'El apodo debe tener entre 2 y 20 letras o números.'; return;
      }
      if ((accion === 'invitado' || accion === 'registrar') && !avatar) {
        error.textContent = 'Elige tu avatar de detective.'; return;
      }
      if (accion === 'invitado') await entrarComoInvitado(apodo(), avatar);
      if (accion === 'google') await entrarConGoogle();
      if (accion === 'registrar') await registrarConCorreo(form.correo.value, form.clave.value, apodo(), avatar);
      if (accion === 'entrar') await entrarConCorreo(form.correo.value, form.clave.value);
      ir('menu');
    } catch (e) {
      // Mensaje general: no decimos si el correo existe o no
      error.textContent = 'No se pudo entrar. Revisa los datos e inténtalo otra vez.';
      console.warn(e);
    }
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); if (listo()) ejecutar('invitado'); });
  raiz.querySelectorAll('[data-accion]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); ejecutar(b.dataset.accion); }));
}
