import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, defer, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Service } from '../models/service.model';
import { ServiceMLResponse } from '../../../models/camping-service.model';

@Injectable({
    providedIn: 'root'
})
export class ServiceService {
    private apiUrl = `${environment.apiUrl}/api/camping-services`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Service[]> {
        return this.http.get<any>(`${this.apiUrl}?size=200&page=0`).pipe(
            map(response => {
                const data = response?.data?.content || response?.data || response || [];
                return (Array.isArray(data) ? data : []).map((s: any) => this.mapToService(s));
            })
        );
    }

    getById(id: number): Observable<Service> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(response => this.mapToService(response.data))
        );
    }

    create(service: Service): Observable<Service> {
        return defer(() => {
            const userJson = localStorage.getItem('current_user');
            if (!userJson) {
                return throwError(() => new Error('Utilisateur non connecté.'));
            }
            const user = JSON.parse(userJson);
            const providerId = user.id || user.userId;

            if (!providerId) {
                return throwError(() => new Error('ID Utilisateur manquant.'));
            }

            let params = new HttpParams().set('providerId', providerId.toString());
            if (service.campingId) {
                params = params.set('siteId', service.campingId.toString());
            }

            return this.http.post<any>(this.apiUrl, {
                name: service.name,
                description: service.description,
                type: service.type,
                price: service.price || 1,
                isAvailable: service.available,
                isCamperOnly: service.targetRole === 'USER',
                isOrganizerService: service.targetRole === 'ORGANIZER',
                images: service.images,
                isActive: service.isActive !== undefined ? service.isActive : true
            }, { params }).pipe(
                map(response => {
                    if (!response || !response.success) {
                        throw new Error(response?.message || 'Erreur lors de la création.');
                    }
                    return this.mapToService(response.data);
                })
            );
        });
    }

    update(id: number, service: Service): Observable<Service> {
        return defer(() => {
            return this.http.put<any>(`${this.apiUrl}/${id}`, {
                name: service.name,
                description: service.description,
                type: service.type,
                price: service.price || 1,
                isAvailable: service.available,
                isCamperOnly: service.targetRole === 'USER',
                isOrganizerService: service.targetRole === 'ORGANIZER',
                images: service.images,
                isActive: service.isActive !== undefined ? service.isActive : true
            }).pipe(
                map(response => {
                    if (!response || !response.success) {
                        throw new Error(response?.message || 'Erreur lors de la mise à jour.');
                    }
                    return this.mapToService(response.data);
                })
            );
        });
    }

    delete(id: number): Observable<void> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
            map(response => response.data)
        );
    }

    getByCamping(campingId: number): Observable<Service[]> {
        return this.http.get<Service[]>(`${this.apiUrl}/camping/${campingId}`);
    }

    getAvailable(): Observable<Service[]> {
        return this.http.get<Service[]>(`${this.apiUrl}/disponibles`);
    }
    /** GET /api/camping-services/{id}/ml/predict — rating + demand (camper) */
    predictForService(id: number): Observable<ServiceMLResponse> {
        return this.http.get<any>(`${this.apiUrl}/${id}/ml/predict`).pipe(
            map(response => response.data)
        );
    }

    getAtRiskServices(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/analytics/at-risk`).pipe(
            map(response => response.data)
        );
    }

    private mapToService(data: any): Service {
        if (!data) return {} as Service;
        const isOrg = data.isOrganizerService === true;
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            price: data.price,
            type: data.type,
            available: data.isAvailable !== undefined ? data.isAvailable : data.available,
            campingId: data.siteId,
            targetRole: isOrg ? 'ORGANIZER' : 'USER',
            isOrganizerService: isOrg,
            isCamperOnly: data.isCamperOnly === true,
            images: data.images || [],
            isActive: data.isActive
        };
    }
}
