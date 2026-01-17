import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders,HttpParams} from '@angular/common/http';
import {catchError, map, Observable, of, throwError} from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation, ReservationFilter, MaintenanceBlock } from '../models/reservation.model';
import { AuthService } from './auth.service';
import {tap} from 'rxjs/operators';


// ========== ADDED: Stay View Interfaces START ==========
export interface StayViewReservation {
  id: number;
  confirmationNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paymentStatus: string;
  checkInStatus: boolean;
  checkOutStatus: boolean;
  numberOfGuests: number;
  specialRequests: string;
}

export interface StayViewRoom {
  roomId: number | null;
  roomNumber: string;
  reservationCount: number;
  reservations: StayViewReservation[];
}

export interface StayViewRoomType {
  roomType: string;
  totalRooms: number;
  totalReservations: number;
  rooms: StayViewRoom[];
}

// ========== ADDED: Stay View Interfaces END ==========

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

        if (response && response.body && Array.isArray(response.body)) {
          reservations = response.body;
        }

        else if (Array.isArray(response)) {
          reservations = response;
        }
        else if (response && typeof response === 'object') {
          if (response.data && Array.isArray(response.data)) {
            reservations = response.data;
          } else {
            const keys = Object.keys(response);
            for (const key of keys) {
              if (Array.isArray(response[key])) {
                reservations = response[key];
                break;
              }
            }
          }
        }
        return reservations as Reservation[];
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  createGroupReservation(propertyCode: string, reservationData: any): Observable<any> {
    const url = `${this.apiUrl}/addGroupReservation?PropertyCode=${propertyCode}`;
    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    return this.http.post<any>(url, reservationData, {
      headers: headers,
      observe: 'response'
    }).pipe(
      map((response: any) => {
        let data = response.body;

        if (data && typeof data === 'object') {
          if (data.body) {
            data = data.body;
          }

          if (data.folioId || data.folioNumber) {
          }
        }

        return data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  updateReservation(id: number, reservationData: any): Observable<any> {
    const url = `${this.apiUrl}/${id}`;

    // 👇 Log before sending
    console.log('PUT URL:', url);
    console.log('PUT Payload:', reservationData);

    return this.http.put<any>(url, reservationData, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('PUT Response:', response)), // 👈 Log success response
      catchError(error => {
        console.error('PUT Error:', error.status, error.message);
        console.error('Error body:', error.error);
        return throwError(() => error);
      })
    );
  }


  updateCheckInAndCheckOutStatus(
    reservationId: number,
    isCheckedIn: boolean,
    isCheckedOut: boolean
  ): Observable<any> {
    const url = `${this.apiUrl}/updateCheckInAndCheckOutStatus?reservationId=${reservationId}&isCheckedIn=${isCheckedIn ? 1 : 0}&isCheckedOut=${isCheckedOut ? 1 : 0}`;

    return this.http.post<any>(url, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  cancelReservation(reservationId: number, reason: string): Observable<any> {
    const url = `${this.apiUrl}/${reservationId}/cancel`;

    const params = new HttpParams().set('reason', reason);

    return this.http.delete<any>(url, {
      headers: this.getHeaders(),
      params: params
    }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  // ========== ADDED: Stay View Method END ==========

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getFilteredReservations(
    filters: Partial<ReservationFilter>,
    propertyCode: string
  ): Observable<Reservation[]> {
    const url = `${this.apiUrl}/filter`;
    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<any>(url, { headers, params }).pipe(
      map(response => {
        let data: any[] = [];
        if (response?.body && Array.isArray(response.body)) {
          data = response.body;
        } else if (Array.isArray(response)) {
          data = response;
        }

        return data.map(item => {
          const reservation: any = {
            id: item.id,
            confirmationNumber: item.confirmationNumber,
            name: item.guestName || item.name || 'N/A',
            email: item.guestEmail || item.email || '',
            phone: item.guestPhone || item.phone || '',
            checkInDate: item.checkInDate,
            checkOutDate: item.checkOutDate,
            totalAmount: item.totalAmount || 0,
            status: item.status || 'PENDING',
            paymentStatus: item.paymentStatus,
            roomCount: item.roomCount || 0,
            groupReservationId: item.groupReservationId,
            reservationType: item.reservationType,
            bookingSource: item.bookingSource,
            specialRequests: item.specialRequests,

            roomDetails: item.roomDetails && Array.isArray(item.roomDetails)
              ? item.roomDetails
              : item.rooms && Array.isArray(item.rooms)
                ? item.rooms
                : (item.roomNumber && item.roomType)
                  ? [{
                    roomId: item.roomId,
                    roomNumber: item.roomNumber,
                    roomType: item.roomType,
                    roomRate: item.currentRate || item.roomRate || 0,
                    numberOfAdults: item.numberOfAdults || 0,
                    numberOfChildren: item.numberOfChildren || 0,
                  }]
                  : []
          };
          return reservation as Reservation;
        });
      }),
      catchError(err => {
        return of([]);
      })
    );
  }

  moveExistingRoom(assignmentData: any): Observable<any> {
    const url = `${this.apiUrl}/moveExistingRoomsOfReservation`;

    return this.http.post<any>(url, assignmentData, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        const bodyStatusCode = response.body?.statusCode || response.statusCode;

        if (bodyStatusCode === 'BAD_REQUEST' || response.status === 400) {
          const errorMsg = response.body?.error || 'Move operation failed';
          throw new Error(errorMsg);
        }

        return response.body;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  assignRooms(assignmentData: any): Observable<any> {
    const url = `${this.apiUrl}/assignRooms`;

    return this.http.post<any>(url, assignmentData, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        const bodyStatusCode = response.body?.statusCode || response.statusCode;

        if (bodyStatusCode === 'BAD_REQUEST' || response.status === 400) {
          const errorMsg = response.body?.error || 'Assign operation failed';
          throw new Error(errorMsg);
        }

        return response.body;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  deleteRoomFromReservation(reservationId: number, roomConfirmationNumber: string): Observable<any> {
    const params = { reservationId: reservationId.toString(), roomConfirmationNumber };
    return this.http.delete<any>(`${this.apiUrl}/deleteRoomByReservation`, {
      headers: this.getHeaders(),
      params
    });
  }

  createMaintenanceBlock(blockData: {
    roomId: string;
    propertyCode: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Observable<any> {
    const url = `${environment.apiUrl}/maintenance-blocks`;

    return this.http.post<any>(url, blockData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  getMaintenanceBlocks(propertyCode: string): Observable<MaintenanceBlock[]> {
    const url = `${environment.apiUrl}/maintenance-blocks/property/${propertyCode}`;

    const headers = this.getHeaders();

    return this.http.get<any>(url, {
      headers: headers
    }).pipe(
      map(response => {
        let maintenanceBlocks: MaintenanceBlock[] = [];

        if (response && response.body && Array.isArray(response.body)) {
          maintenanceBlocks = response.body;
        } else if (Array.isArray(response)) {
          maintenanceBlocks = response;
        }
        return maintenanceBlocks;
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  deleteMaintenanceBlock(blockId: number, roomId: string): Observable<any> {
    const propertyCode = localStorage.getItem('propertyCode') || '';
    const url = `${environment.apiUrl}/maintenance-blocks/${blockId}`;
    const headers = this.getHeaders();

    return this.http.delete(url, {
      headers: headers,
      params: {
        roomId: roomId,
        blockId: blockId.toString(),
        propertyCode: propertyCode
      }
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getReservationById(id: number): Observable<Reservation> {
    const url = `${this.apiUrl}/${id}`;

    const propertyCode = localStorage.getItem('propertyCode') || '';
    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    return this.http.get<any>(url, { headers }).pipe(
      map((response: any) => {
        if (response?.body) {
          return response.body;
        }
        return response;
      }),
      catchError(error => {
        throw error;
      })
    );
  }
}
