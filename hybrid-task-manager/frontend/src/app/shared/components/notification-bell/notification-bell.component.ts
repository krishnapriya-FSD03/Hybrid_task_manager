import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/models';

/**
 * Bell icon with unread badge + dropdown list. Polls every 15s for new
 * notifications (a lightweight stand-in for a websocket push channel —
 * see README for the upgrade path to true real-time delivery).
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatBadgeModule, MatMenuModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  items: AppNotification[] = [];
  private sub?: Subscription;

  constructor(public notifications: NotificationService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    // Poll unread count; snackbar-toast on newly arrived notifications.
    this.sub = interval(15000).pipe(
      startWith(0),
      switchMap(() => this.notifications.refreshUnreadCount())
    ).subscribe();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  loadList() {
    this.notifications.list().subscribe((res) => (this.items = res.results));
  }

  onSelect(n: AppNotification) {
    if (!n.is_read) {
      this.notifications.markRead(n.id).subscribe(() => (n.is_read = true));
    }
  }

  markAllRead() {
    this.notifications.markAllRead().subscribe(() => {
      this.items = this.items.map((n) => ({ ...n, is_read: true }));
    });
  }
}
