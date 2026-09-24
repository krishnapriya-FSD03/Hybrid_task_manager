import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Task, Category, Paginated, TaskMode } from '../models/models';
import { environment } from '../../environments/environment';

export interface TaskFilters {
  mode?: TaskMode;
  status?: string;
  priority?: string;
  team?: number;
  board?: number;
  assignee?: number;
  category?: number;
  search?: string;
  ordering?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private base = `${environment.apiUrl}/tasks/`;

  constructor(private http: HttpClient) {}

  list(filters: TaskFilters = {}): Observable<Paginated<Task>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<Paginated<Task>>(this.base, { params });
  }

  get(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.base}${id}/`);
  }

  create(payload: Partial<Task> & { tag_names?: string[]; assignee_username?: string; category_id?: number }): Observable<Task> {
    return this.http.post<Task>(this.base, payload);
  }

  update(id: number, payload: Partial<Task> & { tag_names?: string[]; assignee_username?: string; category_id?: number }): Observable<Task> {
    return this.http.patch<Task>(`${this.base}${id}/`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}${id}/`);
  }

  addComment(id: number, body: string) {
    return this.http.post(`${this.base}${id}/add_comment/`, { body });
  }

  toggleWatch(id: number) {
    return this.http.post<{ watching: boolean }>(`${this.base}${id}/toggle_watch/`, {});
  }

  uploadAttachment(id: number, file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${this.base}${id}/upload_attachment/`, form);
  }

  listCategories(): Observable<Category[]> {
    return this.http.get<Paginated<Category>>(`${environment.apiUrl}/categories/`).pipe(map((res) => res.results));
  }

  createCategory(payload: { name: string; color: string }): Observable<Category> {
    return this.http.post<Category>(`${environment.apiUrl}/categories/`, payload);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/categories/${id}/`);
  }
}
