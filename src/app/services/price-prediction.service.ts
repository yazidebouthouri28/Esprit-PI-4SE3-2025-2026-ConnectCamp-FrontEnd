// src/app/services/price-prediction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PricePrediction {
  predictedPrice: number;
  priceMin: number;
  priceMax: number;
  confidence: 'low' | 'medium' | 'high';
}

@Injectable({ providedIn: 'root' })
export class PricePredictionService {
  constructor(private http: HttpClient) {}

  predict(productId: string): Observable<PricePrediction | null> {
    return this.http.get<PricePrediction>(
      `${environment.apiUrl}/api/price-prediction/product/${productId}`
    ).pipe(catchError(() => of(null)));
  }
}
