import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { Site } from '../models/camping.models';

interface SiteApiResponse {
    id: number;
    name: string;
    description?: string;
    type?: string;
    verified?: boolean;
    address?: string;
    city?: string;
    country?: string;
    latitude: number;
    longitude: number;
    capacity?: number;
    pricePerNight?: number;
    image?: string;
    images?: string[];
    amenities?: string[];
    contactPhone?: string;
    contactEmail?: string;
    isActive?: boolean;
    rating?: number;
    reviewCount?: number;
    checkInTime?: string;
    checkOutTime?: string;
    houseRules?: string;
    ownerId?: number;
}

interface SiteApiRequest {
    name: string;
    description?: string;
    type?: string;
    address?: string;
    city: string;
    country?: string;
    latitude: number;
    longitude: number;
    capacity?: number;
    pricePerNight?: number;
    images?: string[];
    amenities?: string[];
    contactPhone?: string;
    contactEmail?: string;
    isActive?: boolean;
    checkInTime?: string;
    checkOutTime?: string;
    houseRules?: string;
    ownerId?: number;
}

interface SiteSummaryApiResponse {
    id: number;
    name: string;
    description?: string;
    type?: string;
    verified?: boolean;
    address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    capacity?: number;
    pricePerNight?: number;
    image?: string;
    amenities?: string[];
    contactPhone?: string;
    contactEmail?: string;
    isActive?: boolean;
    rating?: number;
    reviewCount?: number;
    checkInTime?: string;
    checkOutTime?: string;
    houseRules?: string;
    ownerId?: number;
}

interface SitePageResponse<T> {
    content?: T[];
}

type SiteDto = SiteApiResponse | SiteSummaryApiResponse;
type SiteListPayload = SiteDto[] | SitePageResponse<SiteDto>;
type SiteListResponse = ApiResponse<SiteListPayload> | SiteListPayload;
type SiteItemResponse = ApiResponse<SiteDto> | SiteDto;

@Injectable({
    providedIn: 'root'
})
export class SiteService {
    private apiUrl = `${environment.apiUrl}/api/sites`;
    private summaryUrl = `${this.apiUrl}/summary`;
    private readonly readTimeoutMs = 8000;
    private readonly writeTimeoutMs = 30000;
    private readonly allSitesPageSize = 100;

    constructor(private http: HttpClient) { }

    getAllSites(): Observable<Site[]> {
        return this.http.get<SiteListResponse>(this.summaryUrl).pipe(
            timeout(this.readTimeoutMs),
            map((response) => this.toSiteList(response)),
            catchError(() =>
                this.http.get<SiteListResponse>(this.apiUrl, {
                    params: {
                        page: '0',
                        size: String(this.allSitesPageSize)
                    }
                }).pipe(
                    timeout(this.readTimeoutMs),
                    map((response) => this.toSiteList(response))
                )
            )
        );
    }

    getAllSitesAdmin(): Observable<Site[]> {
        return this.http.get<SiteListResponse>(`${this.apiUrl}/admin/all`).pipe(
            timeout(this.readTimeoutMs),
            map((response) => this.toSiteList(response))
        );
    }

    getSiteById(id: number): Observable<Site> {
        return this.http.get<SiteItemResponse>(`${this.apiUrl}/${id}`).pipe(
            timeout(this.readTimeoutMs),
            map((response) => this.toSite(response))
        );
    }

    createSite(site: Site): Observable<Site> {
        return this.http.post<SiteItemResponse>(this.apiUrl, this.toApi(site)).pipe(
            timeout(this.writeTimeoutMs),
            map((response) => this.toSite(response))
        );
    }

    updateSite(id: number, site: Site): Observable<Site> {
        return this.http.put<SiteItemResponse>(`${this.apiUrl}/${id}`, this.toApi(site)).pipe(
            timeout(this.writeTimeoutMs),
            map((response) => this.toSite(response))
        );
    }

    deleteSite(id: number): Observable<void> {
        return this.http.delete<ApiResponse<void> | void>(`${this.apiUrl}/${id}`).pipe(
            timeout(this.writeTimeoutMs),
            map(() => undefined)
        );
    }

    uploadSiteImages(id: number, files: File[]): Observable<Site> {
        const formData = new FormData();
        for (const file of files) {
            formData.append('files', file, file.name);
        }

        return this.http.post<SiteItemResponse>(`${this.apiUrl}/${id}/images`, formData).pipe(
            timeout(this.writeTimeoutMs),
            map((response) => this.toSite(response))
        );
    }

    removeSiteImage(id: number, url: string): Observable<Site> {
        return this.http.delete<SiteItemResponse>(`${this.apiUrl}/${id}/images`, { params: { url } }).pipe(
            timeout(this.writeTimeoutMs),
            map((response) => this.toSite(response))
        );
    }

    private toSiteList(response: SiteListResponse): Site[] {
        const payload = this.unwrapResponse(response);
        if (Array.isArray(payload)) {
            return payload.map((site) => this.fromApi(site));
        }

        if (this.hasContent(payload)) {
            return (payload.content ?? []).map((site) => this.fromApi(site));
        }

        throw new Error('Unexpected site list response shape');
    }

    private toSite(response: SiteItemResponse): Site {
        const payload = this.unwrapResponse(response);
        if (payload === null || payload === undefined || Array.isArray(payload)) {
            throw new Error('Unexpected site response shape');
        }

        return this.fromApi(payload);
    }

    private fromApi(site: SiteDto): Site {
        const fullSite = site as SiteApiResponse;
        const images = fullSite.images?.length ? fullSite.images : (site.image ? [site.image] : []);
        const primaryImage = images[0] ?? site.image ?? '';
        const pricePerNight = site.pricePerNight ?? 0;
        const rating = site.rating ?? 0;
        const latitude = site.latitude ?? 36.8065;
        const longitude = site.longitude ?? 10.1815;

        return {
            id: site.id,
            name: site.name,
            description: site.description ?? '',
            type: site.type ?? '',
            verified: site.verified === true,
            address: site.address ?? '',
            city: site.city ?? '',
            country: site.country ?? '',
            location: site.city ?? '',
            latitude,
            longitude,
            averageRating: Number(rating),
            reviewCount: site.reviewCount ?? 0,
            image: primaryImage,
            images,
            capacity: site.capacity ?? 0,
            pricePerNight: Number(pricePerNight),
            price: Number(pricePerNight),
            amenities: site.amenities ?? [],
            contactPhone: site.contactPhone ?? '',
            contactEmail: site.contactEmail ?? '',
            isActive: site.isActive ?? true,
            checkInTime: fullSite.checkInTime ?? '',
            checkOutTime: fullSite.checkOutTime ?? '',
            houseRules: fullSite.houseRules ?? '',
            ownerId: site.ownerId,
            status: site.isActive === false ? 'Maintenance' : 'Available'
        };
    }

    private unwrapResponse<T>(response: ApiResponse<T> | T): T {
        if (this.isApiResponse(response)) {
            if (response.success === false) {
                throw new Error(response.message ?? 'Site request failed');
            }

            if (response.data === undefined || response.data === null) {
                throw new Error(response.message ?? 'Site response is missing data');
            }

            return response.data;
        }

        return response;
    }

    private isApiResponse<T>(response: ApiResponse<T> | T): response is ApiResponse<T> {
        return response !== null
            && typeof response === 'object'
            && !Array.isArray(response)
            && ('success' in response || 'data' in response);
    }

    private hasContent<T>(payload: T[] | SitePageResponse<T>): payload is SitePageResponse<T> {
        return payload !== null
            && typeof payload === 'object'
            && !Array.isArray(payload)
            && Array.isArray(payload.content);
    }

    private toApi(site: Site): SiteApiRequest {
        return {
            name: site.name,
            description: site.description,
            type: site.type,
            address: site.address,
            city: site.city || site.location || '',
            country: site.country,
            latitude: site.latitude,
            longitude: site.longitude,
            capacity: site.capacity,
            pricePerNight: site.pricePerNight ?? site.price,
            images: site.images ?? (site.image ? [site.image] : []),
            amenities: site.amenities ?? [],
            contactPhone: site.contactPhone,
            contactEmail: site.contactEmail,
            isActive: site.isActive,
            checkInTime: site.checkInTime,
            checkOutTime: site.checkOutTime,
            houseRules: site.houseRules,
            ownerId: site.ownerId
        };
    }
}
