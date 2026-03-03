import { HttpInterceptorFn } from '@angular/common/http';

// Must match AuthService.tokenKey exactly
const TOKEN_KEY = 'auth_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Guard for SSR — localStorage doesn't exist on the server
  if (typeof window === 'undefined') {
    return next(req);
  }

  const token = localStorage.getItem(TOKEN_KEY);

  // No token → pass request through untouched (login, register, public routes)
  if (!token) {
    return next(req);
  }

  // Attach Bearer token to all authenticated requests
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
