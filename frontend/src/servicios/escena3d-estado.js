// Registro mínimo de la escena 3D de los casos (servicios/escena3d.js), sin cargar Cesium:
// el menú llama apagarEscena3d() al entrar, así nunca hay dos visores de Cesium a la vez.
let apagar = null;
export const registrarEscena3d = (fn) => { apagar = fn; };
export const apagarEscena3d = () => { const f = apagar; apagar = null; f?.(); };
