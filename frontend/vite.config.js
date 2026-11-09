import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

// vite-plugin-cesium copia los archivos que Cesium necesita (workers, imágenes) al compilar.
export default defineConfig({
  plugins: [cesium()],
  server: { port: 5173 }
});
