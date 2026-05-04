import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
        return this.http.get<Badge[]>(this.apiUrl);
    }

    getMedals(): Observable<Medal[]> {
        return this.http.get<Medal[]>(this.medalUrl);
    }

    getRulesByBadgeId(badgeId: number): Observable<BadgeRule[]> {
        return this.http.get<BadgeRule[]>(`${this.ruleUrl}/badge/${badgeId}`);
    }

    getById(id: number): Observable<Badge> {
        return this.http.get<Badge>(`${this.apiUrl}/${id}`);
    }

    create(data: Badge): Observable<Badge> {
        return this.http.post<Badge>(this.apiUrl, data);
    }

    update(id: number, data: Badge): Observable<Badge> {
        return this.http.put<Badge>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
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
}
