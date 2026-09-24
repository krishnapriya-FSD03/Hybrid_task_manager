import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TeamService } from '../../../core/services/team.service';
import { Team } from '../../../core/models/models';
import { NewTeamDialogComponent } from './new-team-dialog/new-team-dialog.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
})
export class TeamsComponent implements OnInit {
  private teamService = inject(TeamService);
  private dialog = inject(MatDialog);

  teams: Team[] = [];

  ngOnInit() {
    this.load();
  }
  load() {
    this.teamService.list().subscribe((teams) => (this.teams = teams));
  }
  openNewTeam() {
    const ref = this.dialog.open(NewTeamDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe((team) => team && this.load());
  }
}
