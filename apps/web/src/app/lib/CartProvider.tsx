import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { classifyFailure, failureDetail, itemCount } from '../content/cart';
import type { Cart, CartFailure, Order } from '../content/cart';
import type { CheckoutForm } from '../content/checkout';
import { ApiError } from './api';
import {
  addCartItem,
  applyDiscountCode,
  checkoutCart,
  fetchCart,
  openCart,
  removeCartItem,
  removeDiscountCode,
  setCartItemQuantity,
} from './cartApi';
import { clearCartToken, readCartToken, storeCartToken } from './cartToken';

/**
 * La bolsa, compartida por toda la aplicacion.
 *
 * Es contexto y no estado de una pantalla porque tres sitios distintos hablan de
 * la misma bolsa: la barra la cuenta, la ficha agrega, y la pagina de la bolsa
 * edita. Con una copia por vista, el contador diria una cosa y la pagina otra.
 *
 * El estado que se guarda aqui es **la respuesta del servidor**, sin derivar
 * nada de ella: los importes llegan calculados y se muestran tal cual. Es la
 * misma funcion que usa la orden para congelar los suyos, asi que sumar por
 * nuestra cuenta solo puede producir un total distinto del que se va a cobrar.
 */

/** Como termino una operacion sobre la bolsa. */
export type BagOutcome =
  | { ok: true }
  | { ok: false; failure: CartFailure; detail: string | null };

export type CheckoutOutcome =
  | { ok: true; order: Order }
  | { ok: false; failure: CartFailure; detail: string | null };

export interface BagValue {
  /** `loading` solo mientras se recupera la bolsa guardada, al arrancar. */
  status: 'loading' | 'ready' | 'error';
  /** `null` cuando no hay ninguna bolsa abierta. No es lo mismo que un fallo. */
  cart: Cart | null;
  /** Unidades en la bolsa. Es el numero de la barra. */
  count: number;
  /** Por que no se pudo recuperar la bolsa guardada. `null` mientras no falle. */
  loadFailure: CartFailure | null;
  /** Hay una peticion en curso: los controles se bloquean mientras dura. */
  busy: boolean;
  addItem: (variantId: number, quantity?: number) => Promise<BagOutcome>;
  setQuantity: (itemId: number, quantity: number) => Promise<BagOutcome>;
  removeItem: (itemId: number) => Promise<BagOutcome>;
  applyDiscount: (code: string) => Promise<BagOutcome>;
  removeDiscount: () => Promise<BagOutcome>;
  checkout: (form: CheckoutForm) => Promise<CheckoutOutcome>;
}

const BagContext = createContext<BagValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<BagValue['status']>('loading');
  const [loadFailure, setLoadFailure] = useState<CartFailure | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * Recupera la bolsa guardada.
   *
   * Sin token no se abre ninguna: crear un carrito por visita deja una fila en
   * la base por cada persona que solo miro. La bolsa se abre al agregar la
   * primera pieza, que es cuando existe algo que guardar.
   */
  useEffect(() => {
    const token = readCartToken();

    if (!token) {
      setStatus('ready');
      return;
    }

    // Mismo resguardo que en el catalogo: la respuesta puede volver despues de
    // que el componente se desmonte, y el controlador ademas cancela el viaje.
    let active = true;
    const controller = new AbortController();

    fetchCart(token, controller.signal)
      .then((recovered) => {
        if (!active) return;
        setCart(recovered);
        setStatus('ready');
      })
      .catch((cause: unknown) => {
        if (!active) return;

        // Un token que el servidor ya no reconoce no es un fallo que reportar:
        // es lo que queda despues de comprar. Se borra y la bolsa arranca vacia.
        if (classifyFailure(cause) === 'gone') {
          clearCartToken();
          setStatus('ready');
          return;
        }

        console.error('[api] bolsa guardada:', cause);
        setLoadFailure(classifyFailure(cause));
        setStatus('error');
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  /** Corre una escritura y deja la bolsa en lo que el servidor haya contestado. */
  const apply = useCallback(async (operation: () => Promise<Cart>): Promise<BagOutcome> => {
    setBusy(true);

    try {
      const next = await operation();
      if (next.token) storeCartToken(next.token);
      setCart(next);
      setStatus('ready');
      setLoadFailure(null);
      return { ok: true };
    } catch (cause: unknown) {
      const failure = classifyFailure(cause);

      if (failure === 'gone') {
        clearCartToken();
        setCart(null);
        setStatus('ready');
      }

      console.error('[api] bolsa:', cause);
      return { ok: false, failure, detail: failureDetail(cause) };
    } finally {
      setBusy(false);
    }
  }, []);

  /**
   * Igual, para las operaciones que necesitan una bolsa ya abierta.
   *
   * Sin token no hay nada contra lo que operar, y el desenlace es el mismo que
   * el de un token que el servidor no reconoce. Se levanta el mismo error que
   * levantaria el servidor en vez de inventar un caso aparte: asi hay un solo
   * camino que borra el token y vacia la bolsa.
   */
  const applyWithToken = useCallback(
    (operation: (token: string) => Promise<Cart>) =>
      apply(() => {
        const token = readCartToken();
        if (!token) throw new ApiError('No hay ninguna bolsa abierta.', 404);
        return operation(token);
      }),
    [apply]
  );

  const addItem = useCallback(
    (variantId: number, quantity = 1) =>
      apply(async () => {
        let token = readCartToken();

        if (!token) {
          // El token se guarda en cuanto existe y no al final: si la linea se
          // rechaza, el proximo intento reusa esta bolsa en vez de abrir otra.
          token = (await openCart()).token;
          storeCartToken(token);
        }

        return addCartItem(token, variantId, quantity);
      }),
    [apply]
  );

  const setQuantity = useCallback(
    (itemId: number, quantity: number) =>
      applyWithToken((token) => setCartItemQuantity(token, itemId, quantity)),
    [applyWithToken]
  );

  const removeItem = useCallback(
    (itemId: number) => applyWithToken((token) => removeCartItem(token, itemId)),
    [applyWithToken]
  );

  const applyDiscount = useCallback(
    (code: string) => applyWithToken((token) => applyDiscountCode(token, code)),
    [applyWithToken]
  );

  const removeDiscount = useCallback(
    () => applyWithToken((token) => removeDiscountCode(token)),
    [applyWithToken]
  );

  const requiresTaxId = cart?.requiresTaxId ?? false;

  const checkout = useCallback(
    async (form: CheckoutForm): Promise<CheckoutOutcome> => {
      const token = readCartToken();
      if (!token) return { ok: false, failure: 'gone', detail: null };

      setBusy(true);

      try {
        const order = await checkoutCart(token, form, requiresTaxId);

        // El servidor consume el carrito al convertirlo: su token deja de servir
        // en el mismo momento. Se borra aqui y no mas tarde, porque el siguiente
        // `GET /api/cart/` responderia `404` para siempre.
        clearCartToken();
        setCart(null);
        return { ok: true, order };
      } catch (cause: unknown) {
        const failure = classifyFailure(cause);

        // Un rechazo no consume nada: con la bolsa vacia o el documento mal
        // formado, el servidor revierte y el token sigue sirviendo.
        if (failure === 'gone') {
          clearCartToken();
          setCart(null);
        }

        console.error('[api] checkout:', cause);
        return { ok: false, failure, detail: failureDetail(cause) };
      } finally {
        setBusy(false);
      }
    },
    [requiresTaxId]
  );

  const value = useMemo<BagValue>(
    () => ({
      status,
      cart,
      count: itemCount(cart),
      loadFailure,
      busy,
      addItem,
      setQuantity,
      removeItem,
      applyDiscount,
      removeDiscount,
      checkout,
    }),
    [
      status,
      cart,
      loadFailure,
      busy,
      addItem,
      setQuantity,
      removeItem,
      applyDiscount,
      removeDiscount,
      checkout,
    ]
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag(): BagValue {
  const context = useContext(BagContext);
  if (!context) {
    throw new Error('useBag() requiere que el arbol este dentro de <CartProvider>.');
  }
  return context;
}
