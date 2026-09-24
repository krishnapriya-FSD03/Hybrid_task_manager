import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { TeamService } from '../../../core/services/team.service';
import { Team, TeamRole, User } from '../../../core/models/models';

interface DirectoryRow {
  user: User;
  role: TeamRole;
  isMember: boolean;
  adding: boolean;
}

/**
 * Browsable directory of professional users a Manager/Team Lead can add to
 * a team, with search and a per-row role picker. Guarded to team members
 * with add rights (see ngOnInit) — the API enforces this too.
 */
@Component({
  selector: 'app-add-members',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatSelectModule, MatChipsModule, MatProgressSpinnerModule,
  ],
  templateUrl: './add-members.component.html',
  styleUrl: './add-members.component.scss',
})
export class AddMembersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private teamService = inject(TeamService);
  private snackBar = inject(MatSnackBar);

  team?: Team;
  rows: DirectoryRow[] = [];
  searchTerm = '';
  loading = false;
  private teamId!: number;
  private searchInput$ = new Subject<string>();

  ngOnInit() {
    this.teamId = Number(this.route.snapshot.paramMap.get('id'));

    this.teamService.get(this.teamId).subscribe((team) => {
      this.team = team;
      const canManage = team.my_role === 'manager' || team.my_role === 'team_lead';
      if (!canManage) {
        this.snackBar.open("You don't have permission to add members to this team.", 'Dismiss', { duration: 4000 });
        this.router.navigate(['/professional/teams', this.teamId]);
        return;
      }
      this.loadDirectory();
    });

    this.searchInput$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.loadDirectory());
  }

  onSearchChange() {
    this.searchInput$.next(this.searchTerm);
  }

  loadDirectory() {
    this.loading = true;
    this.authService.searchUsers({ q: this.searchTerm, account_type: 'professional' }).subscribe({
      next: (res) => {
        const memberIds = new Set(this.team?.memberships.map((m) => m.user.id) ?? []);
        this.rows = res.results.map((user) => ({
          user,
          role: 'team_member' as TeamRole,
          isMember: memberIds.has(user.id),
          adding: false,
        }));
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  initials(user: User): string {
    const f = user.first_name?.[0] ?? user.username[0];
    const l = user.last_name?.[0] ?? '';
    return (f + l).toUpperCase();
  }

  addToTeam(row: DirectoryRow) {
    row.adding = true;
    this.teamService.addMember(this.teamId, row.user.username, row.role).subscribe({
      next: (team) => {
        this.team = team;
        row.isMember = true;
        row.adding = false;
        this.snackBar.open(`${row.user.username} added to the team.`, undefined, { duration: 2500 });
      },
      error: (err) => {
        row.adding = false;
        this.snackBar.open(err?.error?.detail || 'Could not add member.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
