import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, catchError, tap } from 'rxjs';
import { inject } from '@angular/core';

export const ThrottlingInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const requestStartTime = Date.now();
  
  const showError = (message: string): void => {
    console.error('Throttling Error:', message);
    // Fallback to alert for now - in production, integrate with actual toast service
    alert(message);
  };

  const showWarning = (message: string): void => {
    console.warn('Throttling Warning:', message);
  };

  const logoutAndRedirect = (): void => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    
    // Navigate to login
    router.navigate(['/login']);
  };

  return next(req).pipe(
    tap((event) => {
      // Check for delayed responses (200 with significant delay)
      if (event instanceof HttpResponse) {
        const responseTime = Date.now() - requestStartTime;
        
        // If response took more than 400ms, likely was delayed by throttling
        if (responseTime > 400 && req.url.includes('/api/messages')) {
          showWarning('Request delayed due to high activity. Please slow down.');
        }
      }
    }),
    catchError((error) => {
      // Handle different throttling-related errors
      if (error.status === 429) {
        showError('Too many requests! Please slow down and try again later.');
      }
      
      if (error.status === 403) {
        const errorBody = error.error;
        
        if (typeof errorBody === 'string' && errorBody.includes('SOFT')) {
          showError('Account temporarily suspended (24 hours).');
          router.navigate(['/banned'], { 
            queryParams: { 
              type: 'SOFT',
              reason: 'Account suspended due to unusual activity'
            }
          });
        } else if (typeof errorBody === 'string' && errorBody.includes('HARD')) {
          showError('Account permanently disabled. Contact administrator.');
          // Logout and redirect to login
          logoutAndRedirect();
        } else if (errorBody?.type === 'SOFT_BAN') {
          showError('Account temporarily suspended.');
          router.navigate(['/banned'], { 
            queryParams: { 
              type: 'SOFT',
              reason: errorBody.message || 'Account suspended due to unusual activity',
              expiresAt: errorBody.expiresAt
            }
          });
        } else if (errorBody?.type === 'HARD_BAN') {
          showError('Account permanently disabled.');
          logoutAndRedirect();
        } else {
          showError('Access denied. Account may be suspended.');
          router.navigate(['/banned']);
        }
      }
      
      return throwError(() => error);
    })
  );
};
