import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SiteService, AiInsights, AiSimilarSite } from '../../services/site.service';
import { Site, Review, CampHighlight, VirtualTour, Certification, RouteGuide } from '../../models/camping.models';
import { ReviewService } from '../../services/review.service';
import { CampHighlightService } from '../../services/camp-highlight.service';
import { VirtualTourService } from '../../services/virtual-tour.service';
import { CertificationService } from '../../services/certification.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { normalizeSiteTags } from '../../models/site-tags';
import { RouteGuideService } from '../../services/route-guide.service';
import { BestTimeToBookComponent } from '../ml/best-time-to-book/best-time-to-book.component';
import { CampsiteMatchScoreComponent } from '../ml/campsite-match-score/campsite-match-score.component';
import { AiReviewSummaryComponent } from '../ml/ai-review-summary/ai-review-summary.component';

@Component({
    selector: 'app-campsite-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, BestTimeToBookComponent, CampsiteMatchScoreComponent, AiReviewSummaryComponent],
    templateUrl: './campsite-detail.component.html',
    styleUrls: ['./campsite-detail.component.css']
})
export class CampsiteDetailComponent implements OnInit {
    campsite: Site | undefined;
    isLoading = true;
    errorMessage = '';
    mappedAmenities: { icon: string; label: string }[] = [];

    reviews: Review[] = [];
    highlights: CampHighlight[] = [];
    virtualTours: VirtualTour[] = [];
    certifications: Certification[] = [];
    readonly ratingStars = [1, 2, 3, 4, 5];
    reviewDraft = { rating: 5, comment: '' };
    reviewSubmitError = '';
    reviewSubmitSuccess = '';
    isSubmittingReview = false;

    editingReviewId: number | null = null;
    editingReviewDraft = { rating: 5, comment: '' };
    isSavingEdit = false;
    
    likes = 0;
    dislikes = 0;

    weatherForecast: any[] = [];
    isWeatherLoading = false;

    
    userReaction: 'LIKE' | 'DISLIKE' | null = null;
    isGalleryOpen = false;
    activeGalleryIndex = 0;
    galleryImages: string[] = [];
    aiInsights: AiInsights | null = null;
    similarSites: AiSimilarSite[] = [];
    routeGuides: RouteGuide[] = [];
    

    // Booking form properties
    checkInDate: string = '';
    checkOutDate: string = '';
    guests: number = 1;

    get minDate(): string {
        return new Date().toISOString().split('T')[0];
    }

    get guestOptions(): number[] {
        const cap = this.campsite?.capacity || 10;
        return Array.from({ length: cap }, (_, i) => i + 1);
    }

    get numberOfNights(): number {
        if (!this.checkInDate || !this.checkOutDate) return 0;
        const start = new Date(this.checkInDate).getTime();
        const end = new Date(this.checkOutDate).getTime();
        const diff = end - start;
        return diff > 0 ? Math.ceil(diff / (1000 * 3600 * 24)) : 0;
    }

    get calculatedTotal(): number {
        const nights = this.numberOfNights > 0 ? this.numberOfNights : 1;
        const base = (this.campsite?.price || 0) * nights;
        return base + 45 + 32;
    }

    toggleLike(): void {
        if (!this.isAuthenticated) return;
        if (this.userReaction === 'LIKE') {
            this.userReaction = null;
            this.likes--;
        } else {
            if (this.userReaction === 'DISLIKE') {
                this.dislikes--;
            }
            this.userReaction = 'LIKE';
            this.likes++;
        }
        this.persistCampsiteReaction();
    }

    toggleDislike(): void {
        if (!this.isAuthenticated) return;
        if (this.userReaction === 'DISLIKE') {
            this.userReaction = null;
            this.dislikes--;
        } else {
            if (this.userReaction === 'LIKE') {
                this.likes--;
            }
            this.userReaction = 'DISLIKE';
            this.dislikes++;
        }
        this.persistCampsiteReaction();
    }

    openGallery(index: number = 0): void {
        const fallbacks = [
            'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1080',
            'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=800'
        ];

        if (this.campsite?.images?.length) {
            this.galleryImages = this.campsite.images.filter((u) => !!u && String(u).trim().length > 0);
        } else if (this.campsite?.image) {
            this.galleryImages = [this.campsite.image].filter((u) => !!u);
            if (this.galleryImages.length < 2) {
                this.galleryImages = [...this.galleryImages, fallbacks[1]];
            }
        } else {
            this.galleryImages = [...fallbacks];
        }

        if (this.galleryImages.length === 0) {
            this.galleryImages = [...fallbacks];
        }

        this.activeGalleryIndex = Math.min(Math.max(0, index), this.galleryImages.length - 1);
        this.isGalleryOpen = true;
        document.body.style.overflow = 'hidden';
        this.cdr.detectChanges();
    }

    closeGallery(): void {
        this.isGalleryOpen = false;
        document.body.style.overflow = '';
        this.cdr.detectChanges();
    }

    @HostListener('document:keydown.escape')
    onEscapeGallery(): void {
        if (this.isGalleryOpen) {
            this.closeGallery();
        }
    }

    onGalleryBackdropClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('gallery-backdrop')) {
            this.closeGallery();
        }
    }

    nextImage(): void {
        if (this.galleryImages.length > 0) {
            this.activeGalleryIndex = (this.activeGalleryIndex + 1) % this.galleryImages.length;
        }
    }

    prevImage(): void {
        if (this.galleryImages.length > 0) {
            this.activeGalleryIndex = (this.activeGalleryIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
        }
    }


    private amenityConfig: Record<string, { icon: string; label: string }> = {
        wifi: { icon: '📶', label: 'WiFi (Lodge)' },
        campfire: { icon: '🔥', label: 'Campfire Rings' },
        hiking: { icon: '🌲', label: 'Nature Trails' },
        water: { icon: '🚿', label: 'Hot Showers' },
        group: { icon: '👥', label: 'Group Accommodation' },
        parking: { icon: '🅿️', label: 'Free Parking' },
        pets: { icon: '🐕', label: 'Pets Allowed' },
        default: { icon: '⛺', label: 'Standard Amenity' }
    };

    showPanorama = false;
    panoViewer: { destroy?: () => void } | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private siteService: SiteService,
        private reviewService: ReviewService,
        private highlightService: CampHighlightService,
        private virtualTourService: VirtualTourService,
        private routeGuideService: RouteGuideService,
        private certificationService: CertificationService,
        private authService: AuthService,
        private sanitizer: DomSanitizer,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            const id = +params['id'];
            if (id) {
                this.loadCampsite(id);
                this.loadRelatedData(id);
                this.loadAiData(id);
            }
        });
    }

    private loadCampsite(id: number) {
        this.isLoading = true;
        this.errorMessage = '';
        this.cdr.detectChanges();

        this.siteService.getSiteById(id).subscribe({
            next: (site) => {
                this.campsite = site;
                this.mapAmenities(site.amenities || []);
                this.loadCampsiteReaction();
                
                if (site.latitude && site.longitude) {
                    this.fetchWeather(Number(site.latitude), Number(site.longitude));
                }
                
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.siteService.getAllSites().subscribe({
                    next: (sites) => {
                        const fallbackSite = sites.find((site) => site.id === id);
                        if (fallbackSite) {
                            this.campsite = fallbackSite;
                            this.mapAmenities(fallbackSite.amenities || []);
                            this.loadCampsiteReaction();
                            this.errorMessage = '';
                        } else {
                            console.error('Error fetching campsite details', err);
                            this.errorMessage = 'Could not load campsite details';
                        }
                        this.isLoading = false;
                        this.cdr.detectChanges();
                    },
                    error: () => {
                        console.error('Error fetching campsite details', err);
                        this.errorMessage = 'Could not load campsite details';
                        this.isLoading = false;
                        this.cdr.detectChanges();
                    }
                });
            }
        });
    }

    private fetchWeather(lat: number, lng: number): void {
        this.isWeatherLoading = true;
        
        const weatherMap: Record<number, { icon: string, desc: string }> = {
            0: { icon: '☀️', desc: 'Clear sky' },
            1: { icon: '🌤️', desc: 'Mainly clear' },
            2: { icon: '⛅', desc: 'Partly cloudy' },
            3: { icon: '☁️', desc: 'Overcast' },
            45: { icon: '🌫️', desc: 'Fog' },
            48: { icon: '🌫️', desc: 'Rime fog' },
            51: { icon: '🌧️', desc: 'Light drizzle' },
            53: { icon: '🌧️', desc: 'Moderate drizzle' },
            55: { icon: '🌧️', desc: 'Dense drizzle' },
            61: { icon: '☔', desc: 'Slight rain' },
            63: { icon: '☔', desc: 'Moderate rain' },
            65: { icon: '☔', desc: 'Heavy rain' },
            71: { icon: '❄️', desc: 'Slight snow' },
            73: { icon: '❄️', desc: 'Moderate snow' },
            75: { icon: '❄️', desc: 'Heavy snow' },
            95: { icon: '⛈️', desc: 'Thunderstorm' },
            96: { icon: '⛈️', desc: 'Storm + hail' },
            99: { icon: '⛈️', desc: 'Heavy hail' },
        };

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data && data.daily) {
                    const days = data.daily.time;
                    this.weatherForecast = days.map((dateStr: string, index: number) => {
                        const code = data.daily.weathercode[index];
                        const wmo = weatherMap[code] || { icon: '🌡️', desc: 'Unknown' };
                        const d = new Date(dateStr);
                        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                        
                        return {
                            day: index === 0 ? 'Today' : dayName,
                            icon: wmo.icon,
                            desc: wmo.desc,
                            maxTemp: Math.round(data.daily.temperature_2m_max[index]),
                            minTemp: Math.round(data.daily.temperature_2m_min[index])
                        };
                    });
                }
            })
            .catch(err => console.error("Weather fetch failed", err))
            .finally(() => {
                this.isWeatherLoading = false;
                this.cdr.detectChanges();
            });
    }

    private getCampsiteReactionStorageKey(): string {
        return `campsite_reaction_${this.campsite?.id || 0}`;
    }

    private loadCampsiteReaction(): void {
        this.likes = 0;
        this.dislikes = 0;
        this.userReaction = null;
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem(this.getCampsiteReactionStorageKey());
            const parsed = raw ? JSON.parse(raw) : null;
            this.likes = Math.max(0, Number(parsed?.likes || 0));
            this.dislikes = Math.max(0, Number(parsed?.dislikes || 0));
            this.userReaction = parsed?.userReaction === 'LIKE' || parsed?.userReaction === 'DISLIKE'
                ? parsed.userReaction
                : null;
        } catch {
            this.likes = 0;
            this.dislikes = 0;
            this.userReaction = null;
        }
    }

    private persistCampsiteReaction(): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(this.getCampsiteReactionStorageKey(), JSON.stringify({
                likes: this.likes,
                dislikes: this.dislikes,
                userReaction: this.userReaction
            }));
        } catch { }
    }

    private getReviewReactionsStorageKey(): string {
        return `campsite_review_reactions_${this.campsite?.id || 0}`;
    }

    private loadReviewReactions(): void {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem(this.getReviewReactionsStorageKey());
            const reactions = raw ? JSON.parse(raw) : {};
            this.reviews = this.reviews.map(r => ({
                ...r,
                likes: reactions[r.id]?.likes || 0,
                dislikes: reactions[r.id]?.dislikes || 0,
                userReactions: reactions[r.id]?.userReactions || {}
            }));
        } catch { }
    }

    private persistReviewReactions(): void {
        if (typeof window === 'undefined') return;
        try {
            const reactions: Record<number, any> = {};
            this.reviews.forEach(r => {
                reactions[r.id] = { 
                    likes: (r as any).likes || 0, 
                    dislikes: (r as any).dislikes || 0,
                    userReactions: (r as any).userReactions || {}
                };
            });
            localStorage.setItem(this.getReviewReactionsStorageKey(), JSON.stringify(reactions));
        } catch { }
    }

    private loadRelatedData(siteId: number) {
        // Reviews
        this.reviewService.getReviewsBySite(siteId).subscribe({
            next: (reviews) => {
                this.reviews = reviews;
                this.loadReviewReactions();
                this.cdr.detectChanges();
            },
            error: () => {
                this.reviews = [];
                this.cdr.detectChanges();
            }
        });

        // Highlights
        this.highlightService.getHighlightsBySite(siteId).subscribe({
            next: (highlights) => {
                this.highlights = highlights.filter(h => h.isPublished);
                this.cdr.detectChanges();
            },
            error: () => {
                this.highlights = [];
                this.cdr.detectChanges();
            }
        });

        // Virtual tours
        this.virtualTourService.getToursBySite(siteId).subscribe({
            next: (tours) => {
                this.virtualTours = tours;
                this.cdr.detectChanges();
            },
            error: () => {
                this.virtualTours = [];
                this.cdr.detectChanges();
            }
        });

        // Certifications
        this.certificationService.getCertificationsBySite(siteId).subscribe({
            next: (certs) => {
                this.certifications = certs;
                this.cdr.detectChanges();
            },
            error: () => {
                this.certifications = [];
                this.cdr.detectChanges();
            }
        });

        this.routeGuideService.getRoutesBySite(siteId).subscribe({
            next: (routes) => {
                this.routeGuides = routes.filter((route) => route.isActive !== false);
                this.cdr.detectChanges();
            },
            error: () => {
                this.routeGuides = [];
                this.cdr.detectChanges();
            }
        });
    }

    private loadAiData(siteId: number): void {
        this.siteService.getAiInsights(siteId).subscribe({
            next: (insights) => {
                this.aiInsights = insights;
                this.cdr.detectChanges();
            },
            error: () => {
                this.aiInsights = {
                    priceBadge: 'Fair Price',
                    badgeColor: 'yellow',
                    availabilityStatus: 'Available',
                    availabilityMessage: 'Usually available.',
                    reviewSummary: 'Review analysis unavailable.',
                    satisfactionPercentage: 0,
                    trustScore: 0,
                    trustLabel: 'Unknown'
                };
                this.cdr.detectChanges();
            }
        });

        this.siteService.getSimilarSites(siteId).subscribe({
            next: (sites) => {
                this.similarSites = sites.slice(0, 3);
                this.cdr.detectChanges();
            },
            error: () => {
                this.similarSites = [];
                this.cdr.detectChanges();
            }
        });
    }

    get priceBadgeClasses(): string {
        const color = (this.aiInsights?.badgeColor || 'yellow').toLowerCase();
        if (color === 'green') {
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        }
        if (color === 'red') {
            return 'bg-red-100 text-red-800 border-red-200';
        }
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }

    get availabilityAlertClasses(): string {
        const status = (this.aiInsights?.availabilityStatus || '').toLowerCase();
        return status === 'busy'
            ? 'bg-red-50 border-red-100 text-red-800'
            : 'bg-emerald-50 border-emerald-100 text-emerald-800';
    }

    get trustLabelClasses(): string {
        const trustScore = Number(this.aiInsights?.trustScore ?? 0);
        if (trustScore >= 80) {
            return 'bg-emerald-100 text-emerald-800';
        }
        if (trustScore >= 50) {
            return 'bg-yellow-100 text-yellow-800';
        }
        return 'bg-gray-100 text-gray-700';
    }

    get trustProgressWidth(): string {
        const value = Math.max(0, Math.min(100, Number(this.aiInsights?.satisfactionPercentage ?? 0)));
        return `${value}%`;
    }

    openSimilarSite(siteId: number): void {
        if (!siteId) return;
        this.router.navigate(['/campsites', siteId]);
    }

    private mapAmenities(amenities: string[]) {
        this.mappedAmenities = amenities.map(amenity => {
            const key = String(amenity).toLowerCase().trim();
            const config = this.amenityConfig[key];
            if (config) {
                return config;
            }
            return {
                icon: this.amenityConfig['default'].icon,
                label: amenity.charAt(0).toUpperCase() + amenity.slice(1)
            };
        });
    }

    goBack() {
        this.location.back();
    }

    reserveNow(): void {
        if (!this.campsite?.id) return;
        this.router.navigate(['/campsites', this.campsite.id, 'reserve'], {
            queryParams: {
                checkIn: this.checkInDate || undefined,
                checkOut: this.checkOutDate || undefined,
                guests: this.guests
            }
        });
    }

    openFirstVirtualTour(): void {
        if (!this.virtualTours.length) {
            return;
        }

        const firstTour = this.virtualTours[0];
        if (firstTour.scenes && firstTour.scenes.length > 0) {
            this.openTourPanorama(firstTour);
            return;
        }

        const target = document.getElementById('virtual-tours');
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    openTourPanorama(tour: VirtualTour): void {
        if (!tour.scenes || tour.scenes.length === 0) return;
        
        this.showPanorama = true;
        document.body.style.overflow = 'hidden';
        this.cdr.detectChanges();

        // Sort scenes by orderIndex
        const sortedScenes = [...tour.scenes].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        
        const scenesConfig: Record<string, any> = {};
        
        sortedScenes.forEach((scene, index) => {
            const sceneId = `scene_${scene.id}`;
            const hotSpots: any[] = [];
            
            // Add custom hotspots if defined
            if (scene.hotspots && Array.isArray(scene.hotspots)) {
                try {
                    scene.hotspots.forEach(hs => {
                        if (typeof hs === 'string') {
                            const parsed = JSON.parse(hs);
                            hotSpots.push(parsed);
                        }
                    });
                } catch (e) {
                    console.warn('Failed to parse hotspot', e);
                }
            }

            // Automatically link scenes like Google Street View
            // If there's a next scene, add arrow pointing forward
            if (index < sortedScenes.length - 1) {
                hotSpots.push({
                    pitch: -15, // Point slightly down onto the floor
                    yaw: 0,     // Arrow straight ahead
                    type: 'scene',
                    text: 'Avancer (Next)',
                    sceneId: `scene_${sortedScenes[index + 1].id}`,
                    targetYaw: 0
                });
            }
            // If there's a previous scene, add arrow pointing back
            if (index > 0) {
                hotSpots.push({
                    pitch: -15,   // Point slightly down
                    yaw: 180,     // Arrow behind
                    type: 'scene',
                    text: 'Reculer (Previous)',
                    sceneId: `scene_${sortedScenes[index - 1].id}`,
                    targetYaw: 180
                });
            }

            scenesConfig[sceneId] = {
                title: scene.title || 'Scene',
                type: 'equirectangular',
                panorama: scene.panoramaUrl || scene.imageUrl,
                yaw: scene.initialYaw || 0,
                pitch: scene.initialPitch || 0,
                hfov: scene.initialFov || 110,
                hotSpots: hotSpots
            };
        });

        setTimeout(() => {
            const innerId = 'public-pannellum-host';
            const container = document.getElementById(innerId);
            if (!container) return;
            container.innerHTML = '';
            
            const g = window as any;
            if (typeof g.pannellum === 'undefined') {
                console.error('Pannellum script not loaded.');
                return;
            }

            const firstSceneId = `scene_${sortedScenes[0].id}`;

            this.panoViewer = g.pannellum.viewer(innerId, {
                default: {
                    firstScene: firstSceneId,
                    sceneFadeDuration: 1000,
                    autoLoad: true,
                    compass: true
                },
                scenes: scenesConfig
            });
        }, 300);
    }

    closePanorama(): void {
        this.showPanorama = false;
        document.body.style.overflow = '';
        if (this.panoViewer && this.panoViewer.destroy) {
            this.panoViewer.destroy();
            this.panoViewer = null;
        }
        this.cdr.detectChanges();
    }

    getDirections(): void {
        const query = this.getCampsiteLocationQuery();
        const url = query
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
            : 'https://www.google.com/maps';
        window.open(url, '_blank', 'noopener');
    }

    get mapEmbedUrl(): SafeResourceUrl {
        const query = this.getCampsiteLocationQuery() || 'campsite';
        return this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=12&output=embed`
        );
    }

    private getCampsiteLocationQuery(): string {
        const parts = [
            this.campsite?.address,
            this.campsite?.location,
            this.campsite?.city,
            this.campsite?.country,
            this.campsite?.name
        ]
            .map((part) => String(part || '').trim())
            .filter(Boolean);

        return parts.join(', ');
    }


    get isAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }

    get isReviewAllowed(): boolean {
        return this.authService.isAuthenticated() && !this.authService.isAdmin();
    }

    get preferenceTags(): string[] {
        const explicitTags = normalizeSiteTags(this.campsite?.tags);
        if (explicitTags.length) {
            return explicitTags;
        }

        const fallbackTags = normalizeSiteTags([
            this.campsite?.type ?? '',
            ...(this.campsite?.amenities ?? [])
        ]);

        return fallbackTags.length ? fallbackTags : ['Camping'];
    }

    /** Text bodies for `/api/ml/user/review-summary` */
    get reviewTextsForMl(): string[] {
        return this.reviews
            .map((r) => (r.comment || '').trim())
            .filter((c) => c.length > 2);
    }

    get campsitePriceForMl(): number {
        return Number(this.campsite?.price ?? this.campsite?.pricePerNight ?? 0);
    }

    get bookingDesiredMonthForMl(): number {
        if (this.checkInDate) {
            const d = new Date(this.checkInDate);
            if (!Number.isNaN(d.getTime())) {
                return d.getMonth() + 1;
            }
        }
        return new Date().getMonth() + 1;
    }

    get mlSiteFeaturesPayload(): Record<string, unknown> {
        return {
            amenities: this.campsite?.amenities ?? [],
            tags: this.preferenceTags,
            price_per_night: this.campsitePriceForMl,
            rating: Number(this.campsite?.averageRating ?? 0),
            location_type: (this.campsite?.type ?? 'FOREST').toString().toLowerCase()
        };
    }

    get mlUserPreferenceAmenities(): string[] {
        const tags = this.preferenceTags.map((t) => String(t).toLowerCase());
        const am = (this.campsite?.amenities ?? []).map((a) => String(a).toLowerCase());
        return [...new Set([...tags, ...am])].slice(0, 12);
    }

    get mlBudgetMin(): number {
        const p = this.campsitePriceForMl;
        return Math.max(0, Math.round((p || 50) * 0.65));
    }

    get mlBudgetMax(): number {
        const p = this.campsitePriceForMl;
        return Math.round((p || 50) * 1.45) || 200;
    }

    get mlPreferredLocationsHint(): string[] {
        const raw = `${this.campsite?.location || ''} ${this.campsite?.city || ''}`.toLowerCase();
        const parts = raw.split(/[,/\s]+/).filter((x) => x.length > 2);
        return [...new Set(parts)].slice(0, 6);
    }

    get capacityDescription(): string {
        const capacity = Number(this.campsite?.capacity || 0);
        if (capacity > 0) {
            return `Up to ${capacity} guests max`;
        }
        return 'Capacity details are provided by campsite host';
    }

    get accommodationDescription(): string {
        const amenityText = (this.campsite?.amenities || []).join(' ').toLowerCase();
        if (amenityText.includes('rv')) {
            return 'Tents & RVs permitted';
        }
        return 'Tents permitted';
    }

    get shouldShowReviewLoginHint(): boolean {
        return !this.authService.isAuthenticated();
    }

    setDraftRating(star: number): void {
        if (star >= 1 && star <= 5) {
            this.reviewDraft.rating = star;
        }
    }

    isHighlightVideo(mediaUrl?: string): boolean {
        if (!mediaUrl) return false;
        if (mediaUrl.startsWith('data:')) {
            return mediaUrl.startsWith('data:video/');
        }
        const normalized = mediaUrl.split('?')[0].toLowerCase();
        return /\.(mp4|webm|ogg|mov|m4v)$/.test(normalized);
    }

    submitReview(): void {
        if (!this.campsite || !this.isReviewAllowed || this.isSubmittingReview) {
            return;
        }

        const comment = (this.reviewDraft.comment || '').trim();
        const rating = Number(this.reviewDraft.rating);

        if (!comment) {
            this.reviewSubmitError = 'Please write your review comment.';
            this.reviewSubmitSuccess = '';
            return;
        }

        if (rating < 1 || rating > 5) {
            this.reviewSubmitError = 'Please choose a star rating between 1 and 5.';
            this.reviewSubmitSuccess = '';
            return;
        }

        const currentUser = this.authService.getCurrentUser();
        const numericUserId = currentUser?.id && /^\d+$/.test(String(currentUser.id))
            ? Number(currentUser.id)
            : undefined;

        this.isSubmittingReview = true;
        this.reviewSubmitError = '';
        this.reviewSubmitSuccess = '';

        this.reviewService.createReview(this.campsite.id, {
            rating,
            comment,
            userId: numericUserId
        }).subscribe({
            next: (created) => {
                const fallbackName = currentUser?.name || currentUser?.username || 'Guest';
                const reviewWithUser = {
                    ...created,
                    userName: created.userName || fallbackName
                };

                this.reviews = [reviewWithUser, ...this.reviews];

                const reviewCount = this.reviews.length;
                const totalRating = this.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
                const averageRating = reviewCount ? Number((totalRating / reviewCount).toFixed(1)) : 0;

                this.campsite = {
                    ...this.campsite!,
                    reviewCount,
                    averageRating
                };

                this.reviewDraft = { rating: 5, comment: '' };
                this.reviewSubmitSuccess = 'Your review has been submitted.';
                this.isSubmittingReview = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.reviewSubmitError = error?.message || 'Unable to submit review right now.';
                this.reviewSubmitSuccess = '';
                this.isSubmittingReview = false;
                this.cdr.detectChanges();
            }
        });
    }

    getReviewReaction(reviewId: number): 'LIKE' | 'DISLIKE' | null {
        const target = this.reviews.find(r => r.id === reviewId) as any;
        if (!target || !target.userReactions) return null;
        const currentUser = this.authService.getCurrentUser();
        const userId = currentUser ? String(currentUser.id) : 'guest';
        return target.userReactions[userId] || null;
    }

    likeReview(reviewId: number): void {
        const target = this.reviews.find(r => r.id === reviewId) as any;
        if (!target) return;
        
        const currentUser = this.authService.getCurrentUser();
        const userId = currentUser ? String(currentUser.id) : 'guest';
        target.userReactions = target.userReactions || {};
        const currentReaction = target.userReactions[userId];

        if (currentReaction === 'LIKE') {
            target.likes = Math.max(0, target.likes - 1);
            delete target.userReactions[userId];
        } else {
            target.likes = (target.likes || 0) + 1;
            if (currentReaction === 'DISLIKE') {
                target.dislikes = Math.max(0, target.dislikes - 1);
            }
            target.userReactions[userId] = 'LIKE';
        }
        
        this.persistReviewReactions();
        this.cdr.detectChanges();
    }

    dislikeReview(reviewId: number): void {
        const target = this.reviews.find(r => r.id === reviewId) as any;
        if (!target) return;
        
        const currentUser = this.authService.getCurrentUser();
        const userId = currentUser ? String(currentUser.id) : 'guest';
        target.userReactions = target.userReactions || {};
        const currentReaction = target.userReactions[userId];

        if (currentReaction === 'DISLIKE') {
            target.dislikes = Math.max(0, target.dislikes - 1);
            delete target.userReactions[userId];
        } else {
            target.dislikes = (target.dislikes || 0) + 1;
            if (currentReaction === 'LIKE') {
                target.likes = Math.max(0, target.likes - 1);
            }
            target.userReactions[userId] = 'DISLIKE';
        }
        
        this.persistReviewReactions();
        this.cdr.detectChanges();
    }

    isReviewAuthor(review: Review): boolean {
        const currentUser = this.authService.getCurrentUser();
        return !!currentUser && !!review.userId && String(currentUser.id) === String(review.userId);
    }

    startEditReview(review: Review): void {
        this.editingReviewId = review.id;
        this.editingReviewDraft = { rating: review.rating, comment: review.comment || '' };
    }

    cancelEditReview(): void {
        this.editingReviewId = null;
        this.editingReviewDraft = { rating: 5, comment: '' };
    }

    setEditDraftRating(star: number): void {
        if (star >= 1 && star <= 5) {
            this.editingReviewDraft.rating = star;
        }
    }

    saveEditReview(): void {
        if (!this.editingReviewId || !this.campsite) return;
        const comment = this.editingReviewDraft.comment.trim();
        if (!comment) {
            alert('Please write a comment for your review.');
            return;
        }

        const currentReviewId = this.editingReviewId;
        const existingReview = this.reviews.find(r => r.id === currentReviewId);
        
        this.isSavingEdit = true;
        this.reviewService.updateReview(currentReviewId, this.campsite.id, {
            rating: this.editingReviewDraft.rating,
            comment
        }).subscribe({
            next: (updated) => {
                const updatedReview = {
                    ...existingReview,
                    ...updated,
                    userName: existingReview?.userName,
                    userAvatar: existingReview?.userAvatar,
                    likes: existingReview?.likes,
                    dislikes: existingReview?.dislikes,
                    userReactions: existingReview?.userReactions
                };
                
                this.reviews = this.reviews.map(r => r.id === currentReviewId ? updatedReview : r);
                this.updateCampsiteRatingStats();
                this.cancelEditReview();
                this.isSavingEdit = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Failed to update review", err);
                alert(err?.message || 'Unable to update review.');
                this.isSavingEdit = false;
                this.cdr.detectChanges();
            }
        });
    }

    deleteReview(review: Review): void {
        if (!confirm('Are you sure you want to delete this review?')) return;
        
        this.reviewService.deleteReview(review.id).subscribe({
            next: () => {
                this.reviews = this.reviews.filter(r => r.id !== review.id);
                this.updateCampsiteRatingStats();
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Failed to delete review", err);
                alert(err?.message || 'Unable to delete review.');
                this.cdr.detectChanges();
            }
        });
    }

    private updateCampsiteRatingStats(): void {
        if (!this.campsite) return;
        const reviewCount = this.reviews.length;
        const totalRating = this.reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
        this.campsite = {
            ...this.campsite,
            reviewCount,
            averageRating: reviewCount ? Number((totalRating / reviewCount).toFixed(1)) : 0
        };
    }
}
