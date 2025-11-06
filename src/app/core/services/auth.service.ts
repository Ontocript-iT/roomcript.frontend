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
  private ROLE_KEY = 'role';
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
        localStorage.setItem("propertyCode", response.propertyCode);

        const primaryRole = response.roles?.[0] || 'GUEST';
        localStorage.setItem(this.ROLE_KEY, primaryRole);
        const userWithRole: User = {
          ...response.user,
          role: primaryRole
        };

        this.userSubject.next(response.user);

        const cleanRoles = (response.roles || []).map((role: string) =>
          role.replace('ROLE_', '')
        );
        localStorage.setItem('userRoles', JSON.stringify(cleanRoles));
        this.currentUserRoles.next(cleanRoles);
      })
    );
  }

  private loadUserRoles(): void {
    // FIX: Parse JSON array correctly
    const rolesString = localStorage.getItem('userRoles');
    if (rolesString) {
      try {
        const roles = JSON.parse(rolesString);
        // Ensure it's an array
        this.currentUserRoles.next(Array.isArray(roles) ? roles : []);
      } catch (e) {
        console.error('Error parsing user roles:', e);
        this.currentUserRoles.next([]);
      }
    } else {
      this.currentUserRoles.next([]);
    }
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
    localStorage.removeItem(this.NAME_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem('userRoles'); // Clear roles on logout
    this.userSubject.next(null);
    this.currentUserRoles.next([]);
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

        // Load name and username from localStorage
        const name = localStorage.getItem(this.NAME_KEY);
        const username = localStorage.getItem(this.USERNAME_KEY);
        const role = localStorage.getItem(this.ROLE_KEY);

        const user: User = {
          ...payload,
          name: name || payload.name,
          username: username || payload.username,
          role: role || 'GUEST'
        };

        this.userSubject.next(user);
      } catch (e) {
        this.logout();
      }
    }
  }
}
