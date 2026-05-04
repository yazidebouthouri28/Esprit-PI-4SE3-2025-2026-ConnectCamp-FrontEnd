import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { VirtualTour, Scene360 } from '../models/camping.models';

interface VirtualTourApiResponse {
    id: number;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    durationMinutes?: number;
    viewCount?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    siteId: number;
}

interface SceneApiResponse {
    id: number;
    title: string;
    description?: string;
    imageUrl: string;
    thumbnailUrl?: string;
    orderIndex?: number;
    initialYaw?: number;
    initialPitch?: number;
    initialFov?: number;
    hotspots?: string[];
}

interface VirtualTourApiRequest {
    title: string;
    description?: string;
    thumbnailUrl?: string;
    durationMinutes?: number;
    isFeatured?: boolean;
    siteId: number;
}

interface SceneApiRequest {
    title: string;
    description?: string;
    imageUrl: string;
    thumbnailUrl?: string;
    orderIndex?: number;
    initialYaw?: number;
    initialPitch?: number;
    initialFov?: number;
    hotspots?: string[];
    virtualTourId: number;
}

@Injectable({
    providedIn: 'root'
})
export class VirtualTourService {
    private tourUrl = `${environment.apiUrl}/api/virtual-tours`;
    private sceneUrl = `${environment.apiUrl}/api/scenes-360`;
    private fileUploadUrl = `${environment.apiUrl}/api/files/upload`;

    constructor(private http: HttpClient) { }

    uploadFile(file: File): Observable<{ data: { fileName: string } }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ data: { fileName: string } }>(this.fileUploadUrl, formData);
    }

    // Virtual Tour
    getToursBySite(siteId: number): Observable<VirtualTour[]> {
        return this.http.get<VirtualTourApiResponse[]>(`${this.tourUrl}/site/${siteId}`).pipe(
            switchMap((tours) => {
                if (!tours.length) {
                    return of([] as VirtualTour[]);
                }

                const sceneRequests = tours.map((tour) =>
                    this.http.get<SceneApiResponse[]>(`${this.sceneUrl}/tour/${tour.id}`).pipe(
                        map((scenes) => this.toTour(tour, scenes))
                    )
                );

                return forkJoin(sceneRequests);
            })
        );
    }

    createTour(siteId: number, tour: Partial<VirtualTour>): Observable<VirtualTour> {
        const payload: VirtualTourApiRequest = {
            title: tour.title ?? 'New Tour',
            description: tour.description,
            thumbnailUrl: tour.thumbnailUrl,
            durationMinutes: tour.durationMinutes ?? 0,
            isFeatured: tour.isFeatured ?? false,
            siteId
        };

        return this.http.post<VirtualTourApiResponse>(`${this.tourUrl}/site/${siteId}`, payload).pipe(
            map((created) => this.toTour(created, []))
        );
    }

    updateTour(id: number, siteId: number, tour: Partial<VirtualTour>): Observable<VirtualTour> {
        const payload: VirtualTourApiRequest = {
            title: tour.title ?? 'Updated Tour',
            description: tour.description,
            thumbnailUrl: tour.thumbnailUrl,
            durationMinutes: tour.durationMinutes ?? 0,
            isFeatured: tour.isFeatured ?? false,
            siteId
        };

        return this.http.put<VirtualTourApiResponse>(`${this.tourUrl}/${id}`, payload).pipe(
            map((updated) => this.toTour(updated, []))
        );
    }

    deleteTour(id: number): Observable<void> {
        return this.http.delete<void>(`${this.tourUrl}/${id}`);
    }

    // Scene 360
    createScene(scene: Partial<Scene360>): Observable<Scene360> {
        if (!scene.virtualTourId) {
            throw new Error('virtualTourId is required to create a scene');
        }

        const payload: SceneApiRequest = {
            title: scene.title ?? scene.name ?? 'Scene',
            description: scene.description,
            imageUrl: scene.imageUrl ?? scene.panoramaUrl ?? '',
            thumbnailUrl: scene.thumbnailUrl,
            orderIndex: scene.orderIndex ?? scene.sceneOrder ?? 0,
            initialYaw: scene.initialYaw,
            initialPitch: scene.initialPitch,
            initialFov: scene.initialFov,
            hotspots: scene.hotspots ?? [],
            virtualTourId: scene.virtualTourId
        };

        return this.http.post<SceneApiResponse>(`${this.sceneUrl}/tour/${scene.virtualTourId}`, payload).pipe(
            map((created) => this.toScene(created, scene.virtualTourId!))
        );
    }

    deleteScene(sceneId: number): Observable<void> {
        return this.http.delete<void>(`${this.sceneUrl}/${sceneId}`);
    }

    private toTour(tour: VirtualTourApiResponse, scenes: SceneApiResponse[]): VirtualTour {
        return {
            id: tour.id,
            title: tour.title,
            description: tour.description ?? '',
            thumbnailUrl: tour.thumbnailUrl,
            durationMinutes: tour.durationMinutes ?? 0,
            viewCount: tour.viewCount ?? 0,
            isActive: tour.isActive ?? true,
            isFeatured: tour.isFeatured ?? false,
            siteId: tour.siteId,
            scenes: scenes.map((scene) => this.toScene(scene, tour.id))
        };
    }

    private toScene(scene: SceneApiResponse, virtualTourId: number): Scene360 {
        return {
            id: scene.id,
            title: scene.title,
            name: scene.title,
            description: scene.description ?? '',
            imageUrl: scene.imageUrl,
            panoramaUrl: scene.imageUrl,
            thumbnailUrl: scene.thumbnailUrl,
            orderIndex: scene.orderIndex ?? 0,
            sceneOrder: scene.orderIndex ?? 0,
            initialYaw: scene.initialYaw,
            initialPitch: scene.initialPitch,
            initialFov: scene.initialFov,
            hotspots: scene.hotspots ?? [],
            virtualTourId
        };
    }
}
