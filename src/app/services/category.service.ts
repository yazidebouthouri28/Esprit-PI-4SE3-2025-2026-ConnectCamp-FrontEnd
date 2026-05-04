import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE } from './product.service';

const unwrap = (res: any) => res?.data?.content || res?.data || res || [];
const unwrapOne = (res: any) => res?.data || res;

@Injectable({ providedIn: 'root' })
export class CategoryService {
  // Both public and admin routes exist — use admin for write operations
  private url = `${API_BASE}/categories`;

  constructor(private http: HttpClient) {}

  /** GET /api/categories */
  getAll(): Observable<any[]> {
    return this.http.get<any>(this.url).pipe(map(unwrap));
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(map(unwrapOne));
  }

  getByName(name: string): Observable<any> {
    return this.http.get<any>(`${this.url}/name/${name}`).pipe(map(unwrapOne));
  }

  /** POST /api/admin/categories */
  create(data: { name: string; description?: string; icon?: string }): Observable<any> {
    return this.http.post<any>(this.url , data).pipe(map(unwrapOne));
  }

  /** PUT /api/admin/categories/{id} */
  update(id: string, data: { name: string; description?: string; icon?: string }): Observable<any> {
    return this.http.put<any>(`${this.url }/${id}`, data).pipe(map(unwrapOne));
  }

  /** DELETE /api/admin/categories/{id} */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url }/${id}`);
  }

  /** PATCH /api/categories/{id}/product-count */
  updateProductCount(id: string): Observable<any> {
    return this.http.patch<any>(`${this.url}/${id}/product-count`, {}).pipe(map(unwrapOne));
  }
  // category.service.ts — ajouter à la fin de la classe

  /** GET /api/categories/sales-report?status=DELIVERED */
  getSalesReport(status: string = 'DELIVERED'): Observable<any[]> {
    return this.http
      .get<any>(`${this.url}/sales-report`, { params: { status } })
      .pipe(map(res => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  /** GET /api/orders/by-category?status=X&categoryId=Y&startDate=Z&endDate=W */
  getOrdersByCategory(
    status: string,
    categoryId: string,
    startDate: string,
    endDate: string
  ): Observable<any[]> {
    const params = { status, categoryId, startDate, endDate };
    return this.http
      .get<any>(`${this.url.replace('/categories', '/orders')}/by-category`, { params })
      .pipe(map(res => (Array.isArray(res) ? res : res?.data ?? [])));
  }
}
