import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {catchError, map, Observable, of, throwError} from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AvailableRooms, Room  } from '../models/room.model';


export interface CreateRoomRequest {
  roomNumber: string;
  roomType: string;
  basePrice: number;
  description: string;
  floor: number;
  capacity: number;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  smokingAllowed: boolean;
  hasBalcony: boolean;
  hasSeaView: boolean;
  amenities: string;
  remarks: string;
}

export interface RoomResponse {
  id: number;
  roomNumber: string;
  roomType: string;
  basePrice: number;
  description: string;
  floor: number;
  capacity: number;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  smokingAllowed: boolean;
  hasBalcony: boolean;
  hasSeaView: boolean;
  amenities: string;
  remarks: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = `${environment.apiUrl}/rooms`;

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

  createRoom(roomData: CreateRoomRequest, propertyCode: string): Observable<RoomResponse> {
    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    return this.http.post<RoomResponse>(
      this.apiUrl,
      roomData,
      { headers }
    ).pipe(
      tap(response => {
        console.log('Room creation response:', response);
      })
    );
  }

  getAvailableRoomsCount(
    propertyCode: string,
    checkInDate: string,
    checkOutDate: string
  ): Observable<AvailableRooms[]> {
    const url = `${this.apiUrl}/getAvailableRoomsTypesCountCheckInCheckOutDate`;

    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    return this.http.get<any>(url, {
      headers,
      params: {
        checkInDate: checkInDate,
        checkOutDate: checkOutDate
      }
    }).pipe(
      map(response => {

        let roomsArray: AvailableRooms[] = [];

        let data = response;
        if (response && response.body) {
          data = response.body;
        }

        if (Array.isArray(data)) {
          roomsArray = data as AvailableRooms[];
        }
        else if (data && typeof data === 'object') {
          roomsArray = Object.keys(data).map(roomType => ({
            roomType: roomType,
            availableCount: data[roomType],
            totalCount: 0,
            reservedCount: 0,
            basePrice: 0
          }));
        }

        return roomsArray;
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  getAvailableRoomsByType(
    propertyCode: string,
    roomType: string,
    checkInDate: string,
    checkOutDate: string
  ): Observable<Room[]> {

    const url = `${this.apiUrl}/AvailableRoomsInRoomTypeCheckInCheckOutDate`;

    return this.http.get<any>(url, {
      headers: {
        'X-Property-Code': propertyCode
      },
      params: {
        roomType: roomType,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate
      }
    }).pipe(
      map(response => {
        let roomsArray: Room[] = [];

        if (Array.isArray(response)) {
          roomsArray = response;
        }
        else if (response && response.body && Array.isArray(response.body)) {
          roomsArray = response.body;
        }

        else if (response && response.data && Array.isArray(response.data)) {
          roomsArray = response.data;
        }

        return roomsArray as Room[];
      }),
      catchError(error => {
        console.error(`Error fetching rooms for ${roomType}:`, error);
        return of([]);
      })
    );
  }

  getRoomsByProperty(propertyCode: string): Observable<Room[]> {
    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map(response => {
        let roomsArray: Room[] = [];

        if (Array.isArray(response)) {
          roomsArray = response;
        }
        else if (response && response.body && Array.isArray(response.body)) {
          roomsArray = response.body;
        }
        else if (response && response.data && Array.isArray(response.data)) {
          roomsArray = response.data;
        }

        return roomsArray as Room[];
      }),
      catchError(error => {
        console.error('Error fetching rooms for property:', error);
        return of([]);
      })
    );
  }

  updateRoom(roomId: number, roomData: CreateRoomRequest): Observable<RoomResponse> {
    const url = `${this.apiUrl}/${roomId}`;
    const headers = this.getHeaders();

    return this.http.put<RoomResponse>(url, roomData, { headers }).pipe(
      tap(response => {
        console.log(`Room ${roomId} updated successfully:`, response);
      }),
      catchError(error => {
        console.error(`Error updating room ${roomId}:`, error);
        throw error;
      })
    );
  }

  removeRoom(roomId: number): Observable<any> {
    const url = `${this.apiUrl}/${roomId}`;
    const headers = this.getHeaders();

    return this.http.delete(url, {
      headers,
      responseType: 'text' as 'json'
    }).pipe(
      tap(() => console.log(`Room ${roomId} deleted successfully`)),
      catchError(error => {
        console.error(`Error deleting room ${roomId}:`, error);
        throw error;
      })
    );
  }

  updateRoomStatus(roomId: number, newStatus: string, reason: string): Observable<any> {
    const url = `${environment.apiUrl}/housekeeping/rooms/${roomId}/status`;
    const headers = this.getHeaders();

    return this.http.put(url, null, {
      headers,
      params: {
        newStatus: newStatus,
        reason: reason
      }
    }).pipe(
      catchError(error => {
        console.error(`Error updating room ${roomId} status:`, error);
        throw error;
      })
    );
  }

  updateReservationRoomStatus(
    roomConfirmationNumber: string,
    status: string
  ): Observable<any> {
    const url = `${environment.apiUrl}/reservations/reservation-room/${roomConfirmationNumber}/status`;
    const headers = this.getHeaders();

    return this.http.put(url, null, {
      headers,
      params: {
        status: status
      }
    }).pipe(
      tap(response => {
        console.log(`Room ${roomConfirmationNumber} status updated to ${status}:`, response);
      }),
      catchError(error => {
        console.error(`Error updating room ${roomConfirmationNumber} status:`, error);
        return throwError(() => error);
      })
    );
  }
}
