import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable, of} from 'rxjs';
import { delay } from 'rxjs/operators';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationReportService {
  private apiUrl = `${environment.apiUrl}/reservations/reports`;
  private propertyCode = localStorage.getItem('propertyCode') || "";

  constructor(private http: HttpClient) {}

  getOperationalReport(reportType: string, filters: any): Observable<any[]> {
    switch (reportType) {
      case 'arrival-departure':
        return this.getArrivalDepartureReport(filters.reportDate || filters.dateFrom);

      case 'daily-reservation':
        return this.getDailyReservationReport(filters.reportDate || filters.dateFrom);

      case 'group-reservation':
        return this.getGroupReservationReport(filters.dateFrom, filters.dateTo);

      case 'long-stay':
        return this.getLongStayReport(filters.minNights || 7); // Default 7 nights

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  getArrivalDepartureReport(reportDate: string): Observable<any[]> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('reportDate', reportDate);

    return this.http.get<any>(`${this.apiUrl}/arrival-departure`, { params })
      .pipe(
        map(response => {
          console.log('Raw API response:', response);

          // Extract arrivals and departures from the response
          if (response && response.result) {
            const arrivals = response.result.arrivals || [];
            const departures = response.result.departures || [];

            console.log('Arrivals:', arrivals);
            console.log('Departures:', departures);

            // Combine both arrays
            return [...arrivals, ...departures];
          }

          return [];
        })
      );
  }

  getDailyReservationReport(reportDate: string): Observable<any[]> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('reportDate', reportDate);

    return this.http.get<any>(`${this.apiUrl}/daily`, { params })
      .pipe(
        map(response => {
          console.log('Daily Report API response:', response);

          if (response && response.result) {
            // Adjust based on your actual API response structure
            return response.result.reservations || response.result || [];
          }

          return [];
        })
      );
  }

  getGroupReservationReport(startDate: string, endDate: string): Observable<any[]> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/group-reservations`, { params })
      .pipe(
        map(response => {
          console.log('Group Reservations API response:', response);

          if (response && response.result) {
            // Adjust based on your actual API response structure
            return response.result.groupReservations || response.result || [];
          }

          return [];
        })
      );
  }

  getLongStayReport(minNights: number): Observable<any[]> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('minNights', minNights.toString());

    return this.http.get<any>(`${this.apiUrl}/long-stays`, { params })
      .pipe(
        map(response => {
          console.log('Long Stay API response:', response);

          if (response && response.result) {
            // Adjust based on your actual API response structure
            return response.result.longStays || response.result || [];
          }

          return [];
        })
      );
  }

  setPropertyCode(code: string): void {
    this.propertyCode = code;
  }

}
