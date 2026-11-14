// Progreso del jugador: lecciones, casos e insignias.
// Se guarda SIEMPRE en el navegador y, si hay conexión, también en Firestore.
// Así la app sigue funcionando aunque Firebase falle el día de la demo.
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.js';

const CLAVE_LOCAL = 'apu-progreso';
const VACIO = { apodo: '', avatar: '', lecciones: [], casos: [], insignias: [], hipotesis: '' };

function leerLocal() {
  try { return { ...VACIO, ...JSON.parse(localStorage.getItem(CLAVE_LOCAL) || '{}') }; } catch { return { ...VACIO }; }
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
    const snap = await getDoc(ref);
    const nube = snap.exists() ? snap.data() : {};
    const datos = { ...VACIO, ...local, ...nube };
    // Las listas se unen: en la nube caben menos (reglas de Firestore) y no deben pisar lo del navegador
    for (const k of ['lecciones', 'casos', 'insignias']) datos[k] = [...new Set([...(local[k] ?? []), ...(nube[k] ?? [])])];
    datos.casos = normalizarCasos(datos.casos); // "id" y "id|fecha" del mismo caso → uno solo
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
      casos: datos.casos.slice(0, 3),
      insignias: datos.insignias.slice(0, 15),
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
// Casos resueltos: cada uno se guarda como "id|AAAA-MM-DD" (el día en que se resolvió). Es un texto de la
// misma lista "casos" de siempre (firestore.rules: lista de hasta 3), así que las reglas no cambian.
// Los guardados antes, solo con el id, se siguen entendiendo (sin fecha).
export function casosResueltos(p) {
  const m = new Map();
  for (const e of p?.casos ?? []) {
    const [id, fecha = null] = String(e).split('|');
    if (id && (!m.has(id) || (fecha && !m.get(id)))) m.set(id, fecha);
  }
  return m; // Map id → fecha ('AAAA-MM-DD' o null)
}
function normalizarCasos(lista) {
  return [...casosResueltos({ casos: lista })].map(([id, fecha]) => (fecha ? `${id}|${fecha}` : id));
}
export async function completarCaso(id) {
  const p = leerLocal();
  const m = casosResueltos(p);
  if (!m.get(id)) m.set(id, new Date().toISOString().slice(0, 10));
  return guardar({ casos: [...m].map(([i, f]) => (f ? `${i}|${f}` : i)) });
}
// Guarda la insignia en el campo insignias, sin duplicarla. Devuelve true si es nueva
// (así quien la da sabe si debe mostrar el aviso de componentes/nueva-insignia.js).
// En el navegador quedan todas; en Firestore hasta 15 (firebase/firestore.rules).
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
