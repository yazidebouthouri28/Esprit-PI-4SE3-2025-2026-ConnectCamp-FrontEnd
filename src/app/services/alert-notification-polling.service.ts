import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval, switchMap, catchError, of, EMPTY } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

export interface BackendNotification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AlertNotificationPollingService implements OnDestroy {

  private readonly pollIntervalMs = 30_000;
  private readonly apiBase = `${environment.apiUrl}/api/notifications`;

  private pollSub?: Subscription;
  private seenIds = new Set<number>();

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private notif: NotificationService
  ) {}

  /** Call once after login (e.g. from AppComponent or a root guard). */
  start(): void {
    if (this.pollSub) return; // already running

    // Fetch immediately, then every 30 s
    this.fetchOnce();
    this.pollSub = interval(this.pollIntervalMs).subscribe(() => this.fetchOnce());
  }

  stop(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
    this.seenIds.clear();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private fetchOnce(): void {
    const user = this.auth.getCurrentUser();
    if (!user?.id) return;

    this.http
      .get<any>(`${this.apiBase}/user/${user.id}/unread`)
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        const notifications: BackendNotification[] = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        notifications.forEach(n => {
          if (!this.seenIds.has(n.id)) {
            this.seenIds.add(n.id);
            this.showToast(n.message);
          }
        });
      });
  }

  private showToast(message: string): void {
    if (message.startsWith('✅')) {
      this.notif.success(message, 7000);
    } else if (message.startsWith('🚑') || message.startsWith('👷')) {
      this.notif.info(message, 7000);
    } else {
      this.notif.info(message, 6000);
    }
  }
}
