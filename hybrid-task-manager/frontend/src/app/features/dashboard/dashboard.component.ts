import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DashboardService } from '../../core/services/dashboard.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, Team } from '../../core/models/models';

const STATUS_LABEL: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done',
};
const PRIORITY_COLOR: Record<string, string> = {
  low: '#4caf50', medium: '#ff9800', high: '#f4511e', urgent: '#c62828',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonToggleModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  mode: 'personal' | 'professional' = 'personal';
  teams: Team[] = [];
  selectedTeam?: number;
  stats: DashboardStats | null = null;

  constructor(
    private dashboardService: DashboardService,
    private teamService: TeamService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    if (this.auth.isProfessional()) {
      this.teamService.list().subscribe((teams) => (this.teams = teams));
    }
    this.load();
  }

  load() {
    const obs = this.mode === 'personal'
      ? this.dashboardService.personal()
      : this.dashboardService.professional(this.selectedTeam);
    obs.subscribe((stats) => (this.stats = stats));
  }

  get statusEntries() {
    return Object.entries(this.stats?.by_status || {}).map(([key, value]) => ({ key, value }));
  }
  get priorityEntries() {
    return Object.entries(this.stats?.by_priority || {}).map(([key, value]) => ({ key, value }));
  }
  statusLabel(key: string) {
    return STATUS_LABEL[key] || key;
  }
  priorityColor(key: string) {
    return PRIORITY_COLOR[key] || '#999';
  }
  barWidth(value: number) {
    const max = Math.max(this.stats?.total || 1, 1);
    return Math.max((value / max) * 100, 4);
  }
}
