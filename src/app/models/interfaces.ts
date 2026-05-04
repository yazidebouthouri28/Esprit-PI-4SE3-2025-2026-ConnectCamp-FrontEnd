// ========== PRODUCT MANAGEMENT (CATALOGUE) ==========
export interface Product {
  id: number;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  rentalPrice?: number;
  compareAtPrice?: number;
  sku: string;
  categoryId: number;
  categoryName: string;
  tags: string[];
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  inStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  rentalAvailable: boolean;
  rentalDuration?: string;
  depositAmount?: number;
  maxRentalDays?: number;
  loyaltyPoints: number;
  rating: number;
  reviews: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  discount?: number;
  specs?: string[];
}

export interface RentalProduct extends Product {
  rentalPrice: number;
  rentalDuration: string;
  depositAmount: number;
  maxRentalDays: number;
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
  city: string;
  country: string;
  phone?: string;
  email?: string;
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
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  type: 'purchase' | 'rental';
  totalAmount: number;
  items: OrderItem[];
  rentalStartDate?: string;
  rentalEndDate?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface OrderItem {
  productId?: number;
  productName: string;
  quantity: number;
  price: number;
  type?: 'purchase' | 'rental';
  rentalDays?: number;
  image?: string;
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

// ========== CLIENT/CUSTOMER ==========
export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  type: 'purchase' | 'rental';
  rentalDays?: number;
}

export interface WalletTransaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface CustomerOrder {
  id: number;
  orderDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: CartItem[];
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  walletBalance: number;
  loyaltyPoints: number;
  createdAt: string;
}

// ========== RENTALS ==========
export interface Rental {
  id: string;
  productId: number;
  productName: string;
  customerName: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
  status: 'active' | 'overdue' | 'completed' | 'cancelled';
  totalCost: number;
  depositAmount: number;
}

// ========== SETTINGS ==========
export interface SellerSettings {
  stockAlerts: boolean;
  orderAlerts: boolean;
  rentalReminders: boolean;
  emailReports: boolean;
  globalThreshold: number;
  autoRestockThreshold: number;
  defaultRentalDays: number;
  defaultDepositPercent: number;
  lateFeePerDay: number;
}
