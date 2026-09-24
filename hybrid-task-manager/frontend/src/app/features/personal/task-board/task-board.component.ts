import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskStatus } from '../../../core/models/models';
import { TaskCardComponent } from '../../../shared/components/task-card/task-card.component';
import { TaskFormComponent } from '../../tasks/task-form/task-form.component';
import { TaskDetailComponent } from '../../tasks/task-detail/task-detail.component';
import { ManageCategoriesComponent } from '../manage-categories/manage-categories.component';

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'in_review', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

/** Personal-mode kanban board — private to the signed-in user. */
@Component({
  selector: 'app-personal-task-board',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DragDropModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatFormFieldModule, MatSelectModule, TaskCardComponent,
  ],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss',
})
export class PersonalTaskBoardComponent implements OnInit {
  columns = COLUMNS;
  columnIds = COLUMNS.map((c) => c.key);
  grouped: Record<string, Task[]> = { todo: [], in_progress: [], in_review: [], done: [] };

  constructor(private taskService: TaskService, private dialog: MatDialog) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.taskService.list({ mode: 'personal', ordering: '-priority' }).subscribe((res) => {
      this.grouped = { todo: [], in_progress: [], in_review: [], done: [] };
      for (const t of res.results) this.grouped[t.status].push(t);
    });
  }

  onDrop(event: CdkDragDrop<Task[]>) {
    const task: Task = event.item.data;
    const newStatus = event.container.id as TaskStatus;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.taskService.update(task.id, { status: newStatus }).subscribe();
  }

  openNewTask() {
    const ref = this.dialog.open(TaskFormComponent, { width: '520px', data: { mode: 'personal' } });
    ref.afterClosed().subscribe((task) => task && this.load());
  }

  openManageCategories() {
    const ref = this.dialog.open(ManageCategoriesComponent, { width: '420px' });
    ref.afterClosed().subscribe((changed) => changed && this.load());
  }

  openTask(task: Task) {
    this.taskService.get(task.id).subscribe((full) => {
      const ref = this.dialog.open(TaskDetailComponent, {
        width: '600px', data: { task: full, isTeamContext: false },
      });
      ref.afterClosed().subscribe(() => this.load());
    });
  }
}
