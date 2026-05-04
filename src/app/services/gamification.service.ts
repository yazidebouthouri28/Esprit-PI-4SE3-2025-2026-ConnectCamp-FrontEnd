import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Badge as GamificationBadge } from '../models/gamification.models';

export interface Medal {
    id?: number;
    name: string;
    icon: string;
    type?: string;
}

export interface Badge {
    id?: number;
    name: string;
    icon: string;
    medal?: Medal;
    medalId?: number;
    medalName?: string;
    rules?: BadgeRule[];
}

export interface BadgeRule {
    id?: number;
    numero: number;
    regle: string;
}

export interface UserBadge {
    id: number;
    badge: Badge;
}

// Keep the old name for backward compatibility or refactor if needed
export type Gamification = Badge & { rules?: BadgeRule[] };

@Injectable({
    providedIn: 'root'
})
export class GamificationService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/badges`;
    private medalUrl = `${environment.apiUrl}/api/medals`;
    private ruleUrl = `${environment.apiUrl}/api/badge-rules`;
    private userBadgeUrl = `${environment.apiUrl}/api/user-badges`;

    getAll(): Observable<Badge[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map((body) => this.normalizeBadges(Array.isArray(body) ? body : (body?.data ?? [])))
        );
    }

    getBadges(): Observable<GamificationBadge[]> {
        return this.getAll().pipe(
            map((badges) => badges.map((badge) => this.toGamificationBadge(badge)))
        );
    }

    getMedals(): Observable<Medal[]> {
        return this.http.get<any>(this.medalUrl).pipe(
            map((body) => this.normalizeMedals(Array.isArray(body) ? body : (body?.data ?? [])))
        );
    }

    getRulesByBadgeId(badgeId: number): Observable<BadgeRule[]> {
        return this.http.get<BadgeRule[]>(`${this.ruleUrl}/badge/${badgeId}`);
    }

    getById(id: number): Observable<Badge> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map((body) => this.normalizeBadge(body?.data != null ? body.data : body))
        );
    }

    create(data: Badge): Observable<Badge> {
        return this.http.post<Badge>(this.apiUrl, data);
    }

    createBadge(data: Badge): Observable<Badge> {
        return this.create(data);
    }

    update(id: number, data: Badge): Observable<Badge> {
        return this.http.put<Badge>(`${this.apiUrl}/${id}`, data);
    }

    updateBadge(id: number, data: Badge): Observable<Badge> {
        return this.update(id, data);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    deleteBadge(id: number): Observable<void> {
        return this.delete(id);
    }

    createMedal(data: Medal): Observable<Medal> {
        return this.http.post<Medal>(this.medalUrl, data);
    }

    updateMedal(id: number, data: Medal): Observable<Medal> {
        return this.http.put<Medal>(`${this.medalUrl}/${id}`, data);
    }

    deleteMedal(id: number): Observable<void> {
        return this.http.delete<void>(`${this.medalUrl}/${id}`);
    }

    assignToEvent(badgeId: number, eventId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${badgeId}/assign/${eventId}`, {});
    }

    unassignFromEvent(badgeId: number, eventId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${badgeId}/unassign/${eventId}`);
    }

    getUserBadges(userId: number): Observable<UserBadge[]> {
        return this.http.get<UserBadge[]>(`${this.userBadgeUrl}/user/${userId}`);
    }

    awardBulkBadges(userIds: number[], badgeId: number, eventId: number): Observable<void> {
        const requests = userIds.map((userId) =>
            this.http.post(`${this.userBadgeUrl}`, {
                user: { id: userId },
                badge: { id: badgeId },
                event: { id: eventId }
            })
        );

        if (!requests.length) {
            return new Observable<void>((observer) => {
                observer.next(void 0);
                observer.complete();
            });
        }

        return forkJoin(requests).pipe(map(() => void 0));
    }

    private normalizeBadges(rawBadges: any[]): Badge[] {
        return (rawBadges || []).map((badge) => this.normalizeBadge(badge));
    }

    private normalizeBadge(rawBadge: any): Badge {
        const medal = rawBadge?.medal;
        return {
            ...rawBadge,
            id: rawBadge?.id != null ? Number(rawBadge.id) : undefined,
            name: rawBadge?.name ?? '',
            icon: rawBadge?.icon ?? '',
            medal,
            medalId: rawBadge?.medalId ?? medal?.id,
            medalName: rawBadge?.medalName ?? medal?.name ?? '',
            rules: rawBadge?.rules ?? []
        };
    }

    private normalizeMedals(rawMedals: any[]): Medal[] {
        return (rawMedals || []).map((medal) => ({
            ...medal,
            id: medal?.id != null ? Number(medal.id) : undefined,
            name: medal?.name ?? '',
            icon: medal?.icon ?? '',
            type: medal?.type ?? ''
        }));
    }

    private toGamificationBadge(badge: Badge): GamificationBadge {
        return {
            id: Number(badge.id ?? 0),
            name: badge.name ?? '',
            icon: badge.icon ?? '',
            medalId: Number(badge.medalId ?? badge.medal?.id ?? 0),
            medalName: badge.medalName ?? badge.medal?.name ?? '',
            rules: (badge.rules ?? []).map((rule) => ({
                id: Number(rule.id ?? 0),
                numero: Number(rule.numero ?? 0),
                regle: rule.regle ?? ''
            }))
        };
    }
}
