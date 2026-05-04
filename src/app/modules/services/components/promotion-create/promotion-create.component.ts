import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PromotionService } from '../../services/promotion.service';
import { Promotion } from '../../models/promotion.model';

@Component({
    selector: 'app-promotion-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './promotion-create.component.html',
    styleUrls: ['./promotion-create.component.css']
})
export class PromotionCreateComponent implements OnInit {
    promoForm: FormGroup;
    loading = false;
    submitted = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private promotionService: PromotionService,
        private router: Router
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

    ngOnInit(): void { }

    onSubmit(): void {
        this.submitted = true;
        this.errorMessage = '';

        if (this.promoForm.invalid) return;

        this.loading = true;
        const formValues = this.promoForm.value;

        // Map frontend form properties to Backend expected PromotionRequest properties
        const payload: Promotion = {
            name: formValues.code, // The backend uses 'name' which we treat as the code
            code: formValues.code.toUpperCase(), // The promo code used for validation (findByCodeIgnoreCase)
            description: formValues.description,
            type: 'PERCENTAGE', // We are creating percentage discounts
            discountValue: formValues.percentage, // Map percentage to discountValue
            startDate: formValues.startDate + 'T00:00:00', // Basic ISO formatting for backend LocalDateTime
            endDate: formValues.endDate + 'T23:59:59',
            isActive: formValues.active,
            targetAudience: 'ALL'
        };

        this.promotionService.create(payload).subscribe({
            next: () => {
                this.loading = false;
                if (this.router.url.includes('/admin')) this.router.navigate(['/admin']);
                else this.router.navigate(['/services/promotions']);
            },
            error: (err) => {
                console.error('Error creating promotion', err);
                // Extract error message if provided by backend ApiResponse
                if (err.error && err.error.message) {
                    this.errorMessage = err.error.message;
                } else if (err.error && err.error.errors) {
                    // For validation errors
                    this.errorMessage = Object.values(err.error.errors).join(', ');
                } else {
                    this.errorMessage = 'Failed to create promotion code. Please verify the dates and try again.';
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
