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

  // getMaintenanceRequestById(id: number): Observable<MaintenanceRequest> {
  //   return this.http.get<MaintenanceRequest>(`${this.apiUrl}/${id}`, {
  //     headers: this.getHeaders()
  //   });
  // }
  //
  // createMaintenanceRequest(requestData: Partial<MaintenanceRequest>): Observable<any> {
  //   return this.http.post<any>(this.apiUrl, requestData, {
  //     headers: this.getHeaders(),
  //   });
  // }
  //
  // updateMaintenanceRequest(id: number, requestData: Partial<MaintenanceRequest>): Observable<any> {
  //   return this.http.put<any>(`${this.apiUrl}/${id}`, requestData, {
  //     headers: this.getHeaders(),
  //   });
  // }
  //
  // deleteMaintenanceRequest(id: number): Observable<void> {
  //   return this.http.delete<void>(`${this.apiUrl}/${id}`, {
  //     headers: this.getHeaders()
  //   });
  // }
}
