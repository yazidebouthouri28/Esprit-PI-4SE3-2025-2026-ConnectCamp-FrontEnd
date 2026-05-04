import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE } from './product.service';

const unwrap = (res: any) => res?.data?.content || res?.data || res || [];
const unwrapOne = (res: any) => res?.data || res;

// ════════════════════════════════════════════════
// INVENTORY SERVICE  —  /api/inventory
// ════════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private url = `${API_BASE}/inventory`;

  constructor(private http: HttpClient) {}

  /** GET /api/inventory */
  getAll(): Observable<any[]> {
    return this.http.get<any>(this.url).pipe(map(unwrap));
  }

  /** GET /api/inventory/low-stock — items below threshold */
  getAlerts(): Observable<any[]> {
    return this.http.get<any>(`${this.url}/low-stock`).pipe(map(unwrap));
  }

  /** GET /api/inventory/product/{productId} */
  getByProduct(productId: string): Observable<any> {
    return this.http.get<any>(`${this.url}/product/${productId}`).pipe(map(unwrapOne));
  }

  /** GET /api/inventory/warehouse/{warehouseId} */
  getByWarehouse(warehouseId: string): Observable<any[]> {
    return this.http.get<any>(`${this.url}/warehouse/${warehouseId}`).pipe(map(unwrap));
  }

  /** GET /api/inventory/{id} */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(map(unwrapOne));
  }

  /** POST /api/inventory */
  create(data: any): Observable<any> {
    return this.http.post<any>(this.url, data).pipe(map(unwrapOne));
  }

  /** DELETE /api/inventory/{id} */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }

  /** POST /api/inventory/{id}/adjust — adjust stock quantity */
  adjustStock(id: string, adjustment: number, reason?: string): Observable<any> {
    let params = new HttpParams().set('adjustment', adjustment.toString());
    if (reason) params = params.set('reason', reason);
    return this.http.post<any>(`${this.url}/${id}/adjust`, null, { params }).pipe(map(unwrapOne));
  }

  /** POST /api/inventory/{id}/reserve — reserve stock */
  reserveStock(id: string, quantity: number): Observable<any> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.post<any>(`${this.url}/${id}/reserve`, null, { params }).pipe(map(unwrapOne));
  }

  /** POST /api/inventory/{id}/release — release reserved stock */
  releaseStock(id: string, quantity: number): Observable<any> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.post<any>(`${this.url}/${id}/release`, null, { params }).pipe(map(unwrapOne));
  }

  /** PUT /api/inventory/{id} — update inventory */
  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.url}/${id}`, data).pipe(map(unwrapOne));
  }

  /** POST /api/inventory/{id}/movement — record a stock IN/OUT movement */
  recordMovement(id: string, data: { type: string; quantity: number }): Observable<any> {
    return this.http.post<any>(`${this.url}/${id}/movement`, data).pipe(map(unwrapOne));
  }
}

// ════════════════════════════════════════════════
// RENTAL SERVICE  —  /api/rentals
// ════════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class RentalService {
  private url = `${API_BASE}/rentals`;

  constructor(private http: HttpClient) {}

  /** GET /api/rentals — admin: all rentals */
  getAll(): Observable<any[]> {
    return this.http.get<any>(this.url).pipe(map(unwrap));
  }

  /** GET /api/rentals/user/{userId} */
  getByUser(userId: string): Observable<any[]> {
    return this.http.get<any>(`${this.url}/user/${userId}`).pipe(map(unwrap));
  }

  /** GET /api/rentals/{id} */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(map(unwrapOne));
  }

  /** GET /api/rentals/number/{number} */
  getByNumber(number: string): Observable<any> {
    return this.http.get<any>(`${this.url}/number/${number}`).pipe(map(unwrapOne));
  }

  /** POST /api/rentals */
  create(data: any): Observable<any> {
    return this.http.post<any>(this.url, data).pipe(map(unwrapOne));
  }

  /** PATCH /api/rentals/{id}/status — update rental status */
  updateStatus(id: string, status: string): Observable<any> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<any>(`${this.url}/${id}/status`, null, { params }).pipe(map(unwrapOne));
  }

  /** Mark as returned = update status to RETURNED */
  markReturned(id: string): Observable<any> {
    return this.updateStatus(id, 'RETURNED');
  }

  /** Cancel rental = update status to CANCELLED */
  cancel(id: string): Observable<any> {
    return this.updateStatus(id, 'CANCELLED');
  }

  /** PATCH /api/rentals/{id}/extend — extend rental by additional days */
  extend(id: string, data: { additionalDays: number }): Observable<any> {
    return this.http.patch<any>(`${this.url}/${id}/extend`, data).pipe(map(unwrapOne));
  }

  /** POST /api/rentals/{id}/reminder — send return reminder to customer */
  sendReminder(id: string): Observable<any> {
    return this.http.post<any>(`${this.url}/${id}/reminder`, null).pipe(map(unwrapOne));
  }

  /** DELETE /api/rentals/{id} */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }
}

// ════════════════════════════════════════════════
// WAREHOUSE SERVICE  —  /api/warehouses
// ════════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private url = `${API_BASE}/warehouses`;

  constructor(private http: HttpClient) {}

  /** GET /api/warehouses */
  getAll(): Observable<any[]> {
    return this.http.get<any>(this.url).pipe(map(unwrap));
  }

  /** GET /api/warehouses/active */
  getActive(): Observable<any[]> {
    return this.http.get<any>(`${this.url}/active`).pipe(map(unwrap));
  }

  /** GET /api/warehouses/search?q=term */
  search(term: string): Observable<any[]> {
    const params = new HttpParams().set('q', term);
    return this.http.get<any>(`${this.url}/search`, { params }).pipe(map(unwrap));
  }

  /** GET /api/warehouses/stats */
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.url}/stats`).pipe(map(unwrapOne));
  }

  /** GET /api/warehouses/{id} */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(map(unwrapOne));
  }

  /** GET /api/warehouses/code/{code} */
  getByCode(code: string): Observable<any> {
    return this.http.get<any>(`${this.url}/code/${code}`).pipe(map(unwrapOne));
  }

  /** GET /api/warehouses/city/{city} */
  getByCity(city: string): Observable<any[]> {
    return this.http.get<any>(`${this.url}/city/${city}`).pipe(map(unwrap));
  }

  /** POST /api/warehouses */
  create(data: any): Observable<any> {
    return this.http.post<any>(this.url, data).pipe(map(unwrapOne));
  }

  /** PUT /api/warehouses/{id} */
  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.url}/${id}`, data).pipe(map(unwrapOne));
  }

  /** PATCH /api/warehouses/{id} */
  patch(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.url}/${id}`, data).pipe(map(unwrapOne));
  }

  /** PATCH /api/warehouses/{id}/toggle-status */
  toggleStatus(id: string): Observable<any> {
    return this.http.patch<any>(`${this.url}/${id}/toggle-status`, {}).pipe(map(unwrapOne));
  }

  /** DELETE /api/warehouses/{id} */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }

  /** DELETE /api/warehouses/batch */
  deleteBatch(ids: string[]): Observable<any> {
    return this.http.delete<any>(`${this.url}/batch`, { body: ids });
  }
}
