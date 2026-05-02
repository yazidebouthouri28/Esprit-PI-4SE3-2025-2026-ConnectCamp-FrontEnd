import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  NotificationCenterService,
  UserInboxNotification
} from '../../services/notification-center.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative notification-bell-container">
      <button
        type="button"
        class="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-cream transition-colors hover:border-white/30 hover:text-sage"
        aria-label="Notifications"
        (click)="toggleDropdown($event)">
        <span class="text-lg leading-none">{{ bellIcon }}</span>
        <span
          *ngIf="unreadCount > 0"
          class="absolute -right-1 -top-1 min-w-[1.25rem] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <div
        *ngIf="dropdownOpen"
        class="absolute right-0 top-12 z-[70] w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p class="text-sm font-black text-[#1a2e1a]">Notifications</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {{ unreadCount }} non lue{{ unreadCount > 1 ? 's' : '' }}
            </p>
          </div>
          <button
            *ngIf="notifications.length > 0"
            type="button"
            class="text-[10px] font-black uppercase tracking-widest text-[#2C4A3C] hover:text-[#1a2e1a]"
            (click)="markAllAsRead($event)">
            Tout lire
          </button>
        </div>

        <div *ngIf="notifications.length === 0" class="px-4 py-6 text-center text-sm text-gray-500">
          Aucune notification non lue.
        </div>

        <div *ngIf="notifications.length > 0" class="max-h-96 overflow-y-auto">
          <button
            *ngFor="let notification of notifications; trackBy: trackByNotificationId"
            type="button"
            class="flex w-full gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50"
            (click)="openNotification(notification, $event)">
            <span class="pt-0.5 text-base">{{ iconFor(notification.type) }}</span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs font-black uppercase tracking-wider text-[#1a2e1a]">
                {{ notification.title || 'Notification' }}
              </span>
              <span class="mt-1 block text-xs text-gray-600">
                {{ notification.message }}
              </span>
              <span class="mt-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {{ notification.createdAt ? (notification.createdAt | date:'MMM d, HH:mm') : 'Maintenant' }}
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly notificationCenter = inject(NotificationCenterService);
  private readonly router = inject(Router);
  private readonly subscription = new Subscription();

  readonly bellIcon = '\u{1F514}';
  dropdownOpen = false;
  unreadCount = 0;
  notifications: UserInboxNotification[] = [];

  ngOnInit(): void {
    this.subscription.add(
      this.notificationCenter.unreadCount$.subscribe((count) => {
        this.unreadCount = count;
      })
    );
    this.subscription.add(
      this.notificationCenter.notifications$.subscribe((notifications) => {
        this.notifications = notifications;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      this.notificationCenter.refreshNow();
    }
  }

  openNotification(notification: UserInboxNotification, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationCenter.markAsRead(notification.id).subscribe();
    this.dropdownOpen = false;

    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  markAllAsRead(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationCenter.markAllAsRead().subscribe(() => {
      this.dropdownOpen = false;
    });
  }

  iconFor(type: string): string {
    switch ((type || '').toUpperCase()) {
      case 'EVENT_COMPLETED':
        return '\u{1F3AF}';
      case 'BADGE_AWARDED':
        return '\u{1F3C5}';
      default:
        return '\u{1F514}';
    }
  }

  trackByNotificationId(_: number, notification: UserInboxNotification): number {
    return notification.id;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.notification-bell-container')) {
      this.dropdownOpen = false;
    }
  }
}
