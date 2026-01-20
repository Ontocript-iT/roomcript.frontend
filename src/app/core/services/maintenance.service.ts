// maintenance.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { MaintenanceRequest } from '../models/maintenance.model';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private apiUrl = `${environment.apiUrl}/housekeeping/maintenance`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  getAllMaintenanceRequests(propertyCode: string): Observable<MaintenanceRequest[]> {
    return this.http.get<any>(
      `${this.apiUrl}?propertyCode=${propertyCode}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.result || []),
      tap(maintenanceRequests => {
        console.log('Maintenance requests fetched:', maintenanceRequests);
      })
    );
  }

  assignMaintenanceRequest(requestId: number, userId: number): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${requestId}/assign?userId=${userId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  startMaintenanceWork(requestId: number): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${requestId}/start`,
      {},
      { headers: this.getHeaders() }
    );
  }

  completeMaintenanceWork(requestId: number): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${requestId}/complete`,
      {},
      { headers: this.getHeaders() }
    );
  }

  deleteMaintenanceRequest(id: number, reason: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}?reason=${encodeURIComponent(reason)}`,
      { headers: this.getHeaders() }
    );
  }
}
