import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  // First try via service, then fallback to localStorage directly
  let token = authService.getToken();
  if (!token) {
    token = localStorage.getItem('auth_token');
  }
  console.log('[Interceptor] Token exists:', !!token);
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  return next(req);
};