import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Intervention } from '../models/intervention.model';

@Injectable({
    providedIn: 'root'
})
export class InterventionService {
    private apiUrl = `${environment.apiUrl}/api/interventions`;

    constructor(private http: HttpClient) { }

    getByAlerte(alerteId: number): Observable<Intervention[]> {
        return this.http.get<Intervention[]>(`${this.apiUrl}/alerte/${alerteId}`);
    }

    create(intervention: Intervention): Observable<Intervention> {
        return this.http.post<Intervention>(this.apiUrl, intervention);
    }

    update(id: number, intervention: Intervention): Observable<Intervention> {
        return this.http.put<Intervention>(`${this.apiUrl}/${id}`, intervention);
    }
}
