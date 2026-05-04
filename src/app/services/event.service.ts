import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { Event } from '../models/event.model';
import { EventServiceEntity } from '../models/event-service-entity.model';
import { ApiResponse } from '../models/api.models';

export interface MLPredictionRequest {
    category: string;
    state: string;
    hour: number;
    month: number;
    day_of_week: number;
}

export interface MLPredictionResponse {
    predicted_attendees: number;
    popularity: string;
    badge_suggestion: string;
}

type MaybeApiResponse<T> = ApiResponse<T> | T;

@Injectable({
    providedIn: 'root'
})
export class EventService {
    private apiUrl = `${environment.apiUrl}/api/events`;
    private readonly readTimeoutMs = 10000;
    private readonly writeTimeoutMs = 30000;

    constructor(private http: HttpClient) { }

    getEvents(): Observable<Event[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(res => res.data || res)
        );
    }

    getEventById(id: number): Observable<Event> {
        return this.http.get<Event>(`${this.apiUrl}/${id}`);
    }

    addRequestedService(eventId: number, service: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/api/event-services`, service);
    }

    getEventWorkRoles(eventId: number): Observable<EventServiceEntity[]> {
        return this.http.get<any>(`${environment.apiUrl}/api/event-services/event/${eventId}`).pipe(
            map(res => res.data || res || [])
        );
    }

    updateRequestedServiceSpots(eventId: number, requestedServiceId: number, change: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${eventId}/requested-services/${requestedServiceId}/spots`, { change });
    }

    predictEvent(data: MLPredictionRequest): Observable<MLPredictionResponse> {
        return this.http.post<MaybeApiResponse<MLPredictionResponse>>(`${this.apiUrl}/predict`, data).pipe(
            timeout(this.readTimeoutMs),
            map((res) => this.unwrap(res))
        );
    }

    createEvent(eventData: unknown): Observable<unknown> {
        return this.http.post<MaybeApiResponse<unknown>>(this.apiUrl, eventData).pipe(
            timeout(this.writeTimeoutMs),
            map((res) => this.unwrap(res))
        );
    }

    finalizeEvent(eventId: number, actualAttendees: number): Observable<unknown> {
        const params = new HttpParams().set('actualAttendees', String(actualAttendees));
        return this.http.post<MaybeApiResponse<unknown>>(`${this.apiUrl}/${eventId}/finalize`, {}, { params }).pipe(
            timeout(this.writeTimeoutMs),
            map((res) => this.unwrap(res))
        );
    }

    getRecommendations(): Observable<any[]> {
        return this.http.get<MaybeApiResponse<any[]>>(`${this.apiUrl}/recommendations`).pipe(
            timeout(this.readTimeoutMs),
            map((res) => this.unwrap(res))
        );
    }

    private unwrap<T>(res: MaybeApiResponse<T>): T {
        if (res && typeof res === 'object' && !Array.isArray(res) && ('success' in res || 'data' in res)) {
            const api = res as ApiResponse<T>;
            if (api.success === false) {
                throw new Error(api.message ?? 'Event request failed');
            }
            return api.data as T;
        }
        return res as T;
    }
}
