import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      <div *ngFor="let notification of notifications"
           [ngClass]="getNotificationClass(notification.type)"
           class="p-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
        <span class="text-xl">{{ getIcon(notification.type) }}</span>
        <p class="flex-1 text-sm">{{ notification.message }}</p>
        <button (click)="dismiss(notification.id)" 
                class="text-current opacity-60 hover:opacity-100 transition-opacity">
          ✕
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class NotificationComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(
      notifications => this.notifications = notifications
    );
  }

  getNotificationClass(type: string): string {
    const classes: Record<string, string> = {
      'success': 'bg-green-500 text-white',
      'error': 'bg-red-500 text-white',
      'warning': 'bg-yellow-500 text-white',
      'info': 'bg-blue-500 text-white'
    };
    return classes[type] || 'bg-gray-500 text-white';
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  }

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
}
