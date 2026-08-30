import { defineConfig, devices } from '@playwright/test';

/**
 * Recorridos de extremo a extremo contra la aplicacion real.
 *
 * Usa el Chrome instalado en la maquina (`channel: 'chrome'`) en vez de que
 * Playwright descargue su propio navegador: son ~150 MB por navegador y aqui ya
 * hay uno. La contrapartida es que se prueba contra la version de Chrome del
 * sistema y no contra una fija, lo cual para esta suite es aceptable — comprueba
 * comportamiento de la aplicacion, no compatibilidad entre navegadores.
 *
 * `webServer` levanta Vite si no hay nada escuchando, y lo reutiliza si ya lo
 * hay: asi la suite corre igual en una maquina de desarrollo con el servidor
 * abierto que en integracion continua desde cero.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // En CI un `test.only` olvidado dejaria pasar una suite incompleta en verde.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:5173',
    // Rastro solo del primer reintento: guardarlo siempre llena el disco rapido.
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
