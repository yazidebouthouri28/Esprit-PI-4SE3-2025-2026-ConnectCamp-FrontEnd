import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CancellationRiskResponse {
  riskScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  featureImportance: Array<{ feature: string; impact: number }>;
  recommendation: string;
  usingFallback?: boolean;
}

export interface PricingOptimizationResponse {
  optimalPrice: number;
  confidence: number;
  revenueImpact: number;
  factors: Array<{ name: string; impact: string; explanation: string }>;
  forecastData: Array<{ month: number; suggestedPrice: number; demand: number }>;
  usingFallback?: boolean;
}

export interface ImageAnalysisResponse {
  qualityScore: number;
  amenities: string[];
  environment: string;
  environmentConfidence: number;
  suggestions: string[];
}

export interface HighlightClassificationResponse {
  predictedCategory: string;
  confidence: number;
  alternativeCategories: string[];
  suggestedTags: Array<{ tag: string; relevance: number }>;
  categoryProbabilities: { [key: string]: number };
  usingFallback?: boolean;
}

export interface RevenuePredictionResponse {
  predictedRevenue: number;
  confidenceInterval: { lower: number; upper: number };
  breakdown: {
    accommodation: number;
    activities: number;
    equipment: number;
    meals: number;
    other: number;
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Optional narrative factors when the backend returns them */
  keyFactors?: string[];
  usingFallback?: boolean;
}

export interface MlDashboardStats {
  status: string;
  totalPredictions: { [key: string]: number };
  modelPerformance: { [key: string]: any };
  modelVersions: { [key: string]: string };
}

@Injectable({
  providedIn: 'root'
})
export class MlIntegrationService {
  private apiUrl = `${environment.apiUrl}/api/ml`;

  constructor(private http: HttpClient) {}

  // ==================== CANCELLATION PREDICTION ====================
  analyzeCancellationRisk(reservationId: number): Observable<CancellationRiskResponse> {
    return this.http.post<CancellationRiskResponse>(
      `${this.apiUrl}/reservation/${reservationId}/cancellation-risk`,
      {}
    );
  }

  // ==================== DYNAMIC PRICING ====================
  getOptimalPrice(siteId: number, currentPrice?: number): Observable<PricingOptimizationResponse> {
    const options = currentPrice && currentPrice > 0
      ? { params: { currentPrice: String(currentPrice) } }
      : {};

    return this.http.post<PricingOptimizationResponse>(
      `${this.apiUrl}/campsite/${siteId}/optimal-price`,
      {},
      options
    );
  }

  // ==================== IMAGE ANALYSIS ====================
  analyzeImage(imageFile: File): Observable<ImageAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post<ImageAnalysisResponse>(
      `${this.apiUrl}/image/analyze`,
      formData
    );
  }

  // ==================== HIGHLIGHT CLASSIFICATION ====================
  classifyHighlight(title: string, content: string): Observable<HighlightClassificationResponse> {
    return this.http.post<HighlightClassificationResponse>(
      `${this.apiUrl}/highlight/classify`,
      { title, content }
    ).pipe(timeout(6000));
  }

  // ==================== REVENUE PREDICTION ====================
  predictRevenue(reservationId: number): Observable<RevenuePredictionResponse> {
    return this.http.post<RevenuePredictionResponse>(
      `${this.apiUrl}/reservation/${reservationId}/revenue-prediction`,
      {}
    );
  }

  // ==================== DASHBOARD STATS ====================
  getMlDashboardStats(): Observable<MlDashboardStats> {
    return this.http.get<MlDashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }
}
