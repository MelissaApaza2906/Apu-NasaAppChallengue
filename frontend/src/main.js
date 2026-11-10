// Arranque de APU: estilos globales + rutas
import './estilos/base.css';
import { iniciarRutas } from './router.js';
import { escucharSesion } from './servicios/auth.js';
import { montarAsistente } from './componentes/jukumari-asistente.js';

escucharSesion();
iniciarRutas(document.getElementById('app'));
// El Jukumari asistente: uno solo, fuera del contenedor del router (no se destruye al cambiar de pantalla)
montarAsistente(document.getElementById('app'));
