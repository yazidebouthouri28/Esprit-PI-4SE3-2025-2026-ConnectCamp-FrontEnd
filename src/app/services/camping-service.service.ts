import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CampingService, CampingServiceRequest, ServiceMLResponse } from '../models/camping-service.model';

@Injectable({
    providedIn: 'root'
})
export class CampingServiceService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/camping-services`;

    getAllServices(page: number = 0, size: number = 10): Observable<any> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<any>(this.apiUrl, { params });
    }

    getServiceById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    getActiveServices(page: number = 0, size: number = 10): Observable<any> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<any>(`${this.apiUrl}/active`, { params });
    }

    getOrganizerServices(page: number = 0, size: number = 10): Observable<any> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<any>(`${this.apiUrl}/organizer`, { params });
    }

    getServicesByType(type: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/type/${type}`);
    }

    getServicesBySiteId(siteId: number, page: number = 0, size: number = 10): Observable<any> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<any>(`${this.apiUrl}/site/${siteId}`, { params });
    }

    createService(service: CampingServiceRequest, providerId: number, siteId?: number): Observable<any> {
        let params = new HttpParams().set('providerId', providerId.toString());
        if (siteId) {
            params = params.set('siteId', siteId.toString());
        }
        return this.http.post<any>(this.apiUrl, service, { params });
    }

    updateService(id: number, service: CampingServiceRequest): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, service);
    }

    deleteService(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }

    getAtRiskServices(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/analytics/at-risk`).pipe(
            map(response => response.data || [])
        );
    }

    // ── ML Predictions ────────────────────────────────────────────────────

    predictForService(id: number): Observable<ServiceMLResponse> {
        return this.http.get<any>(`${this.apiUrl}/${id}/ml/predict`).pipe(
            map(response => response.data)
        );
    }

    predictFull(request: any): Observable<ServiceMLResponse> {
        return this.http.post<any>(`${this.apiUrl}/ml/predict`, request).pipe(
            map(response => response.data)
        );
    }
}
