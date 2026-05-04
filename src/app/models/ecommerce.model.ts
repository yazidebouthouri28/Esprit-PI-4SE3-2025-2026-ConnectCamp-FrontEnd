// ========== PRODUCT MANAGEMENT (CATALOGUE) ==========
export interface Product {
  id: number;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  categoryId: number;
  categoryName: string;
  tags: string[];
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  convertedPrice?: number;
  originalPriceConverted?: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== INVENTORY MANAGEMENT (STOCKS) ==========
export interface Inventory {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  warehouseId: number;
  warehouseName: string;
  locationCode: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  lastRestockedAt: string;
}

export interface StockMovement {
  id: number;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  location: string;
  date: string;
  performedBy: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
}

// ========== CATEGORIES ==========
export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  subcategories: Subcategory[];
  productCount: number;
}

export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
}

// ========== ORDERS ==========
export interface Order {
  id: number;
  customerName: string;
  orderDate: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  trackingNumber?: string;
  items: OrderItem[];
}

export interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  type?: string;
  rentalDays?: number;
}

export interface CreateOrderDto {
  items: {
    productId: string;
    quantity: number;
    type?: string;
    rentalDays?: number;
  }[];
  shippingAddress:    string;
  shippingName:       string;
  shippingPhone:      string;
  shippingCity:       string;
  shippingPostalCode: string;
  shippingCountry:    string;
  paymentMethod:      string;
  notes?:             string;
  couponCode?:        string;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  totalStock: number;
  stockValue: number;
}

// ========== QUALITY SCORE ==========

export type QualityBadge =
  | 'EXCELLENT'
  | 'GOOD'
  | 'AVERAGE'
  | 'NEEDS_IMPROVEMENT';

export interface QualityScoreBreakdown {
  completenessScore: number;   // 0–25
  mediaScore: number;          // 0–15
  reviewScore: number;         // 0–25
  performanceScore: number;    // 0–20
  sellerScore: number;         // 0–15
}

export interface ProductQualityScoreResponse {
  productId: number;
  productName: string;
  overallScore: number;        // 0–100
  badge: QualityBadge;
  badgeColor: string;          // 'gold' | 'silver' | 'bronze' | 'gray'
  breakdown: QualityScoreBreakdown;
  isActive: boolean;
}
