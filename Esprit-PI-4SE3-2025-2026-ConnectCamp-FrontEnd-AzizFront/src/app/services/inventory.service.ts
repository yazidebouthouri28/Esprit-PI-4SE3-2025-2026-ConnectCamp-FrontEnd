import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Inventory, StockMovement, CreateStockMovementDto } from '../models/api.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/api/inventory`;

  constructor(private http: HttpClient) {}

  private extractData<T>(response: ApiResponse<T>): T {
    return response.data ?? ([] as any);
  }

  private unwrap = (res: any) => res?.data?.content || res?.data || res || [];
  private unwrapOne = (res: any) => res?.data || res;

  getAll(params?: {
    warehouseId?: string;
    productId?: string;
    lowStockOnly?: boolean;
  }): Observable<Inventory[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<Inventory[]>>(this.apiUrl, { params: httpParams })
      .pipe(map(res => this.extractData(res)));
  }

  getById(id: string): Observable<Inventory> {
    return this.http.get<ApiResponse<Inventory>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => this.extractData(res)));
  }

  getByProduct(productId: string): Observable<Inventory[]> {
    return this.http.get<ApiResponse<Inventory[]>>(`${this.apiUrl}/product/${productId}`)
      .pipe(map(res => this.extractData(res)));
  }

  getLowStock(): Observable<Inventory[]> {
    return this.http.get<ApiResponse<Inventory[]>>(`${this.apiUrl}/low-stock`)
      .pipe(map(res => this.extractData(res)));
  }

  getMovements(productId?: string): Observable<StockMovement[]> {
    let url = `${this.apiUrl}/movements`;
    if (productId) {
      url += `?productId=${productId}`;
    }
    return this.http.get<any>(url).pipe(map(res => this.unwrap(res)));
  }

  createMovement(data: CreateStockMovementDto): Observable<StockMovement> {
    return this.http.post<any>(`${this.apiUrl}/movements`, data)
      .pipe(map(res => this.unwrapOne(res)));
  }

  updateStock(id: string, data: { currentStock?: number; lowStockThreshold?: number }): Observable<Inventory> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data)
      .pipe(map(res => this.unwrapOne(res)));
  }

  adjustStock(id: string, adjustment: number, reason?: string): Observable<Inventory> {
    let params = new HttpParams().set('adjustment', adjustment.toString());
    if (reason) params = params.set('reason', reason);
    return this.http.post<any>(`${this.apiUrl}/${id}/adjust`, null, { params })
      .pipe(map(res => this.unwrapOne(res)));
  }

  reserveStock(id: string, quantity: number): Observable<Inventory> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.post<any>(`${this.apiUrl}/${id}/reserve`, null, { params })
      .pipe(map(res => this.unwrapOne(res)));
  }

  releaseStock(id: string, quantity: number): Observable<Inventory> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.post<any>(`${this.apiUrl}/${id}/release`, null, { params })
      .pipe(map(res => this.unwrapOne(res)));
  }

  create(data: any): Observable<Inventory> {
    return this.http.post<any>(this.apiUrl, data)
      .pipe(map(res => this.unwrapOne(res)));
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
