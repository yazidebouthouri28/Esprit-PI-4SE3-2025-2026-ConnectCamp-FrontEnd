import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { GeolocationService } from '../../services/geolocation.service';
import { QualityScoreService } from '../../services/quality-score.service';

import { CountrySelectorComponent } from '../country-selector/country-selector.component';
import { QualityBadgeComponent } from '../quality-badge/quality-badge.component';
import { TopQualityProductsComponent } from '../top-quality-products/top-quality-products.component';

import { CartItem } from '../../models/api.models';

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  image: string;
  price: number;
  rentalPrice?: number;

  rating: number;
  reviews: number;
  inStock: boolean;

  loyaltyPoints: number;
  featured: boolean;

  description: string;
  specs?: string[];
  discount?: number;
}

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CountrySelectorComponent,
    QualityBadgeComponent,
    TopQualityProductsComponent
  ],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.css']
})
export class MarketplaceComponent implements OnInit {

  // ================= STATE =================
  searchTerm = '';
  selectedCategory = 'All Products';
  sortBy = 'featured';
  priceRange = 'all';

  inStockOnly = false;
  rentalOnly = false;

  showQuickView = false;
  selectedProduct: Product | null = null;

  viewMode: 'grid' | 'list' = 'grid';

  showCartToast = false;
  isLoading = false;

  currentPage = 1;
  itemsPerPage = 8;

  filteredProducts: Product[] = [];
  originalProducts: Product[] = [];

  categories: { name: string; icon: string; count: number; id?: string }[] = [];

  currentCountryCode = 'FR';
  currencySymbol = '€';
  currentVatRate = 20;
  popularSearches: string[] = [
    'Tents',
    'Sleeping Bags',
    'Camping',
    'Hiking',
    'Outdoor'
  ];

  private baseCurrency = 'EUR';

  // ================= REALISTIC RATES (EUR BASE) =================
  private getExchangeRate(currencyCode: string): number {
    const rates: Record<string, number> = {
      EUR: 1,
      TND: 3.35,
      USD: 1.08,
      GBP: 0.86,
      CAD: 1.47,
      CNY: 7.8,
      JPY: 160,
      AED: 3.97
    };

    return rates[currencyCode] ?? 1;
  }

  // ================= IMAGES =================
  private campingPhotos = [
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
    'https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=800',
    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800'
  ];

  private imageCache = new Map<string, string>();

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private geoService: GeolocationService,
    public qualityService: QualityScoreService,
    private cdr: ChangeDetectorRef
  ) {}

  // ================= INIT =================
  ngOnInit(): void {

    this.geoService.location$.subscribe(loc => {

      this.currentCountryCode = loc.countryCode;

      this.currentVatRate = this.geoService.getVatRateForCountry(loc.countryCode);

      const currency = this.geoService.getCurrencyForCountry(loc.countryCode);
      this.currencySymbol = currency.symbol;

      this.filterProducts();
    });

    this.geoService.detectLocation().subscribe();

    this.loadCategories();
    this.loadProducts();
  }

  // ================= CATEGORIES =================
  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (cats: any[]) => {
        this.categories = [
          { name: 'All Products', icon: '🏕️', count: 0 },
          ...cats.map(c => ({
            name: c.name,
            icon: c.icon || '📦',
            count: c.productCount || 0,
            id: String(c.id)
          }))
        ];
      },
      error: () => {
        this.categories = [
          { name: 'All Products', icon: '🏕️', count: this.originalProducts.length }
        ];
      }
    });
  }

  // ================= PRODUCTS =================
  loadProducts(): void {
    this.isLoading = true;

    this.productService.getAll(0, 100).subscribe({
      next: (api: any[]) => {

        const products = (api || []).map(p => this.mapApiProduct(p));

        this.originalProducts = this.assignImages(products);
        this.filteredProducts = [...this.originalProducts];

        this.updateCategoryCounts();

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.originalProducts = [];
        this.filteredProducts = [];
        this.isLoading = false;
      }
    });
  }

  private mapApiProduct(api: any): Product {
    return {
      id: String(api.id),
      name: api.name,
      category: api.categoryName || 'General',
      categoryId: String(api.categoryId || ''),

      image: '',
      price: api.price,

      rentalPrice: api.isRentable ? api.rentalPricePerDay : undefined,

      rating: api.rating ?? 4.5,
      reviews: api.reviewCount ?? 50,

      inStock: (api.stockQuantity ?? 0) > 0,

      loyaltyPoints: Math.floor(api.price),
      featured: api.isFeatured ?? false,

      description: api.description || '',
      specs: api.tags || [],

      discount: api.originalPrice
        ? Math.round((1 - api.price / api.originalPrice) * 100)
        : undefined
    };
  }

  // ================= IMAGES =================
  private assignImages(list: Product[]): Product[] {
    return list.map(p => ({
      ...p,
      image: this.getImage(p.id)
    }));
  }

  private getImage(id: string): string {
    if (this.imageCache.has(id)) return this.imageCache.get(id)!;

    const img = this.campingPhotos[Math.abs(this.hash(id)) % this.campingPhotos.length];
    this.imageCache.set(id, img);
    return img;
  }

  private hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return h;
  }

  // ================= FILTER =================
  filterProducts(): void {

    let list = [...this.originalProducts];

    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s)
      );
    }

    if (this.selectedCategory !== 'All Products') {
      list = list.filter(p => p.category === this.selectedCategory);
    }

    if (this.inStockOnly) list = list.filter(p => p.inStock);
    if (this.rentalOnly) list = list.filter(p => !!p.rentalPrice);

    this.filteredProducts = list;
    this.currentPage = 1;
  }

  // ================= PRICE (FIX FINAL CLEAN) =================
  getPriceWithVat(price: number): number {

    const currency = this.geoService.getCurrencyForCountry(this.currentCountryCode);

    // TVA sur prix EUR
    const priceWithVat = price * (1 + this.currentVatRate / 100);

    // pas de conversion si devise base
    if (currency.code === this.baseCurrency) {
      return priceWithVat;
    }

    const rate = this.getExchangeRate(currency.code);

    return priceWithVat * rate;
  }

  getDiscountedPrice(p: Product): number {
    return p.discount
      ? p.price * (1 - p.discount / 100)
      : p.price;
  }

  // ================= PAGINATION =================
  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ================= CART =================
  addToCart(product: Product, type: 'purchase' | 'rental'): void {

    const item: CartItem = {
      productId: product.id,
      productName: product.name,
      price: type === 'rental'
        ? this.getPriceWithVat(product.rentalPrice || product.price)
        : this.getPriceWithVat(this.getDiscountedPrice(product)),

      quantity: 1,
      image: product.image,
      type: type === 'rental' ? 'RENTAL' : 'PURCHASE'
    };

    this.cartService.addToCart(item).subscribe();

    this.showCartToast = true;
    setTimeout(() => this.showCartToast = false, 2500);
  }

  // ================= UI =================
  quickView(p: Product): void {
    this.selectedProduct = p;
    this.showQuickView = true;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'All Products';
    this.filterProducts();
  }

  addToWishlist(p: Product): void {
    alert(`❤️ ${p.name}`);
  }

  updateCategoryCounts(): void {
    const all = this.categories.find(c => c.name === 'All Products');
    if (all) all.count = this.originalProducts.length;
  }

  onCountryChange(code: string): void {
    this.geoService.setCountry(code);
  }

  onQualityProductClick(id: string | number): void {
    const found = this.originalProducts.find(p => p.id === String(id));
    if (found) this.quickView(found);
  }
}
