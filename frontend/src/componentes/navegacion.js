// Navegación común: el botón "‹ Ruta / ‹ Menú / ‹ Archivo" de arriba a la izquierda (a la derecha del logo)
// y el aviso pequeño que dura 2 s ("Seguiste donde lo dejaste").
// En celular el botón queda como un círculo de 40 px con solo "‹" (navegacion.css).
import './navegacion.css';
import { ir } from '../router.js';

export function botonVolver(texto, destino, etiqueta = `Volver: ${texto}`) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn-apu secundario btn-volver';
  b.setAttribute('aria-label', etiqueta);
  b.innerHTML = `<span class="flecha" aria-hidden="true">‹</span><span class="texto" aria-hidden="true">${texto}</span>`;
  b.addEventListener('click', () => ir(destino));
  return b;
}

let avisoActual = null;
export function avisar(texto, ms = 2000) {
  avisoActual?.remove();
  const a = document.createElement('p');
  a.className = 'aviso-apu';
  a.setAttribute('role', 'status');
  a.textContent = texto;
  a.style.setProperty('--dura', `${ms}ms`);
  (document.getElementById('app') ?? document.body).append(a);
  avisoActual = a;
  setTimeout(() => { a.remove(); if (avisoActual === a) avisoActual = null; }, ms + 300);
}
