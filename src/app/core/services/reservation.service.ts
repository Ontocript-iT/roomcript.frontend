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
      map(response => {
        let reservations: any[] = [];

        // Check if response has a 'body' property
        if (response && response.body && Array.isArray(response.body)) {
          console.log('Extracted from response.body, length:', response.body.length);
          reservations = response.body;
        }
        // If response is already an array
        else if (Array.isArray(response)) {
          console.log('Response is direct array, length:', response.length);
          reservations = response;
        }
        // If response is an object
        else if (response && typeof response === 'object') {
          if (response.data && Array.isArray(response.data)) {
            reservations = response.data;
          } else {
            const keys = Object.keys(response);
            for (const key of keys) {
              if (Array.isArray(response[key])) {
                console.log(`Found array in response.${key}`);
                reservations = response[key];
                break;
              }
            }
          }
        }
        return reservations as Reservation[];
      }),
      catchError(error => {
        console.error('Error fetching reservations:', error);
        return of([]);
      })
    );
  }

  getReservationById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  createReservation(reservation: Partial<Reservation>): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reservation);
  }

  createGroupReservation(propertyCode: string, reservationData: any): Observable<any> {
    const url = `${this.apiUrl}/addGroupReservation?PropertyCode=${propertyCode}`;
    return this.http.post(url, reservationData);
  }

  updateReservation(id: number, reservationData: any): Observable<any> {
    const url = `${this.apiUrl}/${id}`;

    console.log('🔄 Updating reservation:', {
      url: url,
      reservationId: id,
      data: reservationData
    });

    return this.http.put<any>(url, reservationData, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('Reservation updated successfully:', response);
      }),
      catchError(error => {
        console.error('Error updating reservation:', error);
        throw error;
      })
    );
  }

  updateCheckInAndCheckOutStatus(
    reservationId: number,
    isCheckedIn: boolean,
    isCheckedOut: boolean
  ): Observable<any> {
    const url = `${this.apiUrl}/updateCheckInAndCheckOutStatus?reservationId=${reservationId}&isCheckedIn=${isCheckedIn ? 1 : 0}&isCheckedOut=${isCheckedOut ? 1 : 0}`;

    console.log('🔄 Updating check-in/out status:', {
      url: url,
      reservationId: reservationId,
      isCheckedIn: isCheckedIn,
      isCheckedOut: isCheckedOut
    });

    return this.http.post<any>(url, {}, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('Check-in/out status updated successfully:', response);
      }),
      catchError(error => {
        console.error('Error updating check-in/out status:', error);
        throw error;
      })
    );
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
