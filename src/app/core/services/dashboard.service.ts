import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface GuestCountResponse {
  headers: any;
  body: {
    checkedOutCount: number;
    checkedInCount: number;
  };
  statusCode: string;
  statusCodeValue: number;
}

export interface GuestCount {
  checkedInCount: number;
  checkedOutCount: number;
}

export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
}

export interface RevenueStats {
  todayRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

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

  /**
   * Get checked-in and checked-out guest counts
   */
  getGuestCounts(propertyCode: string): Observable<GuestCount> {
    const params = new HttpParams().set('propertyCode', propertyCode);
    
    return this.http.get<GuestCountResponse>(
      `${environment.apiUrl}/properties/getCheckedInCheckedOutGuestsCount`,
      {
        headers: this.getHeaders(),
        params: params
      }
    ).pipe(
      map(response => ({
        checkedInCount: response.body.checkedInCount,
        checkedOutCount: response.body.checkedOutCount
      })),
      catchError(error => {
        console.error('Error fetching guest counts:', error);
        return of({ checkedInCount: 0, checkedOutCount: 0 });
      })
    );
  }

  /**
   * Get dashboard statistics
   * TODO: Replace with actual API endpoint when available
   */
  getDashboardStats(propertyCode: string): Observable<DashboardStats> {
    // Mock data - replace with actual API call
    return of({
      totalRooms: 120,
      occupiedRooms: 85,
      availableRooms: 35,
      occupancyRate: 70.8
    });
  }

  /**
   * Get revenue statistics
   * TODO: Replace with actual API endpoint when available
   */
  getRevenueStats(propertyCode: string): Observable<RevenueStats> {
    // Mock data - replace with actual API call
    return of({
      todayRevenue: 125000,
      monthRevenue: 3500000,
      yearRevenue: 42000000
    });
  }

  /**
   * Get all dashboard data at once
   */
  getAllDashboardData(propertyCode: string): Observable<{
    guestCounts: GuestCount;
    dashboardStats: DashboardStats;
    revenueStats: RevenueStats;
  }> {
    return forkJoin({
      guestCounts: this.getGuestCounts(propertyCode),
      dashboardStats: this.getDashboardStats(propertyCode),
      revenueStats: this.getRevenueStats(propertyCode)
    });
  }
}
