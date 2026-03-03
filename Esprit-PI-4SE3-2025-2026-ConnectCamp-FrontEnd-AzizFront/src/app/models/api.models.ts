// ========== API Response Models ==========
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ========== AUTH ==========

// ✅ Named union — import UserRole wherever you need a typed role
export type UserRole =
  | 'CLIENT'
  | 'SELLER'
  | 'ORGANIZER'
  | 'CAMPER'
  | 'SPONSOR'
  | 'ADMIN';

export interface LoginRequest {
  email: string;       // sent to Spring Boot as emailOrUsername
  password: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  country?: string;
  age?: number;
  role: UserRole;           // required & strictly typed
  isSeller?: boolean;
  isBuyer?: boolean;
  storeName?: string;
  avatar?: string;
  bio?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  age?: number;             // Spring Boot field
  loyaltyPoints?: number;
  role: UserRole;           // uses named type — fixes TS2322
  isSeller?: boolean;       // Spring Boot field
  isBuyer?: boolean;        // Spring Boot field
  storeName?: string;       // Spring Boot field
  avatar?: string;
  bio?: string;
  coverImage?: string;
  location?: string;
  status?: 'online' | 'offline' | 'typing';
  createdAt: string;
}

// ========== PRODUCT ==========
export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  categoryId: string;
  categoryName?: string;
  tags: string[];
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  rentalAvailable: boolean;
  rentalPrice?: number;
  depositAmount?: number;
  maxRentalDays?: number;
  sellerId: string;
  stockQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  categoryId: string;
  tags?: string[];
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  rentalAvailable?: boolean;
  rentalPrice?: number;
  depositAmount?: number;
  maxRentalDays?: number;
}

// ========== CATEGORY ==========
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  parentId?: string;
  subcategories?: Category[];
  productCount?: number;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description: string;
  icon?: string;
  parentId?: string;
}

// ========== INVENTORY ==========
export interface Inventory {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  warehouseId: string;
  warehouseName?: string;
  locationCode: string;
  location?: string;
  currentStock: number;
  reservedStock?: number;
  availableStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  lastRestockedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  warehouseId: string;
  locationCode?: string;
  performedBy: string;
  createdAt: string;
}

export interface CreateStockMovementDto {
  productId: string;
  warehouseId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  locationCode?: string;
}

// ========== WAREHOUSE ==========
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateWarehouseDto {
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

// ========== ORDER ==========
export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  sellerId: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  type: 'PURCHASE' | 'RENTAL';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  shippingAddress: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  type: 'PURCHASE' | 'RENTAL';
  rentalDays?: number;
}
export interface CreateOrderDto {
  userId?: number;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  paymentMethod: string;
  notes?: string;
  couponCode?: string;
  // kept for frontend cart use, not sent to backend
  items?: {
    productId: string;
    quantity: number;
    type: 'PURCHASE' | 'RENTAL';
    rentalDays?: number;
  }[];
}

// ========== RENTAL ==========
export interface Rental {
  id: string;
  productId: string;
  productName?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  sellerId: string;
  startDate: string;
  endDate: string;
  daysLeft?: number;
  status: 'ACTIVE' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';
  totalCost: number;
  deposit?: number;
  depositAmount?: number;
  depositReturned?: boolean;
  createdAt: string;
}

export interface ExtendRentalDto {
  additionalDays: number;
}

// ========== WALLET ==========
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  loyaltyPoints: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface AddFundsDto {
  amount: number;
  source: 'CARD' | 'BANK_TRANSFER';
}

// ========== CART ==========
export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  type: 'PURCHASE' | 'RENTAL';
  rentalDays?: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  updatedAt: string;
}
