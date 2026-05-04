import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import {
  ReservationRecord,
  ReservationService,
} from '../../services/reservation.service';
import {
  CartItem,
  Wallet,
  WalletTransaction,
  Order,
  CreateOrderDto,
} from '../../models/api.models';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css'],
})
export class ClientComponent implements OnInit {
  Math = Math;

  activeTab = 'wallet';
  isLoading = false;
  errorMessage = '';

  menuItems = [
    { id: 'wallet', label: 'My Wallet', icon: '💰', badge: '' },
    { id: 'orders', label: 'My Orders', icon: '📦', badge: '' },
    { id: 'reservations', label: 'My Reservations', icon: '🏕️', badge: '' },
    { id: 'cart', label: 'Shopping Cart', icon: '🛒', badge: '0' },
    { id: 'profile', label: 'Profile', icon: '⚙️', badge: '' },
  ];

  // Customer Info
  customerName = '';
  customerEmail = '';
  customerPhone = '';
  customerCountry = '';
  customerAddress = '';

  // Wallet
  walletBalance = 0;
  loyaltyPoints = 0;
  walletTransactions: WalletTransaction[] = [];

  // Orders
  customerOrders: Order[] = [];
  orderStatuses = ['All', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  selectedOrderStatus = 'All';

  // Reservations
  reservations: ReservationRecord[] = [];
  reservationsLoading = false;
  reservationActionMessage = '';

  // Cart
  cartItems: CartItem[] = [];
  selectedPaymentMethod: 'wallet' | 'card' = 'wallet';
  shippingCost = 15.0;
  shippingAddress = '';

  // Modals
  showAddFundsModal = false;
  showWithdrawModal = false;
  showTransferModal = false;
  showCheckoutSuccess = false;
  showReservationDetailsModal = false;
  selectedReservation: ReservationRecord | null = null;
  addFundsAmount = 100;
  fundingSource: 'CARD' | 'BANK_TRANSFER' = 'CARD';
  latestOrderId = '';
  lastEarnedPoints = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private walletService: WalletService,
    private orderService: OrderService,
    private authService: AuthService,
    private accountProfile: AccountProfileService,
    private notificationService: NotificationService,
    private apiService: ApiService,
    private reservationService: ReservationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load user info
    const user = this.authService.getCurrentUser();
    if (user) {
      this.customerName = user.name;
      this.customerEmail = user.email;
      this.customerPhone = user.phone || '';
      this.customerCountry = user.country || '';
      this.customerAddress = user.address || '';
    }

    // Check route data for default tab
    const routeData = this.route.snapshot.data;
    if (routeData['defaultTab']) {
      this.activeTab = routeData['defaultTab'];
    }

    // Handle query params for tab
    this.route.queryParams.subscribe((params) => {
      if (params['tab']) this.activeTab = params['tab'];
    });

    // Subscribe to cart updates
    this.cartService.cart$.subscribe((items) => {
      this.cartItems = items;
      this.updateCartBadge();
    });

    // Load data
    this.loadWallet();
    this.loadOrders();
    this.loadReservations();
  }

  selectTab(tabId: string, event?: MouseEvent): void {
    console.log('User clicked tab:', tabId);
    if (tabId === 'profile') {
      this.goToProfile();
      return;
    }
    
    // Explicitly update and force change detection
    this.activeTab = tabId;
    this.cdr.detectChanges();
    console.log('activeTab is now:', this.activeTab);
    
    // Reload data when switching tabs
    if (tabId === 'reservations') {
      this.loadReservations();
    } else if (tabId === 'orders') {
      this.loadOrders();
    } else if (tabId === 'wallet') {
      this.loadWallet();
    }
  }

  loadWallet() {
    const user = this.authService.getCurrentUser();
    const userId = user?.id && /^\d+$/.test(String(user.id)) ? Number(user.id) : null;
    if (!userId) return;

    this.walletService.getWalletByUserId(userId).subscribe({
      next: (wallet) => {
        this.walletBalance = wallet?.balance ?? 0;
        this.loyaltyPoints = (wallet as any)?.loyaltyPoints ?? 0;
      },
      error: () => {
        this.walletBalance = 0;
        this.loyaltyPoints = 0;
      },
    });

    this.walletService.getTransactions(userId).subscribe({
      next: (transactions) => (this.walletTransactions = transactions || []),
      error: () => (this.walletTransactions = []),
    });
  }

  loadOrders() {
    this.orderService.getMyOrders().subscribe({
      next: (orders) => (this.customerOrders = orders),
      error: () => {
        this.orderService.getAll().subscribe({
          next: (orders) => (this.customerOrders = orders),
          error: () => (this.customerOrders = []),
        });
      },
    });
  }

  loadReservations() {
    console.log('loadReservations() triggered');
    const user = this.authService.getCurrentUser();
    const userId = user?.id && /^\d+$/.test(String(user.id)) ? Number(user.id) : null;
    
    if (!userId) {
      console.warn('loadReservations: Invalid or missing userId, returning empty array.', user);
      this.reservations = [];
      return;
    }

    this.reservationsLoading = true;
    console.log('Fetching reservations for userId:', userId);
    
    this.reservationService.getReservationsByUser(userId).subscribe({
      next: (rows) => {
        console.log('Reservations loaded successfully. Count:', rows?.length);
        this.reservations = rows;
        this.reservationsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load reservations:', err);
        this.reservations = [];
        this.reservationsLoading = false;
      }
    });
  }

  get cartSubtotal(): number {
    return this.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }

  get cartTax(): number {
    return this.cartSubtotal * 0.1;
  }

  get cartTotal(): number {
    return this.cartSubtotal + this.shippingCost + this.cartTax;
  }

  get filteredOrders(): Order[] {
    if (this.selectedOrderStatus === 'All') return this.customerOrders;
    return this.customerOrders.filter(
      (o) => o.status === this.selectedOrderStatus,
    );
  }

  canCancelReservation(row: ReservationRecord): boolean {
    if (!row || String(row.status || '').toUpperCase() === 'CANCELLED')
      return false;
    if (!row.createdAt) return false;
    const createdAt = new Date(row.createdAt);
    if (Number.isNaN(createdAt.getTime())) return false;
    return Date.now() - createdAt.getTime() <= 5 * 60 * 60 * 1000;
  }

  cancelReservation(row: ReservationRecord) {
    const user = this.authService.getCurrentUser();
    const userId =
      user?.id && /^\d+$/.test(String(user.id)) ? Number(user.id) : null;
    if (!userId || !row?.id) return;
    this.reservationService
      .cancelReservationByUser(
        Number(row.id),
        userId,
        'Cancelled by customer from dashboard',
      )
      .subscribe({
        next: () => {
          this.reservationActionMessage = 'Reservation cancelled successfully.';
          this.loadReservations();
        },
        error: (err) => {
          this.reservationActionMessage =
            err?.error?.message ||
            'Cancellation is only allowed within 5 hours.';
        },
      });
  }

  payNowReservation(row: ReservationRecord) {
    const user = this.authService.getCurrentUser();
    const userId = user?.id && /^\d+$/.test(String(user.id)) ? Number(user.id) : null;
    if (!userId || !row?.id) return;
    this.reservationService.payNowHardcoded(Number(row.id), userId).subscribe({
      next: () => {
        this.reservationActionMessage = 'Payment completed (hardcoded).';
        this.loadReservations();
      },
      error: (err) => {
        this.reservationActionMessage = err?.error?.message || 'Unable to process payment.';
      }
    });
  }

  viewReservationDetails(row: ReservationRecord) {
    this.selectedReservation = row;
    this.showReservationDetailsModal = true;
  }

  closeReservationDetailsModal() {
    this.showReservationDetailsModal = false;
    this.selectedReservation = null;
  }

  updateCartBadge() {
    const cartMenuItem = this.menuItems.find((m) => m.id === 'cart');
    if (cartMenuItem) {
      cartMenuItem.badge =
        this.cartItems.length > 0 ? this.cartItems.length.toString() : '';
    }
  }

  get customerAvatar(): string {
    return (
      this.accountProfile.resolveStoredImageUrl(
        this.authService.getCurrentUser()?.avatar,
      ) || ''
    );
  }

  get customerInitials(): string {
    return this.accountProfile.initialsFromName(
      this.customerName || this.customerEmail || 'Client',
      'CC',
    );
  }

  goToAccountSettings() {
    this.router.navigate(['/settings']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  updateQuantity(index: number, change: number) {
    const item = this.cartItems[index];
    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      this.removeFromCart(index);
    } else {
      this.cartService.updateQuantity(item.productId, newQuantity).subscribe();
    }
  }

  removeFromCart(index: number) {
    const item = this.cartItems[index];
    this.cartService.removeFromCart(item.productId).subscribe();
  }

  openAddFundsModal() {
    this.showAddFundsModal = true;
    this.addFundsAmount = 100;
    this.fundingSource = 'CARD';
  }

  confirmAddFunds() {
    if (this.addFundsAmount <= 0) {
      alert('⚠️ Please enter a valid amount');
      return;
    }

    this.isLoading = true;
    this.walletService
      .addFunds({
        amount: this.addFundsAmount,
        source: this.fundingSource,
      })
      .subscribe({
        next: (wallet) => {
          this.walletBalance = wallet.balance;
          this.loyaltyPoints = wallet.loyaltyPoints;
          alert(
            `✅ Successfully added $${this.addFundsAmount} to your wallet!`,
          );
          this.showAddFundsModal = false;
          this.isLoading = false;
          this.loadWallet();
        },
        error: (err) => {
          this.isLoading = false;
          alert('❌ Failed to add funds: ' + (err.message || 'Unknown error'));
        },
      });
  }

  checkout() {
    if (this.cartItems.length === 0) {
      alert('⚠️ Your cart is empty');
      return;
    }

    if (!this.shippingAddress) {
      alert('⚠️ Please enter a shipping address');
      return;
    }

    if (
      this.selectedPaymentMethod === 'wallet' &&
      this.walletBalance < this.cartTotal
    ) {
      alert(
        '⚠️ Insufficient wallet balance. Please add funds or choose card payment.',
      );
      return;
    }

    const orderData: CreateOrderDto = {
      items: this.cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        type: item.type,
        rentalDays: item.rentalDays,
      })),
      shippingAddress: this.shippingAddress,
      paymentMethod:
        this.selectedPaymentMethod === 'wallet' ? 'WALLET' : 'CARD',
    };

    this.isLoading = true;
    this.orderService.create(orderData).subscribe({
      next: (order: any) => {
        this.latestOrderId = order.id;
        this.lastEarnedPoints = Math.floor(this.cartTotal);
        this.showCheckoutSuccess = true;
        this.isLoading = false;
        this.cartService.clearCart().subscribe();
        this.loadWallet();
        this.loadOrders();
      },
      error: (err: any) => {
        this.isLoading = false;
        alert('❌ Checkout failed: ' + (err.message || 'Unknown error'));
      },
    });
  }

  closeCheckoutSuccess() {
    this.showCheckoutSuccess = false;
    this.activeTab = 'orders';
  }

  viewOrderDetails(order: Order) {
    alert(
      `Order #${order.id}\nStatus: ${order.status}\nTotal: $${order.totalAmount.toFixed(2)}\nItems: ${order.items.length}`,
    );
  }

  trackOrder(order: Order) {
    if (order.trackingNumber) {
      alert(
        `📍 Tracking Order #${order.id}\nTracking Number: ${order.trackingNumber}`,
      );
    } else {
      alert('Tracking information not yet available.');
    }
  }

  cancelOrder(order: Order) {
    if (confirm(`Are you sure you want to cancel Order #${order.id}?`)) {
      this.orderService.cancel(order.id).subscribe({
        next: () => {
          alert(`✅ Order #${order.id} has been cancelled.`);
          this.loadOrders();
        },
        error: (err) =>
          alert(
            '❌ Failed to cancel order: ' + (err.message || 'Unknown error'),
          ),
      });
    }
  }

  downloadInvoice(order: Order) {
    alert(
      `📄 Invoice for Order #${order.id} would be downloaded.\n(Feature coming soon)`,
    );
  }

  getOrderStatusBadge(status: string): string {
    const badges: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  getTransactionIcon(type: string): string {
    return type === 'CREDIT' ? '📥' : '📤';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getStatusBadge(status: string): string {
    const badges: { [key: string]: string } = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  isCredit(type: string): boolean {
    return type === 'CREDIT';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart().subscribe(() => {
        alert('🛒 Cart cleared');
      });
    }
  }

  saveProfile() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      alert('❌ Not logged in');
      return;
    }

    this.isLoading = true;

    const updatedUser = {
      name: this.customerName,
      email: this.customerEmail,
      phone: this.customerPhone,
      country: this.customerCountry,
      address: this.customerAddress,
    };

    this.apiService.update('users', Number(user.id), updatedUser).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        alert('✅ Profile updated successfully!');

        // Update stored user in localStorage
        const updatedStoredUser = { ...user, ...updatedUser };
        localStorage.setItem('current_user', JSON.stringify(updatedStoredUser));
      },
      error: (err: any) => {
        this.isLoading = false;
        alert(
          '❌ Failed to update profile: ' + (err.message || 'Unknown error'),
        );
      },
    });
  }
}
