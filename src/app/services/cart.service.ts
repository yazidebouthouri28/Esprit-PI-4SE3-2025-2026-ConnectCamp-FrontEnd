import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, catchError, map } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { CartItem } from '../models/api.models';

const LOCAL_CART_KEY = 'local_cart';

@Injectable({ providedIn: 'root' })
export class CartService {

  private apiUrl = `${environment.apiUrl}/api/cart`;
  private isBrowser: boolean;

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadLocalCart();
  }

  // ── localStorage helpers ──────────────────────────────────────────────────

  private loadLocalCart(): void {
    if (!this.isBrowser) return;
    try {
      const raw = localStorage.getItem(LOCAL_CART_KEY);
      if (raw) this.cartSubject.next(JSON.parse(raw));
    } catch { /* ignore */ }
  }

  private saveLocalCart(items: CartItem[]): void {
    if (!this.isBrowser) return;
    try { localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }

  private clearLocalCart(): void {
    if (!this.isBrowser) return;
    try { localStorage.removeItem(LOCAL_CART_KEY); } catch { /* ignore */ }
  }

  private getCurrentUserId(): string | null {
    if (!this.isBrowser) return null;
    try {
      const userStr = localStorage.getItem('current_user') || localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.id?.toString() || null;
      }
      return null;
    } catch { return null; }
  }

  private isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    try { return !!localStorage.getItem('auth_token'); } catch { return false; }
  }

  // ── Cart state ────────────────────────────────────────────────────────────

  getItems():     CartItem[] { return this.cartSubject.value; }
  getItemCount(): number     { return this.cartSubject.value.reduce((s, i) => s + i.quantity, 0); }
  getSubtotal():  number     { return this.cartSubject.value.reduce((s, i) => s + i.price * i.quantity, 0); }

  // ── Core methods ──────────────────────────────────────────────────────────

  addItem(item: CartItem): Observable<void> {
    const current = [...this.cartSubject.value];
    const idx = current.findIndex(i => i.productId === item.productId && i.type === item.type);
    if (idx >= 0) {
      current[idx] = { ...current[idx], quantity: current[idx].quantity + item.quantity };
    } else {
      current.push(item);
    }
    this.cartSubject.next(current);
    this.saveLocalCart(current);

    const userId = this.getCurrentUserId();
    if (this.isLoggedIn() && userId) {
      // Backend: POST /api/cart/{userId}/items?productId=X&quantity=Y
      return this.http.post<any>(
        `${this.apiUrl}/${userId}/items?productId=${item.productId}&quantity=${item.quantity}`,
        {}
      ).pipe(
        map(() => void 0),
        catchError(e => { console.warn('Cart add failed silently:', e.status); return of(void 0); })
      );
    }
    return of(void 0);
  }

  addToCart(item: CartItem): Observable<void> {
    return this.addItem(item);
  }

  removeItem(productId: string, type: 'PURCHASE' | 'RENTAL' = 'PURCHASE'): Observable<void> {
    const current = this.cartSubject.value.filter(
      i => !(i.productId === productId && i.type === type)
    );
    this.cartSubject.next(current);
    this.saveLocalCart(current);

    const userId = this.getCurrentUserId();
    if (this.isLoggedIn() && userId) {
      // Backend needs itemId not productId — find item first from local state
      // Since we already removed it locally, use productId as best effort
      return this.http.delete<any>(`${this.apiUrl}/${userId}/items/${productId}`).pipe(
        map(() => void 0),
        catchError(e => { console.warn('Cart remove failed silently:', e.status); return of(void 0); })
      );
    }
    return of(void 0);
  }

  removeFromCart(productId: string, type: 'PURCHASE' | 'RENTAL' = 'PURCHASE'): Observable<void> {
    return this.removeItem(productId, type);
  }

  updateQuantity(
    productId: string,
    quantity: number,
    type: 'PURCHASE' | 'RENTAL' = 'PURCHASE'
  ): Observable<void> {
    if (quantity <= 0) return this.removeItem(productId, type);

    const current = this.cartSubject.value.map(i =>
      i.productId === productId && i.type === type ? { ...i, quantity } : i
    );
    this.cartSubject.next(current);
    this.saveLocalCart(current);

    const userId = this.getCurrentUserId();
    if (this.isLoggedIn() && userId) {
      return this.http.put<any>(
        `${this.apiUrl}/${userId}/items/${productId}?quantity=${quantity}`,
        {}
      ).pipe(
        map(() => void 0),
        catchError(e => { console.warn('Cart update failed silently:', e.status); return of(void 0); })
      );
    }
    return of(void 0);
  }

  clearCart(): Observable<void> {
    this.cartSubject.next([]);
    this.clearLocalCart();

    const userId = this.getCurrentUserId();
    if (this.isLoggedIn() && userId) {
      return this.http.delete<any>(`${this.apiUrl}/${userId}/clear`).pipe(
        map(() => void 0),
        catchError(e => { console.warn('Cart clear failed silently:', e.status); return of(void 0); })
      );
    }
    return of(void 0);
  }

  // ── Fetch for cart page ───────────────────────────────────────────────────

  fetchCart(): Observable<CartItem[]> {
    const userId = this.getCurrentUserId();
    if (!this.isLoggedIn() || !userId) return of(this.cartSubject.value);

    return this.http.get<any>(`${this.apiUrl}/${userId}`).pipe(
      map(response => {
        // Backend returns ApiResponse<CartResponse> with items inside
        const raw = response?.data || response;
        const items: CartItem[] = (raw?.items || []).map((i: any) => ({
          productId: String(i.productId || i.product?.id),
          productName: i.productName || i.product?.name || '',
          price: i.price || i.unitPrice || 0,
          quantity: i.quantity || 1,
          image: i.image || i.product?.thumbnail || '',
          type: i.type || 'PURCHASE',
          rentalDays: i.rentalDays
        }));
        this.cartSubject.next(items);
        this.saveLocalCart(items);
        return items;
      }),
      catchError(e => {
        console.warn(`fetchCart failed (${e.status}) — returning local cart`);
        return of(this.cartSubject.value);
      })
    );
  }

  syncCartAfterLogin(): void {
    const userId = this.getCurrentUserId();
    if (!this.isLoggedIn() || !userId) return;

    const localItems = [...this.cartSubject.value];

    this.http.get<any>(`${this.apiUrl}/${userId}`).pipe(
      catchError(e => {
        console.warn(`Cart fetch after login failed (${e.status}) — keeping local cart`);
        return of(null);
      })
    ).subscribe(response => {
      if (response === null) return;

      const raw = response?.data || response;
      const serverItems: CartItem[] = (raw?.items || []).map((i: any) => ({
        productId: String(i.productId || i.product?.id),
        productName: i.productName || i.product?.name || '',
        price: i.price || 0,
        quantity: i.quantity || 1,
        image: i.image || '',
        type: i.type || 'PURCHASE'
      }));

      const merged = [...serverItems];
      for (const local of localItems) {
        const exists = merged.find(s => s.productId === local.productId && s.type === local.type);
        if (!exists) merged.push(local);
      }

      this.cartSubject.next(merged);
      this.saveLocalCart(merged);
      this.clearLocalCart();
    });
  }
}
