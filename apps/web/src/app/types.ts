export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  status: 'active' | 'draft' | 'archived';
  description?: string;
}

/**
 * `CartItem` vivia aqui y era el carrito en memoria de `App`: un arreglo de
 * productos que se perdia al recargar y del que se derivaba el total en el
 * cliente. Lo reemplaza el carrito del servidor, cuyas lineas y cuyos importes
 * se declaran en `content/cart.ts` porque los manda la API.
 */
export interface Settings {
  whatsapp: string;
  shippingCost: number;
  currency: string;
  businessName: string;
  taxRate: number;
}
