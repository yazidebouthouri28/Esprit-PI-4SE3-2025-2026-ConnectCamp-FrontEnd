import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CampsiteRecommendation {
  siteId: number;
  name: string;
  matchScore: number;
  matchReasons: string[];
  predictedRating: number;
  priceValueScore: number;
  imageQualityScore: number;
}

export interface PersonalizedRecommendationsResponse {
  recommendations: CampsiteRecommendation[];
  userPreferencesSummary: string;
  totalMatchesFound: number;
  topCategories: string[];
}

export interface MonthlyForecast {
  month: number;
  monthName: string;
  predictedPrice: number;
  priceChangePercent: number;
  demandLevel: string;
  recommendation: string;
}

export interface BestTimeToBookResponse {
  siteId: number;
  currentPrice: number;
  bestMonthsToBook: MonthlyForecast[];
  worstMonthsToAvoid: MonthlyForecast[];
  savingsOpportunity: number;
  recommendationSummary: string;
  urgencyLevel: string;
}

export interface SentimentBreakdown {
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  keyPositiveThemes: string[];
  keyNegativeThemes: string[];
}

export interface ReviewSummaryResponse {
  siteId: number;
  totalReviewsAnalyzed: number;
  aiSummary: string;
  sentiment: SentimentBreakdown;
  topMentionedPros: any[];
  topMentionedCons: any[];
  representativeQuotes: string[];
  confidenceScore: number;
}

export interface MatchDetail {
  category: string;
  score: number;
  explanation: string;
  matchingFeatures: string[];
  missingFeatures: string[];
}

export interface MatchScoreResponse {
  siteId: number;
  campsiteName: string;
  overallMatchScore: number;
  matchGrade: string;
  matchDetails: MatchDetail[];
  topMatchingAspects: string[];
  dealBreakers: string[];
  personalizedRecommendation: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserMlService {
  private apiUrl = `${environment.apiUrl}/api/ml/user`;

  constructor(private http: HttpClient) {}

  // 1. Personalized Recommendations
  getPersonalizedRecommendations(
    userId: number,
    preferredAmenities?: string[],
    locationTypes?: string[],
    budgetMin?: number,
    budgetMax?: number
  ): Observable<PersonalizedRecommendationsResponse> {
    const params: any = { userId };
    if (preferredAmenities) params.preferredAmenities = preferredAmenities.join(',');
    if (locationTypes) params.locationTypes = locationTypes.join(',');
    if (budgetMin) params.budgetMin = budgetMin;
    if (budgetMax) params.budgetMax = budgetMax;

    return this.http.post<PersonalizedRecommendationsResponse>(
      `${this.apiUrl}/recommendations`,
      null,
      { params }
    );
  }

  // 2. Best Time to Book
  getBestTimeToBook(siteId: number, currentPrice: number, desiredMonth: number): Observable<BestTimeToBookResponse> {
    return this.http.post<BestTimeToBookResponse>(
      `${this.apiUrl}/best-time-to-book`,
      null,
      { params: { siteId, currentPrice, desiredMonth } }
    );
  }

  // 3. Review Summary
  getReviewSummary(siteId: number, reviews: string[]): Observable<ReviewSummaryResponse> {
    return this.http.post<ReviewSummaryResponse>(
      `${this.apiUrl}/review-summary`,
      reviews,
      { params: { siteId } }
    );
  }

  // 4. Match Score
  getMatchScore(
    siteId: number,
    siteName: string,
    siteFeatures: any,
    userAmenities?: string[],
    budgetMin?: number,
    budgetMax?: number,
    preferredLocations?: string[]
  ): Observable<MatchScoreResponse> {
    const params: any = { siteId, siteName };
    if (userAmenities) params.userAmenities = userAmenities.join(',');
    if (budgetMin) params.budgetMin = budgetMin;
    if (budgetMax) params.budgetMax = budgetMax;
    if (preferredLocations) params.preferredLocations = preferredLocations.join(',');

    return this.http.post<MatchScoreResponse>(
      `${this.apiUrl}/match-score`,
      siteFeatures,
      { params }
    );
  }
}
