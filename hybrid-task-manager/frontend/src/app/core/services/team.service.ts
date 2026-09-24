import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Team, ProjectBoard, User, TeamRole, Paginated } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private base = `${environment.apiUrl}/teams/`;
  private boardsBase = `${environment.apiUrl}/boards/`;

  constructor(private http: HttpClient) {}

  list(): Observable<Team[]> {
    return this.http.get<Paginated<Team>>(this.base).pipe(map((res) => res.results));
  }

  get(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.base}${id}/`);
  }

  create(payload: { name: string; description?: string }): Observable<Team> {
    return this.http.post<Team>(this.base, payload);
  }

  update(id: number, payload: { name?: string; description?: string }): Observable<Team> {
    return this.http.patch<Team>(`${this.base}${id}/`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}${id}/`);
  }

  addMember(teamId: number, username: string, role: TeamRole) {
    return this.http.post<Team>(`${this.base}${teamId}/add_member/`, { username, role });
  }

  removeMember(teamId: number, username: string) {
    return this.http.post<Team>(`${this.base}${teamId}/remove_member/`, { username });
  }

  updateMemberRole(teamId: number, username: string, role: TeamRole) {
    return this.http.post<Team>(`${this.base}${teamId}/update_member_role/`, { username, role });
  }

  listBoards(teamId?: number): Observable<ProjectBoard[]> {
    return this.http.get<Paginated<ProjectBoard>>(this.boardsBase, teamId ? { params: { team: teamId } } : {}).pipe(
      map((res) => res.results)
    );
  }

  getBoard(id: number): Observable<ProjectBoard> {
    return this.http.get<ProjectBoard>(`${this.boardsBase}${id}/`);
  }

  createBoard(payload: { team: number; name: string; description?: string }): Observable<ProjectBoard> {
    return this.http.post<ProjectBoard>(this.boardsBase, payload);
  }

  deleteBoard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.boardsBase}${id}/`);
  }
}
