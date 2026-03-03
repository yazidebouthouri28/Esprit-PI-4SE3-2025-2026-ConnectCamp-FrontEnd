import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl
} from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { WalletService } from '../../services/wallet.service';
import { CartItem } from '../../models/api.models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  cartItems: CartItem[] = [];
  walletBalance = 0;
  shipping = 15.00;
  taxRate = 0.10;
  selectedPaymentMethod: 'wallet' | 'card' = 'wallet';
  orderSuccess = false;
  orderId: string = '';
  isLoading = false;

  checkoutForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private location: Location,
    private router: Router,
    private cartService: CartService,
    private walletService: WalletService
  ) {}

  ngOnInit(): void {
    // Load cart items
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      if (items.length === 0 && !this.orderSuccess) {
        this.router.navigate(['/cart']);
      }
    });

    // Load wallet balance
    this.walletService.getBalance().subscribe(data => {
      this.walletBalance = data.balance;
    });

    // Build form
    this.checkoutForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', Validators.required],
      paymentMethod: ['wallet', Validators.required],
      // Card fields (conditionally required)
      cardNumber: [''],
      cardExpiry: [''],
      cardCvv: [''],
      cardHolder: ['']
    });

    // Watch payment method changes
    this.checkoutForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      this.selectedPaymentMethod = method;
      this.updateCardValidators(method);
    });
  }

  // ── Validators dynamiques pour la carte ──────────────────────────────────

  updateCardValidators(method: string): void {
    const cardNumber = this.checkoutForm.get('cardNumber');
    const cardExpiry = this.checkoutForm.get('cardExpiry');
    const cardCvv   = this.checkoutForm.get('cardCvv');
    const cardHolder = this.checkoutForm.get('cardHolder');

    if (method === 'card') {
      cardNumber?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
      cardExpiry?.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
      cardCvv?.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
      cardHolder?.setValidators([Validators.required, Validators.minLength(3)]);
    } else {
      cardNumber?.clearValidators();
      cardExpiry?.clearValidators();
      cardCvv?.clearValidators();
      cardHolder?.clearValidators();
    }

    cardNumber?.updateValueAndValidity();
    cardExpiry?.updateValueAndValidity();
    cardCvv?.updateValueAndValidity();
    cardHolder?.updateValueAndValidity();
  }

  // ── Getters pour accès facile dans le template ────────────────────────────

  get f(): { [key: string]: AbstractControl } {
    return this.checkoutForm.controls;
  }

  get subtotal(): number {
    return this.cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
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

  get hasInsufficientBalance(): boolean {
    return this.selectedPaymentMethod === 'wallet' && this.walletBalance < this.total;
  }

  // ── Helpers pour afficher les erreurs ────────────────────────────────────

  isFieldInvalid(field: string): boolean {
    const control = this.checkoutForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.checkoutForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required'])   return 'This field is required.';
    if (control.errors['email'])      return 'Please enter a valid email address.';
    if (control.errors['minlength'])  return `Minimum ${control.errors['minlength'].requiredLength} characters required.`;
    if (control.errors['pattern']) {
      if (field === 'phone')       return 'Phone must be 8 digits.';
      if (field === 'cardNumber')  return 'Card number must be 16 digits.';
      if (field === 'cardExpiry')  return 'Format must be MM/YY.';
      if (field === 'cardCvv')     return 'CVV must be 3 or 4 digits.';
    }
    return 'Invalid value.';
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goBack(): void {
    this.location.back();
  }

  // ── Soumission ────────────────────────────────────────────────────────────

  placeOrder(): void {
    // Marquer tous les champs comme touchés pour afficher les erreurs
    this.checkoutForm.markAllAsTouched();

    if (this.checkoutForm.invalid) return;
    if (this.hasInsufficientBalance) return;

    this.isLoading = true;

    // Simuler un appel API
    setTimeout(() => {
      this.cartService.clearCart().subscribe(() => {
        this.orderId = `ORD-${Date.now()}`;
        this.orderSuccess = true;
        this.isLoading = false;
      });
    }, 1500);
  }

  // ── Format de numéro de carte ─────────────────────────────────────────────

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 16);
    this.checkoutForm.get('cardNumber')?.setValue(input.value, { emitEvent: false });
  }

  formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 3) value = value.slice(0, 2) + '/' + value.slice(2);
    input.value = value;
    this.checkoutForm.get('cardExpiry')?.setValue(value, { emitEvent: false });
  }
}
