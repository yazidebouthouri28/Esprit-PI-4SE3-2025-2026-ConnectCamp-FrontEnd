import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CampHighlight } from '../models/camping.models';

interface CampHighlightApiResponse {
    id: number;
    title: string;
    content: string;
    category: CampHighlight['category'];
    imageUrl?: string;
    isPublished?: boolean;
    tags?: string[];
    siteId: number;
    createdAt?: string;
    updatedAt?: string;
}

interface CampHighlightApiRequest {
    title: string;
    content: string;
    category: CampHighlight['category'];
    imageUrl?: string;
    isPublished?: boolean;
    tags?: string[];
    siteId: number;
}

interface HighlightMediaUploadApiResponse {
    url: string;
}

export interface SiteHighlightStats {
    siteId: number;
    siteName: string;
    totalHighlights: number;
    publishedHighlights: number;
}

export interface HighlightAdvancedSearchFilters {
    keyword?: string;
    siteId?: number;
    category?: CampHighlight['category'];
    published?: boolean;
    sortBy?: 'updatedAt' | 'createdAt' | 'title' | 'category';
    sortDirection?: 'asc' | 'desc';
}

export interface RelatedHighlight {
    id: number;
    title: string;
    category?: string;
    siteId?: number;
    siteName?: string;
    imageUrl?: string;
    isPublished?: boolean;
    relevanceScore?: number;
}

export interface HighlightQualityCheck {
    highlightId: number;
    qualityScore: number;
    status: string;
    hasImage: boolean;
    published: boolean;
    contentLength: number;
    strengths: string[];
    warnings: string[];
}

export interface HighlightCountMetric {
    label: string;
    count: number;
}

export interface HighlightDashboard {
    totalHighlights: number;
    publishedHighlights: number;
    unpublishedHighlights: number;
    averageContentLength: number;
    highlightsWithImage: number;
    byCategory: HighlightCountMetric[];
    topSites: HighlightCountMetric[];
}

@Injectable({
    providedIn: 'root'
})
export class CampHighlightService {
    private apiUrl = `${environment.apiUrl}/api/camp-highlights`;
    private readonly writeTimeoutMs = 30000;

    constructor(private http: HttpClient) { }

    getAllHighlights(): Observable<CampHighlight[]> {
        return this.http.get<CampHighlightApiResponse[]>(`${this.apiUrl}/all`).pipe(
            map((highlights) => highlights.map((highlight) => this.fromApi(highlight)))
        );
    }

    getSiteHighlightStats(): Observable<SiteHighlightStats[]> {
        return this.http.get<SiteHighlightStats[]>(`${this.apiUrl}/stats/by-site`);
    }

    getHighlightsBySite(siteId: number): Observable<CampHighlight[]> {
        return this.http.get<CampHighlightApiResponse[]>(`${this.apiUrl}/site/${siteId}`).pipe(
            map((highlights) => highlights.map((highlight) => this.fromApi(highlight)))
        );
    }

    getHighlightsBySiteAndCategory(siteId: number, category: CampHighlight['category']): Observable<CampHighlight[]> {
        return this.http.get<CampHighlightApiResponse[]>(`${this.apiUrl}/site/${siteId}/category/${category}`).pipe(
            map((highlights) => highlights.map((highlight) => this.fromApi(highlight)))
        );
    }

    searchHighlights(keyword: string): Observable<CampHighlight[]> {
        return this.http.get<CampHighlightApiResponse[]>(`${this.apiUrl}/search`, {
            params: { keyword }
        }).pipe(
            map((highlights) => highlights.map((highlight) => this.fromApi(highlight)))
        );
    }

    searchHighlightsAdvanced(filters: HighlightAdvancedSearchFilters): Observable<CampHighlight[]> {
        return this.http.get<CampHighlightApiResponse[]>(`${this.apiUrl}/advanced/search`, {
            params: this.toSearchParams(filters)
        }).pipe(
            map((highlights) => highlights.map((highlight) => this.fromApi(highlight)))
        );
    }

    getHighlightById(id: number): Observable<CampHighlight> {
        return this.http.get<CampHighlightApiResponse>(`${this.apiUrl}/${id}`).pipe(
            map((highlight) => this.fromApi(highlight))
        );
    }

    getRelatedHighlights(id: number): Observable<RelatedHighlight[]> {
        return this.http.get<RelatedHighlight[]>(`${this.apiUrl}/${id}/related`);
    }

    getQualityCheck(id: number): Observable<HighlightQualityCheck> {
        return this.http.get<HighlightQualityCheck>(`${this.apiUrl}/${id}/quality-check`);
    }

    getAdvancedDashboard(): Observable<HighlightDashboard> {
        return this.http.get<HighlightDashboard>(`${this.apiUrl}/advanced/dashboard`);
    }

    createHighlight(siteId: number, highlight: Partial<CampHighlight>): Observable<CampHighlight> {
        const payload: CampHighlightApiRequest = {
            title: highlight.title ?? '',
            content: highlight.content ?? '',
            category: highlight.category ?? 'FLORA',
            imageUrl: highlight.imageUrl ?? '',
            isPublished: highlight.isPublished ?? true,
            tags: this.normalizeTags(highlight.tags),
            siteId
        };

        return this.http.post<CampHighlightApiResponse>(`${this.apiUrl}/site/${siteId}`, payload).pipe(
            timeout(this.writeTimeoutMs),
            map((created) => this.fromApi(created))
        );
    }

    updateHighlight(id: number, highlight: Partial<CampHighlight>): Observable<CampHighlight> {
        const payload: CampHighlightApiRequest = {
            title: highlight.title ?? '',
            content: highlight.content ?? '',
            category: highlight.category ?? 'FLORA',
            imageUrl: highlight.imageUrl ?? '',
            isPublished: highlight.isPublished ?? true,
            tags: this.normalizeTags(highlight.tags),
            siteId: highlight.siteId ?? 0
        };

        return this.http.put<CampHighlightApiResponse>(`${this.apiUrl}/${id}`, payload).pipe(
            timeout(this.writeTimeoutMs),
            map((updated) => this.fromApi(updated))
        );
    }

    uploadHighlightMedia(siteId: number, file: File): Observable<string> {
        const formData = new FormData();
        formData.append('file', file, file.name);

        return this.http.post<HighlightMediaUploadApiResponse>(`${this.apiUrl}/site/${siteId}/media`, formData).pipe(
            timeout(this.writeTimeoutMs),
            map((response) => response?.url ?? '')
        );
    }

    deleteHighlight(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    private fromApi(highlight: CampHighlightApiResponse): CampHighlight {
        return {
            id: highlight.id,
            title: highlight.title,
            content: highlight.content,
            category: highlight.category,
            imageUrl: highlight.imageUrl ?? '',
            isPublished: highlight.isPublished ?? true,
            tags: this.normalizeTags(highlight.tags),
            siteId: highlight.siteId,
            createdAt: highlight.createdAt ?? '',
            updatedAt: highlight.updatedAt ?? ''
        };
    }

    private normalizeTags(tags?: string[] | null): string[] {
        const normalized: string[] = [];
        for (const raw of tags ?? []) {
            const tag = String(raw || '').trim();
            if (tag && !normalized.some((current) => current.toLowerCase() === tag.toLowerCase())) {
                normalized.push(tag);
            }
        }
        return normalized.slice(0, 8);
    }

    private toSearchParams(filters: HighlightAdvancedSearchFilters): HttpParams {
        let params = new HttpParams();

        for (const [key, value] of Object.entries(filters ?? {})) {
            if (value === undefined || value === null || value === '') {
                continue;
            }
            params = params.set(key, String(value));
        }

        return params;
    }
}
