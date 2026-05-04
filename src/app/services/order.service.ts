import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { OrderStatisticsResponse } from '../models/api.models';

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

  getAll(page = 0, size = 50): Observable<any[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(this.url, { params }).pipe(map(unwrap));
  }

  getByStatus(status: string, page = 0, size = 20): Observable<any[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.url}/status/${status}`, { params }).pipe(map(unwrap));
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(map(unwrapOne));
  }

  getByUser(userId: string, page = 0, size = 50): Observable<any[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.url}/user/${userId}`, { params }).pipe(map(unwrap));
  }

  getMyOrders(): Observable<any[]> {
    const userId = this.getCurrentUserId();
    if (userId) return this.getByUser(userId);
    return this.http.get<any>(this.url).pipe(map(unwrap));
  }

  getSellerOrders(): Observable<any[]> {
    return this.http.get<any>(`${this.url}/seller`).pipe(map(unwrap));
  }

  updateStatus(id: string, status: string, notes?: string): Observable<any> {
    let params = new HttpParams().set('status', status);
    if (notes) params = params.set('notes', notes);
    return this.http.patch<any>(`${this.url}/${id}/status`, null, { params })
      .pipe(map(unwrapOne));
  }

  updateTracking(id: string, trackingNumber: string, carrier?: string): Observable<any> {
    let params = new HttpParams().set('trackingNumber', trackingNumber);
    if (carrier) params = params.set('carrier', carrier);
    return this.http.patch<any>(`${this.url}/${id}/tracking`, null, { params })
      .pipe(map(unwrapOne));
  }

  cancel(id: string, reason?: string): Observable<any> {
    return this.updateStatus(id, 'CANCELLED', reason);
  }

  cancelAdmin(id: string, reason?: string): Observable<any> {
    return this.cancel(id, reason);
  }

  create(orderData: {
    userId?:             number;
    shippingName?:       string;
    shippingPhone?:      string;
    shippingAddress:     string;
    shippingCity?:       string;
    shippingPostalCode?: string;
    shippingCountry?:    string;
    paymentMethod:       string;
    notes?:              string;
    couponCode?:         string;
    items?:              any[];
  }): Observable<any> {
    const userId = orderData.userId ?? Number(this.getCurrentUserId() ?? 0);
    let params = new HttpParams()
      .set('userId',             userId.toString())
      .set('shippingName',       orderData.shippingName       || '')
      .set('shippingPhone',      orderData.shippingPhone      || '')
      .set('shippingAddress',    orderData.shippingAddress    || '')
      .set('shippingCity',       orderData.shippingCity       || '')
      .set('shippingPostalCode', orderData.shippingPostalCode || '')
      .set('shippingCountry',    orderData.shippingCountry    || '')
      .set('paymentMethod',      orderData.paymentMethod      || 'CARD');
    if (orderData.notes) params = params.set('notes', orderData.notes);
    return this.http.post<any>(this.url, null, { params }).pipe(map(unwrapOne));
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }

  // ── NOUVEAU 1 : Statistiques par statut (JPQL JOIN) ────────────────────
  // GET /api/orders/statistics/by-status
  getStatisticsByStatus(): Observable<OrderStatisticsResponse[]> {
    return this.http
      .get<any>(`${this.url}/statistics/by-status`)
      .pipe(map(res => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  // ── NOUVEAU 2 : Filtre avancé (keyword multi-table) ────────────────────
  // GET /api/orders/user/{userId}/filter?status=X&since=Y
  getFilteredOrders(userId: string, status: string, since: string): Observable<any[]> {
    const params = new HttpParams()
      .set('status', status)
      .set('since',  since);
    return this.http
      .get<any>(`${this.url}/user/${userId}/filter`, { params })
      .pipe(map(res => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  // ── Helper ──────────────────────────────────────────────
  private getCurrentUserId(): string | null {
    try {
      const userStr = localStorage.getItem('current_user') || localStorage.getItem('user');
      if (userStr) return JSON.parse(userStr)?.id?.toString() || null;
    } catch { /* ignore */ }
    return null;
  }
}
