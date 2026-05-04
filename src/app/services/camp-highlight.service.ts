import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    siteId: number;
}

interface HighlightMediaUploadApiResponse {
    url: string;
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

    getHighlightById(id: number): Observable<CampHighlight> {
        return this.http.get<CampHighlightApiResponse>(`${this.apiUrl}/${id}`).pipe(
            map((highlight) => this.fromApi(highlight))
        );
    }

    createHighlight(siteId: number, highlight: Partial<CampHighlight>): Observable<CampHighlight> {
        const payload: CampHighlightApiRequest = {
            title: highlight.title ?? '',
            content: highlight.content ?? '',
            category: highlight.category ?? 'FLORA',
            imageUrl: highlight.imageUrl ?? '',
            isPublished: highlight.isPublished ?? true,
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
            siteId: highlight.siteId,
            createdAt: highlight.createdAt ?? '',
            updatedAt: highlight.updatedAt ?? ''
        };
    }
}
