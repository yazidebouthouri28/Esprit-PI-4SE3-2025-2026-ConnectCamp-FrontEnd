import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ParticipantRequest {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  specialNeeds?: string;
  eventId: number;
  userId?: number;
  ticketId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/participants`;

  joinEvent(request: ParticipantRequest): Observable<any> {
    return this.http.post(this.apiUrl, request);
  }

  getParticipantStats(eventId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/event/${eventId}/stats`);
  }

  getMyEvents(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }
}
