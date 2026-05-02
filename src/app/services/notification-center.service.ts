import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, forkJoin, of, timer } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse, User } from '../models/api.models';
import { AuthService } from './auth.service';
import { NotificationService as ToastNotificationService } from './notification.service';

export interface UserInboxNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  isRead?: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationCenterService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastNotificationService);

  private readonly notificationsSubject = new BehaviorSubject<UserInboxNotification[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();

  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  private pollingSubscription: Subscription | null = null;
  private readonly authSubscription: Subscription;
  private currentUserId: number | null = null;
  private readonly announcedIds = new Set<number>();

  constructor() {
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      this.handleUserChanged(user);
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.authSubscription.unsubscribe();
  }

  refreshNow(): void {
    if (this.currentUserId == null) {
      return;
    }
    this.fetchState(this.currentUserId);
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<UserInboxNotification>>(
        `${environment.apiUrl}/api/notifications/${notificationId}/read`,
        {}
      )
      .pipe(
        map(() => {
          this.notificationsSubject.next(
            this.notificationsSubject.value.filter((notification) => notification.id !== notificationId)
          );
          this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
          return void 0;
        }),
        catchError(() => of(void 0))
      );
  }

  markAllAsRead(): Observable<void> {
    if (this.currentUserId == null) {
      return of(void 0);
    }

    return this.http
      .post<ApiResponse<void>>(
        `${environment.apiUrl}/api/notifications/user/${this.currentUserId}/read-all`,
        {}
      )
      .pipe(
        map(() => {
          this.notificationsSubject.next([]);
          this.unreadCountSubject.next(0);
          return void 0;
        }),
        catchError(() => of(void 0))
      );
  }

  private handleUserChanged(user: User | null): void {
    const nextUserId = this.parseUserId(user?.id);
    if (this.currentUserId === nextUserId) {
      return;
    }

    this.currentUserId = nextUserId;
    this.stopPolling();
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    this.announcedIds.clear();

    if (nextUserId != null) {
      this.startPolling(nextUserId);
    }
  }

  private startPolling(userId: number): void {
    this.pollingSubscription = timer(0, 120000).subscribe(() => {
      this.fetchState(userId);
    });
  }

  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  private fetchState(userId: number): void {
    forkJoin({
      notifications: this.fetchUnreadNotifications(userId),
      count: this.fetchUnreadCount(userId)
    }).subscribe(({ notifications, count }) => {
      const previousIds = new Set(this.notificationsSubject.value.map((notification) => notification.id));

      this.notificationsSubject.next(notifications);
      this.unreadCountSubject.next(count);

      notifications
        .filter((notification) => !previousIds.has(notification.id) && !this.announcedIds.has(notification.id))
        .slice(0, 3)
        .forEach((notification) => {
          this.announcedIds.add(notification.id);
          const title = (notification.title || '').trim();
          const message = (notification.message || '').trim();
          this.toastService.info(title ? `${title}: ${message}` : message, 7000);
        });
    });
  }

  private fetchUnreadNotifications(userId: number): Observable<UserInboxNotification[]> {
    return this.http
      .get<ApiResponse<UserInboxNotification[]>>(
        `${environment.apiUrl}/api/notifications/user/${userId}/unread`
      )
      .pipe(
        map((response) => response.data ?? []),
        catchError(() => of([]))
      );
  }

  private fetchUnreadCount(userId: number): Observable<number> {
    return this.http
      .get<ApiResponse<number>>(
        `${environment.apiUrl}/api/notifications/user/${userId}/unread/count`
      )
      .pipe(
        map((response) => response.data ?? 0),
        catchError(() => of(0))
      );
  }

  private parseUserId(rawUserId: string | number | null | undefined): number | null {
    const userId = Number(rawUserId);
    return Number.isFinite(userId) && userId > 0 ? userId : null;
  }
}
