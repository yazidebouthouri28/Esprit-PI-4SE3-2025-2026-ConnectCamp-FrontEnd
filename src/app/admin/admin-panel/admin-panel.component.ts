import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';
import { SponsorsManagementComponent } from '../sponsors-management/sponsors-management.component';
import { ModerationPanelComponent } from '../moderation-panel/moderation-panel.component';
import { MarketplaceManagementComponent } from '../marketplace-management/marketplace-management.component';
import { ReservationsManagementComponent } from '../reservations-management/reservations-management.component';
import { CampsitesManagementComponent } from '../campsites-management/campsites-management.component';
import { EventsAdminManagementComponent } from '../events-management/events-management.component';
import { UsersManagementComponent } from '../users-management/users-management.component';
import { ReportsManagementComponent } from '../reports-management/reports-management.component';
import { ServiceListComponent } from '../../modules/services/components/service-list/service-list.component';
import { PackListComponent } from '../../modules/services/components/pack-list/pack-list.component';
import { PromotionListComponent } from '../../modules/services/components/promotion-list/promotion-list.component';
import { AlerteDashboardComponent } from '../../modules/emergency/components/alerte-dashboard/alerte-dashboard.component';
import { CandidatureManageComponent } from '../../modules/services/components/candidature-manage/candidature-manage.component';
import { CandidatureListComponent } from '../../modules/services/components/candidature-list/candidature-list.component';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AdminSidebarComponent,
    AdminDashboardComponent,
    SponsorsManagementComponent,
    ModerationPanelComponent,
    MarketplaceManagementComponent,
    ReservationsManagementComponent,
    CampsitesManagementComponent,
    EventsAdminManagementComponent,
    UsersManagementComponent,
    ReportsManagementComponent,
    ServiceListComponent,
    PackListComponent,
    PromotionListComponent,
    AlerteDashboardComponent,
    CandidatureManageComponent,
    CandidatureListComponent,
  ],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css'],
})
export class AdminPanelComponent {
  activeSection = signal('dashboard');
  isMenuOpen = signal(false);
  user = signal<any>(null);

  systemTimeLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date());

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    this.user.set(this.userService.getLoggedInUser());
  }

  get isChildRoute(): boolean {
    const url = this.router.url;
    return (url.includes('/admin/') || url.includes('/organizer/')) &&
           (url !== '/admin' && url !== '/organizer');
  }

  setSection(section: string) {
    this.activeSection.set(section);
  }

  renderContent() {
    return this.activeSection();
  }

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
