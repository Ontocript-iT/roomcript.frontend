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

// ===========================Operational Reports==========================

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

// ======================Performance Reports=============================

  getPerformanceReport(reportType: string, filters: any): Observable<any[]> {
    switch (reportType) {
      case 'occupancy':
        return this.getOccupancyReport(filters.startDate, filters.endDate);

      case 'reservation-date-range':
        return this.getReservationsByDateRange(filters.startDate, filters.endDate);

      case 'reservation-status':
        return this.getReservationsByStatus(filters.status, filters.startDate, filters.endDate);

      case 'monthly-reservation':
        return this.getMonthlySummary(filters.year, filters.month);

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  getOccupancyReport(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/occupancy`, { params })
      .pipe(
        map(response => {

          if (response && response.result) {
            const roomTypeData = response.result.roomTypeOccupancy || {};
            const dataArray = Object.values(roomTypeData);

            return {
              data: dataArray,
              summary: {
                startDate: response.result.startDate,
                endDate: response.result.endDate,
                totalRooms: response.result.totalRooms,
                occupiedRooms: response.result.occupiedRooms,
                availableRooms: response.result.availableRooms,
                occupancyPercentage: response.result.occupancyPercentage,
                totalGuests: response.result.totalGuests,
                averageRoomRate: response.result.averageRoomRate,
                totalRevenue: response.result.totalRevenue
              }
            };
          }

          return { data: [], summary: null };
        })
      );
  }

  getReservationsByDateRange(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/date-range`, { params })
      .pipe(
        map(response => {

          if (response && response.result) {

            return {
              data: response.result.reservations || [],
              summary: {
                startDate: response.result.startDate,
                endDate: response.result.endDate,
                totalReservations: response.result.totalReservations,
                totalRevenue: response.result.totalRevenue,
                totalPaid: response.result.totalPaid,
                totalOutstanding: response.result.totalOutstanding
              }
            };
          }

          return { data: [], summary: null };
        })
      );
  }

  getReservationsByStatus(status: string, startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('status', status)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/by-status`, { params })
      .pipe(
        map(response => {

          if (response && response.result) {

            return {
              data: response.result.reservations || [],
              summary: {
                status: response.result.status,
                startDate: response.result.startDate,
                endDate: response.result.endDate,
                totalReservations: response.result.totalReservations,
                totalAmount: response.result.totalAmount
              }
            };
          }

          return { data: [], summary: null };
        })
      );
  }

  getMonthlySummary(year: number, month: number): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http.get<any>(`${this.apiUrl}/monthly-summary`, { params })
      .pipe(
        map(response => {

          if (response && response.result) {

            return {
              data: response.result.dailyOccupancy || [],
              summary: {
                year: response.result.year,
                month: response.result.month,
                monthName: response.result.monthName,
                totalReservations: response.result.totalReservations,
                totalRooms: response.result.totalRooms,
                totalGuests: response.result.totalGuests,
                totalRevenue: response.result.totalRevenue,
                averageRoomRate: response.result.averageRoomRate,
                occupancyPercentage: response.result.occupancyPercentage,
                cancellations: response.result.cancellations,
                noShows: response.result.noShows
              }
            };
          }

          return { data: [], summary: null };
        })
      );
  }

  setPropertyCode(code: string): void {
    this.propertyCode = code;
  }

}
