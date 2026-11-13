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
  'casos':     { carga: () => import('./pantallas/casos/index.js'),     sesion: true },
  'caso':      { carga: () => import('./pantallas/caso/index.js'),      perfil: true },
  'insignias': { carga: () => import('./pantallas/insignias/index.js'), perfil: true },
  'perfil':    { carga: () => import('./pantallas/perfil/index.js'),    sesion: true },
  'ajustes':   { carga: () => import('./pantallas/ajustes/index.js'),   sesion: true }
};

let actual = null;
let turno = 0; // cada cambio de ruta tiene su turno: si llega otro mientras este espera, este no monta nada

export function ir(ruta) { location.hash = '#/' + ruta; }

export function iniciarRutas(contenedor) {
  const mostrar = async () => {
    const [nombre = '', ...params] = location.hash.replace(/^#\/?/, '').split('/');
    const ruta = RUTAS[nombre] ?? RUTAS[''];
    const pedida = [nombre, ...params].join('/');
    const yo = ++turno;
    if (ruta.sesion || ruta.perfil) await sesionLista;
    if (yo !== turno) return; // ya se pidió otra ruta (p. ej. volver rápido): no pisarla
    if (ruta.sesion && !usuarioActual()) { ir(`acceso/${pedida}`); return; }
    if (ruta.perfil && !(await tienePerfil())) { if (yo === turno) ir(`acceso/${pedida}`); return; }
    if (yo !== turno) return;
    const pantalla = await ruta.carga();
    if (yo !== turno) return;
    if (actual?.desmontar) actual.desmontar();
    contenedor.replaceChildren();
    actual = pantalla;
    actual.montar(contenedor, params);
  };
  window.addEventListener('hashchange', mostrar);
  mostrar();
}
