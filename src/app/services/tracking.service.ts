import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TrackingResponse } from '../models/tracking.models';

const unwrapOne = (res: any) => res?.data || res;

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private url = `${environment.apiUrl}/api/orders`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/orders/{id}/tracking
   * Returns full tracking info including 17TRACK events.
   */
  getOrderTracking(orderId: number | string): Observable<TrackingResponse> {
    return this.http
      .get<any>(`${this.url}/${orderId}/tracking`)
      .pipe(map(unwrapOne));
  }

  /**
   * GET /api/orders/tracking/{orderNumber}
   */
  getTrackingByOrderNumber(orderNumber: string): Observable<TrackingResponse> {
    return this.http
      .get<any>(`${this.url}/tracking/${orderNumber}`)
      .pipe(map(unwrapOne));
  }

  /**
   * GET /api/orders/user/{userId}/tracking
   */
  getUserTracking(userId: number | string): Observable<TrackingResponse[]> {
    return this.http
      .get<any>(`${this.url}/user/${userId}/tracking`)
      .pipe(map(res => res?.data || res || []));
  }

  /** Maps a TrackingStatus code to a Tailwind CSS color class */
  statusColorClass(status: string): string {
    const map: Record<string, string> = {
      DELIVERED:          'bg-green-100 text-green-800 border-green-200',
      IN_TRANSIT:         'bg-blue-100 text-blue-800 border-blue-200',
      OUT_FOR_DELIVERY:   'bg-indigo-100 text-indigo-800 border-indigo-200',
      AT_PICKUP_POINT:    'bg-purple-100 text-purple-800 border-purple-200',
      PICKED_UP:          'bg-cyan-100 text-cyan-800 border-cyan-200',
      LABEL_CREATED:      'bg-gray-100 text-gray-700 border-gray-200',
      NOT_SHIPPED:        'bg-gray-100 text-gray-500 border-gray-200',
      DELIVERY_ATTEMPTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      EXCEPTION:          'bg-red-100 text-red-800 border-red-200',
      RETURNED_TO_SENDER: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  }

  /** Maps a TrackingStatus code to an emoji icon */
  statusIcon(status: string): string {
    const map: Record<string, string> = {
      DELIVERED:          '✅',
      IN_TRANSIT:         '🚚',
      OUT_FOR_DELIVERY:   '🛵',
      AT_PICKUP_POINT:    '📦',
      PICKED_UP:          '🏭',
      LABEL_CREATED:      '🏷️',
      NOT_SHIPPED:        '⏳',
      DELIVERY_ATTEMPTED: '⚠️',
      EXCEPTION:          '❌',
      RETURNED_TO_SENDER: '↩️',
    };
    return map[status] || '📦';
  }
}
