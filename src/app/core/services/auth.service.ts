import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private NAME_KEY = 'name';
  private USERNAME_KEY = 'username';
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  private currentUserRoles = new BehaviorSubject<string[]>([]);
  public userRoles$: Observable<string[]> = this.currentUserRoles.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUser();
    this.loadUserRoles();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.NAME_KEY, response.name);
        localStorage.setItem(this.USERNAME_KEY, response.username);
        this.userSubject.next(response.user);
        localStorage.setItem('userRoles', response.roles.join(','));
      })
    );
  }

  private loadUserRoles(): void {
    const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    this.currentUserRoles.next(roles);
  }

  getUserRoles(): string[] {
    return this.currentUserRoles.value;
  }

  hasRole(role: string): boolean {
    return this.currentUserRoles.value.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.currentUserRoles.value.includes(role));
  }

  setUserRoles(roles: string[]): void {
    this.currentUserRoles.next(roles);
    localStorage.setItem('userRoles', JSON.stringify(roles));
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
      tap((response) => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this.userSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private loadUser(): void {
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userSubject.next(payload);
      } catch (e) {
        this.logout();
      }
    }
  }
}
