import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CandidatureResponse {
  id: number;
  statut: string;
  notesEvaluation?: string;
  dateCandidature: string;
  dateDecision?: string;
  candidatId: number;
  candidatName: string;
  eventServiceId: number;
  eventId: number;
  eventName: string;
  serviceName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/candidatures`;

  apply(eventServiceId: number, userId: number, details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/apply/${eventServiceId}`, details, {
      params: { userId: userId.toString() }
    });
  }

  updateStatus(candidatureId: number, organisateurId: number, status: string, notes?: string): Observable<any> {
    let params = new HttpParams()
      .set('organisateurId', organisateurId.toString())
      .set('status', status);
    
    if (notes) params = params.set('notes', notes);

    return this.http.patch(`${this.apiUrl}/${candidatureId}/status`, {}, { params });
  }

  getByEvent(eventId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/event/${eventId}`);
  }

  getByUser(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }

  getByOrganizer(organizerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/organizer/${organizerId}`);
  }

  withdraw(id: number, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/withdraw`, {}, {
      params: { userId: userId.toString() }
    });
  }
}
