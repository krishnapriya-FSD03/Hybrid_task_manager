import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task } from '../../../core/models/models';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

export interface TaskDetailDialogData {
  task: Task;
  isTeamContext: boolean;
}

/**
 * Full task detail: edit fields, assign (team tasks), comment thread,
 * attachments, watch toggle, activity log. Shared by both personal and
 * professional boards — the API enforces what's editable in each mode.
 */
@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatTooltipModule, MatDatepickerModule,
  ],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
})
export class TaskDetailComponent {
  newComment = '';
  isWatching = false;
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  constructor(
    public dialogRef: MatDialogRef<TaskDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDetailDialogData,
    private taskService: TaskService,
    private auth: AuthService,
  ) {
    this.task = data.task;
    this.isWatching = this.task.watchers.some((w) => w.id === this.auth.currentUser()?.id);
  }

  task: Task;

  saveField(field: string, value: any) {
    this.taskService.update(this.task.id, { [field]: value } as any).subscribe((updated) => {
      this.task = { ...this.task, ...updated };
    });
  }

  deleteTask() {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete this task?',
        message: `"${this.task.title}" and all its comments and attachments will be permanently deleted. This can't be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.taskService.delete(this.task.id).subscribe({
        next: () => {
          this.snackBar.open('Task deleted.', undefined, { duration: 2500 });
          this.dialogRef.close('deleted');
        },
        error: () => this.snackBar.open('Could not delete task.', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  toggleWatch() {
    this.taskService.toggleWatch(this.task.id).subscribe((res) => (this.isWatching = res.watching));
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.taskService.uploadAttachment(this.task.id, file).subscribe((attachment: any) => {
      this.task.attachments = [...this.task.attachments, attachment];
    });
  }

  postComment() {
    const body = this.newComment.trim();
    if (!body) return;
    this.taskService.addComment(this.task.id, body).subscribe((comment: any) => {
      this.task.comments = [...this.task.comments, comment];
      this.newComment = '';
    });
  }
}
