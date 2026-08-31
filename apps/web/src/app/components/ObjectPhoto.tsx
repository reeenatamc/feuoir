import type { ObjectImage } from '../content/images';

/**
 * Fotografia de una pieza, en el formato y el ancho que le convengan al lector.
 *
 * Es un `<picture>` y no un `<img>` suelto porque el backend deriva cada foto a
 * AVIF y WebP en cinco anchos, y servir siempre el mayor en el formato mas
 * pesado seria descargar del orden de diez veces lo necesario para pintar una
 * miniatura de la retícula. El navegador elige: los `<source>` lo dejan
 * descartar el formato que no sabe decodificar, y `srcset` mas `sizes` le dan lo
 * que necesita para calcular el ancho antes de tener el diseño resuelto.
 *
 * El orden de `sources` llega decidido por el servidor -- AVIF primero -- y aqui
 * se respeta: el navegador se queda con el primero que soporta.
 */
export function ObjectPhoto({
  image,
  sizes,
  className,
}: {
  image: ObjectImage;
  /**
   * Cuanto ancho ocupa la foto en cada punto de corte. Lo pone la vista y no el
   * servidor porque depende de la retícula, que el backend no conoce.
   */
  sizes: string;
  className?: string;
}) {
  return (
    <picture>
      {image.sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcset} sizes={sizes} />
      ))}
      {/* El `src` es el respaldo en WebP: lo pide un navegador sin `srcset` y es
          tambien lo que se muestra si ningun `<source>` sirve.
          El punto focal va a `object-position` porque el recorte lo hace el
          navegador: la foto llega entera y cada vista la encuadra distinto.
          El `alt` es el que cargo el panel, incluso vacio. Vacio significa que
          la foto no agrega nada al texto que ya la acompana -- el numero, el
          nombre y el estado de la pieza -- y repetirlo seria leerlo dos veces. */}
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        loading="lazy"
        decoding="async"
        className={className}
        style={{ objectPosition: `${image.focalPoint.x}% ${image.focalPoint.y}%` }}
      />
    </picture>
  );
}
