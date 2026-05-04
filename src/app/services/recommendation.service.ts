// src/app/services/recommendation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductSuggestion {
  productId: number;
  productName: string;
  price: number;
  score: number;
  reason: string;
}

export interface CategoryResult {
  id: number;
  name: string;
}

export interface RecommendationResult {
  eventId: number;
  bestCategory: CategoryResult;
  products: ProductSuggestion[];
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRecommendations(eventId: number): Observable<RecommendationResult> {
    return this.http.get<RecommendationResult>(
      `${this.apiUrl}/api/recommendations/event/${eventId}`
    );
  }
}
