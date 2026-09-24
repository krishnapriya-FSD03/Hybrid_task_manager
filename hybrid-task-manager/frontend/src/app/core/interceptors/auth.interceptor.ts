import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

/**
 * Attaches the JWT access token to every API request, and transparently
 * refreshes it on a 401 using the stored refresh token before retrying.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const http = inject(HttpClient);

  const token = auth.getAccessToken();
  const isApiCall = req.url.startsWith(environment.apiUrl);
  const authedReq = token && isApiCall
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const refreshToken = auth.getRefreshToken();
      if (err.status === 401 && isApiCall && refreshToken && !req.url.includes('/auth/token/refresh/')) {
        return http.post<{ access: string }>(`${environment.apiUrl}/auth/token/refresh/`, { refresh: refreshToken }).pipe(
          switchMap((res) => {
            auth.setAccessToken(res.access);
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${res.access}` } });
            return next(retried);
          }),
          catchError((refreshErr) => {
            auth.logout();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
