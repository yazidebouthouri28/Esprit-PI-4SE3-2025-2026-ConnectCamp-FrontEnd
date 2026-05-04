import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { EventServiceEntity } from '../../models/event-service-entity.model';
import { RecommendationService, RecommendationResult } from '../../services/recommendation.service';
import { EventServiceEntityService } from '../../services/event-service-entity.service';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/api.models';

export interface Event {
    id: number;
    title: string;
    type: 'workshop' | 'trip' | 'festival';
    rawEndDate?: string;
    date: string;
    time: string;
    location: string;
    image: string;
    participants: number;
    maxParticipants: number;
    price: number;
    organizer: string;
    organizerUserId?: number;
    likesCount?: number;
    dislikesCount?: number;
    rating?: number;
    description?: string;
    sponsors?: string[];
    features?: string[];
    images?: string[];
    gamifications?: any[];
}

@Component({
    selector: 'app-event-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './event-detail.component.html',
    styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent {
    private http = inject(HttpClient);
    private router = inject(Router);
    public authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    private smartService = inject(EventServiceEntityService);
    private recommendationService = inject(RecommendationService);
    private cartService = inject(CartService);

    requestedServices: EventServiceEntity[] = [];
    recommendedServices: any[] = [];
    recommendedPacks: any[] = [];
    servicesLoading = false;
    
    recommendations: RecommendationResult | null = null;
    recommendationsLoading = false;
    recommendationsError = '';
    recsLoading = false;

    newComment: string = '';
    newCommentRating: number = 0;
    userRating: number = 0;
    ticketCount: number = 1;
    showClaimForm: boolean = false;
    claimSubject: string = '';
    claimDescription: string = '';
    purchaseSuccess: boolean = false;
    purchasedTicket: any = null;
    errorMessage: string = '';
    isProcessing: boolean = false;

    userLiked: boolean = false;
    userDisliked: boolean = false;

    private apiUrl = environment.apiUrl;
    @Input() set event(value: Event | null) {
        const clonedValue = value ? { ...value } : null;

        if (clonedValue && clonedValue.image && !clonedValue.image.startsWith('http') && !clonedValue.image.startsWith('blob')) {
            clonedValue.image = clonedValue.image.startsWith('/uploads/')
                ? `${this.apiUrl}${clonedValue.image}`
                : `${this.apiUrl}/uploads/${clonedValue.image}`;
        }
        if (clonedValue && clonedValue.images) {
            clonedValue.images = clonedValue.images.map(img =>
                (img && !img.startsWith('http') && !img.startsWith('blob'))
                    ? (img.startsWith('/uploads/')
                        ? `${this.apiUrl}${img}`
                        : `${this.apiUrl}/uploads/${img}`)
                    : img
            );
        }
        this._event = clonedValue;
        this.userLiked = false;
        this.userDisliked = false;
        this.requestedServices = [];
        if (clonedValue) {
            this.loadComments();
            this.loadUserReaction();
            this.loadRequestedServices();
            this.loadRecommendations();
            this.loadSmartRecommendations();
        }
    }
    get event(): Event | null { return this._event; }
    private _event: Event | null = null;

    @Output() back = new EventEmitter<void>();
    @Output() edit = new EventEmitter<Event>();
    @Output() add = new EventEmitter<void>();
    @Output() uploadImage = new EventEmitter<number>();

    get progressPercent(): number {
        if (!this.event) return 0;
        return (this.event.participants / this.event.maxParticipants) * 100;
    }

    onBack() {
        this.back.emit();
    }

    get canManage(): boolean {
        const user = this.authService.getCurrentUser();
        if (!user || user.role !== 'ORGANIZER' || !this.event) return false;
        return Number(user.id) === this.event.organizerUserId;
    }

    get isOrganizer(): boolean {
        return this.authService.getCurrentUser()?.role === 'ORGANIZER';
    }

    getProductImage(productName: string): string {
        const keywords = ['outdoor', 'sport', 'gear', 'adventure', 'equipment', 'hiking', 'nature'];
        const keyword = keywords[Math.floor(Math.random() * keywords.length)];
        const seed = productName.replace(/\s+/g, '-').toLowerCase();
        return `https://picsum.photos/seed/${seed}/400/200`;
    }

    get displayRating(): number {
        if (!this.event || this.event.rating == null) return 0;
        return Number(this.event.rating);
    }

    getStarFill(s: number): number {
        const rating = this.displayRating;
        if (s <= rating) return 100;
        if (s - 1 < rating) return (rating - (s - 1)) * 100;
        return 0;
    }

    editEvent() {
        if (!this.event) return;
        this.edit.emit(this.event);
    }

    addNewEvent() {
        this.add.emit();
    }

    triggerUpload(index: number) {
        if (!this.canManage) return;
        this.uploadImage.emit(index);
    }

    deleteEvent() {
        if (!this.event) return;
        if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
            this.isProcessing = true;
            this.http.delete(`${this.apiUrl}/api/events/${this.event.id}`).subscribe({
                next: () => {
                    this.isProcessing = false;
                    this.onBack();
                },
                error: (err) => {
                    this.isProcessing = false;
                    console.error('Delete failed:', err);
                    alert('Erreur lors de la suppression.');
                }
            });
        }
    }

    private loadUserReaction() {
        if (!this._event || !this.authService.isAuthenticated()) return;
        const userId = this.authService.getCurrentUser()?.id;
        if (!userId) return;
        this.http.get<{ liked: boolean; disliked: boolean }>(
            `${this.apiUrl}/api/events/${this._event.id}/my-reaction?userId=${userId}`
        ).subscribe({
            next: (res) => {
                this.userLiked = res.liked === true;
                this.userDisliked = res.disliked === true;
                this.cdr.detectChanges();
            },
            error: () => { /* ignore */ }
        });
    }

    likeEvent() {
        if (!this.event || this.isProcessing) return;
        if (!this.authService.isAuthenticated()) {
            alert('Veuillez vous connecter pour aimer un événement.');
            this.router.navigate(['/auth/login']);
            return;
        }
        const userId = this.authService.getCurrentUser()?.id;
        if (!userId) return;

        this.isProcessing = true;
        const originalLiked = this.userLiked;
        const originalDisliked = this.userDisliked;

        if (this.userLiked) {
            this.userLiked = false;
            this._event!.likesCount = Math.max(0, (this._event!.likesCount || 1) - 1);
        } else {
            this.userLiked = true;
            this._event!.likesCount = (this._event!.likesCount || 0) + 1;
            if (this.userDisliked) {
                this.userDisliked = false;
                this._event!.dislikesCount = Math.max(0, (this._event!.dislikesCount || 1) - 1);
            }
        }
        this.cdr.detectChanges();

        this.http.post(`${this.apiUrl}/api/events/${this.event.id}/like?userId=${userId}`, {}).subscribe({
            next: () => {
                this.refreshEventData();
                this.loadUserReaction();
                this.isProcessing = false;
            },
            error: () => {
                this.userLiked = originalLiked;
                this.userDisliked = originalDisliked;
                this.refreshEventData();
                this.isProcessing = false;
            }
        });
    }

    dislikeEvent() {
        if (!this.event || this.isProcessing) return;
        if (!this.authService.isAuthenticated()) {
            alert('Veuillez vous connecter pour ne pas aimer un événement.');
            this.router.navigate(['/auth/login']);
            return;
        }
        const userId = this.authService.getCurrentUser()?.id;
        if (!userId) return;

        this.isProcessing = true;
        const originalLiked = this.userLiked;
        const originalDisliked = this.userDisliked;

        if (this.userDisliked) {
            this.userDisliked = false;
            this._event!.dislikesCount = Math.max(0, (this._event!.dislikesCount || 1) - 1);
        } else {
            this.userDisliked = true;
            this._event!.dislikesCount = (this._event!.dislikesCount || 0) + 1;
            if (this.userLiked) {
                this.userLiked = false;
                this._event!.likesCount = Math.max(0, (this._event!.likesCount || 1) - 1);
            }
        }
        this.cdr.detectChanges();

        this.http.post(`${this.apiUrl}/api/events/${this.event.id}/dislike?userId=${userId}`, {}).subscribe({
            next: () => {
                this.refreshEventData();
                this.loadUserReaction();
                this.isProcessing = false;
            },
            error: () => {
                this.userLiked = originalLiked;
                this.userDisliked = originalDisliked;
                this.refreshEventData();
                this.isProcessing = false;
            }
        });
    }

    rateEvent(rating: number) {
        if (!this.event) return;
        if (!this.authService.isAuthenticated()) {
            alert('Veuillez vous connecter pour noter un événement.');
            this.router.navigate(['/auth/login']);
            return;
        }
        this.userRating = rating;
        const userId = this.authService.getCurrentUser()?.id;
        if (!userId) return;

        const payload = {
            targetType: 'EVENT',
            targetId: this.event.id,
            rating: rating,
            comment: 'Note via interface event-detail'
        };
        this.http.post(`${this.apiUrl}/api/general-reviews?userId=${userId}`, payload).subscribe({
            next: () => {
                this.refreshEventData();
            },
            error: (err) => console.error('Rating failed', err)
        });
    }

    addCommentWithStars() {
        if (!this.event) return;
        const commentText = this.newComment.trim();
        const ratingVal = this.newCommentRating;

        if (!commentText && ratingVal === 0) return;

        if (!this.authService.isAuthenticated()) {
            alert('Veuillez vous connecter pour ajouter un avis.');
            this.router.navigate(['/auth/login']);
            return;
        }

        this.isProcessing = true;
        const userId = this.authService.getCurrentUser()?.id;

        const payload = {
            targetType: 'EVENT',
            targetId: this.event.id,
            rating: ratingVal > 0 ? ratingVal : null,
            comment: commentText || null
        };

        this.http.post(`${this.apiUrl}/api/general-reviews?userId=${userId}`, payload).subscribe({
            next: () => {
                this.newComment = '';
                this.newCommentRating = 0;
                this.isProcessing = false;
                this.refreshEventData();
                this.loadComments();
            },
            error: (err) => {
                this.isProcessing = false;
                console.error('Review submission failed', err);
            }
        });
    }

    loadRequestedServices() {
        if (!this._event) return;
        this.servicesLoading = true;
        this.http.get<any>(`${this.apiUrl}/api/event-services/event/${this._event.id}`).subscribe({
            next: (res) => {
                const data = res?.data || res || [];
                this.requestedServices = Array.isArray(data) ? data : (data.content || []);
                this.servicesLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.requestedServices = [];
                this.servicesLoading = false;
            }
        });
    }

    loadSmartRecommendations() {
        if (!this._event) return;
        this.recsLoading = true;
        this.recommendedServices = [];
        this.recommendedPacks = [];

        this.smartService.getRecommendedServices(this._event.id).subscribe({
            next: (res) => {
                this.recommendedServices = res.data || [];
                this.recsLoading = false;
                this.cdr.detectChanges();
            },
            error: () => { this.recsLoading = false; }
        });

        this.smartService.getRecommendedPacks(this._event.id).subscribe({
            next: (res) => {
                this.recommendedPacks = res.data || [];
                this.cdr.detectChanges();
            }
        });
    }

    get isParticipant(): boolean {
        const role = this.authService.getCurrentUser()?.role as string;
        return role === 'PARTICIPANT' || role === 'CAMPER';
    }

    goToWorkAtEvent() {
        if (!this.event) return;
        this.router.navigate(['/events', this.event.id, 'work-roles']);
    }

    goToMyCandidatures() {
        this.router.navigate(['/services/candidatures']);
    }

    public comments: any[] = [];
    loadComments() {
        if (!this.event) return;
        this.http.get<any>(`${this.apiUrl}/api/general-reviews/EVENT/${this.event.id}?size=100&sort=createdAt,desc`).subscribe({
            next: (res) => {
                const pageData = res.data || res;
                this.comments = pageData.content || pageData;
            },
            error: (err) => console.error('Failed to load reviews', err)
        });
    }

    buyTickets() {
        if (!this.event || !this.authService.isAuthenticated()) {
            this.router.navigate(['/auth/login']);
            return;
        }
        const user = this.authService.getCurrentUser();
        if (!user) return;

        this.isProcessing = true;
        const params = {
            userId: user.id.toString(),
            eventId: this.event.id.toString(),
            ticketType: 'STANDARD'
        };

        this.http.post<any>(`${this.apiUrl}/api/tickets/purchase`, null, { params }).subscribe({
            next: (res) => {
                this.purchasedTicket = res?.data || res;
                this.purchaseSuccess = true;
                this.isProcessing = false;
                this.cdr.detectChanges();
                this.refreshEventData();
            },
            error: (err) => {
                this.isProcessing = false;
                alert(err.error?.message || 'Erreur lors de l\'achat du ticket. Veuillez réessayer.');
                this.cdr.detectChanges();
            }
        });
    }

    submitClaim() {
        if (!this.event || !this.claimSubject.trim() || !this.authService.isAuthenticated()) return;
        const userId = this.authService.getCurrentUser()?.id;
        const payload = {
            subject: this.claimSubject,
            description: this.claimDescription,
            category: 'OTHER',
            referenceType: 'RESERVATION',
            referenceId: this.event.id
        };
        this.http.post(`${this.apiUrl}/complaints?userId=${userId}`, payload).subscribe({
            next: () => {
                this.showClaimForm = false;
                this.claimSubject = '';
                this.claimDescription = '';
                alert('Réclamation soumise avec succès.');
            },
            error: (err) => console.error('Claim failed', err)
        });
    }

    private refreshEventData() {
        if (!this.event) return;
        this.http.get<any>(`${this.apiUrl}/api/events/${this.event.id}`).subscribe({
            next: (res) => {
                const refreshedEvent = res.data || res;
                if (this._event) {
                    this._event.likesCount = refreshedEvent.likesCount;
                    this._event.dislikesCount = refreshedEvent.dislikesCount;
                    this._event.participants = refreshedEvent.currentParticipants || refreshedEvent.participants;
                    if (refreshedEvent.rating !== undefined) this._event.rating = refreshedEvent.rating;
                    if (refreshedEvent.gamifications !== undefined) this._event.gamifications = refreshedEvent.gamifications;
                    this.cdr.detectChanges();
                }
            },
            error: (err) => console.error('Refresh failed', err)
        });
    }

    loadRecommendations() {
        if (!this._event) return;
        this.recommendationsLoading = true;
        this.recommendationsError = '';
        this.recommendations = null;

        this.recommendationService.getRecommendations(this._event.id).subscribe({
            next: (res) => {
                this.recommendations = res;
                this.recommendationsLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.recommendationsError = 'Could not load recommendations.';
                this.recommendationsLoading = false;
            }
        });
    }

    addRecommendedToCart(product: any) {
        const item: CartItem = {
            productId: String(product.productId),
            productName: product.productName,
            price: product.price,
            quantity: 1,
            image: '',
            type: 'PURCHASE'
        };
        this.cartService.addToCart(item).subscribe();
        alert(`✅ "${product.productName}" added to cart!`);
    }
}
