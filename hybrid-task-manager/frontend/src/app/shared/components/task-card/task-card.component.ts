import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Task } from '../../../core/models/models';

const PRIORITY_COLOR: Record<string, string> = {
  low: '#4caf50', medium: '#ff9800', high: '#f4511e', urgent: '#c62828',
};

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Output() open = new EventEmitter<Task>();

  get priorityColor() {
    return PRIORITY_COLOR[this.task.priority] || '#999';
  }
}
