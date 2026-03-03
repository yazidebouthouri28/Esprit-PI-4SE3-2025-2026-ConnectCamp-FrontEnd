import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Routes where a 401 should NOT trigger logout/redirect
// (the user isn't logged in yet — let the component handle the error)
const AUTH_ROUTES = ['/auth/login', '/auth/register'];

function isAuthRequest(url: string): boolean {
  return AUTH_ROUTES.some(route => url?.includes(route));
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let userFriendlyMessage = 'Something went wrong. Please try again.';

      if (error.error instanceof ErrorEvent) {
        userFriendlyMessage = 'A network error occurred. Please check your connection.';
      } else {
        switch (error.status) {
          case 0:
            userFriendlyMessage = 'Unable to connect to the server. Please check your internet connection.';
            break;

          case 400:
            userFriendlyMessage = sanitizeErrorMessage(error) || 'Invalid request. Please check your input.';
            break;

          case 401:
            if (isAuthRequest(req.url)) {
              // ✅ Login/register failed with wrong credentials — let the
              //    component show the error, do NOT redirect or clear storage
              userFriendlyMessage = sanitizeErrorMessage(error) || 'Invalid email or password.';
            } else {
              // ✅ Session expired on a protected route — clear and redirect
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('current_user');
              }
              router.navigate(['/auth/login']);
              userFriendlyMessage = 'Your session has expired. Please login again.';
            }
            break;

          case 403:
            userFriendlyMessage = 'You do not have permission to perform this action.';
            break;

          case 404:
            userFriendlyMessage = 'The requested resource was not found.';
            break;

          case 409:
            userFriendlyMessage = sanitizeErrorMessage(error) || 'A conflict occurred. The resource may already exist.';
            break;

          case 422:
            userFriendlyMessage = sanitizeErrorMessage(error) || 'Please check your input and try again.';
            break;

          case 429:
            userFriendlyMessage = 'Too many requests. Please wait a moment and try again.';
            break;

          case 500:
          case 502:
          case 503:
          case 504:
            userFriendlyMessage = 'The server is experiencing issues. Please try again later.';
            break;

          default:
            userFriendlyMessage = sanitizeErrorMessage(error) || 'An unexpected error occurred. Please try again.';
        }
      }

      console.error('HTTP Error:', {
        status: error.status,
        url: error.url,
        message: userFriendlyMessage,
        timestamp: new Date().toISOString()
      });

      return throwError(() => ({
        message: userFriendlyMessage,
        status: error.status,
        error: null
      }));
    })
  );
};

function sanitizeErrorMessage(error: HttpErrorResponse): string | null {
  try {
    const errorBody = error.error;
    if (!errorBody) return null;

    let message = errorBody.message || errorBody.error || '';
    if (typeof message !== 'string' || !message) return null;

    const technicalPatterns = [
      /mongodb/i, /duplicate key/i, /collection/i, /document/i, /objectid/i,
      /entity/i, /repository/i, /hibernate/i, /jdbc/i, /sql/i, /constraint/i,
      /foreign key/i, /primary key/i, /null pointer/i, /stack trace/i,
      /exception/i, /error at/i, /\.java:/i, /\.class/i, /spring/i, /bean/i,
      /injection/i, /autowired/i, /could not execute/i,
      /internal server/i, /unexpected token/i, /parse error/i, /syntax error/i,
      /connection refused/i, /deadlock/i, /transaction/i, /rollback/i
    ];

    for (const pattern of technicalPatterns) {
      if (pattern.test(message)) return null;
    }

    const validationMappings: Record<string, string> = {
      'email already exists':   'This email is already registered. Try logging in instead.',
      'username already exists':'This username is taken. Please choose another.',
      'user not found':         'Account not found. Please check your credentials.',
      'invalid password':       'Incorrect password. Please try again.',
      'invalid credentials':    'Invalid email or password.',
      'email is required':      'Please enter your email address.',
      'password is required':   'Please enter your password.',
      'name is required':       'Please enter your name.',
      'username is required':   'Please enter a username.',
      'invalid email':          'Please enter a valid email address.',
      'password too short':     'Password must be at least 6 characters.',
      'insufficient funds':     "You don't have enough balance for this transaction.",
      'insufficient stock':     'This product is out of stock.',
      'product not found':      'This product is no longer available.',
      'order not found':        'Order not found.',
      'already exists':         'This item already exists.'
    };

    const lower = message.toLowerCase();
    for (const [pattern, friendly] of Object.entries(validationMappings)) {
      if (lower.includes(pattern)) return friendly;
    }

    if (message.length < 200 && !message.includes('\n')) return message;

    return null;
  } catch {
    return null;
  }
}
