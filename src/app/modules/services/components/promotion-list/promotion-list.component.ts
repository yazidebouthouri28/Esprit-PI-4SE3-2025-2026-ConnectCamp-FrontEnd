import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PromotionService } from '../../services/promotion.service';
import { Promotion } from '../../models/promotion.model';
import { UserService } from '../../../../services/user.service';

@Component({
    selector: 'app-promotion-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './promotion-list.component.html',
    styleUrls: ['./promotion-list.component.css']
})
export class PromotionListComponent implements OnInit {
    promotions: Promotion[] = [];
    loading = false;
    error: string | null = null;
    copiedCodeId: number | null = null;

    constructor(
        private promotionService: PromotionService,
        private userService: UserService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadPromotions();
    }

    isAdmin(): boolean { return this.userService.isAdmin(); }
    isUser(): boolean { return this.userService.isUser(); }

    loadPromotions(): void {
        this.loading = true;
        this.error = null;
        this.promotionService.getAll().subscribe({
            next: (data: any) => {
                // Handle both wrapped and unwrapped data
                const rawData = data.data || data;
                if (this.isAdmin()) {
                    // Admins see all promotions so they can reactivate them
                    this.promotions = Array.isArray(rawData) ? rawData : [];
                } else {
                    // Regular users only see active ones
                    this.promotions = Array.isArray(rawData) ? rawData.filter((p: any) => p.isActive) : [];
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading promotions', err);
                this.error = 'Failed to load promotions.';
                this.loading = false;
            }
        });
    }

    deletePromotion(id: number | undefined): void {
        if (!id) return;
        if (confirm('Are you sure you want to delete this promotion?')) {
            this.promotionService.delete(id).subscribe({
                next: () => {
                    console.log('Promotion deleted successfully');
                    this.loadPromotions();
                },
                error: (err) => {
                    console.error('Delete error full object:', err);
                    const msg = err.error?.message || err.message || 'Server error';
                    alert('Error deleting promotion: ' + msg);
                }
            });
        }
    }

    copyCode(promo: Promotion): void {
        const code = promo.code || promo.name;
        navigator.clipboard.writeText(code).then(() => {
            this.copiedCodeId = promo.id!;
            setTimeout(() => { this.copiedCodeId = null; }, 2000);
        });
    }

    goToPacks(promoCode?: string): void {
        const extras = promoCode ? { queryParams: { code: promoCode } } : {};
        this.router.navigate(['/services/packs'], extras);
    }

    isExpired(promotion: Promotion): boolean {
        if (!promotion.endDate) return false;
        return new Date(promotion.endDate).getTime() < new Date().getTime();
    }

    isScheduled(promotion: Promotion): boolean {
        if (!promotion.startDate) return false;
        return new Date(promotion.startDate).getTime() > new Date().getTime();
    }

    togglePromotionStatus(promotion: Promotion): void {
        const action = promotion.isActive ? 'Deactivate' : 'Activate';
        if (confirm(`Are you sure you want to ${action.toLowerCase()} this promotion?`)) {
            const updated = { ...promotion, isActive: !promotion.isActive };
            this.promotionService.update(promotion.id!, updated).subscribe({
                next: () => {
                    console.log(`Promotion ${action.toLowerCase()}d successfully`);
                    this.loadPromotions();
                },
                error: (err) => {
                    console.error('Toggle error:', err);
                    alert(`Error during ${action.toLowerCase()}: ` + (err.error?.message || err.message));
                }
            });
        }
    }
}
