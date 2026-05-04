import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const API_BASE = 'http://localhost:8089/api';

// ================= SAFE UNWRAPPERS =================
const unwrap = (res: any) =>
  res?.data?.content ??
  res?.data ??
  res ??
  [];

const unwrapOne = (res: any) =>
  res?.data ?? res ?? null;

// ================= TYPES =================
export interface PriceCalculationResponse {
  basePrice: number;
  vat: number;
  totalPrice: number;
  currency: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {

  private url = `${API_BASE}/products`;
  private adminUrl = `${API_BASE}/admin/products`;

  constructor(private http: HttpClient) {}

  // ================= ADMIN =================

  getAllAdmin(page = 0, size = 50): Observable<any[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<any>(this.adminUrl, { params })
      .pipe(map(unwrap));
  }

  getPending(page = 0, size = 20): Observable<any[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<any>(`${this.adminUrl}/pending`, { params })
      .pipe(map(unwrap));
  }

  approve(id: string): Observable<any> {
    return this.http.post(`${this.adminUrl}/${id}/approve`, {})
      .pipe(map(unwrapOne));
  }

  reject(id: string, reason: string): Observable<any> {
    const params = new HttpParams().set('reason', reason);

    return this.http.post(`${this.adminUrl}/${id}/reject`, null, { params })
      .pipe(map(unwrapOne));
  }

  toggleFeatured(id: string): Observable<any> {
    return this.http.post(`${this.adminUrl}/${id}/feature`, {})
      .pipe(map(unwrapOne));
  }

  deleteAdmin(id: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/${id}`);
  }

  // ================= PRICE (FIX IMPORTANT TND) =================

  calculatePrice(
    productId: number,
    country: string,
    currency: string
  ): Observable<PriceCalculationResponse> {

    return this.http.post<PriceCalculationResponse>(
      `${this.url}/calculate-price`,
      {
        productId,
        countryCode: country,
        currency
      }
    );
  }

  // ================= PUBLIC =================

  getAll(
    page = 0,
    size = 100,
    filters?: { isActive?: boolean; categoryId?: string }
  ): Observable<any[]> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filters?.isActive !== undefined) {
      params = params.set('isActive', String(filters.isActive));
    }

    if (filters?.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }

    return this.http.get<any>(this.url, { params })
      .pipe(map(unwrap));
  }

  getActive(): Observable<any[]> {
    return this.http.get<any>(`${this.url}/active`)
      .pipe(map(unwrap));
  }

  getBySeller(sellerId: string, page = 0, size = 100): Observable<any[]> {
    const params = new HttpParams()
      .set('sellerId', sellerId)
      .set('page', page)
      .set('size', size);

    return this.http.get<any>(this.url, { params })
      .pipe(map(unwrap));
  }

  getFeatured(): Observable<any[]> {
    return this.http.get<any>(`${this.url}/featured`)
      .pipe(map(unwrap));
  }

  getRentals(): Observable<any[]> {
    return this.http.get<any>(`${this.url}/rental`)
      .pipe(map(unwrap));
  }

  search(term: string): Observable<any[]> {
    const params = new HttpParams().set('q', term);

    return this.http.get<any>(`${this.url}/search`, { params })
      .pipe(map(unwrap));
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`)
      .pipe(map(unwrapOne));
  }

  create(data: any): Observable<any> {
    return this.http.post(this.url, data)
      .pipe(map(unwrapOne));
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.url}/${id}`, data)
      .pipe(map(unwrapOne));
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }

  // alias
  getMyProducts(): Observable<any[]> {
    return this.getAll();
  }
}
