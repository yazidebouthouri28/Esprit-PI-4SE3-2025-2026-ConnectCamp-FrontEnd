import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum AlertStatus {
    ACTIVE = 'ACTIVE',
    RESOLVED = 'RESOLVED',
    DISMISSED = 'DISMISSED'
}

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/alerts`;

    getAllAlerts(page: number = 0, size: number = 10): Observable<any> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<any>(this.apiUrl, { params });
    }

    createAlert(alert: any, siteId?: number): Observable<any> {
        let params = new HttpParams();
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser.id) params = params.set('reportedById', currentUser.id);
        if (siteId) params = params.set('siteId', siteId.toString());

        return this.http.post<any>(this.apiUrl, alert, { params });
    }

    resolveAlert(alertId: number, notes: string): Observable<any> {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const params = new HttpParams()
            .set('resolvedById', currentUser.id)
            .set('resolutionNotes', notes);
        return this.http.post<any>(`${this.apiUrl}/${alertId}/resolve`, {}, { params });
    }
}
