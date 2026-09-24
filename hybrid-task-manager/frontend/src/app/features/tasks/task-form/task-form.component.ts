import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TaskService } from '../../../core/services/task.service';
import { TaskMode, Category } from '../../../core/models/models';

export interface TaskFormDialogData {
  mode: TaskMode;
  team?: number;
  board?: number;
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule,
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  dialogRef = inject(MatDialogRef<TaskFormComponent>);
  data: TaskFormDialogData = inject(MAT_DIALOG_DATA);

  categories: Category[] = [];

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    priority: ['medium'],
    due_date: [null as Date | null],
    assignee_username: [''],
    category_id: [null as number | null],
    tags: [''],
  });

  ngOnInit() {
    if (this.data.mode === 'personal') {
      this.taskService.listCategories().subscribe((categories) => (this.categories = categories));
    }
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload: any = {
      mode: this.data.mode,
      title: v.title,
      description: v.description || '',
      priority: v.priority,
      due_date: v.due_date,
      tag_names: (v.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    };
    if (this.data.mode === 'personal' && v.category_id) {
      payload.category_id = v.category_id;
    }
    if (this.data.mode === 'professional') {
      payload.team = this.data.team;
      payload.board = this.data.board;
      if (v.assignee_username) payload.assignee_username = v.assignee_username;
    }
    this.taskService.create(payload).subscribe((task) => this.dialogRef.close(task));
  }
}
