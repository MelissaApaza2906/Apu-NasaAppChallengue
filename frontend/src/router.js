// Rutas simples con "#": #/menu, #/etapas, #/leccion/variable …
// Cada pantalla exporta montar(contenedor, params) y, si quiere, desmontar().
import { usuarioActual, sesionLista } from './servicios/auth.js';

const RUTAS = {
  '':          { carga: () => import('./pantallas/carga/index.js'),     sesion: false },
  'acceso':    { carga: () => import('./pantallas/acceso/index.js'),    sesion: false },
  'menu':      { carga: () => import('./pantallas/menu/index.js'),      sesion: true },
  'etapas':    { carga: () => import('./pantallas/etapas/index.js'),    sesion: true },
  'leccion':   { carga: () => import('./pantallas/leccion/index.js'),   sesion: true },
  'casos':     { carga: () => import('./pantallas/casos/index.js'),     sesion: true },
  'caso':      { carga: () => import('./pantallas/caso/index.js'),      sesion: true },
  'insignias': { carga: () => import('./pantallas/insignias/index.js'), sesion: true },
  'ajustes':   { carga: () => import('./pantallas/ajustes/index.js'),   sesion: true },
  'prueba-globo': { carga: () => import('./pantallas/prueba-globo/index.js'), sesion: false }
};

let actual = null;

export function ir(ruta) { location.hash = '#/' + ruta; }

export function iniciarRutas(contenedor) {
  const mostrar = async () => {
    const [nombre = '', ...params] = location.hash.replace(/^#\/?/, '').split('/');
    const ruta = RUTAS[nombre] ?? RUTAS[''];
    if (ruta.sesion) await sesionLista;
    if (ruta.sesion && !usuarioActual()) { ir('acceso'); return; }
    if (actual?.desmontar) actual.desmontar();
    contenedor.replaceChildren();
    actual = await ruta.carga();
    actual.montar(contenedor, params);
  };
  window.addEventListener('hashchange', mostrar);
  mostrar();
}
