import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { Alerte, AlertWithInterventionStats, SiteRiskScore, InterventionEfficiency, EmergencyMLResponse } from '../models/alerte.model';

@Injectable({
    providedIn: 'root'
})
export class AlerteService {
    private apiUrl = `${environment.apiUrl}/api/emergency-alerts`;

    constructor(private http: HttpClient, private authService: AuthService) { }

    private get currentUserId(): string {
        return String(this.authService.getCurrentUser()?.id ?? '');
    }

    getAll(): Observable<Alerte[]> {
        return this.http.get<any>(this.apiUrl + '/active').pipe(
            map(response => response.data)
        );
    }

    getById(id: number): Observable<Alerte> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(response => response.data)
        );
    }

    create(alerte: Alerte): Observable<Alerte> {
        const reporterId = this.currentUserId;
        const params = new HttpParams().set('reporterId', reporterId);
        return this.http.post<any>(this.apiUrl, alerte, { params }).pipe(
            map(response => response.data)
        );
    }

    getMyAlerts(): Observable<Alerte[]> {
        const params = new HttpParams().set('reporterId', this.currentUserId);
        return this.http.get<any>(`${this.apiUrl}/my-alerts`, { params }).pipe(
            map(response => response.data.content)
        );
    }

    getDashboardAlerts(): Observable<Alerte[]> {
        return this.http.get<any>(this.apiUrl + '/all').pipe(
            map(response => response.data)
        );
    }

    acknowledge(id: number): Observable<Alerte> {
        const params = new HttpParams().set('userId', this.currentUserId);
        return this.http.put<any>(`${this.apiUrl}/${id}/acknowledge`, {}, { params }).pipe(
            map(response => response.data)
        );
    }

    resolve(id: number, notes: string): Observable<Alerte> {
        const params = new HttpParams()
            .set('userId', this.currentUserId)
            .set('resolutionNotes', notes);
        return this.http.put<any>(`${this.apiUrl}/${id}/resolve`, {}, { params }).pipe(
            map(response => response.data)
        );
    }

    /** GET /api/emergency-alerts/stats/with-interventions — JPQL JOIN (admin) */
    getAlertsWithInterventionStats(): Observable<AlertWithInterventionStats[]> {
        return this.http.get<any>(`${this.apiUrl}/stats/with-interventions`).pipe(
            map(response => response.data)
        );
    }

    /** GET /api/emergency-alerts/search?siteName=...&status=... — Keywords JOIN */
    searchBySiteNameAndStatus(siteName: string, status: string): Observable<Alerte[]> {
        const params = new HttpParams()
            .set('siteName', siteName)
            .set('status', status);
        return this.http.get<any>(`${this.apiUrl}/search`, { params }).pipe(
            map(response => response.data)
        );
    }

    /** GET /api/emergency-alerts/risk-score/{siteId} — Score de risque temps réel */
    getSiteRiskScore(siteId: number): Observable<SiteRiskScore> {
        return this.http.get<any>(`${this.apiUrl}/risk-score/${siteId}`).pipe(
            map(response => response.data)
        );
    }

    /** GET /api/emergency-alerts/intervention-efficiency — Efficacité par type */
    getInterventionEfficiency(): Observable<InterventionEfficiency[]> {
        return this.http.get<any>(`${this.apiUrl}/intervention-efficiency`).pipe(
            map(response => response.data)
        );
    }

    // ── ML Predictions ────────────────────────────────────────────────────

    /** GET /api/emergency-alerts/{id}/ml/predict — Sévérité + temps de réponse (full) */
    predictForAlert(id: number): Observable<EmergencyMLResponse> {
        return this.http.get<any>(`${this.apiUrl}/${id}/ml/predict`).pipe(
            map(response => response.data)
        );
    }

    /** POST /api/emergency-alerts/ml/predict-severity */
    predictSeverity(title: string, description: string, emergencyType: string,
                    affectedPersons: number = 1, evacuationRequired: boolean = false): Observable<EmergencyMLResponse> {
        const params = new HttpParams()
            .set('title', title)
            .set('description', description)
            .set('emergencyType', emergencyType)
            .set('affectedPersons', affectedPersons.toString())
            .set('evacuationRequired', evacuationRequired.toString());
        return this.http.post<any>(`${this.apiUrl}/ml/predict-severity`, {}, { params }).pipe(
            map(response => response.data)
        );
    }

    /** POST /api/emergency-alerts/ml/predict-response-time */
    predictResponseTime(emergencyType: string, severity: string,
                        affectedPersons: number = 1, evacuationRequired: boolean = false): Observable<EmergencyMLResponse> {
        const params = new HttpParams()
            .set('emergencyType', emergencyType)
            .set('severity', severity)
            .set('affectedPersons', affectedPersons.toString())
            .set('evacuationRequired', evacuationRequired.toString());
        return this.http.post<any>(`${this.apiUrl}/ml/predict-response-time`, {}, { params }).pipe(
            map(response => response.data)
        );
    }
}
