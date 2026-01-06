import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ReservationRoomDetails } from '../models/folio.model';
import {environment} from '../../../environments/environment';
import { FolioDetails} from '../models/folio.model';

@Injectable({
  providedIn: 'root'
})
export class FolioService {

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

  getFoliosByReservationId(
    reservationId: number,
    propertyCode: string
  ): Observable<FolioDetails[]> {
    const url = `${environment.apiUrl}/folios/reservation/${reservationId}`;
    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    return this.http.get<any>(url, {
      headers: headers
    }).pipe(
      map(response => {
        let folios: FolioDetails[] = [];

        if (response && response.body && Array.isArray(response.body)) {
          folios = response.body;
        }
        else if (Array.isArray(response)) {
          folios = response;
        }
        else if (response && response.data && Array.isArray(response.data)) {
          folios = response.data;
        }
        else if (response && typeof response === 'object') {
          const keys = Object.keys(response);
          for (const key of keys) {
            if (Array.isArray(response[key])) {
              folios = response[key];
              break;
            }
          }
        }

        return folios as FolioDetails[];
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  getFolioById(
    folioId: number,
    propertyCode: string
  ): Observable<FolioDetails | null> {
    const url = `${environment.apiUrl}/folios/${folioId}`;
    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    return this.http.get<any>(url, {
      headers: headers
    }).pipe(
      map(response => {
        let folio: FolioDetails | null = null;

        if (response && response.body && typeof response.body === 'object') {
          folio = response.body as FolioDetails;
        }
        else if (response && response.data && typeof response.data === 'object') {
          folio = response.data as FolioDetails;
        }
        else if (response && typeof response === 'object') {
          folio = response as FolioDetails;
        }

        return folio;
      }),
      catchError(error => {
        return of(null);
      })
    );
  }

  createFolio(
    reservationId: number,
    guestId: number | null,
    folioType: string,
    createdBy: string,  // Required, not null
    propertyCode: string
  ): Observable<FolioDetails | null> {
    const url = `${environment.apiUrl}/folios/create`;
    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    let params = new HttpParams()
      .set('reservationId', reservationId.toString())
      .set('folioType', folioType)
      .set('createdBy', createdBy);

    if (guestId !== null) {
      params = params.set('guestId', guestId.toString());
    }

    return this.http.post<any>(url, null, {
      headers: headers,
      params: params
    }).pipe(
      map(response => {
        let folio: FolioDetails | null = null;

        if (response && response.body && typeof response.body === 'object') {
          folio = response.body as FolioDetails;
        }
        else if (response && response.data && typeof response.data === 'object') {
          folio = response.data as FolioDetails;
        }
        else if (response && typeof response === 'object') {
          folio = response as FolioDetails;
        }

        return folio;
      }),
      catchError(error => {
        return of(null);
      })
    );
  }

  getReservationDetailsById(
    reservationId: number
  ): Observable<ReservationRoomDetails | null> {
    const url = `${environment.apiUrl}/reservations/getReservationDetailsById/${reservationId}`;
    const headers = this.getHeaders();

    return this.http.get<any>(url, {
      headers: headers
    }).pipe(
      map(response => {
        let reservationDetails: ReservationRoomDetails | null = null;

        if (response && response.body && typeof response.body === 'object') {
          reservationDetails = response.body as ReservationRoomDetails;
        }
        else if (response && response.data && typeof response.data === 'object') {
          reservationDetails = response.data as ReservationRoomDetails;
        }
        else if (response && typeof response === 'object') {
          reservationDetails = response as ReservationRoomDetails;
        }

        return reservationDetails;
      }),
      catchError(error => {
        console.error('Error fetching reservation details:', error);
        return of(null);
      })
    );
  }
}
