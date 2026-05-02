import { Component, input, output, inject, OnInit } from '@angular/core';
import { NgClass, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AccountProfileService } from '../../services/account-profile.service';
import { User } from '../../models/api.models';

interface NavItem {
  id: string;
  label: string;
  icon?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [NgClass, CommonModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css'],
})
export class AdminSidebarComponent implements OnInit {
  activeSection = input.required<string>();
  isCollapsed = false;
  onSectionChange = output<string>();
  logoutClicked = output<void>();

  private authService = inject(AuthService);
  private accountProfile = inject(AccountProfileService);

  currentUser: User | null = null;
  isAdmin = false;
  isOrganizer = false;

  // Full sections for admins
  fullNavSections: NavSection[] = [
    {
      title: 'Core Management',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'M3 7a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM14 7a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V7zM3 17a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3zM14 17a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3z' },
        { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { id: 'sponsors', label: 'Sponsors & Partners', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      ]
    },
    {
      title: 'Market Operations',
      items: [
        { id: 'campsites', label: 'Campsites', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        { id: 'camp_highlights', label: 'Camp Highlights', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
        { id: 'events', label: 'Events & Gamifications', icon: 'M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z' },
        { id: 'products_categories', label: 'Products & Categories', icon: 'M20 13V7a2 2 0 00-2-2h-4V3H6a2 2 0 00-2 2v8m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4m-8 0H4m8 0v5' },
        { id: 'inventory', label: 'Inventory & Warehouses', icon: 'M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
        { id: 'orders', label: 'Orders', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1 5m11-5l1 5M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z' },
        { id: 'rentals_management', label: 'Rentals Management', icon: 'M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z' },
        { id: 'reservations', label: 'Reservations', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 004 0M9 5a2 2 0 012 2v1m0 0a2 2 0 002-2m-2 2H9' },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { id: 'reports', label: 'Reports', icon: 'M9 17v-6m4 6V7m4 10v-4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z' },
        { id: 'moderation', label: 'Moderation', icon: 'M12 8c-1.657 0-3 .895-3 2v1H7a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 00-2-2h-2v-1c0-1.105-1.343-2-3-2z' },
        { id: 'flagged_messages', label: 'Flagged Messages', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
      ]
    }
  ];

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.role === 'ADMIN';
    this.isOrganizer = this.currentUser?.role === 'ORGANIZER';
  }

  // For admins, we use the full sections; for organizers, we provide a custom section with only the Events item.
  get navSections(): NavSection[] {
    if (this.isAdmin) {
      return this.fullNavSections;
    } else if (this.isOrganizer) {
      return [
        {
          title: 'Event Management',
          items: [
            { id: 'events', label: 'Events & Gamifications', icon: 'M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z' }
          ]
        }
      ];
    }
    return []; // fallback
  }

  selectSection(id: string) {
    this.onSectionChange.emit(id);
  }

  get profileAvatar(): string {
    return this.accountProfile.resolveStoredImageUrl(this.currentUser?.avatar) || '';
  }

  get profileInitials(): string {
    return this.accountProfile.initialsFromName(this.currentUser?.name || this.currentUser?.username || 'Admin', 'AD');
  }

  toggleCollapsed() {
    this.isCollapsed = !this.isCollapsed;
  }
}
