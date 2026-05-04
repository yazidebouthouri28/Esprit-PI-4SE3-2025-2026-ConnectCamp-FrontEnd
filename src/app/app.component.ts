import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { AuthService } from './services/auth.service';
import { AlertNotificationPollingService } from './services/alert-notification-polling.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MainLayoutComponent],
  template: `
    <ng-container *ngIf="showLayout; else noLayout">
      <app-main-layout>
        <router-outlet></router-outlet>
      </app-main-layout>
    </ng-container>
    <ng-template #noLayout>
      <router-outlet></router-outlet>
    </ng-template>
  `,
})
export class AppComponent implements OnInit {
  showLayout = true;

  constructor(
    private router: Router,
    private auth: AuthService,
    private alertPolling: AlertNotificationPollingService
  ) {}

  ngOnInit() {
    this.updateLayoutVisibility(this.router.url);

    // Start polling when a user is already logged in (page refresh)
    if (this.auth.getCurrentUser()?.role === 'CAMPER') {
      this.alertPolling.start();
    }

    // React to login / logout during the session
    this.auth.currentUser$.subscribe(user => {
      if (user?.role === 'CAMPER') {
        this.alertPolling.start();
      } else {
        this.alertPolling.stop();
      }
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateLayoutVisibility(event.urlAfterRedirects);
      });
  }

  private updateLayoutVisibility(url: string) {
    const normalizedUrl = url.split(/[?#]/)[0];
    const noLayoutRoutes = ['/auth', '/login', '/register', '/admin'];
    this.showLayout = !noLayoutRoutes.some(route =>
      normalizedUrl === route || normalizedUrl.startsWith(`${route}/`)
    );
  }
}
