import { describe, expect, it } from 'vitest';
import { whatsappLink } from './whatsapp';

describe('whatsappLink', () => {
  it('normaliza el numero a solo digitos', () => {
    // Es el motivo entero de que esta funcion exista: con `+`, espacios o
    // guiones, wa.me abre el chat SIN destinatario y el mensaje no llega a nadie.
    const link = whatsappLink('+593 99 123 4567', 'hola');
    expect(link).toContain('https://wa.me/593991234567?');
  });

  it('codifica el mensaje, incluidos saltos de linea y acentos', () => {
    const link = whatsappLink('593991234567', 'Línea 1\nLínea 2 & 3');
    expect(link).toContain('L%C3%ADnea%201%0AL%C3%ADnea%202%20%26%203');
  });

  it('devuelve null sin numero configurado, en vez de un enlace roto', () => {
    expect(whatsappLink(undefined, 'hola')).toBeNull();
    expect(whatsappLink('', 'hola')).toBeNull();
  });

  it('trata como ausente un numero que no tiene ni un digito', () => {
    expect(whatsappLink('   ', 'hola')).toBeNull();
    expect(whatsappLink('+-- --', 'hola')).toBeNull();
  });
});
