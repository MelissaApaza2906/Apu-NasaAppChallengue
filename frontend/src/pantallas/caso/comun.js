// Piezas comunes de #/casos y #/caso/…: formatos, el Jukumari (con los 3 niveles de ayuda) y el logo.
import { ir } from '../../router.js';
import { botonVolver } from '../../componentes/navegacion.js';

export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d).replace('.', ',').replace('-', '−') : '—');
export const fmtP = (p) => (Number.isFinite(p) ? (p < 0.001 ? '< 0,001' : fmt(p, 3)) : '—');
export const conSigno = (v, d = 2) => (Number.isFinite(v) ? `${v > 0 ? '+' : ''}${fmt(v, d)}` : '—');
export const miles = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Lo que dicen los datos: con p < 0,05 el rumbo de la pendiente; si no, "no cambió de forma clara"
export const rumboDatos = (stats) => (!stats ? null : stats.p < 0.05 ? stats.rumbo : 'no cambió de forma clara');
export const ICONO_RUMBO = { 'bajó': '📉', 'subió': '📈', 'no cambió': '➖', 'no cambió de forma clara': '➖' };

export function logo(destino, etiqueta) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'caso-logo';
  b.setAttribute('aria-label', etiqueta);
  b.innerHTML = '<img src="/img/logo-apu.png" alt="">';
  b.addEventListener('click', () => ir(destino));
  return b;
}

// Cabeza de las pantallas de casos: logo (→ menú principal) + "‹ Archivo" (o el botón que se pase)
export function cabeza(contenedor, texto = 'Archivo', destino = 'casos', etiqueta = 'Volver al archivo de casos') {
  contenedor.prepend(logo('menu', 'Ir al menú principal'), botonVolver(texto, destino, etiqueta));
}

// El Jukumari de cuerpo entero, con su globo "dice" y su nube "piensa".
//   ayuda 'con'  → habla en cada pista
//   ayuda 'poca' → calla; habla solo si se toca "💡 Pistas" (máx. 3 en todo el caso)
//   ayuda 'sin'  → en silencio hasta el veredicto
// decir(dice, piensa, { siempre }) — siempre: habla aunque la ayuda sea poca o ninguna (veredicto, avisos)
export function crearJukumari(raiz, { ayuda = 'con', pistasUsadas = 0, alUsarPista } = {}) {
  const el = document.createElement('aside');
  el.className = `caso-juku ayuda-${ayuda}`;
  el.setAttribute('aria-label', 'El Jukumari, tu guía');
  el.innerHTML = `
    <p class="caso-piensa" aria-live="polite" hidden><span aria-hidden="true">💭</span> <span data-piensa></span></p>
    <p class="caso-dice" aria-live="polite" hidden><b>JUKUMARI</b><span data-dice></span></p>
    <button type="button" class="caso-pistas" hidden></button>
    <img src="/img/jukumari-cuerpo.webp" alt="">`;
  raiz.append(el);
  const dice = el.querySelector('.caso-dice'), piensa = el.querySelector('.caso-piensa'), boton = el.querySelector('.caso-pistas');
  let usadas = pistasUsadas, pistaActual = null;
  const mostrar = (d, p) => {
    dice.hidden = !d; piensa.hidden = !p;
    el.querySelector('[data-dice]').textContent = d ?? '';
    el.querySelector('[data-piensa]').textContent = p ?? '';
    dice.classList.remove('habla'); void dice.offsetWidth; dice.classList.add('habla');
  };
  const pintarBoton = () => {
    boton.hidden = ayuda !== 'poca' || !pistaActual;
    boton.disabled = usadas >= 3;
    boton.textContent = usadas >= 3 ? '💡 Sin pistas' : `💡 Pistas (${3 - usadas})`;
  };
  boton.addEventListener('click', () => {
    if (!pistaActual || usadas >= 3) return;
    usadas += 1;
    mostrar(pistaActual, '');
    alUsarPista?.(usadas);
    pistaActual = null;
    pintarBoton();
  });
  return {
    decir(d, p = '', { siempre = false } = {}) {
      if (ayuda === 'con' || siempre) mostrar(d, p);
      else mostrar('', '');
    },
    // La pista de la pantalla (para la ayuda 'poca'); con ayuda 'con' se dice al empezar
    pista(texto) { pistaActual = texto; pintarBoton(); },
    callar() { mostrar('', ''); }
  };
}
