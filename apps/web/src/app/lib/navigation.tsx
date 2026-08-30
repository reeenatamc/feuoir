import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import type { LinkProps, NavigateOptions, To } from 'react-router';

/**
 * Navegacion con transicion de vista.
 *
 * React Router expone la View Transitions API del navegador por navegacion, con
 * la bandera `viewTransition`. Envolverla aca en vez de repetir el prop en cada
 * enlace tiene un motivo concreto: si es opcional en cada llamada, alcanza con
 * que alguien agregue un <Link> sin acordarse para que esa ruta corte en seco y
 * la transicion quede a medias en el sitio.
 *
 * En navegadores sin soporte la bandera se ignora y la navegacion es la de
 * siempre, asi que no hace falta detectar nada.
 *
 * La animacion en si no vive aca: esta en `styles/transitions.css`, para que sea
 * el mismo lugar que decide el resto del movimiento.
 */
export function TransitionLink({ children, ...props }: LinkProps) {
  // `viewTransition` va antes del spread para que un caso puntual pueda apagarla.
  return (
    <Link viewTransition {...props}>
      {children}
    </Link>
  );
}

/** `useNavigate` con la transicion activada por defecto. */
export function useTransitionNavigate() {
  const navigate = useNavigate();

  return useCallback(
    (to: To, options?: NavigateOptions) => navigate(to, { viewTransition: true, ...options }),
    [navigate]
  );
}
