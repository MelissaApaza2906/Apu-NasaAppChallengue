// Pantalla de prueba del globo 3D: #/prueba-globo
// Reproduce la posición del globo en el menú (maqueta "Monitoreo glaciar") sobre el cielo galáctico.
// Los rectángulos rojos punteados marcan dónde irán la barra de botones y el panel de datos.
import './prueba-globo.css';
import { crearGlobo } from '../../componentes/globo3d.js';

let globo = null;

export function montar(contenedor) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-prueba-globo cielo-apu';
  raiz.innerHTML = `
    ${'<span class="estrella-apu" aria-hidden="true"></span>'.repeat(6)}
    <svg class="pg-orbita" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <ellipse cx="50" cy="50" rx="48" ry="44" fill="none"
        stroke="rgba(169,200,255,.55)" stroke-width=".35" stroke-dasharray="1 1.4" />
    </svg>
    <div class="pg-globo"></div>
    <div class="pg-zona pg-barra"><span>BARRA · 5 BOTONES</span></div>
    <div class="pg-zona pg-panel"><span>PANEL DE DATOS</span></div>
  `;
  contenedor.append(raiz);
  globo = crearGlobo(raiz.querySelector('.pg-globo'), { tamano: 0.95 });
  window.apuGlobo = globo; // para probar irA() / estado() desde la consola
}

export function desmontar() {
  globo?.destruir();
  globo = null;
  delete window.apuGlobo;
}
