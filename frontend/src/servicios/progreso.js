// Progreso del jugador: lecciones, casos e insignias.
// Se guarda SIEMPRE en el navegador y, si hay conexión, también en Firestore.
// Así la app sigue funcionando aunque Firebase falle el día de la demo.
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.js';

const CLAVE_LOCAL = 'apu-progreso';
const VACIO = { apodo: '', avatar: '', lecciones: [], casos: {}, insignias: [], hipotesis: '' };

function leerLocal() {
  try { const d = { ...VACIO, ...JSON.parse(localStorage.getItem(CLAVE_LOCAL) || '{}') }; d.casos = comoMapa(d.casos); return d; } catch { return { ...VACIO, casos: {} }; }
}
function escribirLocal(datos) {
  try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify(datos)); } catch { /* modo privado: se ignora */ }
}
function refUsuario() {
  return db && auth?.currentUser ? doc(db, 'usuarios', auth.currentUser.uid) : null;
}

export async function leerProgreso() {
  const local = leerLocal();
  const ref = refUsuario();
  if (!ref) return local;
  try {
    // Sin conexión, Firestore tarda ~10 s en rendirse: a los 4 s sigue con lo del navegador
    const snap = await Promise.race([getDoc(ref), new Promise((_, no) => setTimeout(() => no(new Error('Firestore no responde')), 4000))]);
    const nube = snap.exists() ? snap.data() : {};
    const datos = { ...VACIO, ...local, ...nube };
    // Las listas se unen: en la nube caben menos (reglas de Firestore) y no deben pisar lo del navegador
    for (const k of ['lecciones', 'insignias']) datos[k] = [...new Set([...(local[k] ?? []), ...(nube[k] ?? [])])];
    datos.casos = unirCasos(comoMapa(local.casos), comoMapa(nube.casos));
    escribirLocal(datos);
    return datos;
  } catch {
    return local;
  }
}

async function guardar(cambios) {
  const datos = { ...leerLocal(), ...cambios };
  escribirLocal(datos);
  const ref = refUsuario();
  if (!ref) return datos;
  try {
    await setDoc(ref, {
      apodo: String(datos.apodo || 'Detective').slice(0, 20),
      avatar: String(datos.avatar || '').slice(0, 20), // id de contenido/avatares.js
      lecciones: datos.lecciones.slice(0, 10),  // mismos topes que firebase/firestore.rules
      casos: Object.fromEntries(Object.entries(comoMapa(datos.casos)).slice(0, 11)), // usuarios/{uid}.casos[id]
      insignias: datos.insignias.slice(0, 30),
      // "bajó|Muy seguro" (lección 5 → lección 10). Solo si hay: así las reglas viejas no rechazan lo demás
      ...(datos.hipotesis ? { hipotesis: String(datos.hipotesis).slice(0, 40) } : {}),
      actualizado: serverTimestamp()
    });
  } catch (e) {
    console.warn('APU: no se pudo guardar en la nube; queda en el navegador.', e);
  }
  return datos;
}

// ¿Ya tiene perfil de detective? (apodo de 2 a 20 caracteres y avatar elegido)
export async function tienePerfil() {
  const p = await leerProgreso();
  return /^[\p{L}\p{N} _-]{2,20}$/u.test(String(p.apodo ?? '').trim()) && Boolean(p.avatar);
}

// Apodo y avatar (id de contenido/avatares.js); solo cambia lo que se pasa
export function guardarPerfil({ apodo, avatar } = {}) {
  const cambios = {};
  if (apodo !== undefined) cambios.apodo = apodo;
  if (avatar !== undefined) cambios.avatar = avatar;
  return guardar(cambios);
}

export async function completarLeccion(id) {
  const p = leerLocal();
  return guardar({ lecciones: [...new Set([...p.lecciones, id])] });
}

// Hipótesis de la lección 5 ("bajó" / "no cambió" / "subió" y qué tan seguro): va al perfil y la usa la lección 10
export function guardarHipotesis(opcion, confianza = '') {
  return guardar({ hipotesis: [opcion, confianza].filter(Boolean).join('|') });
}

// Por dónde va cada lección (fase, página, chequeos, pregunta y aciertos de la trivia): solo en el navegador
const CLAVE_AVANCE = 'apu-lecciones-avance';
export function leerAvance(id) {
  try { const t = JSON.parse(localStorage.getItem(CLAVE_AVANCE) || '{}'); return t && typeof t[id] === 'object' ? t[id] : null; } catch { return null; }
}
export function guardarAvance(id, avance) {
  try {
    const t = JSON.parse(localStorage.getItem(CLAVE_AVANCE) || '{}') || {};
    t[id] = avance;
    localStorage.setItem(CLAVE_AVANCE, JSON.stringify(t));
  } catch { /* modo privado */ }
}
// Casos: usuarios/{uid}.casos[id] = { pista, elecciones, veredicto, resuelto, fecha }
//   pista: la estrella hasta la que llegó (0 = expediente … 7 = todas) · elecciones: lo que eligió en cada pista
//   veredicto: { rumbo, palabras } · resuelto: true al firmar · fecha: 'AAAA-MM-DD' del día en que lo cerró
// La lista vieja ("id" o "id|AAAA-MM-DD", hasta 3) se convierte sola: esos casos quedan resueltos.
function comoMapa(casos) {
  if (casos && !Array.isArray(casos) && typeof casos === 'object') return { ...casos };
  const m = {};
  for (const e of Array.isArray(casos) ? casos : []) {
    const [id, fecha = null] = String(e).split('|');
    if (id) m[id] = { ...(m[id] ?? {}), resuelto: true, fecha: fecha ?? m[id]?.fecha ?? null };
  }
  return m;
}
// Navegador + nube: se queda lo más avanzado de cada caso
function unirCasos(a, b) {
  const m = { ...a };
  for (const [id, v] of Object.entries(b)) {
    const x = m[id] ?? {};
    m[id] = { ...x, ...v, pista: Math.max(x.pista ?? 0, v.pista ?? 0), resuelto: Boolean(x.resuelto || v.resuelto), fecha: v.fecha ?? x.fecha ?? null };
  }
  return m;
}
export function casosResueltos(p) {
  return new Map(Object.entries(comoMapa(p?.casos)).filter(([, v]) => v?.resuelto).map(([id, v]) => [id, v.fecha ?? null]));
}
export const estadoCaso = (p, id) => comoMapa(p?.casos)[id] ?? null;
// Guarda lo nuevo de un caso (se une con lo que ya había)
export function guardarCaso(id, cambios) {
  const p = leerLocal();
  const antes = p.casos[id] ?? {};
  const nuevo = { ...antes, ...cambios, elecciones: { ...(antes.elecciones ?? {}), ...(cambios.elecciones ?? {}) }, pista: Math.max(antes.pista ?? 0, cambios.pista ?? 0) };
  return guardar({ casos: { ...p.casos, [id]: nuevo } });
}
export function completarCaso(id, veredicto = null) {
  const antes = leerLocal().casos[id];
  return guardarCaso(id, { resuelto: true, pista: 7, fecha: antes?.fecha ?? new Date().toISOString().slice(0, 10), ...(veredicto ? { veredicto } : {}) });
}
// Guarda la insignia en el campo insignias, sin duplicarla. Devuelve true si es nueva
// (así quien la da sabe si debe mostrar el aviso de componentes/nueva-insignia.js).
// En el navegador quedan todas; en Firestore hasta 30 (firebase/firestore.rules).
export async function ganarInsignia(id) {
  const p = leerLocal();
  if (p.insignias.includes(id)) return false;
  await guardar({ insignias: [...p.insignias, id] });
  return true;
}

// "Caminante": glaciares visitados, solo en el navegador. Al llegar a la meta, gana la insignia.
const CLAVE_GLACIARES = 'apu-glaciares-vistos';
export function glaciaresVistos() {
  try { const v = JSON.parse(localStorage.getItem(CLAVE_GLACIARES) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
export async function verGlaciar(id, meta = 11) {
  const vistos = [...new Set([...glaciaresVistos(), id])];
  try { localStorage.setItem(CLAVE_GLACIARES, JSON.stringify(vistos)); } catch { /* modo privado */ }
  return vistos.length >= meta ? ganarInsignia('caminante') : false;
}

export async function borrarDatosUsuario() {
  try { localStorage.removeItem(CLAVE_LOCAL); localStorage.removeItem(CLAVE_GLACIARES); localStorage.removeItem(CLAVE_AVANCE); } catch {}
  const ref = refUsuario();
  if (ref) await deleteDoc(ref);
}
