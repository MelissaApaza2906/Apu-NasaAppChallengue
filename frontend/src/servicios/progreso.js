// Progreso del jugador: lecciones, casos e insignias.
// Se guarda SIEMPRE en el navegador y, si hay conexión, también en Firestore.
// Así la app sigue funcionando aunque Firebase falle el día de la demo.
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.js';

const CLAVE_LOCAL = 'apu-progreso';
const VACIO = { apodo: '', avatar: '', lecciones: [], casos: [], insignias: [] };

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
      lecciones: datos.lecciones.slice(0, 5),
      casos: datos.casos.slice(0, 3),
      insignias: datos.insignias.slice(0, 4),
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
export async function completarCaso(id) {
  const p = leerLocal();
  return guardar({ casos: [...new Set([...p.casos, id])] });
}
export async function ganarInsignia(id) {
  const p = leerLocal();
  return guardar({ insignias: [...new Set([...p.insignias, id])] });
}

export async function borrarDatosUsuario() {
  try { localStorage.removeItem(CLAVE_LOCAL); } catch {}
  const ref = refUsuario();
  if (ref) await deleteDoc(ref);
}
