/**
 * Constructores de color a partir de los tokens de marca.
 *
 * Los halos y degradados de la app son siempre los mismos tres colores de fuego
 * a distinta intensidad. Escritos como `rgba(255,90,31,0.12)` quedaban clavados
 * y no seguian al modo activo, ademas de estar repetidos en media docena de
 * componentes con valores que ya habian empezado a divergir (0.1 en un lado,
 * 0.12 en otro, 0.15 en otro).
 */
export type FireToken = 'orange' | 'red' | 'yellow';

/** El token de fuego mezclado con transparencia. `percent` va de 0 a 100. */
export function fire(token: FireToken, percent = 100): string {
  return percent >= 100
    ? `var(--fire-${token})`
    : `color-mix(in srgb, var(--fire-${token}) ${percent}%, transparent)`;
}

/** Degradado lineal entre tokens de fuego, el gesto de marca mas repetido. */
export function fireGradient(
  stops: Array<[FireToken, number?]>,
  angle = '90deg'
): string {
  const rendered = stops.map(([token, percent]) => fire(token, percent)).join(', ');
  return `linear-gradient(${angle}, ${rendered})`;
}
