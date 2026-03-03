import { Routes } from '@angular/router';
import { AuthGuard, SellerGuard, ClientGuard, AdminGuard, OrganizerGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Home routes
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },

  // Campsite routes
  {
    path: 'campsites',
    loadComponent: () => import('./components/campsites/campsite-listings.component').then(m => m.CampsiteListingsComponent)
  },
  {
    path: 'campsites/:id',
    loadComponent: () => import('./components/campsite-detail/campsite-detail.component').then(m => m.CampsiteDetailComponent)
  },

  // Event routes
  {
    path: 'events',
    loadComponent: () => import('./components/events/events-management.component').then(m => m.EventsManagementComponent)
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./components/event-detail/event-detail.component').then(m => m.EventDetailComponent)
  },

  // Marketplace routes (e-commerce)
  {
    path: 'marketplace',
    loadComponent: () => import('./components/marketplace/marketplace.component').then(m => m.MarketplaceComponent)
  },
  {
    path: 'marketplace/:id',
    loadComponent: () => import('./components/marketplace/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },

  // Community routes
  {
    path: 'community',
    loadComponent: () => import('./components/community/community-forum.component').then(m => m.CommunityForumComponent)
  },

  // Map route
  {
    path: 'map',
    loadComponent: () => import('./components/map/interactive-map.component').then(m => m.InteractiveMapComponent)
  },

  // Sponsors route
  {
    path: 'sponsors',
    loadComponent: () => import('./components/sponsors/sponsors.component').then(m => m.SponsorsComponent)
  },

  // Cart route - standalone page
  {
    path: 'cart',
    loadComponent: () => import('./components/client/client.component').then(m => m.ClientComponent),
    canActivate: [AuthGuard],
    data: { defaultTab: 'cart' }
  },

  // Dashboard route - main user dashboard
  {
    path: 'dashboard',
    loadComponent: () => import('./components/client/client.component').then(m => m.ClientComponent),
    canActivate: [AuthGuard]
  },

  // Legacy /client redirect to /dashboard
  {
    path: 'client',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Profile routes
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
  },

  // User preferences
  {
    path: 'preferences',
    loadComponent: () => import('./components/user-preferences/user-preferences.component').then(m => m.UserPreferencesComponent),
    canActivate: [AuthGuard]
  },

  // E-commerce Seller Dashboard
  {
    path: 'seller',
    loadComponent: () => import('./components/seller/seller.component').then(m => m.SellerComponent),
    canActivate: [AuthGuard],

  },

  // Sponsor Dashboard
  {
    path: 'sponsor-dashboard',
    loadComponent: () => import('./components/sponsors/sponsors.component').then(m => m.SponsorsComponent),
    canActivate: [AuthGuard],
    data: { role: 'SPONSOR' }
  },

  // Admin Panel (comprehensive)
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-panel/admin-panel.component').then(m => m.AdminPanelComponent),
    canActivate: [AdminGuard]
  },

  // Authentication routes - Single unified auth page
  {
    path: 'auth',
    loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    redirectTo: '/auth/register',
    pathMatch: 'full'
  },

  // Fallback route
  { path: '**', redirectTo: '' }
];
