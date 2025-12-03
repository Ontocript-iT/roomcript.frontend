import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {Property, PropertyResponse} from '../models/property.model';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private apiUrl = `${environment.apiUrl}/properties`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  createProperty(propertyData: Property): Observable<PropertyResponse> {
    return this.http.post<PropertyResponse>(this.apiUrl, propertyData, {
      headers: this.getHeaders(),
    });
  }

  // getAllProperties(): Observable<PropertyResponse[]> {
  //   return this.http.get<PropertyResponse[]>(this.apiUrl, { headers: this.getHeaders() });
  // }

  getPropertyById(id: number): Observable<PropertyResponse> {
    return this.http.get<PropertyResponse>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  updateProperty(id: number, propertyData: Property): Observable<PropertyResponse> {
    return this.http.put<PropertyResponse>(`${this.apiUrl}/${id}`, propertyData, {
      headers: this.getHeaders(),
    });
  }

  deleteProperty(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getAllProperties(): Observable<PropertyResponse[]> {
    return this.http.get<any>(
      `${environment.apiUrl}/properties/getAllProperties`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.body || response),
      tap(properties => {
        console.log('Properties fetched:', properties);
      })
    );
  }
}
