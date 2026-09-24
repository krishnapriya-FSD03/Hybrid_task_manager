import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeamService } from '../../../core/services/team.service';
import { Team, ProjectBoard, TeamRole } from '../../../core/models/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

/** Team roster (add/remove members, change roles), boards, and team settings
 * (rename/delete — Manager/Team Lead only, enforced by the API too). */
@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatListModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule,
    MatTooltipModule, MatDialogModule,
  ],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.scss',
})
export class TeamDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private teamService = inject(TeamService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  team?: Team;
  boards: ProjectBoard[] = [];
  newBoardName = '';
  newMemberUsername = '';
  newMemberRole: TeamRole = 'team_member';
  memberError = '';

  editingDetails = false;
  editName = '';
  editDescription = '';

  private teamId!: number;

  ngOnInit() {
    this.teamId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load() {
    this.teamService.get(this.teamId).subscribe((team) => (this.team = team));
    this.teamService.listBoards(this.teamId).subscribe((boards) => (this.boards = boards));
  }

  createBoard() {
    if (!this.newBoardName.trim()) return;
    this.teamService.createBoard({ team: this.teamId, name: this.newBoardName }).subscribe(() => {
      this.newBoardName = '';
      this.load();
    });
  }

  deleteBoard(board: ProjectBoard) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete this board?',
        message: `"${board.name}" and all its tasks will be permanently deleted. This can't be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.teamService.deleteBoard(board.id).subscribe({
        next: () => {
          this.snackBar.open('Board deleted.', undefined, { duration: 2500 });
          this.load();
        },
        error: (err) => this.snackBar.open(err?.error?.detail || 'Could not delete board.', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  addMember() {
    this.memberError = '';
    this.teamService.addMember(this.teamId, this.newMemberUsername, this.newMemberRole).subscribe({
      next: (team) => {
        this.team = team;
        this.newMemberUsername = '';
      },
      error: (err) => (this.memberError = err?.error?.detail || 'Could not add member.'),
    });
  }

  removeMember(username: string) {
    this.teamService.removeMember(this.teamId, username).subscribe((team) => (this.team = team));
  }

  changeMemberRole(username: string, role: TeamRole) {
    this.teamService.updateMemberRole(this.teamId, username, role).subscribe({
      next: (team) => {
        this.team = team;
        this.snackBar.open(`${username}'s role updated.`, undefined, { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.detail || 'Could not update role.', 'Dismiss', { duration: 4000 });
        this.load(); // revert the select back to the real role
      },
    });
  }

  startEditingDetails() {
    if (!this.team) return;
    this.editName = this.team.name;
    this.editDescription = this.team.description;
    this.editingDetails = true;
  }

  cancelEditingDetails() {
    this.editingDetails = false;
  }

  saveDetails() {
    if (!this.editName.trim()) return;
    this.teamService.update(this.teamId, { name: this.editName, description: this.editDescription }).subscribe({
      next: (team) => {
        this.team = team;
        this.editingDetails = false;
        this.snackBar.open('Team updated.', undefined, { duration: 2000 });
      },
      error: (err) => this.snackBar.open(err?.error?.detail || 'Could not update team.', 'Dismiss', { duration: 4000 }),
    });
  }

  deleteTeam() {
    if (!this.team) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete this team?',
        message: `"${this.team.name}" — all its boards, tasks, and membership will be permanently deleted for every member. This can't be undone.`,
        confirmLabel: 'Delete team',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.teamService.delete(this.teamId).subscribe({
        next: () => {
          this.snackBar.open('Team deleted.', undefined, { duration: 2500 });
          this.router.navigate(['/professional/teams']);
        },
        error: (err) => this.snackBar.open(err?.error?.detail || 'Could not delete team.', 'Dismiss', { duration: 4000 }),
      });
    });
  }
}
