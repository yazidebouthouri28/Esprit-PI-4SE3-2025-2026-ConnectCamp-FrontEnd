import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

interface CarouselSlide {
  headline: string;
  description: string;
  image: string;
}

// Maps frontend display roles → backend enum values
const ROLE_TO_BACKEND: Record<string, string> = {
  'CLIENT':    'USER',
  'CAMPER':    'PARTICIPANT',
  'SELLER':    'SELLER',
  'ORGANIZER': 'ORGANIZER',
  'SPONSOR':   'SPONSOR',
  'ADMIN':     'ADMIN'
};

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit, OnDestroy {
  isLogin = signal(true);
  logoError = false;
  currentYear = new Date().getFullYear();

  // Login
  loginEmail = '';
  loginPassword = '';
  loginError = '';
  isLoginLoading = false;

  // Signup
  signupName = '';
  signupEmail = '';
  signupUsername = '';
  signupPhone = '';
  signupGender = '';
  signupDob = '';
  signupPassword = '';
  signupConfirmPassword = '';
  signupRole = 'CAMPER';
  signupError = '';
  signupSuccess = '';
  isSignupLoading = false;

  showLoginPassword = false;
  showSignupPassword = false;
  showSignupConfirm = false;

  returnUrl = '/';

  private carouselInterval: ReturnType<typeof setInterval> | null = null;
  readonly CAROUSEL_INTERVAL_MS = 5000;

  currentSlide = 0;
  carouselSlides: CarouselSlide[] = [
    {
      headline: 'Discover unforgettable camping experiences',
      description: 'Connect with nature, find the perfect campsite, and join a community of outdoor enthusiasts who share your passion for adventure.',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1200',
    },
    {
      headline: 'Book campsites and join events',
      description: 'From family weekends to backcountry trips—browse, book, and get tickets for workshops and camping events near you.',
      image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1200',
    },
    {
      headline: 'Gear up at the marketplace',
      description: 'Buy or rent quality camping equipment and earn loyalty points on every purchase. Everything you need for your next trip.',
      image: 'https://images.unsplash.com/photo-1627820988643-8077d82eed7d?q=80&w=1200',
    },
  ];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  get slide(): CarouselSlide {
    return this.carouselSlides[this.currentSlide];
  }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
    this.carouselInterval = setInterval(() => this.nextSlide(), this.CAROUSEL_INTERVAL_MS);
  }

  ngOnDestroy() {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.carouselSlides.length;
  }

  switchToSignup() { this.isLogin.set(false); }
  switchToLogin()  { this.isLogin.set(true);  }

  // ── Login ─────────────────────────────────────────────────────────────────
  onSubmitLogin() {
    this.loginError = '';
    if (!this.loginEmail || !this.loginPassword) {
      this.loginError = 'Please fill in all fields.';
      return;
    }
    this.isLoginLoading = true;
    this.authService.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: (auth) => {
        this.cartService.syncCartAfterLogin();
        if (auth.user.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate([this.returnUrl || '/home']);
        }
      },
      error: (err) => {
        this.isLoginLoading = false;
        this.loginError = err.message || 'Invalid email or password.';
      }
    });
  }

  // ── Signup ────────────────────────────────────────────────────────────────
  onSubmitSignup() {
    this.signupError = '';
    this.signupSuccess = '';

    if (!this.signupName || !this.signupEmail || !this.signupPassword) {
      this.signupError = 'Please fill in all required fields.';
      return;
    }
    if (this.signupPassword !== this.signupConfirmPassword) {
      this.signupError = 'Passwords do not match.';
      return;
    }
    if (this.signupPassword.length < 6) {
      this.signupError = 'Password must be at least 6 characters.';
      return;
    }

    // Auto-generate username from name if not provided
    const username = this.signupUsername ||
      this.signupName.toLowerCase().replace(/\s+/g, '.') + Math.floor(Math.random() * 100);

    const backendRole = ROLE_TO_BACKEND[this.signupRole] || 'PARTICIPANT';

    const payload: any = {
      name:     this.signupName,
      username: username,
      email:    this.signupEmail,
      password: this.signupPassword,
      role:     backendRole,
      isSeller: this.signupRole === 'SELLER',
      isBuyer:  true,
      avatar:   'avatar.png'
    };
    if (this.signupPhone)  payload.phone  = this.signupPhone;
    if (this.signupGender) payload.gender = this.signupGender;

    this.isSignupLoading = true;
    this.authService.register(payload).subscribe({
      next: () => {
        this.signupSuccess = 'Account created! Redirecting…';
        this.cartService.syncCartAfterLogin();
        setTimeout(() => this.router.navigate(['/home']), 1200);
      },
      error: (err) => {
        this.isSignupLoading = false;
        this.signupError = err.message || 'Registration failed. Please try again.';
      }
    });
  }
}