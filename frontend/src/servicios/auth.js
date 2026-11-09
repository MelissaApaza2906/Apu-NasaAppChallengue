// Inicio de sesión: invitado (anónimo), Google o correo. Solo pedimos un apodo.
import {
  onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup, linkWithPopup,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser
} from 'firebase/auth';
import { auth } from './firebase.js';
import { guardarPerfil, borrarDatosUsuario } from './progreso.js';

let usuario = null;
const oyentes = new Set();
let avisarLista;
// Se cumple cuando Firebase ya sabe si hay sesión (evita mandar al acceso a quien ya entró)
export const sesionLista = new Promise((r) => { avisarLista = r; });

export function usuarioActual() { return usuario; }
export function alCambiarSesion(fn) { oyentes.add(fn); return () => oyentes.delete(fn); }

export function escucharSesion() {
  if (!auth) { usuario = { uid: 'local', isAnonymous: true }; avisarLista(); return; } // sin Firebase: modo navegador
  onAuthStateChanged(auth, (u) => { usuario = u; avisarLista(); oyentes.forEach((fn) => fn(u)); });
}

export async function entrarComoInvitado(apodo) {
  if (!auth) return usuario;
  const { user } = await signInAnonymously(auth);
  await guardarPerfil({ apodo });
  return user;
}

// Si ya era invitado, Google se "engancha" a su cuenta y no pierde el progreso.
export async function entrarConGoogle() {
  const proveedor = new GoogleAuthProvider();
  if (auth.currentUser?.isAnonymous) return (await linkWithPopup(auth.currentUser, proveedor)).user;
  return (await signInWithPopup(auth, proveedor)).user;
}

export async function registrarConCorreo(correo, clave, apodo) {
  const { user } = await createUserWithEmailAndPassword(auth, correo, clave);
  await guardarPerfil({ apodo });
  return user;
}

export async function entrarConCorreo(correo, clave) {
  return (await signInWithEmailAndPassword(auth, correo, clave)).user;
}

export async function salir() { if (auth) await signOut(auth); }

// "Borrar mi cuenta" (Ajustes): borra el progreso y luego la cuenta.
export async function borrarCuenta() {
  await borrarDatosUsuario();
  if (auth?.currentUser) await deleteUser(auth.currentUser);
}
