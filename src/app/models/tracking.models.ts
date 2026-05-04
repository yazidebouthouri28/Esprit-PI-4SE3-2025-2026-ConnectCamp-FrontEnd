// ========== INVOICE ==========

export interface InvoiceLineItem {
  productName: string;
  productSku?: string;
  productThumbnail?: string;
  quantity: number;
  unit: string;
  unitPriceHT: number;
  taxRate: number;
  taxAmount: number;
  totalPriceHT: number;
  totalPriceTTC: number;
}

export interface InvoiceDTO {
  id: number;
  invoiceNumber: string;
  orderNumber?: string;
  issueDate: string;         // LocalDate → ISO string
  dueDate?: string;
  paidAt?: string;
  company?: Record<string, any>;
  customerId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress?: string;
  items: InvoiceLineItem[];
  subtotalHT: number;
  totalDiscount: number;
  totalTax: number;
  totalShipping: number;
  totalTTC: number;
  paymentStatus: string;
  paymentMethod?: string;
  pdfUrl?: string;
  qrCodeUrl?: string;
  verificationUrl?: string;
  notes?: string;
  legalNotice?: string;
  createdAt?: string;
}

// ========== TRACKING ==========

export type TrackingStatus =
  | 'NOT_SHIPPED'
  | 'LABEL_CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'AT_PICKUP_POINT'
  | 'DELIVERED'
  | 'DELIVERY_ATTEMPTED'
  | 'EXCEPTION'
  | 'RETURNED_TO_SENDER';

export interface TrackingEvent {
  timestamp: string;       // LocalDateTime → ISO string
  status: TrackingStatus;
  location: string;
  description: string;
  carrierStatus?: string;
}

export interface CurrentTrackingStatus {
  code: TrackingStatus;
  label: string;
  severity: string;        // e.g. 'success', 'warning', 'error', 'info'
  timestamp: string;
  location: string;
  description: string;
}

export interface EstimatedDelivery {
  minDate?: string;
  maxDate?: string;
  isExpired: boolean;
  daysRemaining: number;
}

export interface ShippingInfo {
  recipientName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface TrackingResponse {
  orderId: number;
  orderNumber: string;
  trackingNumber?: string;
  carrierName?: string;
  carrierWebsite?: string;
  carrierTrackingUrl?: string;
  currentStatus: CurrentTrackingStatus;
  estimatedDelivery?: EstimatedDelivery;
  events: TrackingEvent[];
  shippingInfo: ShippingInfo;
  lastUpdated: string;
}
