import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Rental, ExtendRentalDto } from '../models/api.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private apiUrl = `${environment.apiUrl}/api/rentals`;

  constructor(private http: HttpClient) {}

  private extractData<T>(response: ApiResponse<T>): T {
    return response.data ?? ([] as any);
  }

  getAll(params?: {
    status?: string;
    customerId?: string;
    sellerId?: string;
  }): Observable<Rental[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<Rental[]>>(this.apiUrl, { params: httpParams })
      .pipe(map(res => this.extractData(res)));
  }

  getById(id: string): Observable<Rental> {
    return this.http.get<ApiResponse<Rental>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => this.extractData(res)));
  }

  extend(id: string, data: ExtendRentalDto): Observable<Rental> {
    return this.http.patch<ApiResponse<Rental>>(`${this.apiUrl}/${id}/extend`, data)
      .pipe(map(res => this.extractData(res)));
  }

  markReturned(id: string): Observable<Rental> {
    return this.http.patch<ApiResponse<Rental>>(`${this.apiUrl}/${id}/return`, {})
      .pipe(map(res => this.extractData(res)));
  }

  cancel(id: string): Observable<Rental> {
    return this.http.patch<ApiResponse<Rental>>(`${this.apiUrl}/${id}/cancel`, {})
      .pipe(map(res => this.extractData(res)));
  }

  getMyRentals(): Observable<Rental[]> {
    return this.http.get<ApiResponse<Rental[]>>(`${this.apiUrl}/my-rentals`)
      .pipe(map(res => this.extractData(res)));
  }

  getSellerRentals(): Observable<Rental[]> {
    return this.http.get<ApiResponse<Rental[]>>(`${this.apiUrl}/seller-rentals`)
      .pipe(map(res => this.extractData(res)));
  }

  getActive(): Observable<Rental[]> {
    return this.getAll({ status: 'ACTIVE' });
  }

  getOverdue(): Observable<Rental[]> {
    return this.getAll({ status: 'OVERDUE' });
  }

  sendReminder(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reminder`, null);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
