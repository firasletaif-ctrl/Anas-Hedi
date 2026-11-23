export type Category = 'vetements' | 'technologie';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  stock: number;
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
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}
