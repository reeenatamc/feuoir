import { describe, expect, it } from 'vitest';
import { fire, fireGradient } from './color';

describe('fire', () => {
  it('al 100% devuelve el token pelado, sin mezcla innecesaria', () => {
    // Un `color-mix` al 100% da lo mismo que el color, pero cuesta calculo en
    // cada repintado y ensucia el CSS inspeccionado.
    expect(fire('orange')).toBe('var(--fire-orange)');
    expect(fire('red', 100)).toBe('var(--fire-red)');
  });

  it('por debajo de 100 mezcla con transparente', () => {
    expect(fire('orange', 12)).toBe(
      'color-mix(in srgb, var(--fire-orange) 12%, transparent)'
    );
  });

  it('referencia el token y nunca un hex, para que siga al modo activo', () => {
    for (const token of ['orange', 'red', 'yellow'] as const) {
      expect(fire(token, 30)).toContain(`var(--fire-${token})`);
      expect(fire(token, 30)).not.toMatch(/#[0-9a-f]{3,8}/i);
    }
  });
});

describe('fireGradient', () => {
  it('encadena las paradas en el orden dado', () => {
    expect(fireGradient([['orange'], ['red']])).toBe(
      'linear-gradient(90deg, var(--fire-orange), var(--fire-red))'
    );
  });

  it('respeta la opacidad de cada parada por separado', () => {
    const g = fireGradient([['orange', 10], ['red', 40]]);
    expect(g).toContain('var(--fire-orange) 10%');
    expect(g).toContain('var(--fire-red) 40%');
  });

  it('permite cambiar el angulo', () => {
    expect(fireGradient([['yellow'], ['orange']], '180deg')).toContain('linear-gradient(180deg,');
  });
});
