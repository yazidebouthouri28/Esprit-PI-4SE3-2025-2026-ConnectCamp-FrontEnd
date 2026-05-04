import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Promotion } from '../models/promotion.model';

@Injectable({
    providedIn: 'root'
})
export class PromotionService {
    private apiUrl = `${environment.apiUrl}/api/promotions`;
    private cartApiUrl = `${environment.apiUrl}/api/cart`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Promotion[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => {
                if (response && response.data) {
                    return response.data;
                }
                return response; // Fallback if not wrapped
            })
        );
    }

    create(promotion: Promotion): Observable<Promotion> {
        return this.http.post<any>(this.apiUrl, promotion).pipe(
            map(response => {
                if (response && response.data) {
                    return response.data;
                }
                if (response && response.success && response.data === null) {
                    return {} as Promotion; // Handle empty data success
                }
                return response;
            })
        );
    }

    validateCode(code: string, amount: number, userId?: number): Observable<any> {
        let url = `${this.apiUrl}/validate?code=${encodeURIComponent(code)}&montant=${amount}`;
        if (userId) url += `&userId=${userId}`;
        return this.http.post<any>(url, {}).pipe(
            map(response => response?.data ?? response)
        );
    }

    applyToCart(userId: number, code: string): Observable<any> {
        return this.http.post<any>(
            `${this.cartApiUrl}/${userId}/promo?code=${encodeURIComponent(code)}`, {}
        ).pipe(map(response => response?.data ?? response));
    }

    removeFromCart(userId: number): Observable<any> {
        return this.http.delete<any>(
            `${this.cartApiUrl}/${userId}/promo`
        ).pipe(map(response => response?.data ?? response));
    }

    getById(id: number): Observable<Promotion> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(response => {
                if (response && response.data) {
                    return response.data;
                }
                return response;
            })
        );
    }

    update(id: number, promotion: Promotion): Observable<Promotion> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, promotion).pipe(
            map(response => {
                if (response && response.data) {
                    return response.data;
                }
                return response;
            })
        );
    }

    delete(id: number): Observable<void> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
            map(response => {
                if (!response.success) {
                    throw new Error(response.message || 'Error deleting promotion');
                }
            })
        );
    }
}
