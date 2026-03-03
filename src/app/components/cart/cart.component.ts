import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/api.models';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
    cartItems: CartItem[] = [];
    walletBalance = 250.00;
    shipping = 15.00;
    taxRate = 0.10;

    constructor(
        private location: Location,
        private router: Router,
        private cartService: CartService
    ) {}

    ngOnInit(): void {
        // Subscribe to cart updates
        this.cartService.cart$.subscribe(items => {
            this.cartItems = items;
        });
    }

    goBack() {
        this.location.back();
    }

    get subtotal(): number {
        return this.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }

    get tax(): number {
        return this.subtotal * this.taxRate;
    }

    get total(): number {
        return this.subtotal + this.shipping + this.tax;
    }

    get pointsToEarn(): number {
        return Math.floor(this.total);
    }

    incrementQuantity(item: CartItem) {
        this.cartService.updateQuantity(item.productId, item.quantity + 1).subscribe();
    }

    decrementQuantity(item: CartItem) {
        if (item.quantity > 1) {
            this.cartService.updateQuantity(item.productId, item.quantity - 1).subscribe();
        }
    }

    removeItem(item: CartItem) {
        this.cartService.removeFromCart(item.productId).subscribe();
    }

    clearCart() {
        if (confirm('Are you sure you want to clear your cart?')) {
            this.cartService.clearCart().subscribe();
        }
    }

    proceedToCheckout() {
        this.router.navigate(['/cart']);
    }
}
