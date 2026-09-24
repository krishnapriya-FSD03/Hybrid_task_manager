import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AppNotification, Paginated } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = `${environment.apiUrl}/notifications/`;

  /** Polled unread count, drives the bell badge. */
  unreadCount = signal(0);

  constructor(private http: HttpClient) {}

  list(): Observable<Paginated<AppNotification>> {
    return this.http.get<Paginated<AppNotification>>(this.base);
  }

  refreshUnreadCount(): Observable<{ unread_count: number }> {
    return this.http.get<{ unread_count: number }>(`${this.base}unread_count/`).pipe(
      tap((res) => this.unreadCount.set(res.unread_count))
    );
  }

  markRead(id: number): Observable<AppNotification> {
    return this.http.post<AppNotification>(`${this.base}${id}/mark_read/`, {}).pipe(
      tap(() => this.unreadCount.update((c) => Math.max(0, c - 1)))
    );
  }

  markAllRead(): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.base}mark_all_read/`, {}).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }
}
