import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const unwrap = (res: any) => {
  if (Array.isArray(res)) return res;
  return res?.data?.content || res?.data || res || [];
};
const unwrapOne = (res: any) => res?.data || res;

@Injectable({ providedIn: 'root' })
export class OrderService {
  private url = `${environment.apiUrl}/api/orders`;

  constructor(private http: HttpClient) {}

  // ── Admin ──────────────────────────────────────────────

  /** GET /api/orders (Admin only) */
  getAll(page = 0, size = 50): Observable<any[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(this.url, { params }).pipe(map(unwrap));
  }

  /** GET /api/orders/status/{status} (Admin only) */
  getByStatus(status: string, page = 0, size = 20): Observable<any[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.url}/status/${status}`, { params }).pipe(map(unwrap));
  }

  /** GET /api/orders/{id} */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(map(unwrapOne));
  }

  /** GET /api/orders/user/{userId} */
  getByUser(userId: string, page = 0, size = 50): Observable<any[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.url}/user/${userId}`, { params }).pipe(map(unwrap));
  }

  /** Alias — used by client.component */
  getMyOrders(): Observable<any[]> {
    const userId = this.getCurrentUserId();
    if (userId) return this.getByUser(userId);
    return this.http.get<any>(this.url).pipe(map(unwrap));
  }

  /** GET /api/orders/seller — may not exist, component handles error */
  getSellerOrders(): Observable<any[]> {
    return this.http.get<any>(`${this.url}/seller`).pipe(map(unwrap));
  }

  /** PATCH /api/orders/{id}/status (Admin only) */
  updateStatus(id: string, status: string, notes?: string): Observable<any> {
    let params = new HttpParams().set('status', status);
    if (notes) params = params.set('notes', notes);
    return this.http.patch<any>(`${this.url}/${id}/status`, null, { params })
      .pipe(map(unwrapOne));
  }

  /** PATCH /api/orders/{id}/tracking */
  updateTracking(id: string, trackingNumber: string, carrier?: string): Observable<any> {
    let params = new HttpParams().set('trackingNumber', trackingNumber);
    if (carrier) params = params.set('carrier', carrier);
    return this.http.patch<any>(`${this.url}/${id}/tracking`, null, { params })
      .pipe(map(unwrapOne));
  }

  /** Cancel = PATCH status to CANCELLED */
  cancel(id: string, reason?: string): Observable<any> {
    return this.updateStatus(id, 'CANCELLED', reason);
  }

  /** Alias */
  cancelAdmin(id: string, reason?: string): Observable<any> {
    return this.cancel(id, reason);
  }

  /**
   * POST /api/orders
   * Backend expects individual @RequestParam fields (not a JSON body).
   * Accepts the broad shape used by client.component so it compiles.
   */
  create(orderData: {
    userId?: number;
    shippingName?: string;
    shippingPhone?: string;
    shippingAddress: string;
    shippingCity?: string;
    shippingPostalCode?: string;
    shippingCountry?: string;
    paymentMethod: string;
    notes?: string;
    couponCode?: string;
    // legacy fields from CreateOrderDto — ignored by backend but accepted here
    items?: any[];
  }): Observable<any> {
    const userId = orderData.userId ?? Number(this.getCurrentUserId() ?? 0);

    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('shippingName', orderData.shippingName || '')
      .set('shippingPhone', orderData.shippingPhone || '')
      .set('shippingAddress', orderData.shippingAddress || '')
      .set('shippingCity', orderData.shippingCity || '')
      .set('shippingPostalCode', orderData.shippingPostalCode || '')
      .set('shippingCountry', orderData.shippingCountry || '')
      .set('paymentMethod', orderData.paymentMethod || 'CARD');

    if (orderData.notes) params = params.set('notes', orderData.notes);

    return this.http.post<any>(this.url, null, { params }).pipe(map(unwrapOne));
  }

  /** DELETE /api/orders/{id} */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }

  // ── Helper ─────────────────────────────────────────────

  private getCurrentUserId(): string | null {
    try {
      const userStr = localStorage.getItem('current_user') || localStorage.getItem('user');
      if (userStr) return JSON.parse(userStr)?.id?.toString() || null;
    } catch { /* ignore */ }
    return null;
  }
}
