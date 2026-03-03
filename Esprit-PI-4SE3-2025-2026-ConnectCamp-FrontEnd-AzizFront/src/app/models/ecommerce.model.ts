// ========== PRODUCT MANAGEMENT (CATALOGUE) ==========
export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  // Rental fields (mapped from backend isRentable / rentalPricePerDay)
  rentalAvailable?: boolean;
  rentalPrice?: number;
  depositAmount?: number;
  maxRentalDays?: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ========== INVENTORY MANAGEMENT (STOCKS) ==========
export interface Inventory {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  locationCode: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  lastRestockedAt?: string;
}

export interface StockMovement {
  id: string;
  productId?: string;
  productName: string;
  warehouseId?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  locationCode?: string;
  location?: string;
  date?: string;
  performedBy?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

// ========== CATEGORIES ==========
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories?: Subcategory[];
  productCount?: number;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
}

// ========== ORDERS ==========
export interface Order {
  id: string;
  customerName: string;
  customerEmail?: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    country?: string;
  };
  orderDate: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
}

export interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
}

// ========== RENTALS ==========
export interface Rental {
  id: string;
  productId?: string;
  productName: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  depositAmount: number;
  status: string;
  daysLeft?: number;
}

export interface ExtendRentalDto {
  additionalDays: number;
}

// ========== DTOs (frontend → service calls) ==========
export interface CreateProductDto {
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  categoryId?: string;
  sellerId?: number;
  tags?: string[];
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  isRentable?: boolean;
  rentalPricePerDay?: number;
  stockQuantity?: number;
  // kept for backwards compat with old form fields
  rentalAvailable?: boolean;
  rentalPrice?: number;
  depositAmount?: number;
  maxRentalDays?: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  icon?: string;
}

export interface CreateStockMovementDto {
  productId: string;
  warehouseId?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  locationCode?: string;
}

export interface CreateWarehouseDto {
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

// ========== CART ==========
export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
  type: 'PURCHASE' | 'RENTAL';
  rentalDays?: number;
}

// ========== DASHBOARD ==========
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
