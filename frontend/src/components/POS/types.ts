// Shared types for POS components
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  category_id?: number | null;
  category?: { id: number; name: string };
  image_url?: string | null;
  reorder_level?: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface CartItem {
  product_id: number;
  name: string;
  sku: string;
  unit_price: number;
  quantity: number;
}
