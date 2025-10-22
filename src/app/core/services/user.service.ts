import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface CreateUserRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  propertyCode: string;
  role: string;
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
    console.log('Creating user with data:', userData);

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
    map(response => response.body || response), // Extract body if exists
    tap(users => {
      console.log('Property users fetched:', users);
    })
  );
}

revokeUserAccess(userId: number, propertyCode: string): Observable<any> {
  const params = {
    userId: userId.toString(),
    propertyCode: propertyCode
  };
  
  return this.http.post(
    `${environment.apiUrl}/properties/revoke`,
    null,
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


}
