import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, Paginated } from '../models/models';
import { environment } from '../../environments/environment';

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

const ACCESS_KEY = 'htm_access';
const REFRESH_KEY = 'htm_refresh';
const USER_KEY = 'htm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSignal = signal<User | null>(this.readStoredUser());

  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => !!this.currentUserSignal());
  isProfessional = computed(() => this.currentUserSignal()?.account_type === 'professional');

  constructor(private http: HttpClient, private router: Router) {}

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login/`, { username, password }).pipe(
      tap((res) => this.persistSession(res))
    );
  }

  register(payload: {
    username: string; email: string; password: string; password_confirm: string;
    account_type: 'personal' | 'professional'; first_name?: string; last_name?: string;
  }): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/auth/register/`, payload);
  }

  private persistSession(res: LoginResponse) {
    localStorage.setItem(ACCESS_KEY, res.access);
    localStorage.setItem(REFRESH_KEY, res.refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.currentUserSignal.set(res.user);
  }

  refreshUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me/`).pipe(
      tap((user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUserSignal.set(user);
      })
    );
  }

  updatePreferences(payload: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/auth/me/`, payload).pipe(
      tap((user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUserSignal.set(user);
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  setAccessToken(token: string) {
    localStorage.setItem(ACCESS_KEY, token);
  }

  logout() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  /** User directory — used by the "Add members" page. Optionally filter by
   * account type (e.g. 'professional') and/or a free-text name/username search. */
  searchUsers(params: { q?: string; account_type?: string } = {}): Observable<Paginated<User>> {
    const query: Record<string, string> = {};
    if (params.q) query['q'] = params.q;
    if (params.account_type) query['account_type'] = params.account_type;
    return this.http.get<Paginated<User>>(`${environment.apiUrl}/auth/search/`, { params: query });
  }
}
