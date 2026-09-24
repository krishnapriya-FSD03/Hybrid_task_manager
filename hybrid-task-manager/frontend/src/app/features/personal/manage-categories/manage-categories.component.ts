import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskService } from '../../../core/services/task.service';
import { Category } from '../../../core/models/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const SWATCHES = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];

/** Create, list, and delete personal task categories. Deleting a category
 * doesn't delete its tasks — the API just clears the category on them. */
@Component({
  selector: 'app-manage-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './manage-categories.component.html',
  styleUrl: './manage-categories.component.scss',
})
export class ManageCategoriesComponent implements OnInit {
  private taskService = inject(TaskService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<ManageCategoriesComponent>);

  categories: Category[] = [];
  swatches = SWATCHES;
  newName = '';
  newColor = SWATCHES[0];
  changed = false;

  ngOnInit() {
    this.load();
  }

  load() {
    this.taskService.listCategories().subscribe((categories) => (this.categories = categories));
  }

  create() {
    if (!this.newName.trim()) return;
    this.taskService.createCategory({ name: this.newName.trim(), color: this.newColor }).subscribe({
      next: () => {
        this.newName = '';
        this.changed = true;
        this.load();
      },
      error: () => this.snackBar.open('Could not create category — name may already exist.', 'Dismiss', { duration: 4000 }),
    });
  }

  delete(category: Category) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete this category?',
        message: `"${category.name}" will be removed. Tasks using it will just lose their category — they won't be deleted.`,
        confirmLabel: 'Delete',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.taskService.deleteCategory(category.id).subscribe(() => {
        this.changed = true;
        this.load();
      });
    });
  }

  close() {
    this.dialogRef.close(this.changed);
  }
}
