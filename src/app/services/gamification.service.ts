import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { Badge, Medal } from '../models/gamification.models';
import { isUnreachableApiRoute } from '../utils/http-api-fallback';

@Injectable({
    providedIn: 'root'
})
export class GamificationService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/gamifications`;
    private legacyBadgesUrl = `${environment.apiUrl}/api/badges`;
    private legacyMedalsUrl = `${environment.apiUrl}/api/medals`;

    getBadges(): Observable<Badge[]> {
        return this.http.get<ApiResponse<Badge[]>>(`${this.apiUrl}/badges`).pipe(
            map(res => this.normalizeBadges(res.data || [])),
            catchError((err) => {
                if (!isUnreachableApiRoute(err)) {
                    return throwError(() => err);
                }
                return this.http.get<any>(this.legacyBadgesUrl).pipe(
                    map((body) => {
                        const raw = Array.isArray(body) ? body : (body?.data ?? []);
                        return this.normalizeBadges(raw);
                    })
                );
            })
        );
    }

    getMedals(): Observable<Medal[]> {
        return this.http.get<ApiResponse<Medal[]>>(`${this.apiUrl}/medals`).pipe(
            map(res => this.normalizeMedals(res.data || [])),
            catchError((err) => {
                if (!isUnreachableApiRoute(err)) {
                    return throwError(() => err);
                }
                return this.http.get<any>(this.legacyMedalsUrl).pipe(
                    map((body) => {
                        const raw = Array.isArray(body) ? body : (body?.data ?? []);
                        return this.normalizeMedals(raw);
                    })
                );
            })
        );
    }

    getBadgeById(id: number): Observable<Badge> {
        return this.http.get<ApiResponse<Badge>>(`${this.apiUrl}/badges/${id}`).pipe(
            map(res => {
                if (!res.data) throw new Error('Badge not found');
                return this.normalizeBadge(res.data);
            }),
            catchError((err) => {
                if (!isUnreachableApiRoute(err)) {
                    return throwError(() => err);
                }
                return this.http.get<any>(`${this.legacyBadgesUrl}/${id}`).pipe(
                    map((body) => this.normalizeBadge(body?.data != null ? body.data : body))
                );
            })
        );
    }

    createBadge(data: any): Observable<Badge> {
        return this.http.post<ApiResponse<Badge>>(`${this.apiUrl}/badges`, data).pipe(
            map(res => {
                if (!res.data) throw new Error('Create failed');
                return res.data;
            })
        );
    }

    createMedal(data: any): Observable<Medal> {
        return this.http.post<ApiResponse<Medal>>(`${this.apiUrl}/medals`, data).pipe(
            map(res => {
                if (!res.data) throw new Error('Create failed');
                return res.data;
            })
        );
    }

    updateBadge(id: number, data: any): Observable<Badge> {
        return this.http.put<ApiResponse<Badge>>(`${this.apiUrl}/badges/${id}`, data).pipe(
            map(res => {
                if (!res.data) throw new Error('Update failed');
                return res.data;
            })
        );
    }

    deleteBadge(id: number): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/badges/${id}`).pipe(
            map(() => void 0)
        );
    }

    updateMedal(id: number, data: any): Observable<Medal> {
        return this.http.put<ApiResponse<Medal>>(`${this.apiUrl}/medals/${id}`, data).pipe(
            map(res => {
                if (!res.data) throw new Error('Update failed');
                return res.data;
            })
        );
    }

    deleteMedal(id: number): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/medals/${id}`).pipe(
            map(() => void 0)
        );
    }

    awardBulkBadges(userIds: number[], badgeId: number, eventId: number): Observable<void> {
        const payload = { userIds, badgeId, eventId };
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/badges/award-bulk`, payload).pipe(
            map(() => void 0),
            catchError((err) => {
                if (!isUnreachableApiRoute(err)) {
                    return throwError(() => err);
                }

                // Legacy fallback: assign badges one by one through user-badges endpoint.
                const requests = userIds.map((userId) =>
                    this.http.post(`${environment.apiUrl}/api/user-badges`, {
                        user: { id: userId },
                        badge: { id: badgeId },
                        event: { id: eventId }
                    }).pipe(
                        map(() => true),
                        catchError(() => of(false))
                    )
                );

                if (!requests.length) {
                    return of(void 0);
                }

                return new Observable<void>((observer) => {
                    let done = 0;
                    let successCount = 0;
                    requests.forEach((req) => {
                        req.subscribe({
                            next: (ok) => {
                                done += 1;
                                if (ok) successCount += 1;
                                if (done === requests.length) {
                                    if (successCount > 0) {
                                        observer.next(void 0);
                                        observer.complete();
                                    } else {
                                        observer.error(new Error('Unable to award badges with legacy backend endpoints.'));
                                    }
                                }
                            },
                            error: () => {
                                done += 1;
                                if (done === requests.length) {
                                    if (successCount > 0) {
                                        observer.next(void 0);
                                        observer.complete();
                                    } else {
                                        observer.error(new Error('Unable to award badges with legacy backend endpoints.'));
                                    }
                                }
                            }
                        });
                    });
                });
            })
        );
    }

    private normalizeBadges(rawBadges: any[]): Badge[] {
        return (rawBadges || []).map((badge) => this.normalizeBadge(badge));
    }

    private normalizeBadge(rawBadge: any): Badge {
        if (!rawBadge) {
            return {
                id: 0,
                name: '',
                icon: '',
                medalId: 0,
                medalName: '',
                rules: []
            };
        }

        return {
            id: Number(rawBadge.id ?? 0),
            name: rawBadge.name ?? '',
            icon: rawBadge.icon ?? '',
            medalId: Number(rawBadge.medalId ?? rawBadge.medal?.id ?? 0),
            medalName: rawBadge.medalName ?? rawBadge.medal?.name ?? '',
            rules: rawBadge.rules ?? []
        };
    }

    private normalizeMedals(rawMedals: any[]): Medal[] {
        return (rawMedals || []).map((medal) => ({
            id: Number(medal?.id ?? 0),
            name: medal?.name ?? '',
            icon: medal?.icon ?? '',
            type: medal?.type ?? ''
        }));
    }
}
