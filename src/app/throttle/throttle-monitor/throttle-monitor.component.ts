import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, takeUntil, Subject } from 'rxjs';
import { ThrottleService, ThrottleStatus } from '../services/throttle.service';

@Component({
  selector: 'app-throttle-monitor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './throttle-monitor.component.html',
  styleUrls: ['./throttle-monitor.component.scss']
})
export class ThrottleMonitorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Signals for reactive state
  readonly selectedUserId = signal<number>(1);
  readonly throttleStatus = signal<ThrottleStatus | null>(null);
  readonly bannedUsers = signal<ThrottleStatus[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string>('');
  readonly systemStats = signal<string>('');
  
  // Form input signals
  readonly tempThreshold = signal<number>(10);
  readonly tempReduction = signal<number>(10);
  
  // Computed signals
  readonly statusColor = computed(() => {
    const status = this.throttleStatus()?.status;
    switch (status) {
      case 'NORMAL': return '#10b981'; // green
      case 'WARNING': return '#f59e0b'; // orange
      case 'BLOCKED': return '#ef4444'; // red
      case 'BANNED': return '#000000'; // black
      default: return '#6b7280'; // gray
    }
  });
  
  readonly statusIcon = computed(() => {
    const status = this.throttleStatus()?.status;
    switch (status) {
      case 'NORMAL': return '🟢';
      case 'WARNING': return '🟡';
      case 'BLOCKED': return '🔴';
      case 'BANNED': return '⛔';
      default: return '⚪';
    }
  });
  
  readonly progressPercentage = computed(() => {
    const status = this.throttleStatus();
    if (!status) return 0;
    return Math.min(100, (status.currentCount / status.threshold) * 100);
  });
  
  readonly progressColor = computed(() => {
    const percentage = this.progressPercentage();
    if (percentage >= 100) return '#ef4444'; // red
    if (percentage >= 80) return '#f59e0b'; // orange
    return '#10b981'; // green
  });

  constructor(private throttleService: ThrottleService) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.loadThrottleStatus();
    this.loadBannedUsers();
    this.loadSystemStats();
  }

  private startPolling(): void {
    // Poll every 1000ms
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadThrottleStatus();
        this.loadBannedUsers();
      });
  }

  loadThrottleStatus(): void {
    this.loading.set(true);
    this.error.set('');
    
    this.throttleService.getThrottleStatus(this.selectedUserId())
      .subscribe({
        next: (status) => {
          this.throttleStatus.set(status);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load throttle status');
          this.loading.set(false);
          console.error('Error loading throttle status:', err);
        }
      });
  }

  loadBannedUsers(): void {
    this.throttleService.getBannedUsers()
      .subscribe({
        next: (users) => {
          this.bannedUsers.set(users);
        },
        error: (err) => {
          console.error('Error loading banned users:', err);
        }
      });
  }

  loadSystemStats(): void {
    this.throttleService.getSystemStats()
      .subscribe({
        next: (stats) => {
          this.systemStats.set(stats);
        },
        error: (err) => {
          console.error('Error loading system stats:', err);
        }
      });
  }

  onUserIdChange(): void {
    this.loadThrottleStatus();
  }

  unbanUser(userId: number): void {
    if (confirm(`Are you sure you want to unban user ${userId}?`)) {
      this.throttleService.unbanUser(userId)
        .subscribe({
          next: () => {
            alert(`User ${userId} unbanned successfully`);
            this.loadThrottleStatus();
            this.loadBannedUsers();
          },
          error: (err) => {
            alert('Failed to unban user');
            console.error('Error unbanning user:', err);
          }
        });
    }
  }

  resetUser(userId: number): void {
    if (confirm(`Are you sure you want to reset throttle settings for user ${userId}?`)) {
      this.throttleService.resetUser(userId)
        .subscribe({
          next: () => {
            alert(`Throttle settings reset for user ${userId}`);
            this.loadThrottleStatus();
          },
          error: (err) => {
            alert('Failed to reset user settings');
            console.error('Error resetting user:', err);
          }
        });
    }
  }

  setThreshold(userId: number, threshold: number): void {
    if (threshold < 5 || threshold > 100) {
      alert('Threshold must be between 5 and 100');
      return;
    }
    
    this.throttleService.setThreshold(userId, threshold)
      .subscribe({
        next: () => {
          alert(`Threshold set to ${threshold} for user ${userId}`);
          this.loadThrottleStatus();
        },
        error: (err) => {
          alert('Failed to set threshold');
          console.error('Error setting threshold:', err);
        }
      });
  }

  reduceScore(userId: number, reduction: number): void {
    if (reduction < 1 || reduction > 100) {
      alert('Reduction must be between 1 and 100');
      return;
    }
    
    this.throttleService.reduceAbuseScore(userId, reduction)
      .subscribe({
        next: () => {
          alert(`Abuse score reduced by ${reduction} for user ${userId}`);
          this.loadThrottleStatus();
        },
        error: (err) => {
          alert('Failed to reduce abuse score');
          console.error('Error reducing score:', err);
        }
      });
  }

  testThrottling(userId: number): void {
    // Send multiple rapid requests to test throttling
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        this.throttleService.ping(userId)
          .subscribe({
            error: (err) => {
              // Expected for throttling test
              console.log(`Request ${i + 1} failed:`, err.status);
            }
          });
      }, i * 100); // 100ms between requests
    }
  }

  formatTimeRemaining(expiresAt?: string): string {
    if (!expiresAt) return 'Permanent';
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h ${minutes}m`;
    }
    
    return `${hours}h ${minutes}m`;
  }
}
