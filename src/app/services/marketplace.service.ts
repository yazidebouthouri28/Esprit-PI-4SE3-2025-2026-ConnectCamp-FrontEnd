import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, WalletTransaction } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$: Observable<CartItem[]> = this.cartSubject.asObservable();

  private walletBalance = 250.00;
  private walletSubject = new BehaviorSubject<number>(this.walletBalance);
  public wallet$: Observable<number> = this.walletSubject.asObservable();

  private loyaltyPoints = 1450;
  private pointsSubject = new BehaviorSubject<number>(this.loyaltyPoints);
  public points$: Observable<number> = this.pointsSubject.asObservable();

  private transactions: WalletTransaction[] = [
    {
      id: 1,
      type: 'debit',
      amount: 149.99,
      description: 'Purchase: Premium Sleeping Bag',
      date: '2026-02-14',
      status: 'completed'
    },
    {
      id: 2,
      type: 'credit',
      amount: 200.00,
      description: 'Wallet Top-up',
      date: '2026-02-10',
      status: 'completed'
    }
  ];
  private transactionsSubject = new BehaviorSubject<WalletTransaction[]>(this.transactions);
  public transactions$: Observable<WalletTransaction[]> = this.transactionsSubject.asObservable();

  constructor() {
    // Load from localStorage if available
    this.loadFromStorage();
  }

  // ========== CART MANAGEMENT ==========
  addToCart(item: CartItem): void {
    const existingItem = this.cartItems.find(
      i => i.productId === item.productId && i.type === item.type
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.cartItems.push(item);
    }

    this.cartSubject.next([...this.cartItems]);
    this.saveToStorage();
  }

  removeFromCart(productId: number, type: 'purchase' | 'rental'): void {
    this.cartItems = this.cartItems.filter(
      item => !(item.productId === productId && item.type === type)
    );
    this.cartSubject.next([...this.cartItems]);
    this.saveToStorage();
  }

  updateQuantity(productId: number, type: 'purchase' | 'rental', quantity: number): void {
    const item = this.cartItems.find(
      i => i.productId === productId && i.type === type
    );
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        this.removeFromCart(productId, type);
      } else {
        this.cartSubject.next([...this.cartItems]);
        this.saveToStorage();
      }
    }
  }

  clearCart(): void {
    this.cartItems = [];
    this.cartSubject.next([]);
    this.saveToStorage();
  }

  getCartTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  // ========== WALLET MANAGEMENT ==========
  addFunds(amount: number, description: string = 'Wallet Top-up'): void {
    this.walletBalance += amount;
    this.walletSubject.next(this.walletBalance);

    const transaction: WalletTransaction = {
      id: this.transactions.length + 1,
      type: 'credit',
      amount: amount,
      description: description,
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    };

    this.transactions.unshift(transaction);
    this.transactionsSubject.next([...this.transactions]);
    this.saveToStorage();
  }

  deductFunds(amount: number, description: string): void {
    if (this.walletBalance >= amount) {
      this.walletBalance -= amount;
      this.walletSubject.next(this.walletBalance);

      const transaction: WalletTransaction = {
        id: this.transactions.length + 1,
        type: 'debit',
        amount: amount,
        description: description,
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
      };

      this.transactions.unshift(transaction);
      this.transactionsSubject.next([...this.transactions]);
      this.saveToStorage();
    } else {
      throw new Error('Insufficient balance');
    }
  }

  getWalletBalance(): number {
    return this.walletBalance;
  }

  // ========== LOYALTY POINTS ==========
  addPoints(points: number): void {
    this.loyaltyPoints += points;
    this.pointsSubject.next(this.loyaltyPoints);
    this.saveToStorage();
  }

  deductPoints(points: number): boolean {
    if (this.loyaltyPoints >= points) {
      this.loyaltyPoints -= points;
      this.pointsSubject.next(this.loyaltyPoints);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getLoyaltyPoints(): number {
    return this.loyaltyPoints;
  }

  // ========== CHECKOUT ==========
  checkout(paymentMethod: 'wallet' | 'card'): { success: boolean; orderId?: number; message: string } {
    const total = this.getCartTotal();
    const shippingCost = 15.00;
    const tax = total * 0.1;
    const grandTotal = total + shippingCost + tax;

    if (paymentMethod === 'wallet') {
      if (this.walletBalance < grandTotal) {
        return {
          success: false,
          message: 'Insufficient wallet balance'
        };
      }

      this.deductFunds(grandTotal, `Purchase: ${this.cartItems.length} items`);
    }

    // Award loyalty points
    const points = Math.floor(grandTotal);
    this.addPoints(points);

    // Generate order ID
    const orderId = Date.now();

    // Clear cart
    this.clearCart();

    return {
      success: true,
      orderId: orderId,
      message: `Order placed successfully! Earned ${points} points.`
    };
  }

  // ========== STORAGE ==========
  private saveToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(this.cartItems));
      localStorage.setItem('walletBalance', this.walletBalance.toString());
      localStorage.setItem('loyaltyPoints', this.loyaltyPoints.toString());
      localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const cart = localStorage.getItem('cart');
      if (cart) {
        this.cartItems = JSON.parse(cart);
        this.cartSubject.next([...this.cartItems]);
      }

      const balance = localStorage.getItem('walletBalance');
      if (balance) {
        this.walletBalance = parseFloat(balance);
        this.walletSubject.next(this.walletBalance);
      }

      const points = localStorage.getItem('loyaltyPoints');
      if (points) {
        this.loyaltyPoints = parseInt(points);
        this.pointsSubject.next(this.loyaltyPoints);
      }

      const transactions = localStorage.getItem('transactions');
      if (transactions) {
        this.transactions = JSON.parse(transactions);
        this.transactionsSubject.next([...this.transactions]);
      }
    }
  }
}
