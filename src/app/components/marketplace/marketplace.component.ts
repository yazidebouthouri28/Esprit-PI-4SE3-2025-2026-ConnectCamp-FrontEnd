import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product as ApiProduct, Category as ApiCategory, CartItem } from '../../models/api.models';

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
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.css']
})
export class MarketplaceComponent implements OnInit {
  searchTerm: string = '';
  selectedCategory: string = 'All Products';
  sortBy: string = 'featured';
  priceRange: string = 'all';
  inStockOnly: boolean = false;
  rentalOnly: boolean = false;
  showQuickView: boolean = false;
  selectedProduct: Product | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  showCartToast: boolean = false;
  isLoading: boolean = false;

  currentPage = 1;
  itemsPerPage = 8;

  popularSearches = ['Tents', 'Sleeping Bags', 'Camping', 'Hiking', 'Outdoor'];

  categories: { name: string; icon: string; count: number; id?: string }[] = [
    { name: 'All Products', icon: '🏕️', count: 0 }
  ];

  // Fallback products if API fails
  fallbackProducts: Product[] = [
    {
      id: '1', name: '4-Person Family Tent - Waterproof & Spacious', category: 'Tents',
      image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80',
      price: 299, rentalPrice: 45, rating: 4.7, reviews: 128, inStock: true,
      loyaltyPoints: 299, featured: true, discount: 20,
      description: 'Spacious family tent with waterproof design, perfect for weekend camping trips.',
      specs: ['Waterproof 3000mm', 'Easy 10-min setup', 'Fits 4 people comfortably']
    },
    {
      id: '2', name: 'Premium Sleeping Bag -20°C Winter Edition', category: 'Sleeping Gear',
      image: 'https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=800&q=80',
      price: 189, rentalPrice: 25, rating: 4.9, reviews: 256, inStock: true,
      loyaltyPoints: 189, featured: true, discount: 15,
      description: 'Professional winter sleeping bag for extreme cold conditions.',
      specs: ['Temperature rated -20°C', 'Premium 800-fill down', 'Water-resistant shell']
    },
    {
      id: '3', name: 'Portable Camp Stove with Windscreen', category: 'Cooking',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
      price: 89, rentalPrice: 15, rating: 4.6, reviews: 94, inStock: true,
      loyaltyPoints: 89, featured: false,
      description: 'Compact gas camping stove with carrying case.',
      specs: ['Piezo ignition', 'Adjustable flame', 'Windscreen included']
    },
    {
      id: '4', name: '65L Hiking Backpack - Ergonomic Design', category: 'Backpacks',
      image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&q=80',
      price: 179, rentalPrice: 30, rating: 4.8, reviews: 201, inStock: true,
      loyaltyPoints: 179, featured: false, discount: 25,
      description: 'Large capacity hiking backpack with rain cover and multiple compartments.',
      specs: ['65L capacity', 'Adjustable torso length', 'Rain cover included']
    },
    {
      id: '5', name: 'LED Camping Lantern - Rechargeable', category: 'Accessories',
      image: 'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=800&q=80',
      price: 35, rating: 4.5, reviews: 89, inStock: true, loyaltyPoints: 35, featured: false,
      description: 'Bright LED lantern with USB charging. Multiple brightness modes.',
      specs: ['1000 lumens', 'USB rechargeable', '20-hour battery life']
    },
    {
      id: '6', name: 'Insulated Sleeping Pad - Self Inflating', category: 'Sleeping Gear',
      image: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80',
      price: 119, rentalPrice: 20, rating: 4.7, reviews: 167, inStock: false,
      loyaltyPoints: 119, featured: false,
      description: 'Comfortable self-inflating sleeping pad with excellent insulation.',
      specs: ['R-value 5.0', 'Self-inflating', 'Compact pack size']
    }
  ];

  originalProducts: Product[] = [];
  filteredProducts: Product[] = [];

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (apiCategories) => {
        this.categories = [
          { name: 'All Products', icon: '🏕️', count: 0 },
          ...apiCategories.map(c => ({
            name: c.name,
            icon: c.icon || '📦',
            count: c.productCount || 0,
            id: c.id
          }))
        ];
      },
      error: () => {
        // Use fallback categories
        this.categories = [
          { name: 'All Products', icon: '🏕️', count: this.fallbackProducts.length },
          { name: 'Tents', icon: '⛺', count: 2 },
          { name: 'Sleeping Gear', icon: '💤', count: 2 },
          { name: 'Cooking', icon: '🔥', count: 1 },
          { name: 'Backpacks', icon: '🎒', count: 1 },
          { name: 'Accessories', icon: '🔦', count: 1 }
        ];
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAll(0, 100).subscribe({
      next: (apiProducts) => {
        this.originalProducts = apiProducts.map((p: any) => this.mapApiProduct(p));
        if (this.originalProducts.length === 0) {
          this.originalProducts = [...this.fallbackProducts];
        }
        this.filteredProducts = [...this.originalProducts];
        this.updateCategoryCounts();
        this.isLoading = false;
      },
      error: () => {
        // Use fallback products
        this.originalProducts = [...this.fallbackProducts];
        this.filteredProducts = [...this.originalProducts];
        this.isLoading = false;
      }
    });
  }

  private mapApiProduct(apiProduct: ApiProduct): Product {
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      category: apiProduct.categoryName || 'General',
      categoryId: apiProduct.categoryId,
      image: apiProduct.images?.[0] || 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80',
      price: apiProduct.price,
      rentalPrice: apiProduct.rentalAvailable ? apiProduct.rentalPrice : undefined,
      rating: 4.5, // Default rating if not provided
      reviews: Math.floor(Math.random() * 200) + 50,
      inStock: true, // Assume in stock, would come from inventory
      loyaltyPoints: Math.floor(apiProduct.price),
      featured: apiProduct.isFeatured,
      description: apiProduct.description || apiProduct.shortDescription || '',
      specs: apiProduct.tags || [],
      discount: apiProduct.compareAtPrice ? Math.round((1 - apiProduct.price / apiProduct.compareAtPrice) * 100) : undefined
    };
  }

  private updateCategoryCounts(): void {
    const allProductsCategory = this.categories.find(c => c.name === 'All Products');
    if (allProductsCategory) {
      allProductsCategory.count = this.originalProducts.length;
    }

    this.categories.forEach(cat => {
      if (cat.name !== 'All Products') {
        cat.count = this.originalProducts.filter(p => p.category === cat.name || p.categoryId === cat.id).length;
      }
    });
  }

  searchProducts(): void {
    if (this.searchTerm.length >= 2) {
      this.productService.search(this.searchTerm).subscribe({
        next: (results) => {
          this.originalProducts = results.map((p: any) => this.mapApiProduct(p));  // ← add (p: any)
          this.filterProducts();
        },
        error: () => this.filterProducts()
      });
    } else {
      this.loadProducts();
    }
  }

  get paginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  filterProducts(): void {
    let filtered = [...this.originalProducts];

    if (this.searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedCategory !== 'All Products') {
      const selectedCat = this.categories.find(c => c.name === this.selectedCategory);
      filtered = filtered.filter(p => p.category === this.selectedCategory || p.categoryId === selectedCat?.id);
    }

    if (this.priceRange !== 'all') {
      if (this.priceRange === '0-50') filtered = filtered.filter(p => this.calculateDiscountedPrice(p) <= 50);
      else if (this.priceRange === '50-100') filtered = filtered.filter(p => this.calculateDiscountedPrice(p) > 50 && this.calculateDiscountedPrice(p) <= 100);
      else if (this.priceRange === '100-200') filtered = filtered.filter(p => this.calculateDiscountedPrice(p) > 100 && this.calculateDiscountedPrice(p) <= 200);
      else if (this.priceRange === '200+') filtered = filtered.filter(p => this.calculateDiscountedPrice(p) > 200);
    }

    if (this.inStockOnly) filtered = filtered.filter(p => p.inStock);
    if (this.rentalOnly) filtered = filtered.filter(p => p.rentalPrice);

    if (this.sortBy === 'priceLow') filtered.sort((a, b) => this.calculateDiscountedPrice(a) - this.calculateDiscountedPrice(b));
    else if (this.sortBy === 'priceHigh') filtered.sort((a, b) => this.calculateDiscountedPrice(b) - this.calculateDiscountedPrice(a));
    else if (this.sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    else if (this.sortBy === 'popular') filtered.sort((a, b) => b.reviews - a.reviews);
    else if (this.sortBy === 'featured') filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    this.filteredProducts = filtered;
    this.currentPage = 1;
  }

  calculateDiscountedPrice(product: Product): number {
    return product.discount ? product.price * (1 - product.discount / 100) : product.price;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'All Products';
    this.sortBy = 'featured';
    this.priceRange = 'all';
    this.inStockOnly = false;
    this.rentalOnly = false;
    this.loadProducts();
  }

  quickView(product: Product): void {
    this.selectedProduct = product;
    this.showQuickView = true;
  }

  addToCart(product: Product, type: 'purchase' | 'rental'): void {
    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      price: type === 'rental' && product.rentalPrice ? product.rentalPrice : this.calculateDiscountedPrice(product),
      quantity: 1,
      image: product.image,
      type: type === 'rental' ? 'RENTAL' : 'PURCHASE',
      rentalDays: type === 'rental' ? 7 : undefined
    };
    this.cartService.addToCart(cartItem).subscribe();
    this.showCartToast = true;
    setTimeout(() => { this.showCartToast = false; }, 3000);
  }

  addToWishlist(product: Product): void {
    alert(`❤️ ${product.name} added to wishlist!`);
  }
}
