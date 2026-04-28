export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  status: 'active' | 'draft' | 'archived';
  description?: string;
}

export interface CartItem {
  product: Product;
}

export interface Settings {
  whatsapp: string;
  shippingCost: number;
  currency: string;
  businessName: string;
  taxRate: number;
}
