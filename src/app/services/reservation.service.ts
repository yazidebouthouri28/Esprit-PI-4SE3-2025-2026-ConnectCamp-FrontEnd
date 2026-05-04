import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface ApiEnvelope<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

interface PagePayload<T> {
  content?: T[];
}

export interface SiteReservationPayload {
  userId: number;
  siteId: number;
  checkIn: string;   // ISO datetime
  checkOut: string;  // ISO datetime
  numberOfGuests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
}

export interface ReservationRecord {
  id: number;
  reservationNumber?: string;
  userId?: number;
  userName?: string;
  siteId?: number;
  siteName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
  totalPrice?: number;
  status?: string;
  paymentStatus?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/api/reservations`;

  constructor(private http: HttpClient) {}

  getAllReservations(): Observable<ReservationRecord[]> {
    return this.http.get<ApiEnvelope<ReservationRecord[]>>(this.apiUrl).pipe(
      map((res) => res?.data ?? [])
    );
  }

  createSiteReservation(payload: SiteReservationPayload): Observable<ReservationRecord> {
    let params = new HttpParams()
      .set('userId', payload.userId)
      .set('siteId', payload.siteId)
      .set('checkIn', payload.checkIn)
      .set('checkOut', payload.checkOut)
      .set('numberOfGuests', payload.numberOfGuests)
      .set('guestName', payload.guestName)
      .set('guestEmail', payload.guestEmail)
      .set('guestPhone', payload.guestPhone);

    if (payload.specialRequests?.trim()) {
      params = params.set('specialRequests', payload.specialRequests.trim());
    }

    return this.http.post<ApiEnvelope<ReservationRecord>>(`${this.apiUrl}/site`, null, { params }).pipe(
      map((res) => res?.data as ReservationRecord)
    );
  }

  confirmReservation(id: number): Observable<ReservationRecord> {
    return this.http.patch<ApiEnvelope<ReservationRecord>>(`${this.apiUrl}/${id}/confirm`, null).pipe(
      map((res) => res?.data as ReservationRecord)
    );
  }

  getReservationsByUser(userId: number): Observable<ReservationRecord[]> {
    return this.http.get<ApiEnvelope<PagePayload<ReservationRecord>>>(`${this.apiUrl}/user/${userId}`).pipe(
      map((res) => res?.data?.content ?? [])
    );
  }

  cancelReservation(id: number, reason?: string): Observable<ReservationRecord> {
    let params = new HttpParams();
    if (reason?.trim()) {
      params = params.set('reason', reason.trim());
    }
    return this.http.patch<ApiEnvelope<ReservationRecord>>(`${this.apiUrl}/${id}/cancel`, null, { params }).pipe(
      map((res) => res?.data as ReservationRecord)
    );
  }

  cancelReservationByUser(id: number, userId: number, reason?: string): Observable<ReservationRecord> {
    let params = new HttpParams().set('userId', userId);
    if (reason?.trim()) {
      params = params.set('reason', reason.trim());
    }
    return this.http.patch<ApiEnvelope<ReservationRecord>>(`${this.apiUrl}/${id}/cancel-by-user`, null, { params }).pipe(
      map((res) => res?.data as ReservationRecord)
    );
  }

  payNowHardcoded(id: number, userId: number): Observable<ReservationRecord> {
    const params = new HttpParams().set('userId', userId);
    return this.http.patch<ApiEnvelope<ReservationRecord>>(`${this.apiUrl}/${id}/pay-now`, null, { params }).pipe(
      map((res) => res?.data as ReservationRecord)
    );
  }
}

