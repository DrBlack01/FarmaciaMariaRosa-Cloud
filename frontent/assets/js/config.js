/**
 * config.js - Configuración centralizada de la URL del backend
 * Farmacia María Rosa - Frontend Vanilla
 *
 * INSTRUCCIONES PARA PRODUCCIÓN:
 * Cambiar el valor de PRODUCTION_API_URL a la URL real del backend en Render.
 * Ejemplo: "https://farmacia-maria-rosa-backend.onrender.com"
 *
 * En desarrollo local no se necesita cambiar nada.
 */

(function () {
  // URL del backend en producción (Render)
  // ⚠️ CAMBIAR este valor cuando despliegues el backend en Render
  const PRODUCTION_API_URL = "https://farmacia-maria-rosa-backend.onrender.com";

  // Detección automática del entorno:
  // - Si el archivo se abre directamente (file://) → usa localhost
  // - Si corre en localhost o 127.0.0.1 → usa localhost
  // - Cualquier otro dominio → usa la URL de producción
  const isLocal =
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  window.API_BASE_URL = isLocal
    ? "http://localhost:8081"
    : PRODUCTION_API_URL;

  console.log("[Config] API_BASE_URL =", window.API_BASE_URL);
})();
