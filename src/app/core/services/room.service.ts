import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {catchError, map, Observable, of} from 'rxjs';
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

  createRoom(roomData: CreateRoomRequest): Observable<RoomResponse> {
    console.log('Creating room with data:', roomData);

    return this.http.post<RoomResponse>(
      this.apiUrl,
      roomData,
      { headers: this.getHeaders() }
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
}
