import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { User } from '../../models/api.models';

// ✅ Derive role type from User interface — no separate UserRole export needed
type UserRole = User['role'];

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">

        <div class="auth-header">
          <h2>{{ isLoginMode ? 'Welcome Back' : 'Create Account' }}</h2>
          <p>{{ isLoginMode ? 'Sign in to continue' : 'Join our camping community' }}</p>
        </div>

        <div class="auth-tabs">
          <button [class.active]="isLoginMode"  (click)="isLoginMode = true;  clearMessages()">Login</button>
          <button [class.active]="!isLoginMode" (click)="isLoginMode = false; clearMessages()">Register</button>
        </div>

        <div *ngIf="errorMessage"   class="error-message">  <span>⚠️</span> {{ errorMessage }}</div>
        <div *ngIf="successMessage" class="success-message"><span>✅</span> {{ successMessage }}</div>

        <!-- LOGIN FORM -->
        <form *ngIf="isLoginMode" (ngSubmit)="login()" class="auth-form">
          <div class="form-group">
            <label>Email or Username</label>
            <input type="text" [(ngModel)]="loginForm.email" name="email" placeholder="your@email.com" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="loginForm.password" name="password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="submit-btn" [disabled]="isLoading">
            {{ isLoading ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>

        <!-- REGISTER FORM -->
        <form *ngIf="!isLoginMode" (ngSubmit)="register()" class="auth-form">

          <div class="form-row">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" [(ngModel)]="registerForm.name" name="name" placeholder="John Doe" required>
            </div>
            <div class="form-group">
              <label>Username *</label>
              <input type="text" [(ngModel)]="registerForm.username" name="username" placeholder="johndoe" required minlength="3">
            </div>
          </div>

          <div class="form-group">
            <label>Email *</label>
            <input type="email" [(ngModel)]="registerForm.email" name="email" placeholder="your@email.com" required>
          </div>

          <div class="form-group">
            <label>Password *</label>
            <input type="password" [(ngModel)]="registerForm.password" name="password" placeholder="••••••••" required minlength="6">
          </div>

          <!-- Role Selection -->
          <div class="form-group role-selection">
            <label class="role-label">Select Your Role *</label>
            <p class="role-hint">Choose the role that best describes how you'll use CampConnect</p>
            <div class="role-options">

              <label class="role-option" [class.selected]="registerForm.role === 'CLIENT'">
                <input type="radio" name="role" value="CLIENT" [(ngModel)]="registerForm.role" (change)="onRoleChange()">
                <div class="role-content">
                  <span class="role-icon">🛒</span>
                  <span class="role-name">Client</span>
                  <span class="role-desc">Shop products, book campsites</span>
                </div>
              </label>

              <label class="role-option" [class.selected]="registerForm.role === 'SELLER'">
                <input type="radio" name="role" value="SELLER" [(ngModel)]="registerForm.role" (change)="onRoleChange()">
                <div class="role-content">
                  <span class="role-icon">🏪</span>
                  <span class="role-name">Seller</span>
                  <span class="role-desc">Sell camping gear</span>
                </div>
              </label>

              <label class="role-option" [class.selected]="registerForm.role === 'ORGANIZER'">
                <input type="radio" name="role" value="ORGANIZER" [(ngModel)]="registerForm.role" (change)="onRoleChange()">
                <div class="role-content">
                  <span class="role-icon">📅</span>
                  <span class="role-name">Organizer</span>
                  <span class="role-desc">Create camping events</span>
                </div>
              </label>

              <label class="role-option" [class.selected]="registerForm.role === 'SPONSOR'">
                <input type="radio" name="role" value="SPONSOR" [(ngModel)]="registerForm.role" (change)="onRoleChange()">
                <div class="role-content">
                  <span class="role-icon">🤝</span>
                  <span class="role-name">Sponsor</span>
                  <span class="role-desc">Sponsor events</span>
                </div>
              </label>

              <label class="role-option" [class.selected]="registerForm.role === 'CAMPER'">
                <input type="radio" name="role" value="CAMPER" [(ngModel)]="registerForm.role" (change)="onRoleChange()">
                <div class="role-content">
                  <span class="role-icon">⛺</span>
                  <span class="role-name">Camper</span>
                  <span class="role-desc">Find campsites</span>
                </div>
              </label>

            </div>
          </div>

          <!-- Seller store name -->
          <div *ngIf="registerForm.role === 'SELLER'" class="seller-extras">
            <div class="section-title">🏪 Seller Details</div>
            <div class="form-group">
              <label>Store Name</label>
              <input type="text" [(ngModel)]="registerForm.storeName" name="storeName" placeholder="My Outdoor Store">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" [(ngModel)]="registerForm.phone" name="phone" placeholder="+1 234 567 8900">
            </div>
            <div class="form-group">
              <label>Age</label>
              <input type="number" [(ngModel)]="registerForm.age" name="age" placeholder="25" min="13" max="120">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Address</label>
              <input type="text" [(ngModel)]="registerForm.address" name="address" placeholder="123 Main St">
            </div>
            <div class="form-group">
              <label>Country</label>
              <select [(ngModel)]="registerForm.country" name="country">
                <option value="">Select country</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Australia">Australia</option>
                <option value="Tunisia">Tunisia</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Bio <span class="optional">(optional)</span></label>
            <textarea [(ngModel)]="registerForm.bio" name="bio" placeholder="Tell us about yourself…" rows="2"></textarea>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="registerForm.isBuyer" name="isBuyer">
              <span>I also want to buy products on the platform</span>
            </label>
          </div>

          <button type="submit" class="submit-btn" [disabled]="isLoading">
            {{ isLoading ? 'Creating account…' : 'Create Account' }}
          </button>
        </form>

        <div class="auth-footer">
          <a routerLink="/">← Back to Home</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px;
    }
    .auth-card {
      background: rgba(255,255,255,0.05); border-radius: 20px; padding: 40px;
      width: 100%; max-width: 620px; backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .auth-header { text-align: center; margin-bottom: 30px; }
    .auth-header h2 { color: #fff; font-size: 28px; margin-bottom: 8px; }
    .auth-header p  { color: rgba(255,255,255,0.6); }
    .auth-tabs { display: flex; gap: 10px; margin-bottom: 25px; }
    .auth-tabs button {
      flex: 1; padding: 12px; border: none; border-radius: 10px;
      background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); cursor: pointer;
    }
    .auth-tabs button.active { background: linear-gradient(135deg,#10b981,#059669); color:#fff; }
    .error-message {
      background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.5);
      color: #fca5a5; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px;
      display: flex; align-items: center; gap: 8px;
    }
    .success-message {
      background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.5);
      color: #6ee7b7; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px;
      display: flex; align-items: center; gap: 8px;
    }
    .auth-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 15px; }
    .form-row .form-group { flex: 1; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { color: rgba(255,255,255,0.8); font-size: 14px; }
    .optional { color: rgba(255,255,255,0.4); font-size: 12px; }
    .form-group input, .form-group select, .form-group textarea {
      padding: 14px 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
      background: rgba(255,255,255,0.05); color: #fff; font-size: 15px;
      transition: all 0.3s; font-family: inherit;
    }
    .form-group textarea { resize: vertical; }
    .form-group select option { background: #1a1a2e; color: #fff; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none; border-color: #10b981; background: rgba(255,255,255,0.1);
    }
    .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(255,255,255,0.3); }
    .role-selection {
      padding: 20px; background: rgba(255,255,255,0.03);
      border-radius: 15px; border: 1px solid rgba(255,255,255,0.1);
    }
    .role-label { font-size: 15px !important; font-weight: 600; color: #fff !important; }
    .role-hint  { color: rgba(255,255,255,0.5); font-size: 13px; margin-bottom: 15px; }
    .role-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px,1fr)); gap: 10px; }
    .role-option { position: relative; cursor: pointer; }
    .role-option input { position: absolute; opacity: 0; width: 0; height: 0; }
    .role-content {
      display: flex; flex-direction: column; align-items: center;
      padding: 15px 10px; background: rgba(255,255,255,0.05);
      border: 2px solid transparent; border-radius: 12px; transition: all 0.3s; text-align: center;
    }
    .role-option:hover .role-content { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
    .role-option.selected .role-content { background: rgba(16,185,129,0.2); border-color: #10b981; }
    .role-icon { font-size: 28px; margin-bottom: 8px; }
    .role-name { color: #fff; font-weight: 600; font-size: 14px; }
    .role-desc { color: rgba(255,255,255,0.5); font-size: 11px; margin-top: 4px; line-height: 1.3; }
    .seller-extras {
      padding: 16px; background: rgba(16,185,129,0.08);
      border: 1px solid rgba(16,185,129,0.3); border-radius: 12px;
    }
    .section-title { color: #10b981; font-weight: 600; margin-bottom: 12px; }
    .checkbox-group { flex-direction: row; align-items: center; }
    .checkbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; color: rgba(255,255,255,0.8); }
    .checkbox-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: #10b981; cursor: pointer; padding: 0; }
    .submit-btn {
      padding: 16px; border: none; border-radius: 10px;
      background: linear-gradient(135deg,#10b981,#059669);
      color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s;
    }
    .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(16,185,129,0.3); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .auth-footer { margin-top: 25px; text-align: center; }
    .auth-footer a { color: rgba(255,255,255,0.6); text-decoration: none; }
    .auth-footer a:hover { color: #10b981; }
    @media (max-width: 500px) {
      .form-row { flex-direction: column; gap: 16px; }
      .role-options { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class AuthComponent implements OnInit {

  isLoginMode    = true;
  isLoading      = false;
  errorMessage   = '';
  successMessage = '';
  returnUrl      = '/';

  loginForm = { email: '', password: '' };

  registerForm = {
    name:      '',
    username:  '',
    email:     '',
    password:  '',
    phone:     '',
    address:   '',
    country:   '',
    age:       null as number | null,
    role:      'CLIENT' as UserRole,
    isSeller:  false,
    isBuyer:   true,
    storeName: '',
    bio:       ''
  };

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    if (this.router.url.includes('register')) this.isLoginMode = false;
    if (this.authService.isAuthenticated()) this.router.navigate([this.returnUrl]);
  }

  onRoleChange(): void {
    this.registerForm.isSeller = this.registerForm.role === 'SELLER';
  }

  login(): void {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.errorMessage = 'Please fill in all fields'; return;
    }
    this.isLoading = true;
    this.clearMessages();
    this.authService.login(this.loginForm).subscribe({
      next: () => { this.cartService.syncCartAfterLogin(); this.router.navigate([this.returnUrl]); },
      error: (err) => { this.isLoading = false; this.errorMessage = err.message || 'Login failed.'; }
    });
  }

  register(): void {
    if (!this.registerForm.name || !this.registerForm.username ||
      !this.registerForm.email || !this.registerForm.password) {
      this.errorMessage = 'Please fill in all required fields'; return;
    }
    if (this.registerForm.username.length < 3) { this.errorMessage = 'Username must be at least 3 characters'; return; }
    if (this.registerForm.password.length < 6)  { this.errorMessage = 'Password must be at least 6 characters'; return; }

    this.isLoading = true;
    this.clearMessages();

    const payload: any = {
      name:     this.registerForm.name,
      username: this.registerForm.username,
      email:    this.registerForm.email,
      password: this.registerForm.password,
      role:     this.registerForm.role,
      isSeller: this.registerForm.role === 'SELLER',
      isBuyer:  this.registerForm.isBuyer,
      avatar:   'avatar.png'
    };
    if (this.registerForm.phone)     payload.phone     = this.registerForm.phone;
    if (this.registerForm.address)   payload.address   = this.registerForm.address;
    if (this.registerForm.country)   payload.country   = this.registerForm.country;
    if (this.registerForm.age)       payload.age       = this.registerForm.age;
    if (this.registerForm.storeName) payload.storeName = this.registerForm.storeName;
    if (this.registerForm.bio)       payload.bio       = this.registerForm.bio;

    this.authService.register(payload).subscribe({
      next: () => {
        this.successMessage = 'Account created! Redirecting…';
        this.cartService.syncCartAfterLogin();
        setTimeout(() => this.router.navigate([this.returnUrl]), 1200);
      },
      error: (err) => { this.isLoading = false; this.errorMessage = err.message || 'Registration failed.'; }
    });
  }

  clearMessages(): void { this.errorMessage = ''; this.successMessage = ''; }
}
