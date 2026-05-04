import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, map, of, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
  ForgotPasswordResponse,
  ResetPasswordRequest
} from '../models/api.models';

type UserRole = User['role'];
const VALID_ROLES: UserRole[] = ['CLIENT', 'SELLER', 'ORGANIZER', 'CAMPER', 'SPONSOR', 'ADMIN', 'USER' as any, 'PARTICIPANT' as any];

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  readonly tokenKey = 'auth_token';
  readonly userKey = 'current_user';

  private isBrowser: boolean;
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadStoredUser();
  }

  // ── SSR-safe localStorage ─────────────────────────────────────────────────

  private storageGet(key: string): string | null {
    if (!this.isBrowser) return null;
    try { return localStorage.getItem(key); } catch { return null; }
  }
  private storageSet(key: string, value: string): void {
    if (!this.isBrowser) return;
    try { localStorage.setItem(key, value); } catch { }
  }
  private storageRemove(key: string): void {
    if (!this.isBrowser) return;
    try { localStorage.removeItem(key); } catch { }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  private loadStoredUser(): void {
    const token = this.storageGet(this.tokenKey);
    const userJson = this.storageGet(this.userKey);
    if (token && userJson) {
      try { this.currentUserSubject.next(JSON.parse(userJson) as User); }
      catch { this.logout(); }
    }
  }

  // ── Auth calls ────────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const body = {
      username: credentials.email,
      password: credentials.password
    };

    return this.http.post<any>(`${this.apiUrl}/login`, body).pipe(
      map(raw => this.extractAuthResponse(raw)),
      tap(auth => {
        this.handleAuthSuccess(auth);
        // If user is an organizer, fetch their organizerId and update the stored user
        if (auth.user.role === 'ORGANIZER' && auth.user.id && auth.user.organizerId == null) {
          this.http.get<ApiResponse<number>>(`${environment.apiUrl}/api/organizers/by-user/${auth.user.id}`)
            .subscribe({
              next: (res) => {
                if (res.success && res.data) {
                  const updatedUser = { ...auth.user, organizerId: res.data };
                  this.storageSet(this.userKey, JSON.stringify(updatedUser));
                  this.currentUserSubject.next(updatedUser);
                }
              },
              error: (err) => console.warn('Failed to fetch organizer ID', err)
            });
        }
      }),
      catchError(error => {
        if (this.canUseOfflineAuth(error)) {
          const offlineAuth = this.buildOfflineAuthResponse(credentials.email);
          this.handleAuthSuccess(offlineAuth);
          return of(offlineAuth);
        }

        const msg = error.error?.message
          || error.error?.error
          || error.message
          || 'Login failed. Please check your credentials.';
        return throwError(() => new Error(msg));
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/register`, data).pipe(
      map(raw => this.extractAuthResponse(raw)),
      tap(auth => this.handleAuthSuccess(auth)),
      catchError(error => {
        if (this.canUseOfflineAuth(error)) {
          const offlineAuth = this.buildOfflineRegisterResponse(data);
          this.handleAuthSuccess(offlineAuth);
          return of(offlineAuth);
        }

        // Extract field-level validation errors (from @Valid / @Pattern on DTO)
        const fieldErrors = error.error?.data;
        if (fieldErrors && typeof fieldErrors === 'object') {
          const messages = Object.values(fieldErrors).join(' | ');
          return throwError(() => new Error(messages));
        }

        const msg = error.error?.message
          || error.error?.error
          || error.message
          || 'Registration failed. Please try again.';
        return throwError(() => new Error(msg));
      })
    );
  }

  requestPasswordResetCode(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ApiResponse<ForgotPasswordResponse>>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      map((res) => res.data ?? { status: 'sent' }),
      catchError(error => {
        const msg = error.error?.message
          || error.error?.error
          || error.message
          || 'Failed to send verification code.';
        return throwError(() => new Error(msg));
      })
    );
  }

  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/reset-password`, payload).pipe(
      map(() => void 0),
      catchError(error => {
        const msg = error.error?.message
          || error.error?.error
          || error.message
          || 'Password reset failed.';
        return throwError(() => new Error(msg));
      })
    );
  }

  // ── Response normalisation ────────────────────────────────────────────────

  private extractAuthResponse(raw: any): AuthResponse {
    const p = (raw?.data && raw?.success !== undefined) ? raw.data : raw;
    if (!p?.token) throw new Error('Invalid server response: token missing.');

    const rawRole = String(p.role ?? 'CLIENT').toUpperCase();
    const roleMap: Record<string, UserRole> = { 'USER': 'CLIENT' };
    const role: UserRole = roleMap[rawRole]
      ?? (VALID_ROLES.includes(rawRole as UserRole) ? (rawRole as UserRole) : 'CLIENT');

    const user: User = {
      id: String(p.userId ?? p.id),
      name: p.name ?? p.username,
      username: p.username,
      email: p.email,
      phone: p.phone,
      address: p.address,
      country: p.country,
      loyaltyPoints: p.loyaltyPoints ?? 0,
      role,
      organizerId: p.organizerId ? Number(p.organizerId) : undefined,  // <-- convert to number
      avatar: p.avatar,
      bio: p.bio,
      coverImage: p.coverImage,
      location: p.location,
      createdAt: p.createdAt ?? new Date().toISOString()
    };
    return { token: p.token, user };
  }

  private handleAuthSuccess(auth: AuthResponse): void {
    this.storageSet(this.tokenKey, auth.token);
    this.storageSet(this.userKey, JSON.stringify(auth.user));
    this.currentUserSubject.next(auth.user);
  }

  private preferencesKeyFor(email?: string | null): string | null {
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    return normalizedEmail ? `campconnect_preferences_done_${normalizedEmail}` : null;
  }

  private canUseOfflineAuth(error: any): boolean {
    if (environment.production || !environment.allowOfflineAuth) return false;

    const status = error?.status;
    if (status !== 0) return false;

    const message = String(error?.message ?? '').toLowerCase();
    return message.includes('unable to connect') || message.includes('network') || message.includes('server');
  }

  private buildOfflineAuthResponse(emailOrUsername: string): AuthResponse {
    const raw = (emailOrUsername || 'offline-user').trim();
    const username = raw.includes('@') ? raw.split('@')[0] : raw;
    const email = raw.includes('@') ? raw : `${username}@local.dev`;
    const normalized = username.toLowerCase();
    const role: UserRole = ['admin', 'ahmed', 'owner', 'super'].some((hint) => normalized.includes(hint))
      ? 'ADMIN'
      : 'CLIENT';

    const user: User = {
      id: `offline-${normalized || 'user'}`,
      name: username || 'Offline User',
      username: username || 'offline-user',
      email,
      role,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString()
    };

    return {
      token: this.buildOfflineToken(role),
      user
    };
  }

  private buildOfflineRegisterResponse(data: RegisterRequest): AuthResponse {
    const username = (data.username || data.name || 'offline-user').trim();
    const user: User = {
      id: `offline-${username.toLowerCase()}`,
      name: data.name || username,
      username,
      email: data.email || `${username}@local.dev`,
      phone: data.phone,
      address: data.address,
      country: data.country,
      role: data.role || 'CLIENT',
      loyaltyPoints: 0,
      createdAt: new Date().toISOString()
    };

    return {
      token: this.buildOfflineToken(user.role),
      user
    };
  }

  private buildOfflineToken(role: UserRole): string {
    const header = this.base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = this.base64UrlEncode(JSON.stringify({
      sub: 'offline-user',
      role,
      exp: Math.floor((Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000)
    }));
    return `${header}.${payload}.offline-signature`;
  }

  private base64UrlEncode(value: string): string {
    if (typeof btoa !== 'undefined') {
      return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    return 'offline';
  }

  // ── Public API ────────────────────────────────────────────────────────────

  logout(): void {
    this.storageRemove(this.tokenKey);
    this.storageRemove(this.userKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null { return this.storageGet(this.tokenKey); }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (Date.now() >= payload.exp * 1000) { this.logout(); return false; }
      return true;
    } catch { return true; }
  }

  isTokenExpiringSoon(thresholdMs = 5 * 60 * 1000): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000 - thresholdMs;
    } catch { return false; }
  }

  getCurrentUser(): User | null { return this.currentUserSubject.value; }

  hasCompletedPreferences(user: Pick<User, 'email' | 'role'> | null = this.getCurrentUser()): boolean {
    if (!user) {
      return false;
    }
    if (user.role === 'ADMIN') {
      return true;
    }
    const key = this.preferencesKeyFor(user.email);
    return key ? this.storageGet(key) === 'true' : false;
  }

  markPreferencesCompleted(user: Pick<User, 'email'> | null = this.getCurrentUser()): void {
    const key = this.preferencesKeyFor(user?.email);
    if (key) {
      this.storageSet(key, 'true');
    }
  }

  /** Merge updates into stored user (e.g. after profile save). */
  patchStoredUser(updates: Partial<User>): void {
    const cur = this.getCurrentUser();
    if (!cur) {
      return;
    }
    const merged = { ...cur, ...updates } as User;
    this.storageSet(this.userKey, JSON.stringify(merged));
    this.currentUserSubject.next(merged);
  }

  hasRole(role: string): boolean { return this.getCurrentUser()?.role === role; }

  isAdmin(): boolean { return this.hasRole('ADMIN'); }
  isSeller(): boolean { return this.hasRole('SELLER'); }
  isClient(): boolean { return this.hasRole('CLIENT') || this.hasRole('USER' as any); }
  isOrganizer(): boolean { return this.hasRole('ORGANIZER'); }
  isCamper(): boolean { return this.hasRole('CAMPER'); }
  isSponsor(): boolean { return this.hasRole('SPONSOR'); }
  isParticipant(): boolean {
    const role = this.getCurrentUser()?.role;
    return role === 'PARTICIPANT' || role === 'CAMPER';
  }
}
