import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { WalletService } from '../../services/wallet.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { AccountProfileService } from '../../services/account-profile.service';
import { NotificationService } from '../../services/notification.service';
import { ApiService } from '../../services/api.service';
import { GeolocationService } from '../../services/geolocation.service';
import { PriceCalculationService, CartTotals } from '../../services/price-calculation.service';
import { InvoiceService } from '../../services/invoice.service';
import { TrackingService } from '../../services/tracking.service';
import { CountrySelectorComponent } from '../country-selector/country-selector.component';
import { OrderTrackingComponent } from '../order-tracking/order-tracking.component';
import { CartItem, Wallet, WalletTransaction, Order, CreateOrderDto } from '../../models/api.models';
import { PromotionService } from '../../modules/services/services/promotion.service';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CountrySelectorComponent,
    OrderTrackingComponent,
  ],
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css']
})
export class ClientComponent implements OnInit {
  Math = Math;

  activeTab = 'wallet';
  isLoading = false;
  errorMessage = '';

  menuItems = [
    { id: 'wallet', label: 'My Wallet',     icon: '💰', badge: '' },
    { id: 'orders', label: 'My Orders',     icon: '📦', badge: '' },
    { id: 'cart',   label: 'Shopping Cart', icon: '🛒', badge: '0' },
    { id: 'profile',label: 'Profile',       icon: '⚙️', badge: '' }
  ];

  // Customer Info
  customerName    = '';
  customerEmail   = '';
  customerPhone   = '';
  customerCountry = '';
  customerAddress = '';
  shippingAddress = '';

  // Wallet
  walletBalance: number = 0;
  loyaltyPoints: number = 0;
  walletTransactions: WalletTransaction[] = [];

  // Orders
  customerOrders: Order[] = [];
  orderStatuses = ['All', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  selectedOrderStatus = 'All';

  // Cart
  cartItems: CartItem[] = [];
  selectedPaymentMethod: 'wallet' | 'card' = 'wallet';

  // Promo code
  promoCode = '';
  promoLoading = false;
  promoResult: { valide: boolean; message: string; reduction?: number; montantFinal?: number; promotionName?: string } | null = null;

  get promoDiscount(): number {
    return this.promoResult?.valide ? (this.promoResult.reduction ?? 0) : 0;
  }

  // Modals
  showAddFundsModal    = false;
  showWithdrawModal    = false;
  showTransferModal    = false;
  showCheckoutSuccess  = false;
  addFundsAmount       = 100;
  fundingSource: 'CARD' | 'BANK_TRANSFER' = 'CARD';
  latestOrderId     = '';
  lastEarnedPoints  = 0;

  // ── Tracking modal ──────────────────────────────────
  showTrackingModal = false;
  trackingOrderId: number | string = '';

  // ── Invoice download state ──────────────────────────
  downloadingInvoiceId: number | string | null = null;

  // Geo & pricing
  currentCountryCode = 'FR';
  currencySymbol = '€';
  private cartTotals: CartTotals | null = null;
  isCalculatingPrices = false;

  constructor(
    private route:               ActivatedRoute,
    private router:              Router,
    private cartService:         CartService,
    private walletService:       WalletService,
    private orderService:        OrderService,
    private authService:         AuthService,
    private accountProfile:      AccountProfileService,
    private notificationService: NotificationService,
    private apiService:          ApiService,
    private geoService:          GeolocationService,
    private priceService:        PriceCalculationService,
    private invoiceService:      InvoiceService,
    private trackingService:     TrackingService,
    private promotionService:    PromotionService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.customerName    = user.name    || '';
      this.customerEmail   = user.email   || '';
      this.customerPhone   = user.phone   || '';
      this.customerCountry = user.country || '';
      this.customerAddress = user.address || '';
      this.shippingAddress = user.address || '';
    }

    const routeData = this.route.snapshot.data;
    if (routeData['defaultTab']) this.activeTab = routeData['defaultTab'];

    this.route.queryParams.subscribe(params => {
      if (params['tab']) this.activeTab = params['tab'];
    });

    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.updateCartBadge();
      this.recalculateCartPrices();
    });

    this.loadWallet();
    this.loadOrders();

    this.geoService.location$.subscribe(loc => {
      this.currentCountryCode = loc.countryCode;
      this.currencySymbol = this.geoService.getCurrencyForCountry(loc.countryCode).symbol;
      this.recalculateCartPrices();
    });

    this.geoService.detectLocation().subscribe();
  }

  // ── Data loading ──────────────────────────────────────

  loadWallet() {
    this.walletService.getMyWallet().subscribe({
      next: (wallet) => {
        this.walletBalance = Number(wallet?.balance) || 0;
        this.loyaltyPoints = Number(wallet?.loyaltyPoints) || 0;
      },
      error: () => {
        this.walletService.getBalance().subscribe({
          next: (data) => {
            this.walletBalance = Number(data?.balance) || 0;
            this.loyaltyPoints = Number(data?.loyaltyPoints) || 0;
          },
          error: () => { this.walletBalance = 0; this.loyaltyPoints = 0; }
        });
      }
    });

    this.walletService.getTransactions().subscribe({
      next: (transactions) => this.walletTransactions = transactions ?? [],
      error: ()            => this.walletTransactions = []
    });
  }

  loadOrders() {
    this.orderService.getMyOrders().subscribe({
      next: (orders) => this.customerOrders = orders ?? [],
      error: () => {
        this.orderService.getAll().subscribe({
          next: (orders) => this.customerOrders = orders ?? [],
          error: ()       => this.customerOrders = []
        });
      }
    });
  }

  // ── Cart computed ─────────────────────────────────────

  get cartSubtotal(): number {
    if (this.cartTotals) return this.cartTotals.subtotal;
    return this.cartItems?.reduce(
      (sum, item) => sum + ((item.price ?? 0) * (item.quantity ?? 1)), 0
    ) ?? 0;
  }

  get cartTax(): number {
    if (this.cartTotals) return this.cartTotals.tax;
    const rate = this.geoService.getVatRateForCountry(this.currentCountryCode);
    return this.cartSubtotal * (rate / 100);
  }

  get cartShipping(): number  { return this.cartTotals?.shipping ?? 0; }
  get cartCustoms(): number   { return this.cartTotals?.customs  ?? 0; }

  get cartTotal(): number {
    const baseTotal = this.cartTotals?.total 
      ?? (this.cartSubtotal + this.cartTax + this.cartShipping + this.cartCustoms);
    return Math.max(0, baseTotal - this.promoDiscount);
  }

  get currentVatRate(): number {
    return this.geoService.getVatRateForCountry(this.currentCountryCode);
  }

  applyPromo(): void {
    const code = (this.promoCode || '').trim();
    if (!code) {
      this.promoResult = { valide: false, message: 'Veuillez entrer un code promo.' };
      return;
    }
    this.promoLoading = true;
    this.promoResult = null;
    this.promotionService.validateCode(code, this.cartSubtotal).subscribe({
      next: (res) => {
        this.promoResult = res;
        this.promoLoading = false;
      },
      error: (err) => {
        this.promoResult = { valide: false, message: err?.error?.message || 'Erreur lors de la vérification du code.' };
        this.promoLoading = false;
      }
    });
  }

  removePromo(): void {
    this.promoCode = '';
    this.promoResult = null;
  }

  get filteredOrders(): Order[] {
    if (this.selectedOrderStatus === 'All') return this.customerOrders;
    return this.customerOrders.filter(o => o.status === this.selectedOrderStatus);
  }

  // ── UI helpers ────────────────────────────────────────

  updateCartBadge() {
    const item = this.menuItems.find(m => m.id === 'cart');
    if (item) item.badge = this.cartItems.length > 0 ? this.cartItems.length.toString() : '';
  }

  get customerAvatar(): string {
    return this.accountProfile.resolveStoredImageUrl(
      this.authService.getCurrentUser()?.avatar
    ) || '';
  }

  get customerInitials(): string {
    return this.accountProfile.initialsFromName(
      this.customerName || this.customerEmail || 'Client', 'CC'
    );
  }

  goToAccountSettings() { this.router.navigate(['/settings']); }

  getImageUrl(imagePath: string | undefined): string {
    return this.cartService.getImageUrl(imagePath);
  }

  // ── Cart actions ──────────────────────────────────────

  updateQuantity(index: number, change: number) {
    const item = this.cartItems[index];
    const newQty = (item.quantity || 1) + change;
    if (newQty <= 0) this.removeFromCart(index);
    else this.cartService.updateQuantity(item.productId, newQty).subscribe();
  }

  removeFromCart(index: number) {
    const item = this.cartItems[index];
    this.cartService.removeFromCart(item.productId).subscribe();
  }

  clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart().subscribe(() => alert('🛒 Cart cleared'));
    }
  }

  // ── Wallet actions ────────────────────────────────────

  openAddFundsModal() {
    this.showAddFundsModal = true;
    this.addFundsAmount    = 100;
    this.fundingSource     = 'CARD';
  }

  confirmAddFunds() {
    if (this.addFundsAmount <= 0) { alert('⚠️ Please enter a valid amount'); return; }
    this.isLoading = true;
    this.walletService.addFunds({ amount: this.addFundsAmount, source: this.fundingSource }).subscribe({
      next: (wallet) => {
        this.walletBalance     = Number(wallet?.balance) || 0;
        this.loyaltyPoints     = Number(wallet?.loyaltyPoints) || 0;
        this.showAddFundsModal = false;
        this.isLoading         = false;
        alert(`✅ Successfully added $${this.addFundsAmount} to your wallet!`);
        this.loadWallet();
      },
      error: (err) => {
        this.isLoading = false;
        alert('❌ Failed to add funds: ' + (err.message || 'Unknown error'));
      }
    });
  }

  // ── Country change ────────────────────────────────────

  onCountryChange(countryCode: string): void {
    this.geoService.setCountry(countryCode);
  }

  // ── Price recalculation ───────────────────────────────

  private recalculateCartPrices(): void {
    if (!this.cartItems?.length) return;
    this.isCalculatingPrices = true;
    const items = this.cartItems.map(item => ({
      productId: Number(item.productId),
      quantity:  item.quantity ?? 1
    }));
    this.priceService.calculateCartTotals(items, this.currentCountryCode).subscribe({
      next: totals => {
        this.cartTotals      = totals;
        this.currencySymbol  = totals.currencySymbol;
        this.isCalculatingPrices = false;
      },
      error: () => { this.cartTotals = null; this.isCalculatingPrices = false; }
    });
  }

  // ── Checkout ──────────────────────────────────────────

  checkout() {
    if (this.cartItems.length === 0) { alert('⚠️ Your cart is empty'); return; }
    if (!this.shippingAddress?.trim()) { alert('⚠️ Please enter a shipping address'); return; }
    if (this.selectedPaymentMethod === 'wallet' && this.walletBalance < this.cartTotal) {
      alert('⚠️ Insufficient wallet balance. Please add funds or choose card payment.');
      return;
    }

    const orderData = {
      shippingAddress:    this.shippingAddress.trim(),
      shippingName:       this.customerName    || '',
      shippingPhone:      this.customerPhone   || '',
      shippingCity:       this.customerCountry || '',
      shippingPostalCode: '',
      shippingCountry:    this.currentCountryCode,
      shippingCurrency:   this.currencySymbol,
      paymentMethod:      this.selectedPaymentMethod === 'wallet' ? 'WALLET' : 'CARD',
      items: this.cartItems.map(item => ({
        productId: item.productId, quantity: item.quantity,
        type: item.type, rentalDays: item.rentalDays
      }))
    };

    this.isLoading = true;
    this.orderService.create(orderData).subscribe({
      next: (order: any) => {
        this.latestOrderId       = String(order?.id ?? '');
        this.lastEarnedPoints    = Math.floor(this.cartTotal);
        this.showCheckoutSuccess = true;
        this.isLoading           = false;
        this.cartService.clearCart().subscribe();
        this.loadWallet();
        this.loadOrders();
      },
      error: (err: any) => {
        this.isLoading = false;
        alert('❌ Checkout failed: ' + (err.message || 'Unknown error'));
      }
    });
  }

  closeCheckoutSuccess() {
    this.showCheckoutSuccess = false;
    this.activeTab = 'orders';
  }

  // ── Order actions ─────────────────────────────────────

  viewOrderDetails(order: Order) {
    const total = Number(order?.totalAmount ?? 0).toFixed(2);
    const count = order?.items?.length ?? 0;
    alert(`Order #${order.id}\nStatus: ${order.status}\nTotal: $${total}\nItems: ${count}`);
  }

  trackOrder(order: Order) {
    this.trackingOrderId  = order.id;
    this.showTrackingModal = true;
  }

  closeTrackingModal() {
    this.showTrackingModal = false;
    this.trackingOrderId  = '';
  }

  cancelOrder(order: Order) {
    if (confirm(`Are you sure you want to cancel Order #${order.id}?`)) {
      this.orderService.cancel(String(order.id)).subscribe({
        next: ()     => { alert(`✅ Order #${order.id} cancelled.`); this.loadOrders(); },
        error: (err) => alert('❌ Failed to cancel: ' + (err.message || 'Unknown error'))
      });
    }
  }

  downloadInvoice(order: Order) {
    this.downloadingInvoiceId = order.id;

    this.invoiceService.downloadInvoicePdf(order.id).subscribe({
      next: (blob: Blob) => {
        this.invoiceService.triggerDownload(blob, `invoice-order-${order.id}.pdf`);
        this.downloadingInvoiceId = null;
      },
      error: (err) => {
        this.downloadingInvoiceId = null;
        alert('❌ Invoice not available yet. The invoice is generated on first request — please try again in a moment.');
        console.error('Invoice download error:', err);
      }
    });
  }

  // ── Badge / status helpers ────────────────────────────

  getOrderStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'PENDING':    'bg-yellow-100 text-yellow-800',
      'PROCESSING': 'bg-blue-100 text-blue-800',
      'SHIPPED':    'bg-purple-100 text-purple-800',
      'DELIVERED':  'bg-green-100 text-green-800',
      'CANCELLED':  'bg-red-100 text-red-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  }

  getTransactionIcon(type: string): string { return type === 'CREDIT' ? '📥' : '📤'; }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'COMPLETED': 'bg-green-100 text-green-800',
      'PENDING':   'bg-yellow-100 text-yellow-800',
      'FAILED':    'bg-red-100 text-red-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  }

  isCredit(type: string): boolean { return type === 'CREDIT'; }

  // ── Auth ──────────────────────────────────────────────

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // ── Profile ───────────────────────────────────────────

  saveProfile() {
    const user = this.authService.getCurrentUser();
    if (!user) { alert('❌ Not logged in'); return; }

    this.isLoading = true;
    const updatedUser = {
      name:    this.customerName,
      email:   this.customerEmail,
      phone:   this.customerPhone,
      country: this.customerCountry,
      address: this.customerAddress
    };

    this.apiService.update('users', Number(user.id), updatedUser).subscribe({
      next: (_res: any) => {
        this.isLoading = false;
        alert('✅ Profile updated successfully!');
        localStorage.setItem('current_user', JSON.stringify({ ...user, ...updatedUser }));
      },
      error: (err: any) => {
        this.isLoading = false;
        alert('❌ Failed to update profile: ' + (err.message || 'Unknown error'));
      }
    });
  }
}
