import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TaskService } from '../../../core/services/task.service';
import { TeamService } from '../../../core/services/team.service';
import { Task, TaskStatus } from '../../../core/models/models';
import { TaskCardComponent } from '../../../shared/components/task-card/task-card.component';
import { TaskFormComponent } from '../../tasks/task-form/task-form.component';
import { TaskDetailComponent } from '../../tasks/task-detail/task-detail.component';

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'in_review', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

/** Team project board — Trello-style columns scoped to one board/team. */
@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [
    CommonModule, RouterModule, DragDropModule, MatButtonModule, MatIconModule,
    MatDialogModule, TaskCardComponent,
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class ProjectBoardComponent implements OnInit {
  columns = COLUMNS;
  columnIds = COLUMNS.map((c) => c.key);
  grouped: Record<string, Task[]> = { todo: [], in_progress: [], in_review: [], done: [] };
  private boardId!: number;
  private teamId?: number;

  constructor(private route: ActivatedRoute, private taskService: TaskService, private teamService: TeamService, private dialog: MatDialog) {}

  ngOnInit() {
    this.boardId = Number(this.route.snapshot.paramMap.get('id'));
    this.teamService.getBoard(this.boardId).subscribe((board) => (this.teamId = board.team));
    this.load();
  }

  load() {
    this.taskService.list({ mode: 'professional', board: this.boardId }).subscribe((res) => {
      this.grouped = { todo: [], in_progress: [], in_review: [], done: [] };
      for (const t of res.results) {
        this.grouped[t.status].push(t);
        this.teamId = t.team ?? this.teamId;
      }
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
    const ref = this.dialog.open(TaskFormComponent, {
      width: '520px',
      data: { mode: 'professional', team: this.teamId, board: this.boardId },
    });
    ref.afterClosed().subscribe((task) => task && this.load());
  }

  openTask(task: Task) {
    this.taskService.get(task.id).subscribe((full) => {
      const ref = this.dialog.open(TaskDetailComponent, {
        width: '600px', data: { task: full, isTeamContext: true },
      });
      ref.afterClosed().subscribe(() => this.load());
    });
  }
}
