import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PromotionService } from '../../modules/services/services/promotion.service';

interface CartItem {
    id: number;
    name: string;
    image: string;
    type: 'Purchase' | 'Rental';
    rentalDuration?: string;
    quantity: number;
    unitPrice: number;
}

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
    constructor(
        private location: Location,
        private route: ActivatedRoute,
        private promotionService: PromotionService
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['code']) {
                this.promoCode = params['code'];
                this.applyPromo();
            }
        });
    }

    // ── Promo code ────────────────────────────────────────────────────────────
    promoCode = '';
    promoLoading = false;
    promoResult: { valide: boolean; message: string; reduction?: number; montantFinal?: number; promotionName?: string } | null = null;

    get discount(): number {
        return this.promoResult?.valide ? (this.promoResult.reduction ?? 0) : 0;
    }

    applyPromo(): void {
        if (!this.promoCode.trim()) return;
        this.promoLoading = true;
        this.promoResult = null;
        this.promotionService.validateCode(this.promoCode.trim(), this.subtotal).subscribe({
            next: (res) => { this.promoResult = res; this.promoLoading = false; },
            error: () => {
                this.promoResult = { valide: false, message: 'Erreur lors de la vérification du code.' };
                this.promoLoading = false;
            }
        });
    }

    removePromo(): void {
        this.promoCode = '';
        this.promoResult = null;
    }

    // ── Cart items ────────────────────────────────────────────────────────────
    cartItems: CartItem[] = [
        { id: 1, name: "Waterproof Hiking Boots - Men's", image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080', type: 'Purchase', quantity: 2, unitPrice: 143.10 },
        { id: 2, name: 'Camping Cookware Set - 4 Pieces', image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1080', type: 'Rental', rentalDuration: '7 days', quantity: 1, unitPrice: 36.00 }
    ];

    get subtotal(): number {
        return this.cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    }

    shipping = 15.00;
    taxRate = 0.10;

    get tax(): number { return this.subtotal * this.taxRate; }

    get total(): number {
        return Math.max(0, this.subtotal + this.shipping + this.tax - this.discount);
    }

    get pointsToEarn(): number { return Math.floor(this.total); }

    incrementQuantity(item: CartItem) { item.quantity++; }

    decrementQuantity(item: CartItem) { if (item.quantity > 1) item.quantity--; }

    removeItem(item: CartItem) { this.cartItems = this.cartItems.filter(i => i.id !== item.id); }

    clearCart() { this.cartItems = []; this.orderSuccess = false; }

    // ── Payment ───────────────────────────────────────────────────────────────
    selectedPayment: 'wallet' | 'card' = 'wallet';
    walletBalance = 250.00;

    // Card form fields
    cardNumber = '';
    cardName = '';
    cardExpiry = '';
    cardCvv = '';

    payLoading = false;
    orderSuccess = false;
    orderNumber = '';

    get canPayWallet(): boolean {
        return this.walletBalance >= this.total && this.cartItems.length > 0;
    }

    get canPayCard(): boolean {
        return this.cartItems.length > 0 &&
            this.cardNumber.replace(/\s/g, '').length === 16 &&
            this.cardName.trim().length > 0 &&
            this.cardExpiry.length === 5 &&
            this.cardCvv.length >= 3;
    }

    get canPay(): boolean {
        if (this.cartItems.length === 0) return false;
        return this.selectedPayment === 'wallet' ? this.canPayWallet : this.canPayCard;
    }

    get insufficientBalance(): boolean {
        return this.selectedPayment === 'wallet' && this.walletBalance < this.total && this.cartItems.length > 0;
    }

    formatCardNumber(event: Event): void {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '').substring(0, 16);
        this.cardNumber = value.replace(/(.{4})/g, '$1 ').trim();
    }

    formatExpiry(event: Event): void {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '').substring(0, 4);
        if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2);
        this.cardExpiry = value;
    }

    pay(): void {
        if (!this.canPay) return;
        this.payLoading = true;

        setTimeout(() => {
            if (this.selectedPayment === 'wallet') {
                this.walletBalance -= this.total;
            }
            this.orderNumber = 'CC-' + Date.now().toString().slice(-8);
            this.orderSuccess = true;
            this.payLoading = false;
            this.cartItems = [];
            this.promoCode = '';
            this.promoResult = null;
        }, 1500);
    }

    goBack() { this.location.back(); }
}
