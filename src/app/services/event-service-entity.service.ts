import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { EventServiceEntity, EventServiceEntityRequest } from '../models/event-service-entity.model';

@Injectable({
    providedIn: 'root'
})
export class EventServiceEntityService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/event-services`;
    private assignmentUrl = `${environment.apiUrl}/api/event-service-assignments`;

    addServiceToEvent(request: EventServiceEntityRequest): Observable<ApiResponse<EventServiceEntity>> {
        return this.http.post<ApiResponse<EventServiceEntity>>(this.apiUrl, request);
    }

    getServicesByEvent(eventId: number): Observable<ApiResponse<EventServiceEntity[]>> {
        return this.http.get<ApiResponse<EventServiceEntity[]>>(`${this.apiUrl}/event/${eventId}`);
    }

    removeServiceFromEvent(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }

    /** GET /api/event-service-assignments/recommendations/{eventId} */
    getRecommendedServices(eventId: number): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.assignmentUrl}/recommendations/${eventId}`);
    }

    /** GET /api/event-service-assignments/recommended-packs/{eventId} */
    getRecommendedPacks(eventId: number): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.assignmentUrl}/recommended-packs/${eventId}`);
    }
}
