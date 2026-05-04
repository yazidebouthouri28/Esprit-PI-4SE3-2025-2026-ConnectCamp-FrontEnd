import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ThrottleStatus {
  userId: number;
  currentCount: number;
  threshold: number;
  abuseScore: number;
  status: 'NORMAL' | 'WARNING' | 'BLOCKED' | 'BANNED';
  banType?: 'SOFT' | 'HARD';
  banExpiresAt?: string;
  banReason?: string;
  remainingRequests: number;
  windowUtilization: number;
  windowResetAt: string;
}

export interface SystemStats {
  totalBannedUsers: number;
  softBans: number;
  hardBans: number;
  defaultThreshold: number;
  windowSeconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class ThrottleService {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Get throttle status for a specific user
   */
  getThrottleStatus(userId: number): Observable<ThrottleStatus> {
    return this.http.get<ThrottleStatus>(`${this.apiUrl}/admin/throttle/status/${userId}`);
  }

  /**
   * Get all currently banned users
   */
  getBannedUsers(): Observable<ThrottleStatus[]> {
    return this.http.get<ThrottleStatus[]>(`${this.apiUrl}/admin/throttle/banned`);
  }

  /**
   * Unban a user
   */
  unbanUser(userId: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/admin/throttle/unban/${userId}`, {});
  }

  /**
   * Reset user's throttle settings (score and threshold)
   */
  resetUser(userId: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/admin/throttle/reset/${userId}`, {});
  }

  /**
   * Set custom threshold for a user
   */
  setThreshold(userId: number, threshold: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/admin/throttle/threshold/${userId}/${threshold}`, {});
  }

  /**
   * Reduce abuse score for a user
   */
  reduceAbuseScore(userId: number, reduction: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/admin/throttle/reduce-score/${userId}/${reduction}`, {});
  }

  /**
   * Get system statistics
   */
  getSystemStats(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/admin/throttle/stats`, { responseType: 'text' as 'json' });
  }

  /**
   * Test endpoint to trigger throttling
   */
  ping(userId?: number): Observable<any> {
    const headers: Record<string, string> = {};
    if (userId) {
      headers['X-User-Id'] = userId.toString();
    }
    return this.http.get(`${this.apiUrl}/messages/ping`, { headers });
  }
}
