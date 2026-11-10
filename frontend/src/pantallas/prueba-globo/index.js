// Pantalla de prueba del globo 3D: #/prueba-globo
// Solo para revisar el componente crearGlobo() a pantalla completa.
import { crearGlobo } from '../../componentes/globo3d.js';

let globo = null;

export function montar(contenedor) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-prueba-globo';
  raiz.style.cssText = 'position:absolute;inset:0;background:var(--noche);';
  contenedor.append(raiz);
  globo = crearGlobo(raiz);
  window.apuGlobo = globo; // para probar irA() desde la consola
}

export function desmontar() {
  globo?.destruir();
  globo = null;
  delete window.apuGlobo;
}
