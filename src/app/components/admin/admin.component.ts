import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  activeSection = 'dashboard';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  private apiUrl = 'http://localhost:8080/api/admin';

  menuItems = [
    { id: 'dashboard',  label: 'Dashboard',  icon: '📊' },
    { id: 'users',      label: 'Users',      icon: '👥' },
    { id: 'products',   label: 'Products',   icon: '📦' },
    { id: 'orders',     label: 'Orders',     icon: '🛒' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'reviews',    label: 'Reviews',    icon: '⭐' },
    { id: 'coupons',    label: 'Coupons',    icon: '🎟️' },
    { id: 'refunds',    label: 'Refunds',    icon: '💸' },
  ];

  // ── Dashboard ──────────────────────────────────────────
  dashboard: any = {};

  // ── Users ───────────────────────────────────────────────
  users: any[]    = [];
  usersTotal      = 0;
  usersPage       = 0;
  usersSize       = 20;
  userSearchQuery = '';

  // ── Products ────────────────────────────────────────────
  products: any[] = [];
  productsTotal   = 0;
  productsPage    = 0;
  productsSize    = 20;
  showPendingOnly = false;

  // ── Orders ──────────────────────────────────────────────
  orders: any[]       = [];
  ordersPage          = 0;
  ordersSize          = 20;
  selectedOrderStatus = '';
  orderStatuses       = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  // ── Categories ──────────────────────────────────────────
  categories: any[]    = [];
  newCategory          = { name: '', slug: '', description: '', isActive: true };
  editingCategory: any = null;

  // ── Reviews ─────────────────────────────────────────────
  pendingReviews: any[] = [];
  reviewsPage           = 0;

  // ── Coupons ─────────────────────────────────────────────
  coupons: any[]     = [];
  couponsPage        = 0;
  showCouponForm     = false;
  editingCoupon: any = null;
  newCoupon = {
    code: '', discountType: 'PERCENTAGE', discountValue: 0,
    minOrderAmount: 0, maxUsageCount: 100,
    startDate: '', expiryDate: '', isActive: true
  };

  // ── Refunds ─────────────────────────────────────────────
  refunds: any[]        = [];
  pendingRefunds: any[] = [];
  refundsPage           = 0;
  selectedRefund: any   = null;
  refundAmount          = 0;
  refundNotes           = '';
  refundRejectReason    = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  // ── Private HTTP wrappers ────────────────────────────────
  // authInterceptor attaches Bearer token automatically — no manual headers needed here

  private buildParams(params?: Record<string, any>): HttpParams {
    let p = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') {
          p = p.set(k, String(v));
        }
      });
    }
    return p;
  }

  private get<T>(path: string, params?: Record<string, any>) {
    return this.http.get<any>(`${this.apiUrl}${path}`, { params: this.buildParams(params) });
  }

  private post<T>(path: string, body: any = {}, params?: Record<string, any>) {
    return this.http.post<any>(`${this.apiUrl}${path}`, body, { params: this.buildParams(params) });
  }

  private put<T>(path: string, body: any = {}, params?: Record<string, any>) {
    return this.http.put<any>(`${this.apiUrl}${path}`, body, { params: this.buildParams(params) });
  }

  private delete<T>(path: string) {
    return this.http.delete<any>(`${this.apiUrl}${path}`);
  }

  // ── UI helpers ───────────────────────────────────────────

  showSuccess(msg: string) {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  showError(msg: string) {
    this.errorMessage = msg;
    setTimeout(() => (this.errorMessage = ''), 4000);
  }

  setSection(section: string) {
    this.activeSection  = section;
    this.successMessage = '';
    this.errorMessage   = '';
    const loaders: Record<string, () => void> = {
      dashboard:  () => this.loadDashboard(),
      users:      () => this.loadUsers(),
      products:   () => this.loadProducts(),
      orders:     () => this.loadOrders(),
      categories: () => this.loadCategories(),
      reviews:    () => this.loadPendingReviews(),
      coupons:    () => this.loadCoupons(),
      refunds:    () => this.loadRefunds(),
    };
    loaders[section]?.();
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      PENDING:    'bg-amber-100 text-amber-700 border-amber-200',
      PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
      SHIPPED:    'bg-indigo-100 text-indigo-700 border-indigo-200',
      DELIVERED:  'bg-emerald-100 text-emerald-600 border-emerald-200',
      CANCELLED:  'bg-red-100 text-red-600 border-red-200',
      COMPLETED:  'bg-emerald-100 text-emerald-600 border-emerald-200',
      REJECTED:   'bg-red-100 text-red-600 border-red-200',
      APPROVED:   'bg-emerald-100 text-emerald-600 border-emerald-200',
    };
    return map[status?.toUpperCase()] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  }

  // ── Dashboard ───────────────────────────────────────────

  loadDashboard() {
    this.isLoading = true;
    this.get('/dashboard').subscribe({
      next:  (res) => { this.dashboard = res.data; this.isLoading = false; },
      error: ()    => { this.showError('Failed to load dashboard'); this.isLoading = false; },
    });
  }

  // ── Users ───────────────────────────────────────────────

  loadUsers() {
    this.isLoading = true;
    const path   = this.userSearchQuery ? '/users/search' : '/users';
    const params: Record<string, any> = { page: this.usersPage, size: this.usersSize };
    if (this.userSearchQuery) params['query'] = this.userSearchQuery;

    this.get(path, params).subscribe({
      next: (res) => {
        this.users      = res.data?.content ?? [];
        this.usersTotal = res.data?.totalElements ?? 0;
        this.isLoading  = false;
      },
      error: () => { this.showError('Failed to load users'); this.isLoading = false; },
    });
  }

  searchUsers() { this.usersPage = 0; this.loadUsers(); }

  suspendUser(userId: string, reason: string) {
    this.post(`/users/${userId}/suspend`, {}, { reason }).subscribe({
      next:  () => { this.showSuccess('User suspended'); this.loadUsers(); },
      error: () => this.showError('Failed to suspend user'),
    });
  }

  activateUser(userId: string) {
    this.post(`/users/${userId}/activate`).subscribe({
      next:  () => { this.showSuccess('User activated'); this.loadUsers(); },
      error: () => this.showError('Failed to activate user'),
    });
  }

  verifySellerUser(userId: string) {
    this.post(`/users/${userId}/verify-seller`).subscribe({
      next:  () => { this.showSuccess('Seller verified'); this.loadUsers(); },
      error: () => this.showError('Failed to verify seller'),
    });
  }

  updateUserRole(userId: string, role: string) {
    this.put(`/users/${userId}/role`, {}, { role }).subscribe({
      next:  () => { this.showSuccess('Role updated'); this.loadUsers(); },
      error: () => this.showError('Failed to update role'),
    });
  }

  // ── Products ────────────────────────────────────────────

  loadProducts() {
    this.isLoading = true;
    const path     = this.showPendingOnly ? '/products/pending' : '/products';
    this.get(path, { page: this.productsPage, size: this.productsSize }).subscribe({
      next: (res) => {
        this.products      = res.data?.content ?? [];
        this.productsTotal = res.data?.totalElements ?? 0;
        this.isLoading     = false;
      },
      error: () => { this.showError('Failed to load products'); this.isLoading = false; },
    });
  }

  approveProduct(productId: string) {
    this.post(`/products/${productId}/approve`).subscribe({
      next:  () => { this.showSuccess('Product approved'); this.loadProducts(); },
      error: () => this.showError('Failed to approve product'),
    });
  }

  rejectProduct(productId: string, reason: string) {
    this.post(`/products/${productId}/reject`, {}, { reason }).subscribe({
      next:  () => { this.showSuccess('Product rejected'); this.loadProducts(); },
      error: () => this.showError('Failed to reject product'),
    });
  }

  toggleFeatured(productId: string) {
    this.post(`/products/${productId}/feature`).subscribe({
      next:  () => { this.showSuccess('Featured toggled'); this.loadProducts(); },
      error: () => this.showError('Failed to toggle featured'),
    });
  }

  deleteProduct(productId: string) {
    if (!confirm('Delete this product permanently?')) return;
    this.delete(`/products/${productId}`).subscribe({
      next:  () => { this.showSuccess('Product deleted'); this.loadProducts(); },
      error: () => this.showError('Failed to delete product'),
    });
  }

  // ── Orders ──────────────────────────────────────────────

  loadOrders() {
    this.isLoading = true;
    const path     = this.selectedOrderStatus
      ? `/orders/status/${this.selectedOrderStatus}`
      : '/orders';
    this.get(path, { page: this.ordersPage, size: this.ordersSize }).subscribe({
      next:  (res) => { this.orders = res.data?.content ?? []; this.isLoading = false; },
      error: ()    => { this.showError('Failed to load orders'); this.isLoading = false; },
    });
  }

  updateOrderStatus(orderId: string, status: string, notes = '') {
    this.put(`/orders/${orderId}/status`, {}, { status, notes }).subscribe({
      next:  () => { this.showSuccess('Order updated'); this.loadOrders(); },
      error: () => this.showError('Failed to update order'),
    });
  }

  updateTracking(orderId: string, trackingNumber: string, carrier = '') {
    if (!trackingNumber.trim()) return;
    this.put(`/orders/${orderId}/tracking`, {}, { trackingNumber, carrier }).subscribe({
      next:  () => { this.showSuccess('Tracking updated'); this.loadOrders(); },
      error: () => this.showError('Failed to update tracking'),
    });
  }

  cancelOrder(orderId: string, reason: string) {
    if (!confirm('Cancel this order?')) return;
    this.post(`/orders/${orderId}/cancel`, {}, { reason }).subscribe({
      next:  () => { this.showSuccess('Order cancelled'); this.loadOrders(); },
      error: () => this.showError('Failed to cancel order'),
    });
  }

  // ── Categories ──────────────────────────────────────────

  loadCategories() {
    this.get('/categories').subscribe({
      next:  (res) => (this.categories = res.data ?? []),
      error: ()    => this.showError('Failed to load categories'),
    });
  }

  createCategory() {
    if (!this.newCategory.name.trim()) return;
    this.post('/categories', this.newCategory).subscribe({
      next: () => {
        this.showSuccess('Category created');
        this.newCategory = { name: '', slug: '', description: '', isActive: true };
        this.loadCategories();
      },
      error: () => this.showError('Failed to create category'),
    });
  }

  saveEditCategory() {
    if (!this.editingCategory) return;
    this.put(`/categories/${this.editingCategory.id}`, this.editingCategory).subscribe({
      next: () => {
        this.showSuccess('Category updated');
        this.editingCategory = null;
        this.loadCategories();
      },
      error: () => this.showError('Failed to update category'),
    });
  }

  deleteCategory(categoryId: string) {
    if (!confirm('Delete this category?')) return;
    this.delete(`/categories/${categoryId}`).subscribe({
      next:  () => { this.showSuccess('Category deleted'); this.loadCategories(); },
      error: () => this.showError('Failed to delete category'),
    });
  }

  // ── Reviews ─────────────────────────────────────────────

  loadPendingReviews() {
    this.get('/reviews/pending', { page: this.reviewsPage, size: 20 }).subscribe({
      next:  (res) => (this.pendingReviews = res.data?.content ?? []),
      error: ()    => this.showError('Failed to load reviews'),
    });
  }

  approveReview(reviewId: string) {
    this.post(`/reviews/${reviewId}/approve`).subscribe({
      next:  () => { this.showSuccess('Review approved'); this.loadPendingReviews(); },
      error: () => this.showError('Failed to approve review'),
    });
  }

  rejectReview(reviewId: string) {
    this.post(`/reviews/${reviewId}/reject`).subscribe({
      next:  () => { this.showSuccess('Review rejected'); this.loadPendingReviews(); },
      error: () => this.showError('Failed to reject review'),
    });
  }

  deleteReview(reviewId: string) {
    if (!confirm('Delete this review?')) return;
    this.delete(`/reviews/${reviewId}`).subscribe({
      next:  () => { this.showSuccess('Review deleted'); this.loadPendingReviews(); },
      error: () => this.showError('Failed to delete review'),
    });
  }

  // ── Coupons ─────────────────────────────────────────────

  loadCoupons() {
    this.get('/coupons', { page: this.couponsPage, size: 20 }).subscribe({
      next:  (res) => (this.coupons = res.data?.content ?? []),
      error: ()    => this.showError('Failed to load coupons'),
    });
  }

  createCoupon() {
    if (!this.newCoupon.code.trim()) return;
    this.post('/coupons', this.newCoupon).subscribe({
      next: () => {
        this.showSuccess('Coupon created');
        this.showCouponForm = false;
        this.newCoupon = {
          code: '', discountType: 'PERCENTAGE', discountValue: 0,
          minOrderAmount: 0, maxUsageCount: 100,
          startDate: '', expiryDate: '', isActive: true
        };
        this.loadCoupons();
      },
      error: () => this.showError('Failed to create coupon'),
    });
  }

  saveEditCoupon() {
    if (!this.editingCoupon) return;
    this.put(`/coupons/${this.editingCoupon.id}`, this.editingCoupon).subscribe({
      next: () => {
        this.showSuccess('Coupon updated');
        this.editingCoupon = null;
        this.loadCoupons();
      },
      error: () => this.showError('Failed to update coupon'),
    });
  }

  toggleCouponStatus(couponId: string) {
    this.post(`/coupons/${couponId}/toggle`).subscribe({
      next:  () => { this.showSuccess('Coupon toggled'); this.loadCoupons(); },
      error: () => this.showError('Failed to toggle coupon'),
    });
  }

  deleteCoupon(couponId: string) {
    if (!confirm('Delete this coupon?')) return;
    this.delete(`/coupons/${couponId}`).subscribe({
      next:  () => { this.showSuccess('Coupon deleted'); this.loadCoupons(); },
      error: () => this.showError('Failed to delete coupon'),
    });
  }

  // ── Refunds ─────────────────────────────────────────────

  loadRefunds() {
    this.get('/refunds', { page: this.refundsPage, size: 20 }).subscribe({
      next:  (res) => (this.refunds = res.data?.content ?? []),
      error: ()    => this.showError('Failed to load refunds'),
    });
    this.get('/refunds/pending', { page: 0, size: 20 }).subscribe({
      next:  (res) => (this.pendingRefunds = res.data?.content ?? []),
      error: ()    => {},
    });
  }

  approveRefund(refundId: string, amount: number, notes = '') {
    this.post(`/refunds/${refundId}/approve`, {}, { amount, notes }).subscribe({
      next: () => {
        this.showSuccess('Refund approved');
        this.selectedRefund = null;
        this.loadRefunds();
      },
      error: () => this.showError('Failed to approve refund'),
    });
  }

  rejectRefund(refundId: string, reason: string) {
    if (!reason.trim()) { this.showError('Rejection reason is required'); return; }
    this.post(`/refunds/${refundId}/reject`, {}, { reason }).subscribe({
      next: () => {
        this.showSuccess('Refund rejected');
        this.selectedRefund = null;
        this.loadRefunds();
      },
      error: () => this.showError('Failed to reject refund'),
    });
  }

  markItemsReceived(refundId: string) {
    this.post(`/refunds/${refundId}/items-received`).subscribe({
      next:  () => { this.showSuccess('Items marked received'); this.loadRefunds(); },
      error: () => this.showError('Failed to mark items received'),
    });
  }
}
