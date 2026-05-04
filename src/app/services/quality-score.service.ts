import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

export const API_BASE = 'http://localhost:8089/api';

export type QualityBadge = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'NEEDS_IMPROVEMENT';

export interface QualityScoreBreakdown {
  completenessScore: number;  // /25
  mediaScore: number;         // /15
  reviewScore: number;        // /25
  performanceScore: number;   // /20
  sellerScore: number;        // /15
}

export interface ProductQualityScore {
  productId: number;
  productName: string;
  overallScore: number;       // 0–100
  badge: QualityBadge;
  badgeColor: string;         // 'gold' | 'silver' | 'bronze' | 'gray'
  breakdown: QualityScoreBreakdown;
  isActive: boolean;
}

export interface BadgeConfig {
  label: string;
  emoji: string;
  tailwindBg: string;
  tailwindText: string;
  tailwindBorder: string;
  tailwindRing: string;
  glowColor: string;
}

@Injectable({ providedIn: 'root' })
export class QualityScoreService {

  private readonly url = `${API_BASE}/products`;

  /** Maps badge keys to display config */
  readonly badgeConfig: Record<QualityBadge, BadgeConfig> = {
    EXCELLENT: {
      label: 'Excellent',
      emoji: '🏆',
      tailwindBg: 'bg-amber-50',
      tailwindText: 'text-amber-700',
      tailwindBorder: 'border-amber-300',
      tailwindRing: 'ring-amber-400',
      glowColor: 'rgba(251,191,36,0.35)'
    },
    GOOD: {
      label: 'Bon',
      emoji: '✨',
      tailwindBg: 'bg-blue-50',
      tailwindText: 'text-blue-700',
      tailwindBorder: 'border-blue-300',
      tailwindRing: 'ring-blue-400',
      glowColor: 'rgba(96,165,250,0.30)'
    },
    AVERAGE: {
      label: 'Moyen',
      emoji: '👍',
      tailwindBg: 'bg-orange-50',
      tailwindText: 'text-orange-600',
      tailwindBorder: 'border-orange-300',
      tailwindRing: 'ring-orange-400',
      glowColor: 'rgba(251,146,60,0.25)'
    },
    NEEDS_IMPROVEMENT: {
      label: 'À améliorer',
      emoji: '📈',
      tailwindBg: 'bg-gray-100',
      tailwindText: 'text-gray-500',
      tailwindBorder: 'border-gray-300',
      tailwindRing: 'ring-gray-400',
      glowColor: 'rgba(156,163,175,0.20)'
    }
  };

  // In-memory cache: productId → score
  private cache = new Map<number, ProductQualityScore>();

  constructor(private http: HttpClient) {}

  /** Fetch quality score for a single product. Uses in-memory cache. */
  getScore(productId: string | number): Observable<ProductQualityScore> {
    const numId = Number(productId);
    if (isNaN(numId) || numId <= 0) return of(this.buildFallback(0));

    const cached = this.cache.get(numId);
    if (cached) return of(cached);

    return this.http
      .get<any>(`${this.url}/${numId}/quality-score`)
      .pipe(
        map(res => {
          const data: ProductQualityScore = res?.data ?? res;
          this.cache.set(numId, data);
          return data;
        }),
        catchError(() => of(this.buildFallback(numId)))
      );
  }

  /** Batch-fetch scores for a list of product IDs. */
  getScoresBatch(productIds: number[]): Observable<ProductQualityScore[]> {
    const uncached = productIds.filter(id => !this.cache.has(id));

    if (uncached.length === 0) {
      return of(productIds.map(id => this.cache.get(id)!));
    }

    return this.http
      .post<any>(`${this.url}/quality-score/batch`, uncached)
      .pipe(
        map(res => {
          const list: ProductQualityScore[] = res?.data ?? res ?? [];
          list.forEach(s => this.cache.set(s.productId, s));
          // Return all requested (cached + freshly fetched)
          return productIds.map(id => this.cache.get(id) ?? this.buildFallback(id));
        }),
        catchError(() => of(productIds.map(id => this.buildFallback(id))))
      );
  }

  /** Fetch top-ranked products by quality score (paginated). */
  getTopQualityProducts(page = 0, size = 8): Observable<ProductQualityScore[]> {
    return this.http
      .get<any>(`${this.url}/quality-ranking`, {
        params: { page: String(page), size: String(size) }
      })
      .pipe(
        map(res => {
          const list: ProductQualityScore[] = res?.data?.content ?? res?.data ?? res ?? [];
          list.forEach(s => this.cache.set(s.productId, s));
          return list;
        }),
        catchError(() => of([])),
        shareReplay(1)
      );
  }

  getBadgeConfig(badge: QualityBadge): BadgeConfig {
    return this.badgeConfig[badge] ?? this.badgeConfig['NEEDS_IMPROVEMENT'];
  }

  /** Returns a score tier label usable in aria attributes. */
  getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'À améliorer';
  }

  private buildFallback(productId: number): ProductQualityScore {
    return {
      productId,
      productName: '',
      overallScore: 0,
      badge: 'NEEDS_IMPROVEMENT',
      badgeColor: 'gray',
      breakdown: { completenessScore: 0, mediaScore: 0, reviewScore: 0, performanceScore: 0, sellerScore: 0 },
      isActive: false
    };
  }
}
