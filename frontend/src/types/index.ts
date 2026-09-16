export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category_id?: number | null;
  category: string;
  price: number;
  stock_quantity: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  category_info?: Category;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  email: string;
  address?: string | null;
  orders_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  user_id: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  user?: User;
  items?: OrderItem[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: PaginationMeta;
}

export interface DashboardMetrics {
  total_customers: number;
  total_products: number;
  total_orders: number;
  total_sales: number;
  low_stock_count: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  low_stock_products: Product[];
  recent_orders: Order[];
  sales_chart: { date: string; total: string; count: number }[];
}
