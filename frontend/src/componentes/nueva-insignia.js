// Aviso "¡Nueva insignia!" encima de cualquier pantalla.
// Uso:
//   import { mostrarNuevaInsignia } from '../../componentes/nueva-insignia.js';
//   if (await ganarInsignia('variable')) await mostrarNuevaInsignia('variable');
// Muestra el avatar de cuerpo entero, la insignia, la frase con el apodo y dos botones:
// "Ver mis insignias" (va a #/insignias) y SEGUIR (cierra). Es un <dialog> modal: Esc = SEGUIR.
// Devuelve una promesa que se cumple al cerrarse, con 'ver' o 'seguir'.
import './nueva-insignia.css';
import { ir } from '../router.js';
import { leerProgreso } from '../servicios/progreso.js';
import { avatarPorId } from '../contenido/avatares.js';
import { insigniaPorId } from '../contenido/insignias.js';

const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function mostrarNuevaInsignia(id) {
  const ins = insigniaPorId(id);
  if (!ins) return 'seguir';
  const p = await leerProgreso().catch(() => ({}));
  const apodo = escapar(String(p.apodo || 'detective').trim());
  const avatar = avatarPorId(p.avatar);

  const ventana = document.createElement('dialog');
  ventana.className = 'nueva-insignia';
  ventana.setAttribute('aria-labelledby', 'nueva-insignia-titulo');
  ventana.setAttribute('aria-describedby', 'nueva-insignia-frase');
  ventana.innerHTML = `
    <div class="nueva-insignia-figuras" aria-hidden="true">
      ${avatar ? `<img class="nueva-insignia-avatar" src="${avatar.cuerpo}" alt="">` : ''}
      <span class="nueva-insignia-medalla">${ins.img ? `<img src="${ins.img}" alt="">` : '<span class="hexagono">?</span>'}</span>
    </div>
    <div class="nueva-insignia-texto">
      <span class="etiqueta"><span class="barras" aria-hidden="true">//</span>NUEVA INSIGNIA</span>
      <h2 id="nueva-insignia-titulo">${ins.nombre.toUpperCase()}</h2>
      <p id="nueva-insignia-frase">¡Bien hecho, ${apodo}! Ganaste la insignia ${escapar(ins.nombre)}.</p>
      <div class="nueva-insignia-acciones">
        <button type="button" class="btn-apu secundario" data-ver>VER MIS INSIGNIAS</button>
        <button type="button" class="btn-apu" data-seguir autofocus>SEGUIR</button>
      </div>
    </div>`;
  (document.getElementById('app') ?? document.body).append(ventana); // dentro de #app: usa sus medidas (cqh)

  return new Promise((listo) => {
    let respuesta = 'seguir';
    const cerrar = (r) => { respuesta = r; ventana.close(); };
    ventana.querySelector('[data-seguir]').addEventListener('click', () => cerrar('seguir'));
    ventana.querySelector('[data-ver]').addEventListener('click', () => cerrar('ver'));
    ventana.addEventListener('close', () => {
      ventana.remove();
      if (respuesta === 'ver') ir('insignias');
      listo(respuesta);
    }, { once: true });
    ventana.showModal();
  });
}
