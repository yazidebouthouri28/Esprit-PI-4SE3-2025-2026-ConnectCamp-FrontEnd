import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { EonetEvent } from '../models/alerte.model';

@Injectable({ providedIn: 'root' })
export class EonetService {

    constructor(private http: HttpClient) {}

    /** Open events within ~5° (~500 km) of the given coordinates */
    getNearbyEvents(lat: number, lon: number): Observable<EonetEvent[]> {
        const delta = 2;
        const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
        const params = new HttpParams()
            .set('status', 'open')
            .set('bbox', bbox)
            .set('limit', '10');
        return this.http.get<any>('/eonet/events', { params }).pipe(
            map(res => res.events ?? []),
            catchError(() => of([]))
        );
    }

    /** All open events worldwide (last 7 days) */
    getGlobalEvents(): Observable<EonetEvent[]> {
        const params = new HttpParams()
            .set('status', 'open')
            .set('days', '7')
            .set('limit', '20');
        return this.http.get<any>('/eonet/events', { params }).pipe(
            map(res => res.events ?? []),
            catchError(() => of([]))
        );
    }

    /** Map EONET category id → app emergency type */
    mapCategoryToType(categoryId: string): string {
        const mapping: Record<string, string> = {
            wildfires: 'FIRE',
            severeStorms: 'WEATHER',
            tropicalCyclones: 'WEATHER',
            floods: 'WEATHER',
            drought: 'WEATHER',
            seaLakeIce: 'WEATHER',
            snow: 'WEATHER',
            earthquakes: 'OTHER',
            volcanoes: 'OTHER',
            landslides: 'OTHER',
        };
        return mapping[categoryId] ?? 'OTHER';
    }

    /** Suggested severity based on EONET category */
    mapCategoryToSeverity(categoryId: string): string {
        const critical = ['volcanoes', 'earthquakes'];
        const high = ['wildfires', 'tropicalCyclones', 'floods', 'landslides'];
        const medium = ['severeStorms', 'seaLakeIce'];
        if (critical.includes(categoryId)) return 'CRITICAL';
        if (high.includes(categoryId)) return 'HIGH';
        if (medium.includes(categoryId)) return 'MEDIUM';
        return 'LOW';
    }

    /** Emoji icon for EONET category */
    categoryIcon(categoryId: string): string {
        const icons: Record<string, string> = {
            wildfires: '🔥',
            severeStorms: '⛈️',
            tropicalCyclones: '🌀',
            floods: '🌊',
            earthquakes: '🏔️',
            volcanoes: '🌋',
            landslides: '⛰️',
            seaLakeIce: '🧊',
            snow: '❄️',
            drought: '☀️',
        };
        return icons[categoryId] ?? '⚠️';
    }

    /** Get the first category id of an event */
    getFirstCategoryId(event: EonetEvent): string {
        return event.categories?.[0]?.id ?? 'other';
    }
}
