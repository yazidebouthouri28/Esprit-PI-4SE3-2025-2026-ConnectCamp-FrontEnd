import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { RouteGuide } from '../models/camping.models';

interface RouteGuideApiResponse {
    id: number;
    name?: string;
    description?: string;
    originCity?: string;
    distanceKm?: number;
    distanceMeters?: number;
    estimatedDurationMinutes?: number;
    difficulty?: string;
    instructions?: string;
    mapUrl?: string;
    waypoints?: string[];
    isActive?: boolean;
    siteId?: number;
    virtualTourId?: number;
}

interface RouteGuideApiRequest {
    name: string;
    description?: string;
    originCity: string;
    distanceKm: number;
    estimatedDurationMinutes: number;
    difficulty?: string;
    instructions?: string;
    mapUrl?: string;
    waypoints?: string[];
    isActive?: boolean;
    siteId: number;
    virtualTourId?: number;
}

@Injectable({
    providedIn: 'root'
})
export class RouteGuideService {
    private apiUrl = `${environment.apiUrl}/api/route-guides`;

    constructor(private http: HttpClient) { }

    getRoutesBySite(siteId: number): Observable<RouteGuide[]> {
        return this.http.get<RouteGuideApiResponse[]>(`${this.apiUrl}/site/${siteId}`).pipe(
            map((routes) => routes.map((route) => this.fromApi(route, siteId)))
        );
    }

    createRoute(route: Partial<RouteGuide> & { siteId: number }): Observable<RouteGuide> {
        const payload: RouteGuideApiRequest = {
            name: route.name || `Route from ${route.originCity ?? 'Unknown City'}`,
            description: route.description,
            originCity: route.originCity ?? '',
            distanceKm: route.distanceKm ?? 0,
            estimatedDurationMinutes: route.estimatedDurationMinutes ?? route.durationMin ?? 0,
            difficulty: route.difficulty ?? 'EASY',
            instructions: typeof route.instructions === 'string'
                ? route.instructions
                : JSON.stringify(route.instructions ?? []),
            mapUrl: route.mapUrl ?? '',
            waypoints: route.waypoints ?? [],
            isActive: route.isActive ?? true,
            siteId: route.siteId,
            virtualTourId: route.virtualTourId
        };

        return this.http.post<RouteGuideApiResponse>(`${this.apiUrl}/site/${route.siteId}`, payload).pipe(
            map((created) => this.fromApi(created, route.siteId))
        );
    }

    updateRoute(id: number, route: Partial<RouteGuide> & { siteId: number }): Observable<RouteGuide> {
        const payload: RouteGuideApiRequest = {
            name: route.name || `Route from ${route.originCity ?? 'Unknown City'}`,
            description: route.description,
            originCity: route.originCity ?? '',
            distanceKm: route.distanceKm ?? 0,
            estimatedDurationMinutes: route.estimatedDurationMinutes ?? route.durationMin ?? 0,
            difficulty: route.difficulty ?? 'EASY',
            instructions: typeof route.instructions === 'string'
                ? route.instructions
                : JSON.stringify(route.instructions ?? []),
            mapUrl: route.mapUrl ?? '',
            waypoints: route.waypoints ?? [],
            isActive: route.isActive ?? true,
            siteId: route.siteId,
            virtualTourId: route.virtualTourId
        };

        return this.http.put<RouteGuideApiResponse>(`${this.apiUrl}/${id}`, payload).pipe(
            map((updated) => this.fromApi(updated, route.siteId))
        );
    }

    deleteRoute(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    private fromApi(route: RouteGuideApiResponse, fallbackSiteId: number): RouteGuide {
        const distanceKm = route.distanceKm ?? (route.distanceMeters ? route.distanceMeters / 1000 : 0);

        return {
            id: route.id,
            name: route.name ?? '',
            description: route.description ?? '',
            originCity: route.originCity ?? '',
            distanceKm,
            distanceMeters: route.distanceMeters ?? (distanceKm * 1000),
            estimatedDurationMinutes: route.estimatedDurationMinutes ?? 0,
            durationMin: route.estimatedDurationMinutes ?? 0,
            difficulty: route.difficulty ?? 'EASY',
            instructions: route.instructions ?? '',
            mapUrl: route.mapUrl ?? '',
            waypoints: route.waypoints ?? [],
            isActive: route.isActive ?? true,
            siteId: route.siteId ?? fallbackSiteId,
            virtualTourId: route.virtualTourId
        };
    }
}
