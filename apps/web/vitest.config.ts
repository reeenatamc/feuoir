import { defineConfig } from 'vitest/config';

/**
 * Solo pruebas de logica pura: contenido, identidad de las piezas y utilidades.
 *
 * No hay entorno de navegador (`jsdom`) a proposito. Montar el DOM para probar
 * componentes obligaria a una dependencia mas y a duplicar en asserts lo que el
 * recorrido de extremo a extremo ya comprueba sobre la aplicacion real. La
 * division es: aqui lo que se puede razonar sin pintar nada, en Playwright lo
 * que solo se puede comprobar mirando la pagina.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Los recorridos de Playwright viven en `e2e/` y los corre otro runner.
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
