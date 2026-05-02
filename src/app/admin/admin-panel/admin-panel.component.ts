import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';
import { SponsorsManagementComponent } from '../sponsors-management/sponsors-management.component';
import { CampsitesManagementComponent } from '../campsites-management/campsites-management.component';
import { UsersManagementComponent } from '../users-management/users-management.component';
import { CampHighlightsManagementComponent } from '../camp-highlights-management/camp-highlights-management.component';
import { EventsAdminManagementComponent } from '../events-management/events-management.component';
import { MarketplaceManagementComponent } from '../marketplace-management/marketplace-management.component';
import { ReportsManagementComponent } from '../reports-management/reports-management.component';
import { ReservationsManagementComponent } from '../reservations-management/reservations-management.component';
import { ModerationPanelComponent } from '../moderation-panel/moderation-panel.component';
import { GamificationManagementComponent } from '../gamification-management/gamification-management.component';
import { AuthService } from '../../services/auth.service';
import { ViewModeService } from '../../services/view-mode.service';
import { AccountProfileService } from '../../services/account-profile.service';
import { User } from '../../models/api.models';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    AdminSidebarComponent,
    AdminDashboardComponent,
    SponsorsManagementComponent,
    CampsitesManagementComponent,
    UsersManagementComponent,
    CampHighlightsManagementComponent,
    EventsAdminManagementComponent,
    MarketplaceManagementComponent,
    ReportsManagementComponent,
    ReservationsManagementComponent,
    ModerationPanelComponent,
    GamificationManagementComponent,
  ],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css'],
})
export class AdminPanelComponent {
  activeSection = signal('dashboard');

  systemTimeLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  profileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private viewMode: ViewModeService,
    private accountProfile: AccountProfileService
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const el = ev.target as HTMLElement;
    if (!el.closest('[data-admin-profile-root]')) {
      this.profileMenuOpen = false;
    }
  }

  setSection(section: string): void {
    // Navigate to external route for flagged messages
    if (section === 'flagged_messages') {
      this.router.navigate(['/admin/flagged-messages']);
      return;
    }
    this.activeSection.set(section);
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  get currentAdmin(): User | null {
    return this.authService.getCurrentUser();
  }

  get headerAvatar(): string | undefined {
    const avatar = this.accountProfile.resolveStoredImageUrl(this.currentAdmin?.avatar);
    return avatar || undefined;
  }

  get headerName(): string {
    return this.currentAdmin?.name || this.currentAdmin?.username || 'Admin';
  }

  get headerInitials(): string {
    return this.accountProfile.initialsFromName(this.headerName, 'AD');
  }

  goToSettings(): void {
    this.profileMenuOpen = false;
    this.router.navigate(['/admin/settings']);
  }

  switchToCamperSpace(): void {
    this.profileMenuOpen = false;
    this.viewMode.enterCamperView();
    this.router.navigate(['/home']);
  }

  logoutFromMenu(): void {
    this.profileMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
