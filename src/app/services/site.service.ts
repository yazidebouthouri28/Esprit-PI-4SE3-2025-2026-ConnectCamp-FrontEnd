import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { Site } from '../models/camping.models';
import { normalizeSiteTags } from '../models/site-tags';

interface SiteApiResponse {
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
    images?: string[];
    tags?: string[];
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
    latitude?: number;
    longitude?: number;
    capacity?: number;
    pricePerNight?: number;
    images?: string[];
    tags?: string[];
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
    tags?: string[];
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

export interface AiInsights {
    priceBadge?: string;
    badgeColor?: string;
    availabilityStatus?: string;
    availabilityMessage?: string;
    satisfactionPercentage?: number;
    reviewSummary?: string;
    positiveCount?: number;
    negativeCount?: number;
    trustScore?: number;
    trustLabel?: string;
}

export interface AiSimilarSite {
    siteId: number;
    name?: string;
    similarityScore?: number;
    thumbnail?: string;
    pricePerNight?: number;
    type?: string;
    city?: string;
}

export interface LabelCountMetric {
    label: string;
    count: number;
}

export interface CampsiteAdvancedSearchFilters {
    keyword?: string;
    city?: string;
    country?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    minCapacity?: number;
    maxCapacity?: number;
    minRating?: number;
    tags?: string[];
    amenities?: string[];
    sortBy?: 'name' | 'price' | 'rating' | 'capacity' | 'reviewCount' | 'valueScore';
    sortDirection?: 'asc' | 'desc';
    onlyActive?: boolean;
}

export interface CampsiteCompatibilityRequest {
    capacity?: number;
    budgetMin?: number;
    budgetMax?: number;
    amenities?: string[];
    preferredTags?: string[];
    city?: string;
    type?: string;
    petFriendly?: boolean;
    maxResults?: number;
}

export interface CampsiteCompatibilityMatch {
    siteId: number;
    name: string;
    type?: string;
    city?: string;
    pricePerNight?: number;
    rating?: number;
    capacity?: number;
    thumbnail?: string;
    compatibilityScore?: number;
    matchedAmenities?: string[];
    matchedTags?: string[];
    reasons?: string[];
    badges?: string[];
}

export interface CampsiteComparisonItem {
    siteId: number;
    name: string;
    type?: string;
    city?: string;
    pricePerNight?: number;
    rating?: number;
    capacity?: number;
    amenityCount?: number;
    tagCount?: number;
    familyFriendly?: boolean;
    badges?: string[];
    priceSegment?: string;
    valueScore?: number;
    thumbnail?: string;
}

export interface CampsiteComparison {
    sites: CampsiteComparisonItem[];
    bestPriceSiteId?: number;
    highestRatedSiteId?: number;
    largestCapacitySiteId?: number;
    mostEquippedSiteId?: number;
    recommendedSiteId?: number;
    summary?: string;
}

export interface CampsiteBusinessInsight {
    siteId: number;
    name: string;
    badges?: string[];
    priceSegment?: string;
    cityAveragePrice?: number;
    typeAveragePrice?: number;
    priceGapVsCityAverage?: number;
    priceGapVsTypeAverage?: number;
    valueScore?: number;
    valueLabel?: string;
    amenityCount?: number;
    tagCount?: number;
    highlightCount?: number;
    marketPosition?: string;
}

export interface CampsiteDashboard {
    totalSites: number;
    activeSites: number;
    inactiveSites: number;
    averagePricePerNight: number;
    averageRating: number;
    averageCapacity: number;
    familyFriendlySites: number;
    budgetSites: number;
    topCities: LabelCountMetric[];
    topTypes: LabelCountMetric[];
    priceSegments: LabelCountMetric[];
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

    getAiInsights(siteId: number): Observable<AiInsights> {
        return this.http.get<ApiResponse<AiInsights> | AiInsights>(`${this.apiUrl}/${siteId}/ai-insights`).pipe(
            timeout(this.readTimeoutMs),
            map((response) => this.unwrapResponse(response))
        );
    }

    getBusinessInsights(siteId: number): Observable<CampsiteBusinessInsight> {
        return this.http.get<ApiResponse<CampsiteBusinessInsight> | CampsiteBusinessInsight>(`${this.apiUrl}/${siteId}/business-insights`).pipe(
            timeout(this.readTimeoutMs),
            map((response) => this.unwrapResponse(response))
        );
    }

    getSimilarSites(siteId: number): Observable<AiSimilarSite[]> {
        return this.http.get<ApiResponse<AiSimilarSite[]> | AiSimilarSite[]>(`${this.apiUrl}/${siteId}/similar`).pipe(
            timeout(this.readTimeoutMs),
            map((response) => {
                const payload = this.unwrapResponse(response);
                return Array.isArray(payload) ? payload : [];
            })
        );
    }

    searchSitesAdvanced(filters: CampsiteAdvancedSearchFilters): Observable<Site[]> {
        return this.http.get<SiteListResponse>(`${this.apiUrl}/advanced/search`, {
            params: this.toSearchParams(filters)
        }).pipe(
            timeout(this.readTimeoutMs),
            map((response) => this.toSiteList(response))
        );
    }

    getCompatibilityMatches(request: CampsiteCompatibilityRequest): Observable<CampsiteCompatibilityMatch[]> {
        return this.http.post<ApiResponse<CampsiteCompatibilityMatch[]> | CampsiteCompatibilityMatch[]>(`${this.apiUrl}/advanced/compatibility`, request).pipe(
            timeout(this.readTimeoutMs),
            map((response) => {
                const payload = this.unwrapResponse(response);
                return Array.isArray(payload) ? payload : [];
            })
        );
    }

    compareSites(siteIds: number[]): Observable<CampsiteComparison> {
        return this.http.post<ApiResponse<CampsiteComparison> | CampsiteComparison>(`${this.apiUrl}/advanced/compare`, {
            siteIds
        }).pipe(
            timeout(this.readTimeoutMs),
            map((response) => this.unwrapResponse(response))
        );
    }

    getBusinessDashboard(): Observable<CampsiteDashboard> {
        return this.http.get<ApiResponse<CampsiteDashboard> | CampsiteDashboard>(`${this.apiUrl}/advanced/dashboard`).pipe(
            timeout(this.readTimeoutMs),
            map((response) => this.unwrapResponse(response))
        );
    }

    // AI Semantic Search
    semanticSearch(query: string): Observable<CampsiteCompatibilityMatch[]> {
        return this.http.post<ApiResponse<CampsiteCompatibilityMatch[]> | CampsiteCompatibilityMatch[]>(
            `${this.apiUrl}/search/semantic`, { query }).pipe(
            timeout(this.readTimeoutMs),
            map((response) => {
                const payload = this.unwrapResponse(response);
                return Array.isArray(payload) ? payload : [];
            })
        );
    }

    getSearchSuggestions(q: string): Observable<string[]> {
        return this.http.get<ApiResponse<string[]> | string[]>(`${this.apiUrl}/search/suggestions`, {
            params: { q }
        }).pipe(
            timeout(this.readTimeoutMs),
            map((response) => {
                const payload = this.unwrapResponse(response);
                return Array.isArray(payload) ? payload : [];
            })
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
        const latitude =
            site.latitude !== undefined && site.latitude !== null ? Number(site.latitude) : NaN;
        const longitude =
            site.longitude !== undefined && site.longitude !== null ? Number(site.longitude) : NaN;

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
            ...(Number.isFinite(latitude) ? { latitude } : {}),
            ...(Number.isFinite(longitude) ? { longitude } : {}),
            averageRating: Number(rating),
            reviewCount: site.reviewCount ?? 0,
            image: primaryImage,
            images,
            tags: normalizeSiteTags(site.tags),
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
            tags: normalizeSiteTags(site.tags),
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

    private toSearchParams(filters: CampsiteAdvancedSearchFilters): HttpParams {
        let params = new HttpParams();

        for (const [key, value] of Object.entries(filters ?? {})) {
            if (value === undefined || value === null || value === '') {
                continue;
            }

            if (Array.isArray(value)) {
                if (value.length) {
                    params = params.set(key, value.join(','));
                }
                continue;
            }

            params = params.set(key, String(value));
        }

        return params;
    }
}
