import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AllRoles} from '../models/user.model';

export interface CreateUserRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  propertyCode: string;
  role: string;
  roleId: number;
}

export interface PropertyUser {
  id: number;
  userId: number;
  username: string;
  email: string | null;
  fullName: string | null;
  propertyId: number | null;
  propertyCode: string;
  propertyName: string;
  propertyCity: string | null;
  propertyCountry: string | null;
  roleId: number | null;
  roleName: string;
  roleDescription: string | null;
  roles: string[];
  isActive: boolean;
  assignedAt: string;
  assignedByUsername: string | null;
  assignedById: number | null;
  revokedAt: string | null;
  revokedByUsername: string | null;
  revokedById: number | null;
  remarks: string | null;
  firstName: string;
  lastName: string;
}


export interface UserResponse {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  propertyCode: string;
  role: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/auth/register`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  createUser(userData: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(
      this.apiUrl,
      userData,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('User creation response:', response);
      })
    );
  }

getPropertyUsers(propertyCode: string): Observable<PropertyUser[]> {
  const params = { propertyCode };
  return this.http.get<any>(
    `${environment.apiUrl}/properties/getPropertyUsers`,
    {
      headers: this.getHeaders(),
      params
    }
  ).pipe(
    map(response => {

      if (Array.isArray(response)) {
        return response as PropertyUser[];
      }

      if (response && typeof response === 'object') {

        if (response.body && Array.isArray(response.body)) {
          return response.body as PropertyUser[];
        }

        const keys = Object.keys(response);
        for (const key of keys) {
          if (Array.isArray(response[key])) {
            return response[key] as PropertyUser[];
          }
        }
      }
      return [];
    }),
    // tap(users => {
    //   console.log('Users count:', users.length);
    //   if (users.length > 0) {
    //     console.log('First user sample:', users[0]);
    //   }
    // })
  );
}

  getAllRoles(): Observable<AllRoles[]> {
    const url = `${environment.apiUrl}/users/getAllRoles`;

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response && response.body && Array.isArray(response.body)) {
          return response.body as AllRoles[];
        }
        if (Array.isArray(response)) {
          return response as AllRoles[];
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching roles:', error);
        return of([]);
      })
    );
  }

  revokeRole(userId: number, propertyCode: string, roleName: string): Observable<any> {
    const params = {
      userId: userId.toString(),
      propertyCode: propertyCode,
      roleName: roleName
    };

    return this.http.post(
      `${environment.apiUrl}/properties/revokeRole`,
      null,
      {
        headers: this.getHeaders(),
        params: params
      }
    )
  }

  revokeUserAccess(userId: number, propertyCode: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('propertyCode', propertyCode);

    return this.http.delete(
      `${environment.apiUrl}/properties/revoke`,
      {
        headers: this.getHeaders(),
        params: params
      }
    ).pipe(
      tap(response => {
        console.log('User access revoked:', response);
      })
    );
  }

  assignUserRole(userId: number, propertyCode: string, roleName: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/properties/assign?userId=${userId}&propertyCode=${propertyCode}&roleName=${roleName}`, {
      propertyCode,
      roleName
    });
  }

}
