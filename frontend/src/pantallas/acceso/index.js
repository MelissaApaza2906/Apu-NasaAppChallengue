// Pantalla: acceso y registro · Responsable: (por definir)
// Solo pedimos un APODO. Correo y Google son opcionales.
import './acceso.css';
import { ir } from '../../router.js';
import { entrarComoInvitado, entrarConGoogle, registrarConCorreo, entrarConCorreo } from '../../servicios/auth.js';

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
      <p class="aviso">Solo guardamos tu apodo y tu progreso. Nada más.</p>
      <button class="btn-apu" data-accion="invitado">ENTRAR COMO INVITADO</button>
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
  const apodo = () => form.apodo.value.trim();
  const ejecutar = async (accion) => {
    error.textContent = '';
    try {
      if ((accion === 'invitado' || accion === 'registrar') && !APODO_VALIDO.test(apodo())) {
        error.textContent = 'El apodo debe tener entre 2 y 20 letras o números.'; return;
      }
      if (accion === 'invitado') await entrarComoInvitado(apodo());
      if (accion === 'google') await entrarConGoogle();
      if (accion === 'registrar') await registrarConCorreo(form.correo.value, form.clave.value, apodo());
      if (accion === 'entrar') await entrarConCorreo(form.correo.value, form.clave.value);
      ir('menu');
    } catch (e) {
      // Mensaje general: no decimos si el correo existe o no
      error.textContent = 'No se pudo entrar. Revisa los datos e inténtalo otra vez.';
      console.warn(e);
    }
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); ejecutar('invitado'); });
  raiz.querySelectorAll('[data-accion]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); ejecutar(b.dataset.accion); }));
}
