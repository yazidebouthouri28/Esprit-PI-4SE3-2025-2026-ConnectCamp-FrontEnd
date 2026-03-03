import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { ServicesManagementComponent } from '../services-management/services-management.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
    ServicesManagementComponent
  ],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css'],
})
export class AdminPanelComponent {
  activeSection = signal('dashboard');
  isMenuOpen = signal(false);

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
}
