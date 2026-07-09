import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { NotificationService } from '../../shared/services/notification.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('lms_access_token');
  const notification = inject(NotificationService);
  
  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      let friendlyMsg = '';

      if (error.status === 0) {
        friendlyMsg = 'Cannot connect to the server. Please check if the server is running.';
        notification.error(friendlyMsg);
      } else if (error.status === 500) {
        friendlyMsg = 'Internal Server Error. Please contact support or try again later.';
        notification.error(friendlyMsg);
      } else if (error.status === 403) {
        friendlyMsg = 'Access Denied: You do not have permission for this request.';
        notification.error(friendlyMsg);
      } else if (error.status === 401) {
        if (token) {
          localStorage.removeItem('lms_access_token');
          friendlyMsg = 'Session Expired. Please log in again.';
          notification.warning(friendlyMsg);
        }
      }

      // Re-throw a modified HttpErrorResponse where the error body contains the friendly message
      const modifiedError = new HttpErrorResponse({
        error: { message: friendlyMsg || error.error?.message || 'An unexpected error occurred.' },
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url || undefined
      });

      return throwError(() => modifiedError);
    })
  );
};
