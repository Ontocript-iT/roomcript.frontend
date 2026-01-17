import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {AuthService} from './auth.service';
import {Guest, InhouseGuest, GuestDetails} from '../models/guest.model';

@Injectable({
  providedIn: 'root'
})
export class GuestService {
  private apiUrl = `${environment.apiUrl}/properties/getAllGuestsByPropertyCode`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken?.() ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  deleteGuest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateGuest(id: number, guest: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, guest);
  }

  getAllGuests(propertyCode: string): Observable<Guest[]> {
    const params = { propertyCode };
    return this.http.get<any>(
      this.apiUrl,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(response => {
        if (Array.isArray(response.body)) {
          return response.body.map((guest: any) => ({
            id: guest.id,
            name: guest.name ?? `${guest.firstName ?? ''} ${guest.lastName ?? ''}`.trim(),
            phone: guest.phone ?? '',
            email: guest.email ?? '',
            address: guest.address ?? '',
          }));
        }
        return [];
      }),
      tap(guests => {
        console.log('Guests count:', guests.length);
        if (guests.length > 0) console.log('First guest sample:', guests[0]);
      })
    );
  }

  getInHouseGuests(propertyCode: string): Observable<InhouseGuest[]> {
    const headers = this.getHeaders().set('X-Property-Code', propertyCode);

    return this.http.get<any>(
      `${environment.apiUrl}/reservations/getInHouseGuests`,
      { headers }
    ).pipe(
      map(response => {
        if (response?.body?.inHouseGuests && Array.isArray(response.body.inHouseGuests)) {
          return response.body.inHouseGuests.map((guest: any) => {
            return {
              ...guest,
              roomNumber: guest.roomDetails?.[0]?.roomNumber || null,
              roomType: guest.roomDetails?.[0]?.roomType || null
            };
          }) as InhouseGuest[];
        }

        return [];
      }),
      tap(guests => {
        if (guests.length > 0) console.log('First guest sample:', guests[0]);
      })
    );
  }

  getGuestDetailsByGuestId(guestId: number): Observable<GuestDetails> {
    return this.http.get<any>(
      `${environment.apiUrl}/properties/getGuestDetailsByGuestId/${guestId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.body || response),
      tap(guestDetails => {
        console.log('Guest details:', guestDetails);
      })
    );
  }

}
