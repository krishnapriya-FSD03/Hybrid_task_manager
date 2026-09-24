import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

/** Edit the signed-in user's own profile — name, avatar URL, email
 * notification preference. Account type and username are fixed after
 * registration, so they're shown read-only rather than editable. */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSlideToggleModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  saving = false;

  form = this.fb.group({
    first_name: [''],
    last_name: [''],
    email: ['', [Validators.required, Validators.email]],
    avatar_url: [''],
    email_notifications_enabled: [true],
  });

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        avatar_url: user.avatar_url || '',
        email_notifications_enabled: user.email_notifications_enabled ?? true,
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const payload = this.form.getRawValue();
    this.auth.updatePreferences({
      first_name: payload.first_name ?? '',
      last_name: payload.last_name ?? '',
      email: payload.email ?? '',
      avatar_url: payload.avatar_url ?? '',
      email_notifications_enabled: payload.email_notifications_enabled ?? true,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Profile updated.', undefined, { duration: 2500 });
      },
      error: (err) => {
        this.saving = false;
        const data = err?.error || {};
        const message = Object.values(data).flat().join(' ') || 'Could not update profile.';
        this.snackBar.open(message, 'Dismiss', { duration: 4000 });
      },
    });
  }
}
