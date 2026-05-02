import { Routes } from '@angular/router';
import { AuthGuard, SellerGuard, ClientGuard, AdminGuard, OrganizerOnlyGuard, OrganizerGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Redirect root to the auth login page
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // Home page – only accessible after login
  { path: 'home', loadComponent: () => import('./components/home-hub/home-hub.component').then(m => m.HomeHubComponent), canActivate: [AuthGuard] },

  // --- Campsites (public) ---
  {
    path: 'campsites',
    loadComponent: () => import('./components/campsites/campsite-listings.component').then(m => m.CampsiteListingsComponent)
  },
  {
    path: 'campsites/:siteId/highlights/:highlightId',
    loadComponent: () => import('./components/camp-highlight-detail/camp-highlight-detail.component').then(m => m.CampHighlightDetailComponent)
  },
  {
    path: 'campsites/:id',
    loadComponent: () => import('./components/campsite-detail/campsite-detail.component').then(m => m.CampsiteDetailComponent)
  },
  {
    path: 'campsites/:id/reserve',
    loadComponent: () => import('./components/campsite-reservation/campsite-reservation.component').then(m => m.CampsiteReservationComponent),
    canActivate: [AuthGuard]
  },

  // --- Events: public listing ---
  { path: 'events', loadComponent: () => import('./components/events/events-management.component').then(m => m.EventsManagementComponent) },
  { path: 'events/:id', loadComponent: () => import('./components/event-detail/event-detail.component').then(m => m.EventDetailComponent) },
  { path: 'gamification', loadComponent: () => import('./admin/gamification-management/gamification-management.component').then(m => m.GamificationManagementComponent) },

  // --- Events management for admin/organizer (protected) ---
  { path: 'events/manage', loadComponent: () => import('./admin/events-management/events-management.component').then(m => m.EventsAdminManagementComponent), canActivate: [OrganizerOnlyGuard] },

  // --- Marketplace ---
  { path: 'marketplace', loadComponent: () => import('./components/marketplace/marketplace.component').then(m => m.MarketplaceComponent) },
  { path: 'marketplace/:id', loadComponent: () => import('./components/marketplace/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },

  // --- Community ---
  { path: 'community', loadComponent: () => import('./components/community/community-forum.component').then(m => m.CommunityForumComponent) },

  // --- Map ---
  { path: 'map', loadComponent: () => import('./components/map/interactive-map.component').then(m => m.InteractiveMapComponent) },

  // --- Sponsors ---
  { path: 'sponsors', loadComponent: () => import('./components/sponsors/sponsors.component').then(m => m.SponsorsComponent) },

  // --- Client / Dashboard ---
  { path: 'cart', loadComponent: () => import('./components/client/client.component').then(m => m.ClientComponent), canActivate: [AuthGuard], data: { defaultTab: 'cart' } },
  { path: 'dashboard', loadComponent: () => import('./components/client/client.component').then(m => m.ClientComponent), canActivate: [AuthGuard] },
  { path: 'client', redirectTo: '/dashboard', pathMatch: 'full' },

  // --- Profile ---
  { path: 'profile', loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent), canActivate: [AuthGuard] },
  { path: 'profile/:id', loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'settings', loadComponent: () => import('./components/account-settings/account-settings.component').then(m => m.AccountSettingsComponent), canActivate: [AuthGuard] },

  // --- Preferences ---
  { path: 'preferences', loadComponent: () => import('./components/user-preferences/user-preferences.component').then(m => m.UserPreferencesComponent), canActivate: [AuthGuard] },

  // --- Seller dashboard ---
  { path: 'seller', loadComponent: () => import('./components/seller/seller.component').then(m => m.SellerComponent), canActivate: [AuthGuard], data: { role: 'SELLER' } },

  // --- Sponsor dashboard ---
  { path: 'sponsor-dashboard', loadComponent: () => import('./components/sponsors/sponsors.component').then(m => m.SponsorsComponent), canActivate: [AuthGuard], data: { role: 'SPONSOR' } },

  // --- Admin panel (admin only) ---
  { path: 'admin', loadComponent: () => import('./admin/admin-panel/admin-panel.component').then(m => m.AdminPanelComponent), canActivate: [AdminGuard] },
  { path: 'admin/gamification', loadComponent: () => import('./admin/gamification-management/gamification-management.component').then(m => m.GamificationManagementComponent), canActivate: [AdminGuard] },
  { path: 'admin/settings', loadComponent: () => import('./components/account-settings/account-settings.component').then(m => m.AccountSettingsComponent), canActivate: [AdminGuard] },

  // --- Authentication routes ---
  { path: 'auth', loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent) },
  { path: 'auth/login', loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent) },
  { path: 'auth/register', loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent) },
  { path: 'auth/forgot-password', loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent) },

  // --- Convenience redirects for login/register ---
  { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: '/auth/register', pathMatch: 'full' },

  // --- Organizer events management (copy of admin table) ---
  {
    path: 'organizer/events',
    loadComponent: () => import('./components/organizer-events/organizer-events.component').then(m => m.OrganizerEventsComponent),
    canActivate: [OrganizerOnlyGuard]
  },
  {
    path: 'organizer/gamification',
    loadComponent: () => import('./admin/events-management/events-management.component').then(m => m.EventsAdminManagementComponent),
    canActivate: [OrganizerGuard],
    data: { defaultTab: 'gamifications' }
  },

  // --- Catch‑all: redirect to root (which goes to auth) ---
  { path: '**', redirectTo: '' }
];
