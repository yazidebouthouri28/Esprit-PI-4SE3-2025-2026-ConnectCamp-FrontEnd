import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Candidature } from '../models/candidature.model';

@Injectable({
    providedIn: 'root'
})
export class CandidatureService {
    private apiUrl = `${environment.apiUrl}/api/candidatures`;

    constructor(private http: HttpClient) { }

    getMyCandidatures(): Observable<Candidature[]> {
        const user = JSON.parse(localStorage.getItem('current_user') || '{}');
        const userId = user.id;
        return this.getByUser(userId);
    }

    getUserCandidatures(userId: number): Observable<Candidature[]> {
        return this.getByUser(userId);
    }

    getByUser(userId: number): Observable<Candidature[]> {
        return this.http.get<any>(`${this.apiUrl}/user/${userId}`).pipe(
            map(response => response.data || response)
        );
    }

    getByOrganizer(organizerId: number): Observable<Candidature[]> {
        return this.http.get<any>(`${this.apiUrl}/organizer/${organizerId}`).pipe(
            map(response => response.data || [])
        );
    }

    apply(eventServiceId: number, userId: number, candidature: any): Observable<Candidature> {
        const params = new HttpParams().set('userId', userId);
        return this.http.post<any>(`${this.apiUrl}/apply/${eventServiceId}`, candidature, { params }).pipe(
            map(response => response.data || response)
        );
    }

    withdraw(id: number): Observable<void> {
        const user = JSON.parse(localStorage.getItem('current_user') || '{}');
        const userId = user.id;
        const params = new HttpParams().set('userId', userId);
        return this.http.post<any>(`${this.apiUrl}/${id}/withdraw`, {}, { params }).pipe(
            map(response => response.data)
        );
    }

    getByEvent(eventId: number): Observable<Candidature[]> {
        return this.http.get<any>(`${this.apiUrl}/event/${eventId}`).pipe(
            map(response => response.data || [])
        );
    }

    updateStatus(id: number, organisateurId: number, status: string, notes?: string): Observable<Candidature> {
        let params = new HttpParams()
            .set('organisateurId', organisateurId.toString())
            .set('status', status);
        if (notes) params = params.set('notes', notes);

        return this.http.patch<any>(`${this.apiUrl}/${id}/status`, {}, { params }).pipe(
            map(response => response.data)
        );
    }
}
