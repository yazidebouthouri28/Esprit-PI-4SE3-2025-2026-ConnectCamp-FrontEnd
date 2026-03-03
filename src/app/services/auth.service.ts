import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, map } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/api.models';

type UserRole = User['role'];
const VALID_ROLES: UserRole[] = ['CLIENT', 'SELLER', 'ORGANIZER', 'CAMPER', 'SPONSOR', 'ADMIN', 'USER' as any];

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  readonly tokenKey = 'auth_token';
  readonly userKey  = 'current_user';

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
    try { localStorage.setItem(key, value); } catch {}
  }
  private storageRemove(key: string): void {
    if (!this.isBrowser) return;
    try { localStorage.removeItem(key); } catch {}
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  private loadStoredUser(): void {
    const token    = this.storageGet(this.tokenKey);
    const userJson = this.storageGet(this.userKey);
    if (token && userJson) {
      try { this.currentUserSubject.next(JSON.parse(userJson) as User); }
      catch { this.logout(); }
    }
  }

  // ── Auth calls ────────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // ✅ Java AuthRequest DTO has field: private String username
    //    Spring Security authenticates by username OR email via the service
    //    So we send the value (email or username) in the "username" field
    const body = {
      username: credentials.email,   // field name must match Java DTO exactly
      password: credentials.password
    };

    return this.http.post<any>(`${this.apiUrl}/login`, body).pipe(
      map(raw  => this.extractAuthResponse(raw)),
      tap(auth => this.handleAuthSuccess(auth)),
      catchError(error => {
        const msg = error.error?.message
          || error.error?.error
          || error.message
          || 'Login failed. Please check your credentials.';
        throw new Error(msg);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/register`, data).pipe(
      map(raw  => this.extractAuthResponse(raw)),
      tap(auth => this.handleAuthSuccess(auth)),
      catchError(error => {
        const msg = error.error?.message
          || error.error?.error
          || error.message
          || 'Registration failed. Please try again.';
        throw new Error(msg);
      })
    );
  }

  // ── Response normalisation ────────────────────────────────────────────────

  private extractAuthResponse(raw: any): AuthResponse {
    // Supports both:
    //   Flat    → { token, userId, name, role, ... }
    //   Wrapped → { success: true, data: { token, ... } }
    const p = (raw?.data && raw?.success !== undefined) ? raw.data : raw;
    if (!p?.token) throw new Error('Invalid server response: token missing.');

    // Backend returns role as "USER" enum — map to CLIENT for frontend
    const rawRole = String(p.role ?? 'CLIENT').toUpperCase();
    const roleMap: Record<string, UserRole> = { 'USER': 'CLIENT' };
    const role: UserRole = roleMap[rawRole]
      ?? (VALID_ROLES.includes(rawRole as UserRole) ? (rawRole as UserRole) : 'CLIENT');

    const user: User = {
      id:            String(p.userId ?? p.id),
      name:          p.name      ?? p.username,
      username:      p.username,
      email:         p.email,
      phone:         p.phone,
      address:       p.address,
      country:       p.country,
      loyaltyPoints: p.loyaltyPoints ?? 0,
      role,
      avatar:        p.avatar,
      bio:           p.bio,
      coverImage:    p.coverImage,
      location:      p.location,
      createdAt:     p.createdAt ?? new Date().toISOString()
    };
    return { token: p.token, user };
  }

  private handleAuthSuccess(auth: AuthResponse): void {
    this.storageSet(this.tokenKey, auth.token);
    this.storageSet(this.userKey, JSON.stringify(auth.user));
    this.currentUserSubject.next(auth.user);
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
  hasRole(role: string): boolean { return this.getCurrentUser()?.role === role; }

  isAdmin():     boolean { return this.hasRole('ADMIN'); }
  isSeller():    boolean { return this.hasRole('SELLER'); }
  isClient():    boolean { return this.hasRole('CLIENT') || this.hasRole('USER' as any); }
  isOrganizer(): boolean { return this.hasRole('ORGANIZER'); }
  isCamper():    boolean { return this.hasRole('CAMPER'); }
  isSponsor():   boolean { return this.hasRole('SPONSOR'); }
}
