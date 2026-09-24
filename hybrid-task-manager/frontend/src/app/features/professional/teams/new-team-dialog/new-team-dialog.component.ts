import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TeamService } from '../../../../core/services/team.service';

@Component({
  selector: 'app-new-team-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './new-team-dialog.component.html',
  styleUrl: './new-team-dialog.component.scss',
})
export class NewTeamDialogComponent {
  private teamService = inject(TeamService);
  dialogRef = inject(MatDialogRef<NewTeamDialogComponent>);

  name = '';
  description = '';

  create() {
    this.teamService.create({ name: this.name, description: this.description }).subscribe((team) => this.dialogRef.close(team));
  }
}
