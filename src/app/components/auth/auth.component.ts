import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { User } from '../../models/api.models';

type UserRole = User['role'];

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, OnDestroy {

  isLoginMode = true;
  isForgotPasswordMode = false;
  isSidebarAnimatingOut = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  returnUrl = '/';

  showLoginPassword = false;
  showSignupPassword = false;
  showResetPassword = false;

  currentYear = new Date().getFullYear();

  stars: { id: number; x: number; y: number }[] = [];
  private starIdCounter = 0;
  private campfireAudio: HTMLAudioElement | null = null;
  private owlAudio: HTMLAudioElement | null = null;
  private cricketAudio: HTMLAudioElement | null = null;
  private readonly isBrowser = typeof window !== 'undefined';
  private removeAudioUnlockListeners: (() => void) | null = null;

  loginForm = { email: '', password: '' };
  forgotPasswordForm = { email: '', code: '', newPassword: '' };

  registerForm = {
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    country: '',
    age: null as number | null,
    role: 'CAMPER' as string,              // default changed from CLIENT to CAMPER
    isSeller: false,
    isBuyer: true,
    storeName: '',
    bio: ''
  };

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    if (this.router.url.includes('register')) this.isLoginMode = false;
    if (this.router.url.includes('forgot-password')) {
      this.isLoginMode = true;
      this.isForgotPasswordMode = true;
    }
    if (this.authService.isAuthenticated()) this.router.navigate([this.returnUrl]);
    if (this.isBrowser) {
      this.initCampfireAudio();
      this.startAmbientAudio();
    }
  }

  ngOnDestroy(): void {
    if (this.removeAudioUnlockListeners) {
      this.removeAudioUnlockListeners();
      this.removeAudioUnlockListeners = null;
    }
    if (this.campfireAudio) {
      this.campfireAudio.pause();
      this.campfireAudio = null;
    }
    if (this.owlAudio) {
      this.owlAudio.pause();
      this.owlAudio = null;
    }
    if (this.cricketAudio) {
      this.cricketAudio.pause();
      this.cricketAudio = null;
    }
  }

  switchToSignup(): void {
    this.isForgotPasswordMode = false;
    this.animateSidebarSwitch(false);
  }

  switchToLogin(): void {
    this.isForgotPasswordMode = false;
    this.animateSidebarSwitch(true);
  }

  switchToForgotPassword(): void {
    this.isForgotPasswordMode = true;
    this.isLoginMode = true;
    this.clearMessages();
    this.forgotPasswordForm.email = this.loginForm.email || '';
    this.forgotPasswordForm.code = '';
    this.forgotPasswordForm.newPassword = '';
  }

  backToLoginFromForgot(): void {
    this.isForgotPasswordMode = false;
    this.showResetPassword = false;
    this.clearMessages();
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
      next: (auth) => {
        this.isLoading = false;
        const role = auth.user.role;
        if (role === 'ADMIN') {
          this.router.navigate(['/admin']);
          return;
        }
        if (this.authService.hasCompletedPreferences(auth.user)) {
          this.router.navigate(['/home']);
        } else {
          this.router.navigate(['/preferences']);
        }
        this.cartService.syncCartAfterLogin();
      },
      error: (err) => { this.isLoading = false; this.errorMessage = err.message || 'Login failed.'; }
    });
  }

  register(): void {
    if (!this.registerForm.name || !this.registerForm.username ||
      !this.registerForm.email || !this.registerForm.password) {
      this.errorMessage = 'Please fill in all required fields'; return;
    }
    if (this.registerForm.username.length < 3) { this.errorMessage = 'Username must be at least 3 characters'; return; }
    if (this.registerForm.password.length < 6) { this.errorMessage = 'Password must be at least 6 characters'; return; }

    this.isLoading = true;
    this.clearMessages();

    // Map frontend role to backend Role enum
    const roleMapping: { [key: string]: string } = {
      'SELLER': 'SELLER',
      'ORGANIZER': 'ORGANIZER',
      'SPONSOR': 'SPONSOR',
      'CAMPER': 'PARTICIPANT'
    };
    const backendRole = roleMapping[this.registerForm.role] || 'USER';

    const payload: any = {
      name: this.registerForm.name,
      username: this.registerForm.username,
      email: this.registerForm.email,
      password: this.registerForm.password,
      role: backendRole,
      isSeller: this.registerForm.role === 'SELLER',
      isBuyer: this.registerForm.isBuyer,
      avatar: 'avatar.png'
    };
    if (this.registerForm.phone) payload.phone = this.registerForm.phone;
    if (this.registerForm.address) payload.address = this.registerForm.address;
    if (this.registerForm.country) payload.country = this.registerForm.country;
    if (this.registerForm.age) payload.age = this.registerForm.age;
    if (this.registerForm.storeName) payload.storeName = this.registerForm.storeName;
    if (this.registerForm.bio) payload.bio = this.registerForm.bio;

    this.authService.register(payload).subscribe({
      next: (auth) => {
        this.isLoading = false;
        this.successMessage = 'Account created! Redirecting…';
        const role = auth.user.role;
        if (role === 'ADMIN') {
          setTimeout(() => this.router.navigate(['/admin']), 1200);
          return;
        }
        if (this.authService.hasCompletedPreferences(auth.user)) {
          setTimeout(() => this.router.navigate(['/home']), 1200);
        } else {
          setTimeout(() => this.router.navigate(['/preferences']), 1200);
        }
        this.cartService.syncCartAfterLogin();
      },
      error: (err) => { this.isLoading = false; this.errorMessage = err.message || 'Registration failed.'; }
    });
  }

  sendResetCode(): void {
    if (!this.forgotPasswordForm.email) {
      this.errorMessage = 'Please enter your email.';
      return;
    }
    this.isLoading = true;
    this.clearMessages();
    this.authService.requestPasswordResetCode(this.forgotPasswordForm.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Verification code sent. Check your email.';
        if (response.devCode) {
          this.successMessage = `Verification code sent. Dev code: ${response.devCode}`;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Failed to send verification code.';
      }
    });
  }

  resetPassword(): void {
    if (!this.forgotPasswordForm.email || !this.forgotPasswordForm.code || !this.forgotPasswordForm.newPassword) {
      this.errorMessage = 'Please fill in email, verification code, and new password.';
      return;
    }
    if (this.forgotPasswordForm.newPassword.length < 6) {
      this.errorMessage = 'New password must be at least 6 characters.';
      return;
    }

    this.isLoading = true;
    this.clearMessages();
    this.authService.resetPassword({
      email: this.forgotPasswordForm.email,
      code: this.forgotPasswordForm.code,
      newPassword: this.forgotPasswordForm.newPassword
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password reset successful. You can now sign in.';
        this.loginForm.email = this.forgotPasswordForm.email;
        this.loginForm.password = '';
        this.forgotPasswordForm.code = '';
        this.forgotPasswordForm.newPassword = '';
        this.isForgotPasswordMode = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Password reset failed.';
      }
    });
  }

  clearMessages(): void { this.errorMessage = ''; this.successMessage = ''; }

  private animateSidebarSwitch(targetIsLogin: boolean): void {
    if (this.isLoginMode === targetIsLogin || this.isSidebarAnimatingOut) return;

    this.isSidebarAnimatingOut = true;

    setTimeout(() => {
      this.isLoginMode = targetIsLogin;
      this.clearMessages();

      setTimeout(() => {
        this.isSidebarAnimatingOut = false;
      }, 50);

    }, 400);
  }

  private initCampfireAudio(): void {
    try {
      this.campfireAudio = new Audio(this.publicUrl('Fire Crackling Sound Effect.mp3'));
      this.campfireAudio.loop = true;
      this.campfireAudio.volume = 0.4;
      this.owlAudio = new Audio(this.publicUrl('Sound Effects - Owl Hooting Noise.mp3'));
      this.owlAudio.loop = true;
      this.owlAudio.volume = 0.25;
      this.cricketAudio = new Audio(this.publicUrl('Cricket  Sound Effect.mp3'));
      this.cricketAudio.loop = true;
      this.cricketAudio.volume = 0.02;
    } catch {
      this.campfireAudio = null;
      this.owlAudio = null;
      this.cricketAudio = null;
    }
  }

  private publicUrl(fileName: string): string {
    return encodeURI(`assets/${fileName}`);
  }

  private startAmbientAudio(): void {
    this.tryPlayAmbient().then((played) => {
      if (played) return;
      this.installAudioUnlockListeners();
    });
  }

  private async tryPlayAmbient(): Promise<boolean> {
    const tasks: Promise<unknown>[] = [];
    if (this.campfireAudio) tasks.push(this.campfireAudio.play());
    if (this.owlAudio) tasks.push(this.owlAudio.play());
    if (this.cricketAudio) tasks.push(this.cricketAudio.play());
    if (tasks.length === 0) return false;

    const results = await Promise.allSettled(tasks);
    return results.some((r) => r.status === 'fulfilled');
  }

  private installAudioUnlockListeners(): void {
    if (!this.isBrowser || this.removeAudioUnlockListeners) return;

    const handler = async () => {
      const played = await this.tryPlayAmbient();
      if (played && this.removeAudioUnlockListeners) {
        this.removeAudioUnlockListeners();
        this.removeAudioUnlockListeners = null;
      }
    };

    window.addEventListener('pointerdown', handler, { passive: true });
    window.addEventListener('keydown', handler);
    window.addEventListener('touchstart', handler, { passive: true });

    this.removeAudioUnlockListeners = () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('touchstart', handler);
    };
  }

  onCampfireMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const baseX = event.clientX - rect.left;
    const baseY = event.clientY - rect.top;

    const STARS_PER_MOVE = 4;
    const RADIUS_MIN = 6;
    const RADIUS_MAX = 18;

    for (let i = 0; i < STARS_PER_MOVE; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN);
      const x = baseX + Math.cos(angle) * radius;
      const y = baseY + Math.sin(angle) * radius;

      const id = ++this.starIdCounter;
      this.stars.push({ id, x, y });

      setTimeout(() => {
        this.stars = this.stars.filter(star => star.id !== id);
      }, 700);
    }
  }
}
