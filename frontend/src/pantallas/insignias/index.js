// Pantalla: insignias ("Mi expediente" del riel del menú)
// Responsable: Karen
// Qué hace: arriba, la tarjeta del detective (cara del avatar, apodo y "Cerrar sesión");
// debajo, las insignias ganadas y por ganar (en construcción).
// No hay correo ni contraseña en ninguna parte: la sesión es anónima. "Cerrar sesión" borra
// el progreso de este dispositivo y de la nube, y empieza una sesión anónima nueva.
// Diseño de referencia: maqueta "APU · Diseño visual del juego" (—)
import './insignias.css';
import { ir } from '../../router.js';
import { leerProgreso } from '../../servicios/progreso.js';
import { cerrarSesion } from '../../servicios/auth.js';
import { avatarPorId } from '../../contenido/avatares.js';

const FRASE_ADIOS = '¡Hasta pronto, detective!';
let vivo = false;

const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function montar(contenedor) {
  vivo = true;
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-insignias';
  raiz.innerHTML = `
    <div class="expediente-perfil hud">
      <img class="expediente-cara" src="" alt="" width="72" height="72" hidden>
      <div class="expediente-nombre">
        <span class="expediente-etiqueta">DETECTIVE</span>
        <strong class="expediente-apodo">…</strong>
      </div>
      <button type="button" class="btn-apu secundario expediente-salir">CERRAR SESIÓN</button>
    </div>

    <h1 class="titulo-apu">INSIGNIAS</h1>
    <p>Pantalla en construcción.</p>
    <button class="btn-apu secundario" data-ir="menu">VOLVER AL MENÚ</button>

    <dialog class="expediente-ventana hud" aria-labelledby="salir-titulo" aria-describedby="salir-texto">
      <h2 id="salir-titulo">CERRAR SESIÓN</h2>
      <p id="salir-texto">Si sales, tus insignias y tu progreso se borran de este dispositivo. ¿Seguro?</p>
      <p class="expediente-error" role="alert"></p>
      <div class="expediente-acciones">
        <button type="button" class="btn-apu secundario" data-cancelar autofocus>CANCELAR</button>
        <button type="button" class="btn-apu" data-salir>SALIR</button>
      </div>
    </dialog>
  `;
  contenedor.append(raiz);
  const $ = (s) => raiz.querySelector(s);

  $('[data-ir]').addEventListener('click', () => ir('menu'));

  // Tarjeta: cara del avatar + apodo
  leerProgreso().then((p) => {
    if (!vivo) return;
    $('.expediente-apodo').innerHTML = escapar(String(p.apodo || 'Detective').trim());
    const a = avatarPorId(p.avatar);
    if (a) {
      const cara = $('.expediente-cara');
      cara.src = a.cara;
      cara.alt = a.nombre;
      cara.hidden = false;
    }
  }).catch(() => {});

  // Ventana propia (no confirm()): Cancelar o Esc la cierran; Salir borra todo y vuelve al planeta
  const ventana = $('.expediente-ventana');
  const salir = $('[data-salir]');
  const cancelar = $('[data-cancelar]');
  const error = $('.expediente-error');
  let saliendo = false;

  $('.expediente-salir').addEventListener('click', () => {
    error.textContent = '';
    ventana.showModal();
  });
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
      salir.textContent = 'SALIR';
      error.textContent = 'No se pudo cerrar la sesión. Revisa tu conexión e inténtalo otra vez.';
      return;
    }
    ventana.close();
    // Al llegar al planeta, el Jukumari se despide (como al volver del registro)
    window.addEventListener('hashchange', () => setTimeout(() => window.dispatchEvent(
      new CustomEvent('apu:jukumari', { detail: { texto: FRASE_ADIOS, abrir: true } }))), { once: true });
    ir('menu');
  });
}

export function desmontar() {
  vivo = false;
}
