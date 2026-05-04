import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SiteService } from '../../services/site.service';
import { Site, Review, CampHighlight, VirtualTour, Certification } from '../../models/camping.models';
import { ReviewService } from '../../services/review.service';
import { CampHighlightService } from '../../services/camp-highlight.service';
import { VirtualTourService } from '../../services/virtual-tour.service';
import { CertificationService } from '../../services/certification.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-campsite-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
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

    likes = 12;
    dislikes = 0;

    
    userReaction: 'LIKE' | 'DISLIKE' | null = null;
    isGalleryOpen = false;
    activeGalleryIndex = 0;
    galleryImages: string[] = [];

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
        this.router.navigate(['/campsites', this.campsite.id, 'reserve']);
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

    get directionsUrl(): string {
        if (!this.campsite?.location) return 'https://www.google.com/maps';
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.campsite.location)}`;
    }

    get mapEmbedUrl(): SafeResourceUrl {
        const query = this.campsite?.location || this.campsite?.city || this.campsite?.name || 'campsite';
        return this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=12&output=embed`
        );
    }

    get isAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }

    get isReviewAllowed(): boolean {
        return this.authService.isAuthenticated() && !this.authService.isAdmin();
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
