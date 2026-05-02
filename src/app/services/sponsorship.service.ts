import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SponsorshipRequest {
  sponsorshipType: string;
  sponsorshipLevel: string;
  description?: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  benefits?: string;
  deliverables?: string;
  notes?: string;
}

export interface SponsorshipResponse {
  id: number;
  sponsor: {
    id: number;
    name: string;
    email: string;
    logo?: string;
  };
  event: {
    id: number;
    title: string;
    description?: string;
    location?: string;
    startDateTime?: string;
    endDateTime?: string;
  };
  sponsorshipType: string;
  sponsorshipLevel?: string;
  description?: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  benefits?: string;
  deliverables?: string;
  status: string;
  isActive: boolean;
  isPaid: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SponsorshipService {
  private adminApiUrl = `${environment.apiUrl}/api/admin/sponsorships`;
  private sponsorApiUrl = `${environment.apiUrl}/api/sponsor`;
  private apiUrl = `${environment.apiUrl}/api/sponsors`;

  constructor(private http: HttpClient) { }

  // Admin methods
  assignEventToSponsor(sponsorId: number, eventId: number, request: SponsorshipRequest): Observable<any> {
    return this.http.post(`${this.adminApiUrl}/assign?sponsorId=${sponsorId}&eventId=${eventId}`, request);
  }

  getAllSponsorships(status?: string, page: number = 0, size: number = 50): Observable<any> {
    const params: any = { page, size };
    if (status) {
      params.status = status;
    }
    return this.http.get(this.adminApiUrl, { params });
  }

  getSponsorshipsByStatus(status: string): Observable<any> {
    return this.http.get(`${this.adminApiUrl}/by-status/${status}`);
  }

  getPendingSponsorships(): Observable<any> {
    return this.http.get(`${this.adminApiUrl}/pending`);
  }

  getAcceptedSponsorships(): Observable<any> {
    return this.http.get(`${this.adminApiUrl}/accepted`);
  }

  getDeclinedSponsorships(): Observable<any> {
    return this.http.get(`${this.adminApiUrl}/declined`);
  }

  getAvailableEvents(): Observable<any> {
    return this.http.get(`${this.adminApiUrl}/available-events`);
  }

  getAvailableSponsors(): Observable<any> {
    return this.http.get(`${this.adminApiUrl}/available-sponsors`);
  }

  confirmAcceptance(sponsorshipId: number): Observable<any> {
    return this.http.post(`${this.adminApiUrl}/${sponsorshipId}/confirm-acceptance`, {});
  }

  confirmDecline(sponsorshipId: number): Observable<any> {
    return this.http.post(`${this.adminApiUrl}/${sponsorshipId}/confirm-declined`, {});
  }

  getSponsorshipStats(): Observable<any> {
    return this.http.get(`${this.adminApiUrl}/stats`);
  }

  // Sponsor methods
  getAvailableEventsForSponsors(): Observable<any> {
    return this.http.get(`${this.sponsorApiUrl}/available-events`);
  }

  getMySponsorships(sponsorId: number, status?: string): Observable<any> {
    let url = `${this.sponsorApiUrl}/my-sponsorships?sponsorId=${sponsorId}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get(url);
  }

  requestSponsorship(sponsorId: number, eventId: number, request: SponsorshipRequest): Observable<any> {
    return this.http.post(`${this.sponsorApiUrl}/request-sponsorship?sponsorId=${sponsorId}&eventId=${eventId}`, request);
  }

  acceptSponsorship(sponsorshipId: number): Observable<any> {
    return this.http.post(`${this.sponsorApiUrl}/sponsorships/${sponsorshipId}/accept`, {});
  }

  declineSponsorship(sponsorshipId: number, reason?: string): Observable<any> {
    let url = `${this.sponsorApiUrl}/sponsorships/${sponsorshipId}/decline`;
    if (reason) {
      url += `?reason=${encodeURIComponent(reason)}`;
    }
    return this.http.post(url, {});
  }

  getPendingInvitations(sponsorId: number): Observable<any> {
    return this.http.get(`${this.sponsorApiUrl}/invitations?sponsorId=${sponsorId}`);
  }

  getSponsorDashboardStats(sponsorId: number): Observable<any> {
    return this.http.get(`${this.sponsorApiUrl}/dashboard-stats?sponsorId=${sponsorId}`);
  }

  // General methods
  getSponsorshipById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/sponsorships/${id}`);
  }

  updateSponsorshipStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/sponsorships/${id}/status?status=${status}`, {});
  }

  markAsPaid(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/sponsorships/${id}/mark-paid`, {});
  }

  deleteSponsorship(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sponsorships/${id}`);
  }
}
