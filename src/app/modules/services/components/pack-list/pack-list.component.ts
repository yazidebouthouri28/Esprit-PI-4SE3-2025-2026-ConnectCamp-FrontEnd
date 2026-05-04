import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PackService } from '../../services/pack.service';
import { Pack } from '../../models/pack.model';
import { ServiceService } from '../../services/service.service';
import { Service } from '../../models/service.model';
import { forkJoin } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { CartService } from '../../../../services/cart.service';
import { CartItem } from '../../../../models/api.models';
import { environment } from '../../../../../environments/environment';
import { ReviewService } from '../../../../services/review.service';
import { AiService } from '../../../../services/ai.service';

@Component({
    selector: 'app-pack-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './pack-list.component.html',
    styleUrls: ['./pack-list.component.css']
})
export class PackListComponent implements OnInit {
    packs: Pack[] = [];
    services: Service[] = [];
    loading = false;
    error: string | null = null;

    // AI Reputation State
    reputationResults: Record<number, string> = {};
    reputationLoading: Record<number, boolean> = {};

    // Review Form State
    showReviewFormId: number | null = null;
    reviewData = {
        rating: 5,
        qualityRating: 5,
        valueRating: 5,
        pros: '',
        cons: '',
        comment: 'This bundle is excellent and provides great value.',
        title: 'Great Bundle'
    };
    reviewLoading = false;

    constructor(
        private packService: PackService,
        private serviceService: ServiceService,
        private userService: UserService,
        private router: Router,
        private cartService: CartService,
        private reviewService: ReviewService,
        private aiService: AiService
    ) { }

    addToCart(pack: Pack): void {
        const image = (pack.images && pack.images.length > 0) ? pack.images[0] : (pack.image || '');

        this.cartService.addItem({
            productId: pack.id!.toString(),
            productName: pack.name,
            price: pack.price,
            quantity: 1,
            image: image,
            type: 'PURCHASE'
        });
        alert(`✅ Bundle "${pack.name}" added to cart!`);
        this.router.navigate(['/cart']);
    }

    onBook(packId: number, promoCode?: string): void {
        const pack = this.packs.find(p => p.id === packId);
        if (pack) {
            localStorage.setItem('campingExtra', JSON.stringify({
                id: pack.id,
                name: pack.name,
                price: pack.price,
                type: 'BUNDLE'
            }));
        }
        this.router.navigate(['/campsites'], {
            queryParams: {
                pack: packId,
                promo: promoCode || 'SPECIAL20',
                autoOpen: 'reservation'
            },
            queryParamsHandling: 'merge'
        });
    }

    isAdmin(): boolean { return this.userService.isAdmin(); }
    isUser(): boolean { return this.userService.isUser(); }
    isOrganizer(): boolean { return this.userService.isOrganizer(); }
    isParticipant(): boolean {
        const role = this.userService.getLoggedInUser()?.role;
        return role === 'PARTICIPANT' || role === 'CAMPER' || role === 'USER';
    }
    isCamper(): boolean {
        const role = this.userService.getLoggedInUser()?.role;
        return role === 'CAMPER';
    }

    onBookPack(pack: Pack): void {
        this.onBook(pack.id!);
    }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.error = null;

        const isAdmin = this.isAdmin();
        const packsObs = isAdmin ? this.packService.getAllAdmin() : this.packService.getAll();

        forkJoin({
            packs: packsObs,
            services: this.serviceService.getAll()
        }).subscribe({
            next: (result) => {
                // Ensure result.packs is an array before filtering
                const packsArray = Array.isArray(result.packs) ? result.packs : [];
                this.packs = isAdmin ? packsArray : packsArray.filter(p => p.isActive === true);
                this.services = result.services || [];
                this.loading = false;
            },
            error: (err) => {
                console.warn('Could not load bundles/services', err);
                const serverMsg = err.error?.message || err.message || 'Access Denied';
                this.error = `Bundles might be restricted or your session expired. (Details: ${serverMsg})`;
                this.loading = false;
            }
        });
    }

    getServiceName(id: number): string {
        return this.services.find(s => s.id === id)?.name || 'Unknown Service';
    }

    calculateOriginalPrice(pack: Pack): number {
        return pack.price / (1 - pack.discount / 100);
    }

    deletePack(id: number): void {
        if (confirm('Are you sure you want to completely delete this bundle? This cannot be undone.')) {
            this.packService.delete(id!).subscribe({
                next: () => this.loadData(),
                error: (err) => alert('Error deleting pack')
            });
        }
    }

    togglePackAvailability(pack: Pack): void {
        const currentlyActive = pack.isActive === true;
        const action = currentlyActive ? 'Deactivate' : 'Activate';
        if (confirm(`Are you sure you want to ${action.toLowerCase()} this bundle?`)) {
            this.packService.setStatus(pack.id!, !currentlyActive).subscribe({
                next: () => this.loadData(),
                error: () => alert(`Failed to ${action.toLowerCase()} bundle.`)
            });
        }
    }

    applyPromotion(pack: Pack): void {
        const discountStr = prompt(`Set a discount percentage for ${pack.name} (0 to 100):`, pack.discount.toString());
        if (discountStr !== null) {
            const discount = Number(discountStr);
            if (!isNaN(discount) && discount >= 0 && discount <= 100) {
                const updatedPack = { ...pack, discount: discount };
                this.packService.update(pack.id!, updatedPack).subscribe({
                    next: () => {
                        alert(`Discount of ${discount}% applied successfully!`);
                        this.loadData();
                    },
                    error: () => alert('Failed to apply discount. Please try again.')
                });
            } else {
                alert('Invalid discount. Please enter a number between 0 and 100.');
            }
        }
    }

    getImageUrl(imagePath: string | undefined): string {
        return this.cartService.getImageUrl(imagePath);
    }

    // ── Pack/Bundle Review Logic ──────────────────────────────────────
    toggleReviewForm(packId: number): void {
        if (this.showReviewFormId === packId) {
            this.showReviewFormId = null;
        } else {
            this.showReviewFormId = packId;
            this.reviewData = {
                rating: 5,
                qualityRating: 5,
                valueRating: 5,
                pros: '',
                cons: '',
                comment: 'This bundle is excellent and provides great value.',
                title: 'Excellent Bundle'
            };
        }
    }

    submitPackReview(pack: Pack): void {
        const user = this.userService.getLoggedInUser();
        if (!user) {
            alert('Please login to leave a review.');
            return;
        }

        // Try to find a service ID to link the review to
        let targetServiceId: number | undefined;

        if (pack.serviceIds && pack.serviceIds.length > 0) {
            targetServiceId = pack.serviceIds[0];
        } else if (this.services && this.services.length > 0) {
            // Fallback: Find a service that belongs to the same site (campsite)
            const siteService = this.services.find(s => s.campingId === pack.siteId);
            if (siteService) {
                targetServiceId = siteService.id;
            } else {
                // Last resort: just use the first available service
                targetServiceId = this.services[0].id;
            }
        }

        if (!targetServiceId) {
            alert('Could not find any associated services for this bundle to review.');
            return;
        }

        this.reviewLoading = true;
        const payload = {
            rating: this.reviewData.rating,
            qualityRating: this.reviewData.qualityRating,
            valueRating: this.reviewData.valueRating,
            title: this.reviewData.title,
            comment: this.reviewData.comment,
            pros: this.reviewData.pros.split(',').map(s => s.trim()).filter(s => s),
            cons: this.reviewData.cons.split(',').map(s => s.trim()).filter(s => s)
        };

        this.reviewService.createServiceReview(targetServiceId, user.id, payload).subscribe({
            next: () => {
                alert('✨ Bundle sentiment saved! The AI Advisor will now prioritize this pack based on your feedback.');
                this.showReviewFormId = null;
                this.reviewLoading = false;
            },
            error: (err) => {
                console.error('Error submitting bundle review', err);
                alert(err.error?.message || 'Failed to submit review.');
                this.reviewLoading = false;
            }
        });
    }

    generatePackReputation(packId: number): void {
        this.reputationLoading[packId] = true;
        this.reputationResults[packId] = '';
        this.aiService.analyzePackReputation(packId).subscribe({
            next: (result) => {
                this.reputationResults[packId] = result;
                this.reputationLoading[packId] = false;
            },
            error: () => {
                this.reputationResults[packId] = 'AI analysis unavailable for this bundle.';
                this.reputationLoading[packId] = false;
            }
        });
    }

    closeReputation(packId: number): void {
        delete this.reputationResults[packId];
    }
}
