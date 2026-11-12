// Sesión: al iniciar la app, si no hay sesión, se crea una anónima en silencio (Firebase).
// El perfil (apodo + avatar) se pide aparte, en la pantalla de registro (pantallas/acceso).
import { onAuthStateChanged, signInAnonymously, signOut, deleteUser } from 'firebase/auth';
import { auth } from './firebase.js';
import { borrarDatosUsuario } from './progreso.js';

let usuario = null;
const oyentes = new Set();
let avisarLista;
// Se cumple cuando ya hay sesión (o cuando no se pudo crear: sin conexión, se sigue en el navegador)
export const sesionLista = new Promise((r) => { avisarLista = r; });

export function usuarioActual() { return usuario; }
export function alCambiarSesion(fn) { oyentes.add(fn); return () => oyentes.delete(fn); }

export function escucharSesion() {
  if (!auth) { usuario = { uid: 'local', isAnonymous: true }; avisarLista(); return; } // sin Firebase: modo navegador
  onAuthStateChanged(auth, (u) => {
    if (!u) {
      // Sin sesión: anónima, sin preguntar nada. Si falla (sin conexión), el progreso queda en el navegador.
      signInAnonymously(auth).catch((e) => { console.warn('APU: no se pudo crear la sesión anónima.', e); avisarLista(); });
      return;
    }
    usuario = u;
    avisarLista();
    oyentes.forEach((fn) => fn(u));
  });
}

export async function salir() { if (auth) await signOut(auth); }

// "Cerrar sesión" (Mi expediente): borra usuarios/{uid} y el progreso del navegador, luego la cuenta
// anónima se borra a sí misma (deleteUser), así no quedan cuentas vacías en Firebase; si eso falla,
// signOut igual. Después onAuthStateChanged crea otra anónima en silencio. Sin conexión, Firestore deja
// el borrado en cola (la promesa no se cumple hasta que vuelve la red): no se espera más de 5 s.
export async function cerrarSesion() {
  const borrado = borrarDatosUsuario();
  await Promise.race([borrado, new Promise((r) => setTimeout(r, 5000))]);
  usuario = null;
  if (!auth) return;
  try {
    if (auth.currentUser) await deleteUser(auth.currentUser);
  } catch (e) {
    console.warn('APU: no se pudo borrar la cuenta anónima; se cierra la sesión.', e);
  }
  if (auth.currentUser) await signOut(auth); // deleteUser ya cierra la sesión; si falló, se cierra aquí
}

// "Borrar mi cuenta" (Ajustes): borra el progreso y luego la cuenta.
export async function borrarCuenta() {
  await borrarDatosUsuario();
  if (auth?.currentUser) await deleteUser(auth.currentUser);
}
