import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { InventoryService } from '../../services/inventory.service';
import { WarehouseService } from '../../services/warehouse.service';
import { OrderService } from '../../services/order.service';
import { RentalService } from '../../services/rental.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SumByPipe } from '../../pipe/sum-by.pipe';

import {
  Product, Category, Inventory, StockMovement, Warehouse, Order, Rental,
  CreateCategoryDto, CreateStockMovementDto, CreateWarehouseDto,
  OrderStatisticsResponse
} from '../../models/api.models';
import { HttpClient } from '@angular/common/http';
import { PricePredictionService, PricePrediction } from '../../services/price-prediction.service';

@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SumByPipe], // ← ajouter
  templateUrl: './seller.component.html',
  styleUrls: ['./seller.component.css']

})
export class SellerComponent implements OnInit {
  activeSection = 'products';
  isLoading = false;
  errorMessage = '';

  // Dans seller.component.ts, remplacer le tableau menuItems :
  menuItems = [
    { id: 'dashboard',          label: 'Dashboard',             icon: '📊' },
    { id: 'products',           label: 'Products & Categories',  icon: '📦' },
    { id: 'inventory',          label: 'Inventory & Warehouses', icon: '🏭' },
    { id: 'orders',             label: 'Orders',                 icon: '📋' },
    { id: 'rentals',            label: 'Rentals Management',     icon: '📅' },
    { id: 'statistics',         label: 'Order Statistics',       icon: '📈' },
    { id: 'category-analytics', label: 'Category Analytics',     icon: '🏷️' }, // ← NOUVEAU
  ];

  activeSubSection: 'categories' | 'products' = 'categories';
  inventorySubSection: 'stock' | 'movements' | 'warehouses' = 'stock';
  selectedCategoryId: string | null = null;
  showProductForm = false;
  showRestockForm = false;
  showStockMovementForm = false;
  showWarehouseForm = false;
  showCategoryForm = false;
  showStockAlertForm = false;
  editingProductId: string | null = null;
  editingWarehouseId: string | null = null;
  editingInventoryId: string | null = null;
  // ── Section Category Analytics ─────────────────────────────────────────────

// Sales Report (JPQL JOIN)
  categorySalesReport: any[]       = [];
  salesReportLoading               = false;
  salesReportStatus                = 'DELIVERED';

// Orders by Category (Keyword multi-table)
  categoryOrders: any[]            = [];
  categoryOrdersLoading            = false;
  categoryOrdersApplied            = false;
  categoryOrderFilterStatus        = 'DELIVERED';
  categoryOrderFilterCategoryId    = '';
  categoryOrderFilterStartDate     = '';
  categoryOrderFilterEndDate       = '';
  globalStockAlertThreshold = 15;

  productForm: any = {
    name: '', description: '', shortDescription: '', price: 0, compareAtPrice: 0,
    sku: '', categoryId: '', tags: [], tagsInput: '', isActive: true, isFeatured: false,
    isOnSale: false, rentalAvailable: false, rentalPrice: 0, depositAmount: 0, maxRentalDays: 30,
    brand: 'Unknown', supplierCost: 0, shippingCost: 0, weight: 0,
    stockQuantity: 0, minStockLevel: 0, rating: 3.0,
    reviewCount: 0, salesCount: 0, viewCount: 0, imagesCount: 1,
  };

  restockForm: any       = { productName: '', productId: '', warehouseId: '', quantity: 0, notes: '' };
  stockMovementForm: any = { productId: '', type: 'IN', quantity: 0, reason: '', locationCode: '', warehouseId: '' };
  warehouseForm: any     = { name: '', code: '', address: '', city: '', country: '', phone: '', email: '', isActive: true };
  categoryForm: any      = { name: '', description: '', icon: '📦' };
  stockAlertForm: any    = { inventoryId: '', productName: '', currentThreshold: 0, newThreshold: 0 };

  searchTerm = '';
  filterCategory = '';
  filterStatus = '';
  filterRental = '';
  stockFilterWarehouse = '';
  orderStatusFilter = '';
  rentalStatusFilter = '';

  stats = {
    totalProducts: 0, activeProducts: 0, totalOrders: 0, pendingOrders: 0,
    totalRevenue: 0, lowStockItems: 0, totalStock: 0, stockValue: 0,
    activeRentals: 0, overdueRentals: 0, rentalRevenue: 0
  };

  products: Product[]         = [];
  inventory: Inventory[]      = [];
  stockMovements: StockMovement[] = [];
  warehouses: Warehouse[]     = [];
  orders: Order[]             = [];
  rentals: Rental[]           = [];
  categories: Category[]      = [];

  // ── AI Price ─────────────────────────────────────────────────────────────
  pricePrediction: PricePrediction | null = null;
  priceCheckLoading = false;
  priceWarning: 'above' | 'below' | 'ok' | null = null;
  private priceInput$ = new Subject<number>();

  // ── NOUVEAU : Section statistiques ───────────────────────────────────────
  orderStatistics: OrderStatisticsResponse[] = [];
  statisticsLoading = false;

  // ── NOUVEAU : Filtre avancé commandes ────────────────────────────────────
  filteredOrdersAdvanced: any[] = [];
  orderFilterStatus  = 'DELIVERED';
  orderFilterSince   = '';
  advancedFilterLoading = false;
  advancedFilterApplied = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
    private orderService: OrderService,
    private rentalService: RentalService,
    private authService: AuthService,
    private predictionService: PricePredictionService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Date par défaut = 30 jours en arrière
    const d = new Date();
    d.setDate(d.getDate() - 30);
    this.orderFilterSince = d.toISOString().slice(0, 16); // format datetime-local
    // Dans ngOnInit(), après l'initialisation de orderFilterSince :
    const now = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    this.categoryOrderFilterStartDate = monthAgo.toISOString().slice(0, 16);
    this.categoryOrderFilterEndDate   = now.toISOString().slice(0, 16);
    this.loadAllData();


    this.priceInput$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(price => {
        if (!price || price <= 0) { this.priceCheckLoading = false; return of(null); }
        const categoryName = this.categories.find(
          c => String(c.id) === String(this.productForm.categoryId)
        )?.name || 'Outdoor Accessories';
        const payload = {
          categoryName,
          name:              this.productForm.name            || '',
          brand:             this.productForm.brand           || 'Unknown',
          tags:              this.productForm.tags            || [],
          isFeatured:        this.productForm.isFeatured      || false,
          isOnSale:          this.productForm.isOnSale        || false,
          isRentable:        this.productForm.rentalAvailable || false,
          rentalPricePerDay: this.productForm.rentalPrice     || 0,
          supplierCost:      this.productForm.supplierCost    || 0,
          competitorPrice:   this.productForm.compareAtPrice  || 0,
          shippingCost:      this.productForm.shippingCost    || 0,
          weight:            this.productForm.weight          || 0,
          stockQuantity:     this.productForm.stockQuantity   || 0,
          minStockLevel:     this.productForm.minStockLevel   || 0,
          rating:            this.productForm.rating          || 3.0,
          reviewCount:       this.productForm.reviewCount     || 0,
          salesCount:        this.productForm.salesCount      || 0,
          viewCount:         this.productForm.viewCount       || 0,
          imagesCount:       this.productForm.imagesCount     || 1,
        };
        return this.http.post<any>('http://localhost:8000/predict-price', payload)
          .pipe(catchError(() => of(null)));
      })
    ).subscribe((res: any) => {
      this.priceCheckLoading = false;
      if (!res) { this.pricePrediction = null; this.priceWarning = null; return; }
      this.pricePrediction = {
        predictedPrice: res.predictedPrice,
        priceMin:       res.priceRange.min,
        priceMax:       res.priceRange.max,
        confidence:     res.confidence
      };
      this.evaluatePriceWarning(this.productForm.price);
    });
  }

  onPriceChange() {
    this.pricePrediction = null; this.priceWarning = null;
    this.priceCheckLoading = true;
    this.priceInput$.next(this.productForm.price);
  }

  onFieldChange() {
    if (this.productForm.price > 0) {
      this.pricePrediction = null; this.priceWarning = null;
      this.priceCheckLoading = true;
      this.priceInput$.next(this.productForm.price);
    }
  }

  loadAllData() {
    this.isLoading = true;
    this.loadProducts();
    this.loadCategories();
    this.loadInventory();
    this.loadWarehouses();
    this.loadOrders();
    this.loadRentals();
    this.loadStockMovements();
    this.loadOrderStatistics(); // ← NOUVEAU
    this.loadCategorySalesReport(); // ← ajouter

  }

  evaluatePriceWarning(price: number) {
    if (!this.pricePrediction) return;
    if (price > this.pricePrediction.priceMax)      this.priceWarning = 'above';
    else if (price < this.pricePrediction.priceMin) this.priceWarning = 'below';
    else                                             this.priceWarning = 'ok';
  }

  applyAiPrice() { this.productForm.price = this.pricePrediction?.predictedPrice; this.priceWarning = 'ok'; }

  saveProductWithCheck() {
    if (this.priceCheckLoading) { alert('⏳ Please wait, AI price check is still loading...'); return; }
    if (!this.pricePrediction) { this.saveProduct(); return; }
    if (this.priceWarning === 'above' || this.priceWarning === 'below') {
      const label = this.priceWarning === 'above'
        ? `ABOVE the suggested range (max: ${this.pricePrediction.priceMax} DT)`
        : `BELOW the suggested range (min: ${this.pricePrediction.priceMin} DT)`;
      if (!confirm(`⚠️ Price Warning!\n\nYour price: ${this.productForm.price} DT\nAI suggested: ${this.pricePrediction.priceMin}–${this.pricePrediction.priceMax} DT\n\nYour price is ${label}.\n\nSave anyway?`)) return;
    }
    this.saveProduct();
  }

  resetPriceCheck() { this.pricePrediction = null; this.priceWarning = null; this.priceCheckLoading = false; }

  private toArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    return data?.content || data?.data?.content || data?.data || [];
  }

  // ── Loaders ───────────────────────────────────────────────────────────────

  loadProducts() {
    this.isLoading = true;
    const userId = this.authService.getCurrentUser()?.id;
    const load$ = userId ? this.productService.getBySeller(userId, 0, 100) : this.productService.getAll(0, 100);
    load$.subscribe({
      next: (res: any) => { this.products = this.toArray(res); this.updateStats(); this.isLoading = false; },
      error: () => { this.errorMessage = 'Failed to load products'; this.products = []; this.isLoading = false; }
    });
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (data: any) => this.categories = this.toArray(data),
      error: () => this.errorMessage = 'Failed to load categories'
    });
  }

  loadInventory() {
    this.inventoryService.getAll().subscribe({
      next: (data: any) => { this.inventory = this.toArray(data); this.updateStats(); },
      error: () => { this.inventory = []; this.errorMessage = 'Failed to load inventory'; }
    });
  }

  loadWarehouses() {
    this.warehouseService.getAll().subscribe({
      next: (data: any) => this.warehouses = this.toArray(data),
      error: () => this.errorMessage = 'Failed to load warehouses'
    });
  }

  loadOrders() {
    const userId = this.authService.getCurrentUser()?.id;
    if (userId) {
      this.orderService.getByUser(userId).subscribe({
        next: (orders: any) => { this.orders = this.toArray(orders); this.updateStats(); },
        error: () => { this.orders = []; this.updateStats(); }
      });
    } else { this.orders = []; this.updateStats(); }
  }

  loadRentals() {
    this.rentalService.getAll().subscribe({
      next: (data: any) => { this.rentals = this.toArray(data); this.updateStats(); },
      error: () => { this.rentals = []; this.updateStats(); }
    });
  }

  loadStockMovements() { this.stockMovements = []; }

  // ── NOUVEAU 1 : Charger les statistiques par statut ──────────────────────
  loadOrderStatistics(): void {
    this.statisticsLoading = true;
    this.orderService.getStatisticsByStatus().subscribe({
      next: (stats) => { this.orderStatistics = stats; this.statisticsLoading = false; },
      error: () => { this.orderStatistics = []; this.statisticsLoading = false; }
    });
  }

  // ── NOUVEAU 2 : Filtre avancé commandes ──────────────────────────────────
  applyAdvancedOrderFilter(): void {
    const userId = this.authService.getCurrentUser()?.id?.toString();
    if (!userId) { alert('⚠️ User not found'); return; }
    if (!this.orderFilterStatus || !this.orderFilterSince) { alert('⚠️ Please select a status and a date'); return; }
    // Convertit "2025-01-01T12:00" → "2025-01-01T12:00:00" attendu par Spring
    const sinceIso = this.orderFilterSince.length === 16 ? this.orderFilterSince + ':00' : this.orderFilterSince;
    this.advancedFilterLoading = true;
    this.advancedFilterApplied = false;
    this.orderService.getFilteredOrders(userId, this.orderFilterStatus, sinceIso).subscribe({
      next: (orders) => { this.filteredOrdersAdvanced = orders; this.advancedFilterLoading = false; this.advancedFilterApplied = true; },
      error: () => { this.filteredOrdersAdvanced = []; this.advancedFilterLoading = false; this.advancedFilterApplied = true; }
    });
  }

  resetAdvancedFilter(): void {
    this.filteredOrdersAdvanced = [];
    this.advancedFilterApplied  = false;
    this.orderFilterStatus      = 'DELIVERED';
    const d = new Date(); d.setDate(d.getDate() - 30);
    this.orderFilterSince = d.toISOString().slice(0, 16);
  }

  // ── Barre de volume pour le tableau stats ─────────────────────────────────
  getStatBarWidth(count: number): number {
    if (!this.orderStatistics.length) return 0;
    const max = Math.max(...this.orderStatistics.map(s => s.orderCount));
    return max > 0 ? Math.round((count / max) * 100) : 0;
  }
  // Calcule le total de toutes les commandes (somme de tous les statuts)
  getTotalOrderCount(): number {
    return this.orderStatistics.reduce((sum, s) => sum + s.orderCount, 0);
  }

  // ── Filtered getters ──────────────────────────────────────────────────────

  get filteredProducts(): Product[] {
    let f = [...this.products];
    if (this.searchTerm)     f = f.filter(p => p.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(this.searchTerm.toLowerCase()));
    if (this.filterCategory) f = f.filter(p => p.categoryId === this.filterCategory);
    if (this.filterStatus === 'active')   f = f.filter(p => p.isActive);
    if (this.filterStatus === 'inactive') f = f.filter(p => !p.isActive);
    if (this.filterRental === 'rental')   f = f.filter(p => p.rentalAvailable);
    if (this.filterRental === 'sale')     f = f.filter(p => !p.rentalAvailable);
    return f;
  }

  get filteredInventory(): Inventory[] {
    let f = [...this.inventory];
    if (this.stockFilterWarehouse) f = f.filter(i => i.warehouseId === this.stockFilterWarehouse);
    return f;
  }

  get filteredOrders(): Order[] {
    let f = [...this.orders];
    if (this.orderStatusFilter) f = f.filter(o => o.status === this.orderStatusFilter);
    return f;
  }

  get filteredRentals(): Rental[] {
    let f = [...this.rentals];
    if (this.rentalStatusFilter) f = f.filter(r => r.status === this.rentalStatusFilter);
    return f;
  }

  get lowStockItems(): Inventory[] {
    if (!Array.isArray(this.inventory)) return [];
    return this.inventory.filter(i => i.isLowStock);
  }

  get activeWarehouses(): Warehouse[] {
    if (!Array.isArray(this.warehouses)) return [];
    return this.warehouses.filter(w => w.isActive);
  }

  // ── Product CRUD ──────────────────────────────────────────────────────────

  openProductForm() { this.showProductForm = true; this.editingProductId = null; this.resetProductForm(); }

  resetProductForm() {
    this.productForm = {
      name: '', description: '', shortDescription: '', price: 0, compareAtPrice: 0,
      sku: '', categoryId: '', tags: [], tagsInput: '', isActive: true, isFeatured: false,
      isOnSale: false, rentalAvailable: false, rentalPrice: 0, depositAmount: 0, maxRentalDays: 30,
      brand: 'Unknown', supplierCost: 0, shippingCost: 0, weight: 0,
      stockQuantity: 0, minStockLevel: 0, rating: 3.0, reviewCount: 0, salesCount: 0, viewCount: 0, imagesCount: 1,
    };
    this.resetPriceCheck();
  }

  saveProduct() {
    if (this.productForm.tagsInput) this.productForm.tags = this.productForm.tagsInput.split(',').map((t: string) => t.trim());
    if (!this.productForm.sku) this.productForm.sku = `PRD-${Date.now().toString().slice(-6)}`;
    const sellerId = Number(this.authService.getCurrentUser()?.id ?? 0);
    const productData = {
      name: this.productForm.name, description: this.productForm.description,
      price: this.productForm.price, originalPrice: this.productForm.compareAtPrice || undefined,
      sku: this.productForm.sku, categoryId: this.productForm.categoryId ? Number(this.productForm.categoryId) : undefined,
      sellerId, tags: this.productForm.tags, images: [] as string[],
      isFeatured: this.productForm.isFeatured, isRentable: this.productForm.rentalAvailable,
      rentalPricePerDay: this.productForm.rentalPrice || undefined, stockQuantity: 0
    };
    this.isLoading = true;
    if (this.editingProductId) {
      this.productService.update(this.editingProductId, productData).subscribe({
        next: () => { alert('✅ Product updated successfully!'); this.cancelProductForm(); this.loadProducts(); this.resetPriceCheck(); },
        error: (err) => { this.isLoading = false; alert('❌ Failed to update product: ' + (err.error?.message || err.message || 'Unknown error')); }
      });
    } else {
      this.productService.create(productData).subscribe({
        next: () => { alert('✅ Product added successfully!'); this.cancelProductForm(); this.loadProducts(); },
        error: (err) => { this.isLoading = false; alert('❌ Failed to create product: ' + (err.error?.message || err.message || 'Unknown error')); }
      });
    }
  }

  editProduct(product: Product) { this.productForm = { ...product, tagsInput: product.tags?.join(', ') || '' }; this.editingProductId = product.id; this.showProductForm = true; }

  deleteProduct(id: string) {
    if (confirm('Delete this product?')) {
      this.productService.delete(id).subscribe({
        next: () => { alert('🗑️ Product deleted'); this.loadProducts(); },
        error: (err) => alert('❌ Failed to delete: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    }
  }

  toggleProductStatus(product: Product) {
    this.productService.update(product.id, { isActive: !product.isActive } as any).subscribe({
      next: () => { product.isActive = !product.isActive; alert(`Product ${product.isActive ? 'activated' : 'deactivated'}`); },
      error: () => alert('❌ Failed to update product status')
    });
  }
// ── NOUVEAU 3 : Sales Report par catégorie (JPQL JOIN) ───────────────────
  loadCategorySalesReport(): void {
    this.salesReportLoading = true;
    this.categoryService.getSalesReport(this.salesReportStatus).subscribe({
      next: (data) => { this.categorySalesReport = data; this.salesReportLoading = false; },
      error: ()     => { this.categorySalesReport = []; this.salesReportLoading = false; }
    });
  }

// ── NOUVEAU 4 : Orders by Category (Keyword multi-table) ────────────────
  applyOrdersByCategoryFilter(): void {
    if (!this.categoryOrderFilterCategoryId) { alert('⚠️ Please select a category'); return; }
    if (!this.categoryOrderFilterStartDate || !this.categoryOrderFilterEndDate) {
      alert('⚠️ Please select a date range'); return;
    }
    const startIso = this.categoryOrderFilterStartDate.length === 16
      ? this.categoryOrderFilterStartDate + ':00'
      : this.categoryOrderFilterStartDate;
    const endIso = this.categoryOrderFilterEndDate.length === 16
      ? this.categoryOrderFilterEndDate + ':00'
      : this.categoryOrderFilterEndDate;

    this.categoryOrdersLoading = true;
    this.categoryOrdersApplied = false;
    this.categoryService.getOrdersByCategory(
      this.categoryOrderFilterStatus,
      this.categoryOrderFilterCategoryId,
      startIso,
      endIso
    ).subscribe({
      next: (orders) => {
        this.categoryOrders        = orders;
        this.categoryOrdersLoading = false;
        this.categoryOrdersApplied = true;
      },
      error: () => {
        this.categoryOrders        = [];
        this.categoryOrdersLoading = false;
        this.categoryOrdersApplied = true;
      }
    });
  }

  resetOrdersByCategoryFilter(): void {
    this.categoryOrders        = [];
    this.categoryOrdersApplied = false;
    this.categoryOrderFilterCategoryId = '';
    this.categoryOrderFilterStatus     = 'DELIVERED';
    const now = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    this.categoryOrderFilterStartDate = monthAgo.toISOString().slice(0, 16);
    this.categoryOrderFilterEndDate   = now.toISOString().slice(0, 16);
  }

// ── Helper : max revenue pour la barre de progression ───────────────────
  getSalesReportBarWidth(revenue: number): number {
    if (!this.categorySalesReport.length) return 0;
    const max = Math.max(...this.categorySalesReport.map(s => s.totalRevenue ?? 0));
    return max > 0 ? Math.round((revenue / max) * 100) : 0;
  }

// ── Helper : nom de catégorie depuis son id ───────────────────────────────
  getCategoryNameById(id: string): string {
    return this.categories.find(c => String(c.id) === String(id))?.name ?? '—';
  }
  cancelProductForm() { this.showProductForm = false; this.editingProductId = null; this.resetProductForm(); }

  // ── Inventory / Stock ─────────────────────────────────────────────────────

  openRestockForm(inv: Inventory) { this.restockForm = { productName: inv.productName, productId: inv.productId, warehouseId: inv.warehouseId, quantity: 0, notes: '' }; this.showRestockForm = true; }

  saveRestock() {
    if (this.restockForm.quantity <= 0) { alert('⚠️ Quantity must be greater than 0'); return; }
    const movementData: CreateStockMovementDto = { productId: this.restockForm.productId, warehouseId: this.restockForm.warehouseId, type: 'IN', quantity: this.restockForm.quantity, reason: this.restockForm.notes || 'Manual restock' };
    this.inventoryService.createMovement(movementData).subscribe({
      next: () => { alert(`✅ Restocked ${this.restockForm.quantity} units successfully!`); this.showRestockForm = false; this.loadInventory(); },
      error: (err) => alert('❌ Failed to restock: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  openStockMovementForm() { this.stockMovementForm = { productId: '', type: 'IN', quantity: 0, reason: '', locationCode: '', warehouseId: this.warehouses[0]?.id || '' }; this.showStockMovementForm = true; }

  saveStockMovement() {
    if (!this.stockMovementForm.productId || this.stockMovementForm.quantity === 0) { alert('⚠️ Please fill all required fields'); return; }
    const movementData: CreateStockMovementDto = { productId: this.stockMovementForm.productId, warehouseId: this.stockMovementForm.warehouseId, type: this.stockMovementForm.type, quantity: Math.abs(this.stockMovementForm.quantity), reason: this.stockMovementForm.reason, locationCode: this.stockMovementForm.locationCode };
    this.inventoryService.createMovement(movementData).subscribe({
      next: () => { alert('✅ Stock movement recorded!'); this.showStockMovementForm = false; this.loadInventory(); },
      error: (err) => alert('❌ Failed to record: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  openStockAlertForm(inv: Inventory) { this.stockAlertForm = { inventoryId: inv.id, productName: inv.productName, currentThreshold: inv.lowStockThreshold, newThreshold: inv.lowStockThreshold }; this.editingInventoryId = inv.id; this.showStockAlertForm = true; }

  saveStockAlert() {
    if (this.stockAlertForm.newThreshold < 0) { alert('⚠️ Threshold cannot be negative'); return; }
    const currentItem = this.inventory.find(i => i.id === this.editingInventoryId);
    this.inventoryService.updateStock(this.editingInventoryId!, { currentStock: currentItem?.currentStock || 0, lowStockThreshold: this.stockAlertForm.newThreshold }).subscribe({
      next: () => { alert(`✅ Threshold updated to ${this.stockAlertForm.newThreshold} units`); this.showStockAlertForm = false; this.loadInventory(); },
      error: (err) => alert('❌ Failed to update: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  transferStock(inv: Inventory) {
    const targetWarehouse = prompt('Transfer to warehouse ID:');
    if (!targetWarehouse || targetWarehouse === inv.warehouseId) { alert('⚠️ Cannot transfer to the same warehouse'); return; }
    const quantity = prompt('Quantity to transfer:');
    if (!quantity) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0 || qty > inv.availableStock) { alert('⚠️ Invalid quantity'); return; }
    this.inventoryService.createMovement({ productId: inv.productId, warehouseId: inv.warehouseId, type: 'OUT', quantity: qty, reason: `Transfer to warehouse ${targetWarehouse}` }).subscribe({
      next: () => {
        this.inventoryService.createMovement({ productId: inv.productId, warehouseId: targetWarehouse, type: 'IN', quantity: qty, reason: `Transfer from warehouse ${inv.warehouseId}` }).subscribe({
          next: () => { alert(`✅ Transferred ${qty} units successfully!`); this.loadInventory(); },
          error: (err) => alert('❌ Transfer failed: ' + (err.error?.message || err.message || 'Unknown error'))
        });
      },
      error: (err) => alert('❌ Transfer failed: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  updateGlobalStockAlert() {
    if (this.globalStockAlertThreshold < 0) { alert('⚠️ Threshold cannot be negative'); return; }
    alert(`ℹ️ Global stock alert: ${this.inventory.length} items. Please update individually.`);
  }

  // ── Categories ────────────────────────────────────────────────────────────

  selectCategoryToAddProduct(category: Category) { this.selectedCategoryId = category.id; this.activeSubSection = 'products'; this.productForm.categoryId = category.id; this.openProductForm(); }
  getCategoryName(categoryId: string): string { return this.categories.find(c => c.id === categoryId)?.name || ''; }
  getFilteredProductsByCategory(): Product[] { let f = this.filteredProducts; if (this.selectedCategoryId) f = f.filter(p => p.categoryId === this.selectedCategoryId); return f; }

  saveCategory() {
    if (!this.categoryForm.name) { alert('⚠️ Category name is required'); return; }
    const categoryData: CreateCategoryDto = { name: this.categoryForm.name, description: this.categoryForm.description, icon: this.categoryForm.icon };
    this.categoryService.create(categoryData).subscribe({
      next: () => { alert('✅ Category added!'); this.showCategoryForm = false; this.categoryForm = { name: '', description: '', icon: '📦' }; this.loadCategories(); },
      error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  deleteCategory(id: string) {
    if (this.products.some(p => p.categoryId === id)) { alert('⚠️ Cannot delete category with products'); return; }
    if (confirm('Delete this category?')) {
      this.categoryService.delete(id).subscribe({
        next: () => { alert('🗑️ Category deleted'); this.loadCategories(); },
        error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    }
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  updateOrderStatus(order: Order, newStatus: string) {
    this.orderService.updateStatus(order.id, newStatus).subscribe({
      next: (updatedOrder) => { Object.assign(order, updatedOrder); alert(`✅ Order #${order.id} updated to ${newStatus}`); this.loadOrders(); },
      error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  viewOrderDetails(order: Order) { alert(`Order #${order.id}\nCustomer: ${order.customerName}\nTotal: $${order.totalAmount}\nStatus: ${order.status}`); }

  cancelOrder(order: Order) {
    if (confirm(`Cancel order #${order.id}?`)) {
      this.orderService.cancel(order.id).subscribe({
        next: () => { alert(`✅ Order #${order.id} cancelled`); this.loadOrders(); },
        error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    }
  }

  // ── Rentals ───────────────────────────────────────────────────────────────

  viewRentalDetails(rental: Rental) { alert(`Rental #${rental.id}\nProduct: ${rental.productName}\nCustomer: ${rental.customerName}\nStatus: ${rental.status}`); }

  markRentalReturned(rental: Rental) {
    if (confirm(`Mark rental ${rental.id} as returned?`)) {
      this.rentalService.markReturned(rental.id).subscribe({
        next: () => { alert(`✅ Rental ${rental.id} marked as returned.`); this.loadRentals(); },
        error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    }
  }

  sendRentalReminder(rental: Rental) {
    this.rentalService.sendReminder(rental.id).subscribe({
      next: () => alert(`📧 Reminder sent to ${rental.customerEmail}`),
      error: () => alert(`📧 Reminder sent to ${rental.customerEmail}`)
    });
  }

  extendRental(rental: Rental) {
    const days = prompt('Extend by how many days?');
    if (!days) return;
    const extension = parseInt(days, 10);
    if (isNaN(extension) || extension <= 0) return;
    this.rentalService.extend(rental.id, { additionalDays: extension }).subscribe({
      next: (updatedRental) => { Object.assign(rental, updatedRental); alert(`✅ Rental extended by ${extension} days.`); this.loadRentals(); },
      error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  // ── Warehouses ────────────────────────────────────────────────────────────

  openWarehouseForm(warehouse?: Warehouse) {
    if (warehouse) { this.warehouseForm = { ...warehouse }; this.editingWarehouseId = warehouse.id; }
    else { this.warehouseForm = { name: '', code: '', address: '', city: '', country: '', phone: '', email: '', isActive: true }; this.editingWarehouseId = null; }
    this.showWarehouseForm = true;
  }

  saveWarehouse() {
    if (!this.warehouseForm.name || !this.warehouseForm.code) { alert('⚠️ Name and code are required'); return; }
    const warehouseData: CreateWarehouseDto = { name: this.warehouseForm.name, code: this.warehouseForm.code, address: this.warehouseForm.address, city: this.warehouseForm.city, country: this.warehouseForm.country, phone: this.warehouseForm.phone, email: this.warehouseForm.email, isActive: this.warehouseForm.isActive };
    if (this.editingWarehouseId) {
      this.warehouseService.update(this.editingWarehouseId, warehouseData).subscribe({
        next: () => { alert('✅ Warehouse updated!'); this.showWarehouseForm = false; this.loadWarehouses(); },
        error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    } else {
      this.warehouseService.create(warehouseData).subscribe({
        next: () => { alert('✅ Warehouse added!'); this.showWarehouseForm = false; this.loadWarehouses(); },
        error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    }
  }

  toggleWarehouseStatus(warehouse: Warehouse) {
    this.warehouseService.update(warehouse.id, { isActive: !warehouse.isActive } as any).subscribe({
      next: () => { warehouse.isActive = !warehouse.isActive; alert(`Warehouse ${warehouse.isActive ? 'activated' : 'deactivated'}`); },
      error: () => alert('❌ Failed to update warehouse status')
    });
  }

  deleteWarehouse(id: string) {
    if (this.inventory.some(i => i.warehouseId === id)) { alert('⚠️ Cannot delete warehouse with existing stock.'); return; }
    if (confirm('Delete this warehouse?')) {
      this.warehouseService.delete(id).subscribe({
        next: () => { alert('🗑️ Warehouse deleted'); this.loadWarehouses(); },
        error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    }
  }

  // ── Stats & Badges ────────────────────────────────────────────────────────

  updateStats() {
    this.stats.totalProducts  = this.products.length;
    this.stats.activeProducts = this.products.filter(p => p.isActive).length;
    this.stats.totalOrders    = this.orders.length;
    this.stats.pendingOrders  = this.orders.filter(o => o.status === 'PENDING').length;
    this.stats.totalRevenue   = this.orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    this.stats.lowStockItems  = this.lowStockItems.length;
    this.stats.totalStock     = this.inventory.reduce((sum, i) => sum + (i.currentStock || 0), 0);
    this.stats.stockValue     = this.products.reduce((sum, p) => { const stock = this.inventory.find(i => i.productId === p.id)?.currentStock || 0; return sum + ((p.price || 0) * stock); }, 0);
    this.stats.activeRentals  = this.rentals.filter(r => r.status === 'ACTIVE').length;
    this.stats.overdueRentals = this.rentals.filter(r => r.status === 'OVERDUE').length;
    this.stats.rentalRevenue  = this.rentals.filter(r => r.status !== 'CANCELLED').reduce((sum, r) => sum + (r.totalCost || 0), 0);
  }

  getOrderStatusBadge(status: string): string {
    const badges: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800', 'CONFIRMED': 'bg-teal-100 text-teal-800',
      'PROCESSING': 'bg-blue-100 text-blue-800',  'SHIPPED': 'bg-purple-100 text-purple-800',
      'DELIVERED': 'bg-green-100 text-green-800',  'CANCELLED': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  getWarehouseStockCount(warehouseId: string): number { if (!Array.isArray(this.inventory)) return 0; return this.inventory.filter(i => i.warehouseId === warehouseId).length; }

  getRentalStatusBadge(status: string): string {
    const badges: { [key: string]: string } = { 'ACTIVE': 'bg-green-100 text-green-800', 'OVERDUE': 'bg-red-100 text-red-800', 'COMPLETED': 'bg-blue-100 text-blue-800', 'CANCELLED': 'bg-gray-100 text-gray-800' };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  getMovementTypeBadge(type: string): string {
    const badges: { [key: string]: string } = { 'IN': 'bg-green-100 text-green-800', 'OUT': 'bg-red-100 text-red-800', 'ADJUSTMENT': 'bg-blue-100 text-blue-800' };
    return badges[type] || 'bg-gray-100 text-gray-800';
  }
}
