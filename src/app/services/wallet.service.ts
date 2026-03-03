import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Wallet, WalletTransaction, AddFundsDto } from '../models/api.models';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = `${environment.apiUrl}/wallet`;

  constructor(private http: HttpClient) {}

  private extractData<T>(response: ApiResponse<T>): T {
    return response.data ?? ({} as any);
  }

  getMyWallet(): Observable<Wallet> {
    return this.http.get<ApiResponse<Wallet>>(this.apiUrl)
      .pipe(map(res => this.extractData(res)));
  }

  getBalance(): Observable<{ balance: number; loyaltyPoints: number }> {
    // Balance comes from the main wallet endpoint
    return this.http.get<ApiResponse<Wallet>>(this.apiUrl)
      .pipe(map(res => {
        const wallet = this.extractData(res);
        return { balance: wallet?.balance ?? 0, loyaltyPoints: (wallet as any)?.loyaltyPoints ?? 0 };
      }));
  }

  addFunds(data: AddFundsDto): Observable<Wallet> {
    return this.http.post<ApiResponse<Wallet>>(`${this.apiUrl}/add-funds`, data)
      .pipe(map(res => this.extractData(res)));
  }

  getTransactions(): Observable<WalletTransaction[]> {
    return this.http.get<ApiResponse<WalletTransaction[]>>(`${this.apiUrl}/transactions`)
      .pipe(map(res => this.extractData(res) ?? []));
  }

  getTransactionById(id: string): Observable<WalletTransaction> {
    return this.http.get<ApiResponse<WalletTransaction>>(`${this.apiUrl}/transactions/${id}`)
      .pipe(map(res => this.extractData(res)));
  }
}
