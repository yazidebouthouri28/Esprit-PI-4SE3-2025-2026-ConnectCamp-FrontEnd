import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';

export interface Event {
    id: number;
    title: string;
    type: 'workshop' | 'trip' | 'festival';
    status?: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | string;
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
    public router = inject(Router);
    public authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    private notifications = inject(NotificationService);

    newComment: string = '';
    newCommentRating: number = 0;
    userRating: number = 0;
    ticketCount: number = 1;
    showClaimForm: boolean = false;
    claimSubject: string = '';
    claimDescription: string = '';
    purchaseSuccess: boolean = false;
    errorMessage: string = '';
    isProcessing: boolean = false;

    // Track current user's reaction
    userLiked: boolean = false;
    userDisliked: boolean = false;

    private apiUrl = environment.apiUrl;
    @Input() set event(value: Event | null) {
        // Clone the object to avoid mutating the parent's state (fixes NG0100)
        const clonedValue = value ? { ...value } : null;

        if (clonedValue && clonedValue.image) {
            if (clonedValue.image.startsWith('assets/') || clonedValue.image.startsWith('/assets/')) {
                // Angular frontend asset — serve relative to frontend origin
                clonedValue.image = clonedValue.image.startsWith('/') ? clonedValue.image : `/${clonedValue.image}`;
            } else if (!clonedValue.image.startsWith('http') && !clonedValue.image.startsWith('blob')) {
                clonedValue.image = clonedValue.image.startsWith('/uploads/')
                    ? `${this.apiUrl}${clonedValue.image}`
                    : `${this.apiUrl}/uploads/${clonedValue.image}`;
            }
        }
        if (clonedValue && clonedValue.images) {
            clonedValue.images = clonedValue.images.map(img => {
                if (!img) return img;
                if (img.startsWith('assets/') || img.startsWith('/assets/')) {
                    return img.startsWith('/') ? img : `/${img}`;
                }
                if (!img.startsWith('http') && !img.startsWith('blob')) {
                    return img.startsWith('/uploads/')
                        ? `${this.apiUrl}${img}`
                        : `${this.apiUrl}/uploads/${img}`;
                }
                return img;
            });
        }
        this._event = clonedValue;
        // Reset reaction state each time a new event is opened
        this.userLiked = false;
        this.userDisliked = false;
        if (clonedValue) {
            this.loadComments();
            this.loadUserReaction();
        }
    }
    get event(): Event | null { return this._event; }
    private _event: Event | null = null;

    @Output() back = new EventEmitter<void>();
    @Output() edit = new EventEmitter<Event>();
    @Output() add = new EventEmitter<void>();
    @Output() uploadImage = new EventEmitter<number>();
    @Output() reservationSuccess = new EventEmitter<void>();

    get progressPercent(): number {
        if (!this.event) return 0;
        return (this.event.participants / this.event.maxParticipants) * 100;
    }

    onBack() {
        this.back.emit();
    }

    // Role & Ownership Checks
    get canManage(): boolean {
        const user = this.authService.getCurrentUser();
        if (!user || user.role !== 'ORGANIZER' || !this.event) return false;
        return Number(user.id) === this.event.organizerUserId;
    }

    get isOrganizer(): boolean {
        return this.authService.getCurrentUser()?.role === 'ORGANIZER';
    }

    // Readonly rating derived from backend (likes/dislikes → rating field)
    get displayRating(): number {
        if (!this.event || this.event.rating == null) {
            return 0;
        }
        return Number(this.event.rating);
    }

    // Review-based rating (average of all comments)
    get averageCommentRating(): number {
        if (!this.comments || this.comments.length === 0) return 0;
        const sum = this.comments.reduce((acc, c) => acc + (c.rating || 0), 0);
        return sum / this.comments.length;
    }

    getStarFill(s: number): number {
        const rating = this.averageCommentRating; // Use comment average for the reviews section
        if (s <= rating) return 100;
        if (s - 1 < rating) return (rating - (s - 1)) * 100;
        return 0;
    }

    // Management Actions
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

    // Interactions
    private getNumericUserId(): number | null {
        const raw = this.authService.getCurrentUser()?.id;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private loadUserReaction() {
        if (!this._event || !this.authService.isAuthenticated()) return;
        const userId = this.getNumericUserId();
        if (userId == null) return;
        this.http.get<{ liked: boolean; disliked: boolean }>(
            `${this.apiUrl}/api/events/${this._event.id}/my-reaction?userId=${userId}`
        ).subscribe({
            next: (res) => {
                this.userLiked = res.liked === true;
                this.userDisliked = res.disliked === true;
                this.cdr.detectChanges();
            },
            error: () => { /* ignore, keep defaults */ }
        });
    }

    likeEvent() {
        if (!this.event || this.isProcessing) return;
        if (!this.authService.isAuthenticated()) {
            alert('Veuillez vous connecter pour aimer un événement.');
            this.router.navigate(['/auth/login']);
            return;
        }
        const userId = this.getNumericUserId();
        if (userId == null) {
            alert('Votre session ne contient pas un identifiant utilisateur valide. Veuillez vous reconnecter.');
            return;
        }

        this.isProcessing = true;
        // Optimistic update — save ALL original values for rollback
        const originalLiked = this.userLiked;
        const originalDisliked = this.userDisliked;
        const originalLikesCount = this._event!.likesCount ?? 0;
        const originalDislikesCount = this._event!.dislikesCount ?? 0;

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

        this.http
            .post(`${this.apiUrl}/api/events/${this.event.id}/like`, null, { params: { userId } })
            .pipe(finalize(() => { this.isProcessing = false; }))
            .subscribe({
                next: () => {
                    this.refreshEventData();
                    this.loadUserReaction();
                },
                error: (err) => {
                    this.userLiked = originalLiked;
                    this.userDisliked = originalDisliked;
                    this._event!.likesCount = originalLikesCount;
                    this._event!.dislikesCount = originalDislikesCount;
                    this.cdr.detectChanges();
                    this.notifications.error(err?.error?.message || err?.message || 'Erreur lors du like. Veuillez réessayer.');
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
        const userId = this.getNumericUserId();
        if (userId == null) {
            alert('Votre session ne contient pas un identifiant utilisateur valide. Veuillez vous reconnecter.');
            return;
        }

        this.isProcessing = true;
        // Optimistic update — save ALL original values for rollback
        const originalLiked = this.userLiked;
        const originalDisliked = this.userDisliked;
        const originalLikesCount = this._event!.likesCount ?? 0;
        const originalDislikesCount = this._event!.dislikesCount ?? 0;

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

        this.http
            .post(`${this.apiUrl}/api/events/${this.event.id}/dislike`, null, { params: { userId } })
            .pipe(finalize(() => { this.isProcessing = false; }))
            .subscribe({
                next: () => {
                    this.refreshEventData();
                    this.loadUserReaction();
                },
                error: (err) => {
                    this.userLiked = originalLiked;
                    this.userDisliked = originalDisliked;
                    this._event!.likesCount = originalLikesCount;
                    this._event!.dislikesCount = originalDislikesCount;
                    this.cdr.detectChanges();
                    this.notifications.error(err?.error?.message || err?.message || 'Erreur lors du dislike. Veuillez réessayer.');
                }
            });
    }

    setCommentRating(rating: number) {
        this.newCommentRating = rating;
    }

    addCommentWithStars() {
        if (!this.event) return;
        const commentText = this.newComment.trim();
        const ratingVal = this.newCommentRating;

        // Rating is mandatory in Play Store style
        if (ratingVal === 0) {
            alert('Veuillez sélectionner une note avant de publier votre avis.');
            return;
        }

        if (!this.authService.isAuthenticated()) {
            alert('Veuillez vous connecter pour ajouter un avis.');
            this.router.navigate(['/auth/login']);
            return;
        }

        this.isProcessing = true;
        const userId = this.authService.getCurrentUser()?.id;

        const payload = {
            eventId: this.event.id,
            userId,
            content: commentText || 'Rated only',
            rating: ratingVal
        };

        this.http.post(`${this.apiUrl}/api/comments`, payload).subscribe({
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

    public comments: any[] = [];
    loadComments() {
        if (!this.event) return;
        this.http.get<any>(`${this.apiUrl}/api/comments/event/${this.event.id}`).subscribe({
            next: (res) => {
                this.comments = res?.data || [];
            },
            error: (err) => console.error('Failed to load comments', err)
        });
    }

    buyTickets() {
        if (this.event?.status === 'COMPLETED') {
            this.notifications.warning('Cet événement est terminé. Les réservations sont fermées.');
            return;
        }
        if (!this.event || !this.authService.isAuthenticated()) {
            this.router.navigate(['/auth/login']);
            return;
        }
        const user = this.authService.getCurrentUser();
        if (!user) return;

        if (this.authService.isSponsor()) {
            alert('Sponsors cannot reserve tickets for themselves. An admin must assign you to this event');
            return;
        }

        this.isProcessing = true;
        // The backend expects RequestParams
        const guestName = user.name || user.username || 'Guest';
        const guestEmail = user.email || '';
        const guestPhone = user.phone || '00000000';
        const params = {
            userId: user.id.toString(),
            eventId: this.event.id.toString(),
            quantity: this.ticketCount.toString(),
            notes: `Guest: ${guestName} | Email: ${guestEmail} | Phone: ${guestPhone}`
        };

        this.http.post(`${this.apiUrl}/api/ticket-reservations/event`, null, { params }).subscribe({
            next: () => {
                this.purchaseSuccess = true;
                this.isProcessing = false;
                this.notifications.success('Tickets réservés avec succès.');
                this.cdr.detectChanges();
                setTimeout(() => {
                    this.purchaseSuccess = false;
                    this.cdr.detectChanges();
                }, 5000);
                this.refreshEventData();
                this.reservationSuccess.emit();
            },
            error: (err) => {
                this.isProcessing = false;
                console.error('Reservation failed:', err);
                this.notifications.error(err.error?.message || 'Erreur lors de la réservation. Veuillez réessayer.');
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
                this.notifications.success('Réclamation soumise avec succès.');
            },
            error: (err) => console.error('Claim failed', err)
        });
    }

    private refreshEventData() {
        if (!this.event) return;
        this.http.get<any>(`${this.apiUrl}/api/events/${this.event.id}`).subscribe({
            next: (res) => {
                const refreshedEvent = res.data || res;
                // Merge refreshed data into current event to preserve UI state if needed
                if (this._event) {
                    if (typeof refreshedEvent.likesCount === 'number') {
                        this._event.likesCount = refreshedEvent.likesCount;
                    }
                    if (typeof refreshedEvent.dislikesCount === 'number') {
                        this._event.dislikesCount = refreshedEvent.dislikesCount;
                    }
                    this._event.participants = refreshedEvent.currentParticipants || refreshedEvent.participants;
                    // Actualiser la note si elle est présente dans la réponse
                    if (refreshedEvent.rating !== undefined) {
                        this._event.rating = refreshedEvent.rating;
                    }
                    if (refreshedEvent.gamifications !== undefined) {
                        this._event.gamifications = refreshedEvent.gamifications;
                    }
                    // Force Angular change detection so the updated counts render immediately
                    this.cdr.detectChanges();
                }
            },
            error: (err) => console.error('Refresh failed', err)
        });
    }

    // --- Fullscreen Gallery ---
    isGalleryOpen = false;
    activeGalleryIndex = 0;

    get galleryImages(): string[] {
        if (!this.event) return [];
        const imgs: string[] = [];
        if (this.event.image) imgs.push(this.event.image);
        if (this.event.images) {
            imgs.push(...this.event.images.filter(img => !!img));
        }
        return imgs;
    }

    openGallery(index: number) {
        if (this.galleryImages.length === 0) return;
        this.activeGalleryIndex = Math.min(index, this.galleryImages.length - 1);
        this.isGalleryOpen = true;
    }

    closeGallery() {
        this.isGalleryOpen = false;
    }

    prevImage() {
        this.activeGalleryIndex =
            (this.activeGalleryIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
    }

    nextImage() {
        this.activeGalleryIndex =
            (this.activeGalleryIndex + 1) % this.galleryImages.length;
    }

    onGalleryBackdropClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target.classList.contains('gallery-backdrop')) {
            this.closeGallery();
        }
    }
}
