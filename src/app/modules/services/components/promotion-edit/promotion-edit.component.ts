import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PromotionService } from '../../services/promotion.service';
import { Promotion } from '../../models/promotion.model';

@Component({
    selector: 'app-promotion-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './promotion-edit.component.html',
    styleUrls: ['../promotion-create/promotion-create.component.css']
})
export class PromotionEditComponent implements OnInit {
    promoForm: FormGroup;
    loading = false;
    submitted = false;
    errorMessage = '';
    promoId: number | null = null;

    constructor(
        private fb: FormBuilder,
        private promotionService: PromotionService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.promoForm = this.fb.group({
            code: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(15), Validators.pattern('^[A-Z0-9]+$')]],
            description: ['', [Validators.required]],
            percentage: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            active: [true]
        });
    }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.promoId = +idParam;
            this.loadPromotion(this.promoId);
        }
    }

    loadPromotion(id: number): void {
        this.loading = true;
        this.promotionService.getById(id).subscribe({
            next: (promo: any) => {
                console.log('Loaded promo data:', promo);
                // Handle both raw object and wrapped data property
                const data = promo.data || promo;

                this.promoForm.patchValue({
                    code: data.name || data.code,
                    description: data.description,
                    percentage: data.discountValue || data.percentage,
                    startDate: this.formatDate(data.startDate),
                    endDate: this.formatDate(data.endDate),
                    active: data.isActive !== undefined ? data.isActive : data.active
                });
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading promo:', err);
                const serverMsg = err.error?.message || err.message || '';
                this.errorMessage = 'Failed to load promotion details. ' + serverMsg;
                this.loading = false;
            }
        });
    }

    formatDate(date: any): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    onSubmit(): void {
        this.submitted = true;
        this.errorMessage = '';

        if (this.promoForm.invalid || !this.promoId) return;

        this.loading = true;
        const formValues = this.promoForm.value;

        const payload: Promotion = {
            id: this.promoId,
            name: formValues.code,
            code: formValues.code.toUpperCase(), // The promo code used for validation (findByCodeIgnoreCase)
            description: formValues.description,
            type: 'PERCENTAGE',
            discountValue: formValues.percentage,
            startDate: formValues.startDate + 'T00:00:00',
            endDate: formValues.endDate + 'T23:59:59',
            isActive: formValues.active,
            targetAudience: 'ALL'
        };

        this.promotionService.update(this.promoId, payload).subscribe({
            next: () => {
                this.loading = false;
                if (this.router.url.includes('/admin')) this.router.navigate(['/admin']);
                else this.router.navigate(['/services/promotions']);
            },
            error: (err) => {
                console.error('Error updating promotion', err);
                if (err.error && err.error.message) {
                    this.errorMessage = err.error.message;
                } else {
                    this.errorMessage = 'Failed to update promotion code.';
                }
                this.loading = false;
            }
        });
    }

    goBack(): void {
        if (this.router.url.includes('/admin')) Object.assign(this.router.navigate(['/admin']));
        else this.router.navigate(['/services/promotions']);
    }

    generateCode(): void {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'CAMP-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.promoForm.get('code')?.setValue(code);
    }
}
