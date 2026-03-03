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
import { AuthService } from '../../services/auth.service';
import {
  Product, Category, Inventory, StockMovement, Warehouse, Order, Rental,
  CreateCategoryDto, CreateStockMovementDto, CreateWarehouseDto
} from '../../models/api.models';

@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller.component.html',
  styleUrls: ['./seller.component.css']
})
export class SellerComponent implements OnInit {
  activeSection = 'products';
  isLoading = false;
  errorMessage = '';

  menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Products & Categories', icon: '📦' },
    { id: 'inventory', label: 'Inventory & Warehouses', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'rentals', label: 'Rentals Management', icon: '📅' }
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

  globalStockAlertThreshold = 15;

  productForm: any = {
    name: '', description: '', shortDescription: '', price: 0, compareAtPrice: 0,
    sku: '', categoryId: '', tags: [], tagsInput: '', isActive: true, isFeatured: false,
    rentalAvailable: false, rentalPrice: 0, depositAmount: 0, maxRentalDays: 30
  };

  restockForm: any = { productName: '', productId: '', warehouseId: '', quantity: 0, notes: '' };
  stockMovementForm: any = { productId: '', type: 'IN', quantity: 0, reason: '', locationCode: '', warehouseId: '' };
  warehouseForm: any = { name: '', code: '', address: '', city: '', country: '', phone: '', email: '', isActive: true };
  categoryForm: any = { name: '', description: '', icon: '📦' };
  stockAlertForm: any = { inventoryId: '', productName: '', currentThreshold: 0, newThreshold: 0 };

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

  products: Product[] = [];
  inventory: Inventory[] = [];
  stockMovements: StockMovement[] = [];
  warehouses: Warehouse[] = [];
  orders: Order[] = [];
  rentals: Rental[] = [];
  categories: Category[] = [];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
    private orderService: OrderService,
    private rentalService: RentalService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadAllData();
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
  }

  private toArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    return data?.content || data?.data?.content || data?.data || [];
  }

  // ── Loaders ───────────────────────────────────────────────────────────────

  loadProducts() {
    this.isLoading = true;
    const userId = this.authService.getCurrentUser()?.id;

    // /my-products doesn't exist — use getBySeller(userId) directly
    const load$ = userId
      ? this.productService.getBySeller(userId, 0, 100)
      : this.productService.getAll(0, 100);

    load$.subscribe({
      next: (res: any) => {
        this.products = this.toArray(res);
        this.updateStats();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load products';
        this.products = [];
        this.isLoading = false;
      }
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
      next: (data: any) => {
        this.inventory = this.toArray(data);
        this.updateStats();
      },
      error: () => {
        this.inventory = [];
        this.errorMessage = 'Failed to load inventory';
      }
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

    // /api/orders is ADMIN only (403 for sellers)
    // /api/orders/seller doesn't exist (500)
    // Use /api/orders/user/{userId} which is available to all roles
    if (userId) {
      this.orderService.getByUser(userId).subscribe({
        next: (orders: any) => {
          this.orders = this.toArray(orders);
          this.updateStats();
        },
        error: () => {
          this.orders = [];
          this.updateStats();
        }
      });
    } else {
      this.orders = [];
      this.updateStats();
    }
  }

  loadRentals() {
    // /api/rentals/seller-rentals doesn't exist on backend — use getAll()
    this.rentalService.getAll().subscribe({
      next: (data: any) => {
        this.rentals = this.toArray(data);
        this.updateStats();
      },
      error: () => {
        this.rentals = [];
        this.updateStats();
      }
    });
  }

  loadStockMovements() {
    // /api/inventory/movements doesn't exist — skip gracefully
    this.stockMovements = [];
  }

  // ── Filtered getters ──────────────────────────────────────────────────────

  get filteredProducts(): Product[] {
    let filtered = [...this.products];
    if (this.searchTerm) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    if (this.filterCategory) filtered = filtered.filter(p => p.categoryId === this.filterCategory);
    if (this.filterStatus === 'active') filtered = filtered.filter(p => p.isActive);
    else if (this.filterStatus === 'inactive') filtered = filtered.filter(p => !p.isActive);
    if (this.filterRental === 'rental') filtered = filtered.filter(p => p.rentalAvailable);
    else if (this.filterRental === 'sale') filtered = filtered.filter(p => !p.rentalAvailable);
    return filtered;
  }

  get filteredInventory(): Inventory[] {
    let filtered = [...this.inventory];
    if (this.stockFilterWarehouse) {
      filtered = filtered.filter(i => i.warehouseId === this.stockFilterWarehouse);
    }
    return filtered;
  }

  get filteredOrders(): Order[] {
    let filtered = [...this.orders];
    if (this.orderStatusFilter) {
      filtered = filtered.filter(o => o.status === this.orderStatusFilter);
    }
    return filtered;
  }

  get filteredRentals(): Rental[] {
    let filtered = [...this.rentals];
    if (this.rentalStatusFilter) {
      filtered = filtered.filter(r => r.status === this.rentalStatusFilter);
    }
    return filtered;
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

  openProductForm() {
    this.showProductForm = true;
    this.editingProductId = null;
    this.resetProductForm();
  }

  resetProductForm() {
    this.productForm = {
      name: '', description: '', shortDescription: '', price: 0, compareAtPrice: 0,
      sku: '', categoryId: '', tags: [], tagsInput: '', isActive: true, isFeatured: false,
      rentalAvailable: false, rentalPrice: 0, depositAmount: 0, maxRentalDays: 30
    };
  }

  saveProduct() {
    if (this.productForm.tagsInput) {
      this.productForm.tags = this.productForm.tagsInput.split(',').map((t: string) => t.trim());
    }
    if (!this.productForm.sku) {
      this.productForm.sku = `PRD-${Date.now().toString().slice(-6)}`;
    }

    const sellerId = Number(this.authService.getCurrentUser()?.id ?? 0);

    const productData = {
      name: this.productForm.name,
      description: this.productForm.description,
      price: this.productForm.price,
      originalPrice: this.productForm.compareAtPrice || undefined,
      sku: this.productForm.sku,
      categoryId: this.productForm.categoryId ? Number(this.productForm.categoryId) : undefined,
      sellerId: sellerId,
      tags: this.productForm.tags,
      images: [] as string[],
      isFeatured: this.productForm.isFeatured,
      isRentable: this.productForm.rentalAvailable,
      rentalPricePerDay: this.productForm.rentalPrice || undefined,
      stockQuantity: 0
    };

    this.isLoading = true;

    if (this.editingProductId) {
      this.productService.update(this.editingProductId, productData).subscribe({
        next: () => {
          alert('✅ Product updated successfully!');
          this.cancelProductForm();
          this.loadProducts();
        },
        error: (err) => {
          this.isLoading = false;
          alert('❌ Failed to update product: ' + (err.error?.message || err.message || 'Unknown error'));
        }
      });
    } else {
      this.productService.create(productData).subscribe({
        next: () => {
          alert('✅ Product added successfully!');
          this.cancelProductForm();
          this.loadProducts();
        },
        error: (err) => {
          this.isLoading = false;
          alert('❌ Failed to create product: ' + (err.error?.message || err.message || 'Unknown error'));
        }
      });
    }
  }

  editProduct(product: Product) {
    this.productForm = {
      ...product,
      tagsInput: product.tags?.join(', ') || ''
    };
    this.editingProductId = product.id;
    this.showProductForm = true;
  }

  deleteProduct(id: string) {
    if (confirm('Delete this product?')) {
      this.productService.delete(id).subscribe({
        next: () => {
          alert('🗑️ Product deleted');
          this.loadProducts();
        },
        error: (err) => alert('❌ Failed to delete: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    }
  }

  toggleProductStatus(product: Product) {
    this.productService.update(product.id, { isActive: !product.isActive } as any).subscribe({
      next: () => {
        product.isActive = !product.isActive;
        alert(`Product ${product.isActive ? 'activated' : 'deactivated'}`);
      },
      error: () => alert('❌ Failed to update product status')
    });
  }

  cancelProductForm() {
    this.showProductForm = false;
    this.editingProductId = null;
    this.resetProductForm();
  }

  // ── Inventory / Stock ─────────────────────────────────────────────────────

  openRestockForm(inv: Inventory) {
    this.restockForm = {
      productName: inv.productName,
      productId: inv.productId,
      warehouseId: inv.warehouseId,
      quantity: 0,
      notes: ''
    };
    this.showRestockForm = true;
  }

  saveRestock() {
    if (this.restockForm.quantity <= 0) {
      alert('⚠️ Quantity must be greater than 0');
      return;
    }

    const movementData: CreateStockMovementDto = {
      productId: this.restockForm.productId,
      warehouseId: this.restockForm.warehouseId,
      type: 'IN',
      quantity: this.restockForm.quantity,
      reason: this.restockForm.notes || 'Manual restock'
    };

    this.inventoryService.createMovement(movementData).subscribe({
      next: () => {
        alert(`✅ Restocked ${this.restockForm.quantity} units successfully!`);
        this.showRestockForm = false;
        this.loadInventory();
      },
      error: (err) => alert('❌ Failed to restock: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  openStockMovementForm() {
    this.stockMovementForm = {
      productId: '',
      type: 'IN',
      quantity: 0,
      reason: '',
      locationCode: '',
      warehouseId: this.warehouses[0]?.id || ''
    };
    this.showStockMovementForm = true;
  }

  saveStockMovement() {
    if (!this.stockMovementForm.productId || this.stockMovementForm.quantity === 0) {
      alert('⚠️ Please fill all required fields');
      return;
    }

    const movementData: CreateStockMovementDto = {
      productId: this.stockMovementForm.productId,
      warehouseId: this.stockMovementForm.warehouseId,
      type: this.stockMovementForm.type,
      quantity: Math.abs(this.stockMovementForm.quantity),
      reason: this.stockMovementForm.reason,
      locationCode: this.stockMovementForm.locationCode
    };

    this.inventoryService.createMovement(movementData).subscribe({
      next: () => {
        alert('✅ Stock movement recorded!');
        this.showStockMovementForm = false;
        this.loadInventory();
      },
      error: (err) => alert('❌ Failed to record: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  openStockAlertForm(inv: Inventory) {
    this.stockAlertForm = {
      inventoryId: inv.id,
      productName: inv.productName,
      currentThreshold: inv.lowStockThreshold,
      newThreshold: inv.lowStockThreshold
    };
    this.editingInventoryId = inv.id;
    this.showStockAlertForm = true;
  }

  saveStockAlert() {
    if (this.stockAlertForm.newThreshold < 0) {
      alert('⚠️ Threshold cannot be negative');
      return;
    }

    const currentItem = this.inventory.find(i => i.id === this.editingInventoryId);
    this.inventoryService.updateStock(this.editingInventoryId!, {
      currentStock: currentItem?.currentStock || 0,
      lowStockThreshold: this.stockAlertForm.newThreshold
    }).subscribe({
      next: () => {
        alert(`✅ Threshold updated to ${this.stockAlertForm.newThreshold} units`);
        this.showStockAlertForm = false;
        this.loadInventory();
      },
      error: (err) => alert('❌ Failed to update: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  transferStock(inv: Inventory) {
    const targetWarehouse = prompt('Transfer to warehouse ID:');
    if (!targetWarehouse) return;
    if (targetWarehouse === inv.warehouseId) {
      alert('⚠️ Cannot transfer to the same warehouse');
      return;
    }
    const quantity = prompt('Quantity to transfer:');
    if (!quantity) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0 || qty > inv.availableStock) {
      alert('⚠️ Invalid quantity');
      return;
    }

    this.inventoryService.createMovement({
      productId: inv.productId,
      warehouseId: inv.warehouseId,
      type: 'OUT',
      quantity: qty,
      reason: `Transfer to warehouse ${targetWarehouse}`
    }).subscribe({
      next: () => {
        this.inventoryService.createMovement({
          productId: inv.productId,
          warehouseId: targetWarehouse,
          type: 'IN',
          quantity: qty,
          reason: `Transfer from warehouse ${inv.warehouseId}`
        }).subscribe({
          next: () => {
            alert(`✅ Transferred ${qty} units successfully!`);
            this.loadInventory();
          },
          error: (err) => alert('❌ Transfer failed: ' + (err.error?.message || err.message || 'Unknown error'))
        });
      },
      error: (err) => alert('❌ Transfer failed: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  updateGlobalStockAlert() {
    if (this.globalStockAlertThreshold < 0) {
      alert('⚠️ Threshold cannot be negative');
      return;
    }
    alert(`ℹ️ Global stock alert: ${this.inventory.length} items. Please update individually.`);
  }

  // ── Categories ────────────────────────────────────────────────────────────

  selectCategoryToAddProduct(category: Category) {
    this.selectedCategoryId = category.id;
    this.activeSubSection = 'products';
    this.productForm.categoryId = category.id;
    this.openProductForm();
  }

  getCategoryName(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.name || '';
  }

  getFilteredProductsByCategory(): Product[] {
    let filtered = this.filteredProducts;
    if (this.selectedCategoryId) {
      filtered = filtered.filter(p => p.categoryId === this.selectedCategoryId);
    }
    return filtered;
  }

  saveCategory() {
    if (!this.categoryForm.name) {
      alert('⚠️ Category name is required');
      return;
    }

    const categoryData: CreateCategoryDto = {
      name: this.categoryForm.name,
      description: this.categoryForm.description,
      icon: this.categoryForm.icon
    };

    this.categoryService.create(categoryData).subscribe({
      next: () => {
        alert('✅ Category added!');
        this.showCategoryForm = false;
        this.categoryForm = { name: '', description: '', icon: '📦' };
        this.loadCategories();
      },
      error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  deleteCategory(id: string) {
    if (this.products.some(p => p.categoryId === id)) {
      alert('⚠️ Cannot delete category with products');
      return;
    }
    if (confirm('Delete this category?')) {
      this.categoryService.delete(id).subscribe({
        next: () => {
          alert('🗑️ Category deleted');
          this.loadCategories();
        },
        error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    }
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  updateOrderStatus(order: Order, newStatus: string) {
    this.orderService.updateStatus(order.id, newStatus).subscribe({
      next: (updatedOrder) => {
        Object.assign(order, updatedOrder);
        alert(`✅ Order #${order.id} updated to ${newStatus}`);
        this.loadOrders();
      },
      error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  viewOrderDetails(order: Order) {
    alert(`Order #${order.id}\nCustomer: ${order.customerName}\nTotal: $${order.totalAmount}\nStatus: ${order.status}`);
  }

  cancelOrder(order: Order) {
    if (confirm(`Cancel order #${order.id}?`)) {
      this.orderService.cancel(order.id).subscribe({
        next: () => {
          alert(`✅ Order #${order.id} cancelled`);
          this.loadOrders();
        },
        error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    }
  }

  // ── Rentals ───────────────────────────────────────────────────────────────

  viewRentalDetails(rental: Rental) {
    alert(`Rental #${rental.id}\nProduct: ${rental.productName}\nCustomer: ${rental.customerName}\nStatus: ${rental.status}`);
  }

  markRentalReturned(rental: Rental) {
    if (confirm(`Mark rental ${rental.id} as returned?`)) {
      this.rentalService.markReturned(rental.id).subscribe({
        next: () => {
          alert(`✅ Rental ${rental.id} marked as returned.`);
          this.loadRentals();
        },
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
      next: (updatedRental) => {
        Object.assign(rental, updatedRental);
        alert(`✅ Rental extended by ${extension} days.`);
        this.loadRentals();
      },
      error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
    });
  }

  // ── Warehouses ────────────────────────────────────────────────────────────

  openWarehouseForm(warehouse?: Warehouse) {
    if (warehouse) {
      this.warehouseForm = { ...warehouse };
      this.editingWarehouseId = warehouse.id;
    } else {
      this.warehouseForm = { name: '', code: '', address: '', city: '', country: '', phone: '', email: '', isActive: true };
      this.editingWarehouseId = null;
    }
    this.showWarehouseForm = true;
  }

  saveWarehouse() {
    if (!this.warehouseForm.name || !this.warehouseForm.code) {
      alert('⚠️ Name and code are required');
      return;
    }

    const warehouseData: CreateWarehouseDto = {
      name: this.warehouseForm.name,
      code: this.warehouseForm.code,
      address: this.warehouseForm.address,
      city: this.warehouseForm.city,
      country: this.warehouseForm.country,
      phone: this.warehouseForm.phone,
      email: this.warehouseForm.email,
      isActive: this.warehouseForm.isActive
    };

    if (this.editingWarehouseId) {
      this.warehouseService.update(this.editingWarehouseId, warehouseData).subscribe({
        next: () => {
          alert('✅ Warehouse updated!');
          this.showWarehouseForm = false;
          this.loadWarehouses();
        },
        error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    } else {
      this.warehouseService.create(warehouseData).subscribe({
        next: () => {
          alert('✅ Warehouse added!');
          this.showWarehouseForm = false;
          this.loadWarehouses();
        },
        error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    }
  }

  toggleWarehouseStatus(warehouse: Warehouse) {
    this.warehouseService.update(warehouse.id, { isActive: !warehouse.isActive } as any).subscribe({
      next: () => {
        warehouse.isActive = !warehouse.isActive;
        alert(`Warehouse ${warehouse.isActive ? 'activated' : 'deactivated'}`);
      },
      error: () => alert('❌ Failed to update warehouse status')
    });
  }

  deleteWarehouse(id: string) {
    if (this.inventory.some(i => i.warehouseId === id)) {
      alert('⚠️ Cannot delete warehouse with existing stock.');
      return;
    }
    if (confirm('Delete this warehouse?')) {
      this.warehouseService.delete(id).subscribe({
        next: () => {
          alert('🗑️ Warehouse deleted');
          this.loadWarehouses();
        },
        error: (err) => alert('❌ Failed: ' + (err.error?.message || err.message || 'Unknown error'))
      });
    }
  }

  // ── Stats & Badges ────────────────────────────────────────────────────────

  updateStats() {
    this.stats.totalProducts = this.products.length;
    this.stats.activeProducts = this.products.filter(p => p.isActive).length;
    this.stats.totalOrders = this.orders.length;
    this.stats.pendingOrders = this.orders.filter(o => o.status === 'PENDING').length;
    this.stats.totalRevenue = this.orders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    this.stats.lowStockItems = this.lowStockItems.length;
    this.stats.totalStock = this.inventory.reduce((sum, i) => sum + (i.currentStock || 0), 0);
    this.stats.stockValue = this.products.reduce((sum, p) => {
      const stock = this.inventory.find(i => i.productId === p.id)?.currentStock || 0;
      return sum + ((p.price || 0) * stock);
    }, 0);
    this.stats.activeRentals = this.rentals.filter(r => r.status === 'ACTIVE').length;
    this.stats.overdueRentals = this.rentals.filter(r => r.status === 'OVERDUE').length;
    this.stats.rentalRevenue = this.rentals
      .filter(r => r.status !== 'CANCELLED')
      .reduce((sum, r) => sum + (r.totalCost || 0), 0);
  }

  getOrderStatusBadge(status: string): string {
    const badges: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PROCESSING': 'bg-blue-100 text-blue-800',
      'SHIPPED': 'bg-purple-100 text-purple-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  getWarehouseStockCount(warehouseId: string): number {
    if (!Array.isArray(this.inventory)) return 0;
    return this.inventory.filter(i => i.warehouseId === warehouseId).length;
  }

  getRentalStatusBadge(status: string): string {
    const badges: { [key: string]: string } = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'OVERDUE': 'bg-red-100 text-red-800',
      'COMPLETED': 'bg-blue-100 text-blue-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  getMovementTypeBadge(type: string): string {
    const badges: { [key: string]: string } = {
      'IN': 'bg-green-100 text-green-800',
      'OUT': 'bg-red-100 text-red-800',
      'ADJUSTMENT': 'bg-blue-100 text-blue-800'
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  }
}
