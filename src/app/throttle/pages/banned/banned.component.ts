import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, takeUntil, Subject } from 'rxjs';

@Component({
  selector: 'app-banned',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banned.component.html',
  styleUrls: ['./banned.component.scss']
})
export class BannedComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Signals
  readonly banType = signal<'SOFT' | 'HARD'>('SOFT');
  readonly banReason = signal<string>('');
  readonly expiresAt = signal<string | null>(null);
  readonly remainingTime = signal<string>('');
  readonly isExpired = signal<boolean>(false);
  
  // Computed
  readonly isSoftBan = computed(() => this.banType() === 'SOFT');
  readonly isHardBan = computed(() => this.banType() === 'HARD');

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get ban details from query params
    this.route.queryParams.subscribe(params => {
      this.banType.set(params['type'] || 'SOFT');
      this.banReason.set(params['reason'] || 'Account suspended due to unusual activity');
      this.expiresAt.set(params['expiresAt'] || null);
      
      if (this.isSoftBan() && this.expiresAt()) {
        this.startCountdown();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startCountdown(): void {
    // Update countdown every second
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateRemainingTime();
      });
    
    // Initial update
    this.updateRemainingTime();
  }

  private updateRemainingTime(): void {
    const expires = this.expiresAt();
    if (!expires) return;
    
    const now = new Date().getTime();
    const expiresTime = new Date(expires).getTime();
    const diff = expiresTime - now;
    
    if (diff <= 0) {
      this.remainingTime.set('Expired');
      this.isExpired.set(true);
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    let timeString = '';
    if (days > 0) {
      timeString += `${days}d `;
    }
    if (hours > 0 || days > 0) {
      timeString += `${hours}h `;
    }
    if (minutes > 0 || hours > 0 || days > 0) {
      timeString += `${minutes}m `;
    }
    timeString += `${seconds}s`;
    
    this.remainingTime.set(timeString);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  contactSupport(): void {
    // In a real app, this would open a support form or email client
    window.location.href = 'mailto:support@connectcamp.com?subject=Account Ban Appeal';
  }

  refreshStatus(): void {
    // Reload the page to check if ban has been lifted
    window.location.reload();
  }
}
