import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/api.models';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 w-full border-b border-olive-green/20 bg-forest-green shadow-sm">
      <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2 cursor-pointer">
            <span class="text-2xl">⛺</span>
            <span class="text-xl font-bold text-cream-beige">CampConnect</span>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden lg:flex items-center gap-6">
            <a routerLink="/"
               routerLinkActive="text-sage-green"
               [routerLinkActiveOptions]="{exact: true}"
               class="text-cream-beige hover:text-sage-green transition-colors text-sm font-medium">
              Home
            </a>
            <a routerLink="/map"
               routerLinkActive="text-sage-green"
               class="text-cream-beige hover:text-sage-green transition-colors text-sm font-medium">
              Map
            </a>
            <a routerLink="/campsites"
               routerLinkActive="text-sage-green"
               class="text-cream-beige hover:text-sage-green transition-colors text-sm font-medium">
              Campsites
            </a>
            <a routerLink="/marketplace"
               routerLinkActive="text-sage-green"
               class="text-cream-beige hover:text-sage-green transition-colors text-sm font-medium">
              Marketplace
            </a>
            <a routerLink="/events"
               routerLinkActive="text-sage-green"
               class="text-cream-beige hover:text-sage-green transition-colors text-sm font-medium">
              Events
            </a>
            <a routerLink="/community"
               routerLinkActive="text-sage-green"
               class="text-cream-beige hover:text-sage-green transition-colors text-sm font-medium">
              Community
            </a>
            <!-- Sponsors Link (only for SPONSOR role) -->
            <a *ngIf="isSponsor"
               routerLink="/sponsors"
               routerLinkActive="text-sage-green"
               class="text-orange-400 hover:text-orange-300 transition-colors text-sm font-medium">
              Sponsors
            </a>
            <!-- Seller Dashboard Link (only for SELLER role) -->
            <a *ngIf="isSeller"
               routerLink="/seller"
               routerLinkActive="text-sage-green"
               class="text-cream-beige hover:text-sage-green transition-colors text-sm font-medium">
              Seller
            </a>
            <!-- Admin Link (only for ADMIN role) -->
            <a *ngIf="isAdmin"
               routerLink="/admin"
               routerLinkActive="text-sage-green"
               class="text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium">
              Admin
            </a>
          </div>

          <!-- Right Side Icons -->
          <div class="flex items-center gap-3">
            <!-- Shopping Cart with Badge -->
            <a routerLink="/cart"
               class="relative text-cream-beige hover:text-sage-green transition-colors p-2">
              <span class="text-xl">🛒</span>
              <span *ngIf="cartCount > 0"
                    class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {{cartCount > 9 ? '9+' : cartCount}}
              </span>
            </a>

            <!-- Dashboard Quick Access (logged in users) -->
            <a *ngIf="currentUser"
               routerLink="/dashboard"
               class="text-cream-beige hover:text-sage-green transition-colors p-2 hidden md:block">
              <span class="text-xl">📊</span>
            </a>

            <!-- User Profile / Auth -->
            <div class="relative profile-dropdown-container" *ngIf="currentUser; else loginButton">
              <button (click)="toggleUserMenu()" class="flex items-center gap-2 text-cream-beige hover:text-sage-green transition-colors p-2">
                <img *ngIf="currentUser.avatar" 
                     [src]="currentUser.avatar" 
                     [alt]="currentUser.name"
                     class="w-8 h-8 rounded-full object-cover border-2 border-sage-green">
                <span *ngIf="!currentUser.avatar" class="text-xl">👤</span>
                <span class="hidden xl:inline text-sm">{{ currentUser.name }}</span>
                <span class="text-xs">▼</span>
              </button>
              <!-- User Dropdown -->
              <div *ngIf="userMenuOpen" class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                <div class="px-4 py-3 border-b bg-gray-50">
                  <p class="text-sm font-semibold text-gray-900">{{ currentUser.name }}</p>
                  <p class="text-xs text-gray-500">{{ currentUser.email }}</p>
                  <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded-full"
                        [ngClass]="{
                          'bg-blue-100 text-blue-800': currentUser.role === 'ADMIN',
                          'bg-green-100 text-green-800': currentUser.role === 'SELLER',
                          'bg-purple-100 text-purple-800': currentUser.role === 'ORGANIZER',
                          'bg-orange-100 text-orange-800': currentUser.role === 'SPONSOR',
                          'bg-gray-100 text-gray-800': currentUser.role === 'CAMPER' || currentUser.role === 'CLIENT'
                        }">
                    {{ currentUser.role }}
                  </span>
                </div>
                <a routerLink="/dashboard" (click)="userMenuOpen = false"
                   class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <span>📊</span> Dashboard
                </a>
                <a routerLink="/profile" (click)="userMenuOpen = false"
                   class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <span>👤</span> My Profile
                </a>
                <a routerLink="/dashboard" [queryParams]="{tab: 'orders'}" (click)="userMenuOpen = false"
                   class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <span>📦</span> My Orders
                </a>
                <a routerLink="/preferences" (click)="userMenuOpen = false"
                   class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <span>⚙️</span> Preferences
                </a>
                <!-- Seller Dashboard (only for SELLER role) -->
                <a *ngIf="isSeller" routerLink="/seller" (click)="userMenuOpen = false"
                   class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <span>🏪</span> Seller Dashboard
                </a>
                <!-- Sponsor Dashboard (only for SPONSOR role) -->
                <a *ngIf="isSponsor" routerLink="/sponsor-dashboard" (click)="userMenuOpen = false"
                   class="flex items-center gap-2 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50">
                  <span>🤝</span> Sponsor Dashboard
                </a>
                <!-- Admin Panel (only for ADMIN role) -->
                <a *ngIf="isAdmin" routerLink="/admin" (click)="userMenuOpen = false"
                   class="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50">
                  <span>🔧</span> Admin Panel
                </a>
                <div class="border-t mt-2 pt-2">
                  <button (click)="logout()"
                          class="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <span>🚪</span> Logout
                  </button>
                </div>
              </div>
            </div>
            <ng-template #loginButton>
              <a routerLink="/auth/login"
                 class="text-cream-beige hover:text-sage-green transition-colors flex items-center gap-1 px-3 py-2 rounded-lg bg-sage-green/20 hover:bg-sage-green/30">
                <span>👤</span>
                <span class="text-sm font-medium">Login</span>
              </a>
            </ng-template>

            <!-- Mobile Menu Button -->
            <button
              (click)="toggleMobileMenu()"
              class="lg:hidden text-cream-beige p-2">
              <span class="text-xl">{{mobileMenuOpen ? '✕' : '☰'}}</span>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div *ngIf="mobileMenuOpen"
             class="lg:hidden py-4 space-y-2 border-t border-olive-green/20">
          <a routerLink="/"
             (click)="toggleMobileMenu()"
             routerLinkActive="text-sage-green"
             [routerLinkActiveOptions]="{exact: true}"
             class="block py-2 text-cream-beige hover:text-sage-green">
            🏠 Home
          </a>
          <a routerLink="/map"
             (click)="toggleMobileMenu()"
             routerLinkActive="text-sage-green"
             class="block py-2 text-cream-beige hover:text-sage-green">
            🗺️ Map
          </a>
          <a routerLink="/campsites"
             (click)="toggleMobileMenu()"
             routerLinkActive="text-sage-green"
             class="block py-2 text-cream-beige hover:text-sage-green">
            ⛺ Campsites
          </a>
          <a routerLink="/marketplace"
             (click)="toggleMobileMenu()"
             routerLinkActive="text-sage-green"
             class="block py-2 text-cream-beige hover:text-sage-green">
            🛍️ Marketplace
          </a>
          <a routerLink="/events"
             (click)="toggleMobileMenu()"
             routerLinkActive="text-sage-green"
             class="block py-2 text-cream-beige hover:text-sage-green">
            📅 Events
          </a>
          <a routerLink="/community"
             (click)="toggleMobileMenu()"
             routerLinkActive="text-sage-green"
             class="block py-2 text-cream-beige hover:text-sage-green">
            💬 Community
          </a>
          <!-- Sponsors (only for SPONSOR role) -->
          <a *ngIf="isSponsor"
             routerLink="/sponsors"
             (click)="toggleMobileMenu()"
             routerLinkActive="text-sage-green"
             class="block py-2 text-orange-400 hover:text-orange-300">
            🤝 Sponsors
          </a>
          <!-- Seller Dashboard (only for SELLER role) -->
          <a *ngIf="isSeller"
             routerLink="/seller"
             (click)="toggleMobileMenu()"
             routerLinkActive="text-sage-green"
             class="block py-2 text-cream-beige hover:text-sage-green">
            🏪 Seller Dashboard
          </a>
          <!-- Sponsor Dashboard (only for SPONSOR role) -->
          <a *ngIf="isSponsor"
             routerLink="/sponsor-dashboard"
             (click)="toggleMobileMenu()"
             routerLinkActive="text-sage-green"
             class="block py-2 text-orange-400 hover:text-orange-300">
            🤝 Sponsor Dashboard
          </a>
          <!-- Admin Panel (only for ADMIN role) -->
          <a *ngIf="isAdmin"
             routerLink="/admin"
             (click)="toggleMobileMenu()"
             routerLinkActive="text-sage-green"
             class="block py-2 text-amber-400 hover:text-amber-300">
            🔧 Admin Panel
          </a>
          <div class="border-t border-olive-green/20 pt-2 mt-2">
            <ng-container *ngIf="currentUser; else mobileLogin">
              <a routerLink="/dashboard"
                 (click)="toggleMobileMenu()"
                 class="block py-2 text-cream-beige hover:text-sage-green">
                📊 Dashboard
              </a>
              <a routerLink="/profile"
                 (click)="toggleMobileMenu()"
                 class="block py-2 text-cream-beige hover:text-sage-green">
                👤 My Profile
              </a>
              <a routerLink="/dashboard" [queryParams]="{tab: 'orders'}"
                 (click)="toggleMobileMenu()"
                 class="block py-2 text-cream-beige hover:text-sage-green">
                📦 My Orders
              </a>
              <a routerLink="/preferences"
                 (click)="toggleMobileMenu()"
                 class="block py-2 text-cream-beige hover:text-sage-green">
                ⚙️ Preferences
              </a>
              <button (click)="logout(); toggleMobileMenu()"
                      class="block w-full text-left py-2 text-red-400 hover:text-red-300">
                🚪 Logout
              </button>
            </ng-container>
            <ng-template #mobileLogin>
              <a routerLink="/auth/login"
                 (click)="toggleMobileMenu()"
                 class="block py-2 text-cream-beige hover:text-sage-green">
                👤 Login / Register
              </a>
            </ng-template>
          </div>
        </div>
      </nav>
    </header>
  `
})
export class NavigationComponent implements OnInit {
  mobileMenuOpen = false;
  userMenuOpen = false;
  cartCount = 0;
  currentUser: User | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  // Role checks - strictly check for the specific role only
  get isSeller(): boolean {
    return this.currentUser?.role === 'SELLER' || this.currentUser?.role === 'ADMIN';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  get isOrganizer(): boolean {
    return this.currentUser?.role === 'ORGANIZER' || this.currentUser?.role === 'ADMIN';
  }

  get isSponsor(): boolean {
    return this.currentUser?.role === 'SPONSOR' || this.currentUser?.role === 'ADMIN';
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.userMenuOpen = false;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.userMenuOpen = false;
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-container')) {
      this.userMenuOpen = false;
    }
  }
}
