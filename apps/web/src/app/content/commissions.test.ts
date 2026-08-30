import { describe, expect, it } from 'vitest';
import { EMPTY_REQUEST, composeMessage, isEmailShaped, validate } from './commissions';
import type { CommissionRequest } from './commissions';

/** Solicitud completa, para partir de algo valido y romper un campo por vez. */
function solicitudValida(cambios: Partial<CommissionRequest> = {}): CommissionRequest {
  return {
    ...EMPTY_REQUEST,
    intention: 'Una tabla con marcas de uso reales',
    name: 'Renata',
    email: 'renata@ejemplo.com',
    ...cambios,
  };
}

describe('isEmailShaped', () => {
  it('acepta direcciones legitimas que una expresion estricta rechazaria', () => {
    // Este es el motivo de que la comprobacion sea laxa: los tres son validos y
    // los validadores "estrictos" suelen tumbar al menos uno.
    expect(isEmailShaped('nombre+etiqueta@ejemplo.com')).toBe(true);
    expect(isEmailShaped('a@correo.subdominio.ejemplo.io')).toBe(true);
    expect(isEmailShaped('r@x.co')).toBe(true);
  });

  it('rechaza las erratas evidentes, que es lo unico que puede atajar', () => {
    expect(isEmailShaped('renata')).toBe(false);
    expect(isEmailShaped('renata@')).toBe(false);
    expect(isEmailShaped('renata@ejemplo')).toBe(false);
    expect(isEmailShaped('con espacio@ejemplo.com')).toBe(false);
  });

  it('ignora espacios alrededor, porque pegar un correo suele arrastrarlos', () => {
    expect(isEmailShaped('  renata@ejemplo.com  ')).toBe(true);
  });
});

describe('validate', () => {
  it('no devuelve nada cuando la solicitud esta completa', () => {
    expect(validate(solicitudValida())).toEqual([]);
  });

  it('exige intencion, nombre y correo, y nada mas', () => {
    expect(validate(EMPTY_REQUEST).sort()).toEqual(['email', 'intention', 'name']);
  });

  it('no da por buena una intencion que son solo espacios', () => {
    expect(validate(solicitudValida({ intention: '   ' }))).toContain('intention');
  });

  it('deja pasar medida y presupuesto vacios: son opcionales', () => {
    expect(validate(solicitudValida({ size: '', budget: 'undecided' }))).toEqual([]);
  });
});

describe('composeMessage', () => {
  const labels = {
    title: 'Solicitud de encargo — FEUOIR',
    subject: 'Pieza',
    size: 'Medida',
    intention: 'Intención',
    budget: 'Presupuesto aproximado',
    name: 'Nombre',
    email: 'Correo',
  };
  const values = { subject: 'Tabla', budget: 'Sin definir' };

  it('incluye todos los datos que el negocio necesita para responder', () => {
    const msg = composeMessage(solicitudValida({ size: '8.25"' }), labels, values);

    expect(msg).toContain('Solicitud de encargo — FEUOIR');
    expect(msg).toContain('Pieza: Tabla');
    expect(msg).toContain('Medida: 8.25"');
    expect(msg).toContain('Una tabla con marcas de uso reales');
    expect(msg).toContain('Correo: renata@ejemplo.com');
  });

  it('omite la medida cuando no se indico, en vez de mandar una linea vacia', () => {
    const msg = composeMessage(solicitudValida({ size: '' }), labels, values);
    expect(msg).not.toContain('Medida:');
  });

  it('recorta los espacios de los campos antes de enviarlos', () => {
    const msg = composeMessage(solicitudValida({ name: '  Renata  ' }), labels, values);
    expect(msg).toContain('Nombre: Renata');
  });
});
