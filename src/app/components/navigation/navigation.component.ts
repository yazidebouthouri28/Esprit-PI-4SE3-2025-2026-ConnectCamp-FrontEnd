import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountProfileService } from '../../services/account-profile.service';
import { ViewModeService } from '../../services/view-mode.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userName = '';
  userRole = '';
  userAvatar = '';
  logoError = false;
  profileDropdownOpen = false;
  mobileMenuOpen = false;
  private authSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private accountProfile: AccountProfileService,
    private router: Router,
    private viewMode: ViewModeService
  ) {}

  ngOnInit(): void {
    this.updateUserState();
    // Subscribe to auth changes (if your AuthService emits events)
    this.authSubscription = this.authService.currentUser$.subscribe(() => {
      this.updateUserState();
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private updateUserState(): void {
    const user = this.authService.getCurrentUser();
    this.isLoggedIn = !!user;
    this.userName = user?.name || user?.username || '';
    this.userRole = user?.role || '';
    this.userAvatar = this.accountProfile.resolveStoredImageUrl(user?.avatar) || '';
  }

  /** True only for organizer role (not admin). */
  get showManageMyEvents(): boolean {
    return this.authService.getCurrentUser()?.role === 'ORGANIZER';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get adminInCamperSpace(): boolean {
    return this.viewMode.adminInCamperSpace();
  }

  goToAdminSpace(): void {
    this.viewMode.exitCamperView();
    this.router.navigate(['/admin']);
    this.profileDropdownOpen = false;
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
    this.profileDropdownOpen = false;
    this.mobileMenuOpen = false;
  }

  get userInitials(): string {
    return this.accountProfile.initialsFromName(this.userName || 'User', 'CC');
  }

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
    this.profileDropdownOpen = false;
    this.mobileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close dropdown if clicked outside
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-container')) {
      this.profileDropdownOpen = false;
    }
  }
}
