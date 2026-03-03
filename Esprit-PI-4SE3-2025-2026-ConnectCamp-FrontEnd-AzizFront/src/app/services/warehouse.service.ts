import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Warehouse, CreateWarehouseDto } from '../models/api.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  private apiUrl = `${environment.apiUrl}/api/warehouses`;

  constructor(private http: HttpClient) {}

  private extractData<T>(response: ApiResponse<T>): T {
    return response.data ?? ([] as any);
  }

  getAll(): Observable<Warehouse[]> {
    return this.http.get<ApiResponse<Warehouse[]>>(this.apiUrl)
      .pipe(map(res => this.extractData(res)));
  }

  getById(id: string): Observable<Warehouse> {
    return this.http.get<ApiResponse<Warehouse>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => this.extractData(res)));
  }

  create(warehouse: CreateWarehouseDto): Observable<Warehouse> {
    return this.http.post<ApiResponse<Warehouse>>(this.apiUrl, warehouse)
      .pipe(map(res => this.extractData(res)));
  }

  update(id: string, warehouse: Partial<CreateWarehouseDto>): Observable<Warehouse> {
    return this.http.put<ApiResponse<Warehouse>>(`${this.apiUrl}/${id}`, warehouse)
      .pipe(map(res => this.extractData(res)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  getActive(): Observable<Warehouse[]> {
    return this.http.get<ApiResponse<Warehouse[]>>(`${this.apiUrl}?isActive=true`)
      .pipe(map(res => this.extractData(res)));
  }
}
