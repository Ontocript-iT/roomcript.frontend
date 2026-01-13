import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservationReportService {
  private apiUrl = 'http://localhost:8080/api/reservations/reports';

  constructor(private http: HttpClient) {}

  // Helper to get Property Code
  private get propCode(): string {
    return localStorage.getItem('propertyCode') || 'PROP0005';
  }

  getDailyReport(date: string): Observable<any> {
    const params = new HttpParams().set('propertyCode', this.propCode).set('reportDate', date);
    return this.http.get(`${this.apiUrl}/daily`, { params });
  }

  getDateRangeReport(start: string, end: string): Observable<any> {
    const params = new HttpParams().set('propertyCode', this.propCode).set('startDate', start).set('endDate', end);
    return this.http.get(`${this.apiUrl}/date-range`, { params });
  }

  getArrivalDepartureReport(date: string): Observable<any> {
    const params = new HttpParams().set('propertyCode', this.propCode).set('reportDate', date);
    return this.http.get(`${this.apiUrl}/arrival-departure`, { params });
  }

  getOccupancyReport(start: string, end: string): Observable<any> {
    const params = new HttpParams().set('propertyCode', this.propCode).set('startDate', start).set('endDate', end);
    return this.http.get(`${this.apiUrl}/occupancy`, { params });
  }

  getBookingSourceReport(start: string, end: string): Observable<any> {
    const params = new HttpParams().set('propertyCode', this.propCode).set('startDate', start).set('endDate', end);
    return this.http.get(`${this.apiUrl}/booking-source`, { params });
  }

  getCancellationReport(start: string, end: string): Observable<any> {
    // API expects full timestamp for cancellation, appending time
    const params = new HttpParams()
      .set('propertyCode', this.propCode)
      .set('startDate', `${start}T00:00:00`)
      .set('endDate', `${end}T23:59:59`);
    return this.http.get(`${this.apiUrl}/cancellations`, { params });
  }

  getRevenueByRoomType(start: string, end: string): Observable<any> {
    const params = new HttpParams().set('propertyCode', this.propCode).set('startDate', start).set('endDate', end);
    return this.http.get(`${this.apiUrl}/revenue-by-room-type`, { params });
  }

  getGuestNationalityReport(start: string, end: string): Observable<any> {
    const params = new HttpParams().set('propertyCode', this.propCode).set('startDate', start).set('endDate', end);
    return this.http.get(`${this.apiUrl}/guest-nationality`, { params });
  }

  getMonthlySummary(year: number, month: number): Observable<any> {
    const params = new HttpParams().set('propertyCode', this.propCode).set('year', year).set('month', month);
    return this.http.get(`${this.apiUrl}/monthly-summary`, { params });
  }

  getGroupReservations(start: string, end: string): Observable<any> {
    const params = new HttpParams().set('propertyCode', this.propCode).set('startDate', start).set('endDate', end);
    return this.http.get(`${this.apiUrl}/group-reservations`, { params });
  }

  getLongStays(minNights: number = 7): Observable<any> {
    const params = new HttpParams().set('propertyCode', this.propCode).set('minNights', minNights);
    return this.http.get(`${this.apiUrl}/long-stays`, { params });
  }

  getByStatus(status: string, start: string, end: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propCode)
      .set('status', status)
      .set('startDate', start)
      .set('endDate', end);
    return this.http.get(`${this.apiUrl}/by-status`, { params });
  }
}