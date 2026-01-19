import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AllRoles} from '../models/user.model';
import { PaginatedResponse } from '../models/pagination.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination';

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

// Add these new interfaces after your existing interfaces
export interface PropertyDetails {
  id: number;
  propertyCode: string;
  propertyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  floorCount: number | null;
  status: string;
  totalRooms: number;
  createdAt: string;
  updatedAt: string | null;
  timeZone: string;
  currency: string;
}

export interface UserDetails {
  id: number;
  userId: string;
  email: string | null;
  username: string;
  propertyCode: string;
  isPrivate: boolean;
  dateTimeCreated: string;
  status: string;
  firstName: string;
  lastName: string;
}

export interface AccountResponse {
  headers: any;
  body: {
    propertyDetails: PropertyDetails;
    userDetails: UserDetails;
    status: number;
  };
  statusCode: string;
  statusCodeValue: number;
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

  // Add this method inside the UserService class
getUserAccountDetails(userId: string): Observable<{ propertyDetails: PropertyDetails; userDetails: UserDetails }> {
  const params = new HttpParams().set('userId', userId);

  return this.http.get<AccountResponse>(
    `${environment.apiUrl}/users/getUserDetails`,
    {
      headers: this.getHeaders(),
      params: params
    }
  ).pipe(
    map(response => ({
      propertyDetails: response.body.propertyDetails,
      userDetails: response.body.userDetails
    })),
    catchError(error => {
      console.error('Error fetching user account details:', error);
      throw error;
    })
  );
}

  getPropertyUsers(
    propertyCode: string,
    page: number = 0,
    size: number = 10
  ): Observable<PaginatedResponse<PropertyUser>> {
    const params = new HttpParams()
      .set('propertyCode', propertyCode)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(
      `${environment.apiUrl}/properties/getPropertyUsers`,
      {
        headers: this.getHeaders(),
        params
      }
    ).pipe(
      map(response => {

        if (response && response.body) {
          if (Array.isArray(response.body)) {
            return {
              content: response.body,
              totalElements: response.body.length,
              totalPages: 1,
              size: response.body.length,
              number: 0
            } as PaginatedResponse<PropertyUser>;
          }
          return {
            content: response.body.content || [],
            totalElements: response.body.totalElements || 0,
            totalPages: response.body.totalPages || 0,
            size: response.body.size || size,
            number: response.body.number || page
          } as PaginatedResponse<PropertyUser>;
        }

        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: size,
          number: page
        } as PaginatedResponse<PropertyUser>;
      }),
      catchError(error => {
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: size,
          number: page
        } as PaginatedResponse<PropertyUser>);
      })
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
