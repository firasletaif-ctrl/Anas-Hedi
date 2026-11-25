export type Category = 'airpods' | 'bracelets' | 'montres' | 'accessoires';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  discountPercent: number;
  stock: number;
  active: number;
  image: string;
  badge?: string;
  sku?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'En attente' | 'Expédiée' | 'Livrée' | 'Annulée';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  promoCode?: string;
  discountAmount?: number;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  active: number;
}
