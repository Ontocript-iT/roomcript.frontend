import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

// ===== GUEST INTERFACES: Define data structures for guest operations =====

export interface CreateGuestRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  propertyCode?: string;
}

export interface GuestResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinedAt: string;
  isActive: boolean;
  propertyCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateGuestRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GuestService {
  // ===== API URL: Base endpoint for guest operations =====
  private apiUrl = `${environment.apiUrl}/guests`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ===== AUTHORIZATION HEADERS: Include Bearer token for authenticated requests =====
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ===== GET ALL GUESTS: Fetch complete list of guests =====
  getAllGuests(): Observable<GuestResponse[]> {
    console.log('Fetching all guests...');

    return this.http.get<any>(
      this.apiUrl,
      { headers: this.getHeaders() }
    ).pipe(
      tap(rawResponse => {
        if (rawResponse && typeof rawResponse === 'object' && !Array.isArray(rawResponse)) {
          console.log('Response keys:', Object.keys(rawResponse));
        }
      }),
      map(response => {
        // If response is already an array, return it directly
        if (Array.isArray(response)) {
          console.log('✅ Response is direct array, length:', response.length);
          return response as GuestResponse[];
        }

        // If response has a 'body' property containing array
        if (response && typeof response === 'object') {
          if (response.body && Array.isArray(response.body)) {
            return response.body as GuestResponse[];
          }

          // Search for any array property in response object
          const keys = Object.keys(response);
          for (const key of keys) {
            if (Array.isArray(response[key])) {
              return response[key] as GuestResponse[];
            }
          }
        }

        // Return empty array if no array found
        return [];
      }),
      tap(guests => {
        console.log('Guests count:', guests.length);
        if (guests.length > 0) {
          console.log('First guest sample:', guests[0]);
        }
      })
    );
  }

  // ===== GET GUEST BY ID: Fetch single guest details =====
  getGuestById(id: number): Observable<GuestResponse> {
    console.log('Fetching guest with ID:', id);

    return this.http.get<GuestResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('Guest details retrieved:', response);
      })
    );
  }

  // ===== CREATE GUEST: Add new guest to system =====
  createGuest(guestData: CreateGuestRequest): Observable<GuestResponse> {
    console.log('Creating guest with data:', guestData);

    return this.http.post<GuestResponse>(
      this.apiUrl,
      guestData,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('Guest creation response:', response);
      })
    );
  }

  // ===== UPDATE GUEST: Modify existing guest information =====
  updateGuest(id: number, guestData: UpdateGuestRequest): Observable<GuestResponse> {
    console.log('Updating guest with ID:', id, 'Data:', guestData);

    return this.http.put<GuestResponse>(
      `${this.apiUrl}/${id}`,
      guestData,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('Guest update response:', response);
      })
    );
  }

  // ===== DELETE GUEST: Remove guest from system =====
  deleteGuest(id: number): Observable<any> {
    console.log('Deleting guest with ID:', id);

    return this.http.delete(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('Guest deleted successfully:', response);
      })
    );
  }

  // ===== DEACTIVATE GUEST: Mark guest as inactive =====
  deactivateGuest(id: number): Observable<any> {
    console.log('Deactivating guest with ID:', id);

    return this.http.post(
      `${this.apiUrl}/${id}/deactivate`,
      null,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('Guest deactivated:', response);
      })
    );
  }

  // ===== ACTIVATE GUEST: Mark guest as active =====
  activateGuest(id: number): Observable<any> {
    console.log('Activating guest with ID:', id);

    return this.http.post(
      `${this.apiUrl}/${id}/activate`,
      null,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('Guest activated:', response);
      })
    );
  }

  // ===== SEARCH GUESTS: Find guests by search term =====
  searchGuests(searchTerm: string): Observable<GuestResponse[]> {
    console.log('Searching guests with term:', searchTerm);

    const params = { search: searchTerm };
    return this.http.get<GuestResponse[]>(
      `${this.apiUrl}/search`,
      {
        headers: this.getHeaders(),
        params
      }
    ).pipe(
      tap(results => {
        console.log('Search results count:', results.length);
      })
    );
  }

  // ===== GET ACTIVE GUESTS: Fetch only active guests =====
  getActiveGuests(): Observable<GuestResponse[]> {
    console.log('Fetching active guests...');

    return this.http.get<GuestResponse[]>(
      `${this.apiUrl}/active`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(guests => {
        console.log('Active guests count:', guests.length);
      })
    );
  }
}
