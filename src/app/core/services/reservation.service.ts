import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, map, Observable, of} from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation } from '../models/reservation.model';
import { AvailableRooms } from '../models/room.model';
import {tap} from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/reservations`;
  private roomsApiUrl = `${environment.apiUrl}/rooms`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getReservations(propertyCode: string): Observable<Reservation[]> {
    const url = `${environment.apiUrl}/reservations/getAllReservationsByProperty`;

    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    return this.http.get<any>(url, {
      headers: headers
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
          if (response.body && Array.isArray(response.body)) {
            return response.body as Reservation[];
          }else if (response.data && Array.isArray(response.data)) {
            return response.data as Reservation[];
          }

          const keys = Object.keys(response);
          for (const key of keys) {
            if (Array.isArray(response[key])) {
              return response[key] as Reservation[];
            }
          }
        }

        return [];
      }),
      tap(reservations => {
        if (reservations.length > 0) {
          console.log('First reservation sample:', reservations[0]);
        }
      }),
      catchError(error => {
        console.error('Error fetching reservations:', error);
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

  getAvailableRoomsCount(propertyCode: string): Observable<AvailableRooms[]> {
    const url = `${this.roomsApiUrl}/getAvailableRoomsCountForEachType`;

    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        // Extract the body array from the response
        if (response && response.body && Array.isArray(response.body)) {
          return response.body as AvailableRooms[];
        }
        return [];
      }),
      tap(rooms => {
        if (rooms.length > 0) {
          console.log('Room types:', rooms.map(r => r.roomType));
        }
      }),
      catchError(error => {
        console.error('Error fetching available rooms:', error);
        return of([]);
      })
    );
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
