import { Routes } from '@angular/router';
import { AuthGuard, SellerGuard, ClientGuard, AdminGuard, OrganizerOnlyGuard, OrganizerGuard } from './guards/auth.guard';
import { ParticipantGuard } from './guards/participant.guard';

export const routes: Routes = [
  // Landing Page (Home Hub) - Publicly accessible
  { path: '', loadComponent: () => import('./components/home-hub/home-hub.component').then(m => m.HomeHubComponent) },
  { path: 'home', loadComponent: () => import('./components/home-hub/home-hub.component').then(m => m.HomeHubComponent) },

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
  // Must be BEFORE events/:id to avoid route conflict
  { path: 'events/:eventId/work-roles', loadComponent: () => import('./modules/services/components/event-apply/event-apply.component').then(m => m.EventApplyComponent), canActivate: [ParticipantGuard] },
  { path: 'events/:id', loadComponent: () => import('./components/event-detail/event-detail.component').then(m => m.EventDetailComponent) },

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

  // --- Services & Packs & Bundles (Farah module) ---
  { path: 'services', loadChildren: () => import('./modules/services/services.routes').then(m => m.SERVICES_ROUTES) },

  // --- Emergency & Protocols (Farah module) ---
  { path: 'emergency', loadChildren: () => import('./modules/emergency/emergency.routes').then(m => m.EMERGENCY_ROUTES) },

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
  {
    path: 'seller',
    loadComponent: () =>
      import('./components/seller/seller.component')
        .then(m => m.SellerComponent),
    canActivate: [AuthGuard],
    data: { roles: ['SELLER', 'ADMIN'] }
  },

  // --- Sponsor dashboard ---
  { path: 'sponsor-dashboard', loadComponent: () => import('./components/sponsors/sponsors.component').then(m => m.SponsorsComponent), canActivate: [AuthGuard], data: { role: 'SPONSOR' } },

  // --- Admin panel (admin only) ---
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-panel/admin-panel.component').then(m => m.AdminPanelComponent),
    canActivate: [AdminGuard],
    children: [
      // Emergency admin routes
      { path: 'emergency/protocols', loadComponent: () => import('./modules/emergency/components/protocole-list/protocole-list.component').then(m => m.ProtocoleListComponent) },
      { path: 'emergency/detail/:id', loadComponent: () => import('./modules/emergency/components/alerte-detail/alerte-detail.component').then(m => m.AlerteDetailComponent) },
      { path: 'emergency/intervention/create/:alertId', loadComponent: () => import('./modules/emergency/components/intervention-create/intervention-create.component').then(m => m.InterventionCreateComponent) },
      { path: 'emergency/protocole/create', loadComponent: () => import('./modules/emergency/components/protocole-create/protocole-create.component').then(m => m.ProtocoleCreateComponent) },
      { path: 'emergency/protocole/detail/:id', loadComponent: () => import('./modules/emergency/components/protocole-detail/protocole-detail.component').then(m => m.ProtocoleDetailComponent) },
      { path: 'emergency/protocole/edit/:id', loadComponent: () => import('./modules/emergency/components/protocole-edit/protocole-edit.component').then(m => m.ProtocoleEditComponent) },
      // Services admin routes
      { path: 'services/create', loadComponent: () => import('./modules/services/components/service-create/service-create.component').then(m => m.ServiceCreateComponent) },
      { path: 'services/edit/:id', loadComponent: () => import('./modules/services/components/service-edit/service-edit.component').then(m => m.ServiceEditComponent) },
      { path: 'services/packs/create', loadComponent: () => import('./modules/services/components/pack-create/pack-create.component').then(m => m.PackCreateComponent) },
      { path: 'services/packs/edit/:id', loadComponent: () => import('./modules/services/components/pack-edit/pack-edit.component').then(m => m.PackEditComponent) },
      { path: 'services/promotions/create', loadComponent: () => import('./modules/services/components/promotion-create/promotion-create.component').then(m => m.PromotionCreateComponent) },
      { path: 'services/promotions/edit/:id', loadComponent: () => import('./modules/services/components/promotion-edit/promotion-edit.component').then(m => m.PromotionEditComponent) },
      { path: 'services/packs', loadComponent: () => import('./modules/services/components/pack-list/pack-list.component').then(m => m.PackListComponent) },
      { path: 'services/packs/stats', loadComponent: () => import('./modules/services/components/pack-stats/pack-stats.component').then(m => m.PackStatsComponent) },
    ]
  },
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
    loadComponent: () => import('./admin/gamification-management/gamification-management.component').then(m => m.GamificationManagementComponent),
    canActivate: [OrganizerOnlyGuard]
  },

  // --- Catch‑all: redirect to root (which goes to auth) ---
  { path: '**', redirectTo: '' }
];
