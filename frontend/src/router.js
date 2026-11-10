// Rutas simples con "#": #/menu, #/etapas, #/leccion/variable …
// Cada pantalla exporta montar(contenedor, params) y, si quiere, desmontar().
// perfil: la ruta necesita apodo + avatar; si no los hay, va a #/acceso/<ruta pedida> y,
// al terminar el registro, vuelve a esa ruta. La carga, el menú (y su montaña) son libres.
import { usuarioActual, sesionLista } from './servicios/auth.js';
import { tienePerfil } from './servicios/progreso.js';

const RUTAS = {
  '':          { carga: () => import('./pantallas/carga/index.js') },
  'acceso':    { carga: () => import('./pantallas/acceso/index.js') },
  'menu':      { carga: () => import('./pantallas/menu/index.js') },
  'etapas':    { carga: () => import('./pantallas/etapas/index.js'),    perfil: true },
  'leccion':   { carga: () => import('./pantallas/leccion/index.js'),   perfil: true },
  'casos':     { carga: () => import('./pantallas/casos/index.js'),     perfil: true },
  'caso':      { carga: () => import('./pantallas/caso/index.js'),      perfil: true },
  'insignias': { carga: () => import('./pantallas/insignias/index.js'), perfil: true },
  'ajustes':   { carga: () => import('./pantallas/ajustes/index.js'),   sesion: true }
};

let actual = null;

export function ir(ruta) { location.hash = '#/' + ruta; }

export function iniciarRutas(contenedor) {
  const mostrar = async () => {
    const [nombre = '', ...params] = location.hash.replace(/^#\/?/, '').split('/');
    const ruta = RUTAS[nombre] ?? RUTAS[''];
    const pedida = [nombre, ...params].join('/');
    if (ruta.sesion || ruta.perfil) await sesionLista;
    if (ruta.sesion && !usuarioActual()) { ir(`acceso/${pedida}`); return; }
    if (ruta.perfil && !(await tienePerfil())) { ir(`acceso/${pedida}`); return; }
    if (actual?.desmontar) actual.desmontar();
    contenedor.replaceChildren();
    actual = await ruta.carga();
    actual.montar(contenedor, params);
  };
  window.addEventListener('hashchange', mostrar);
  mostrar();
}
