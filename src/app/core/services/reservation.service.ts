import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, map, Observable, of} from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation } from '../models/reservation.model';
import {tap} from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/reservations`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getReservations(): Observable<Reservation[]> {
    return this.http.get<any>(this.apiUrl, {
      headers: this.getHeaders()
    }).pipe(
      tap(rawResponse => {
        if (rawResponse && typeof rawResponse === 'object' && !Array.isArray(rawResponse)) {
          console.log('Response keys:', Object.keys(rawResponse));
        }
      }),
      map(response => {
        // If response is already an array, return it directly
        if (Array.isArray(response)) {
          console.log('✅ Response is direct array, length:', response.length);
          return response as Reservation[];
        }

        // If response is an object, look for array in properties
        if (response && typeof response === 'object') {
          // Check if response.body contains the array
          if (response.body && Array.isArray(response.body)) {
            console.log('✅ Found array in response.body');
            return response.body as Reservation[];
          }

          // Check if response.data contains the array
          if (response.data && Array.isArray(response.data)) {
            console.log('✅ Found array in response.data');
            return response.data as Reservation[];
          }

          const keys = Object.keys(response);
          for (const key of keys) {
            if (Array.isArray(response[key])) {
              console.log(`✅ Found array in response.${key}`);
              return response[key] as Reservation[];
            }
          }
        }

        return [];
      }),
      tap(reservations => {
        console.log('Reservations count:', reservations.length);
        if (reservations.length > 0) {
          console.log('First reservation sample:', reservations[0]);
        }
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  getReservationById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/${id}`);
  }

  createReservation(reservation: Partial<Reservation>): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reservation);
  }

  createGroupReservation(propertyCode: string, reservationData: any): Observable<any> {
    const url = `${this.apiUrl}/addGroupReservation?PropertyCode=${propertyCode}`;
    return this.http.post(url, reservationData);
  }

  updateReservation(id: number, reservation: Partial<Reservation>): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}`, reservation);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
