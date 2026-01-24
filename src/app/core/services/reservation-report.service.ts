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

// ============================Marketing Insights===================================

  getMarketingReport(reportType: string, filters: any): Observable<any> {
    switch (reportType) {
      case 'booking-source':
        return this.getBookingSourceReport(filters.startDate, filters.endDate);
      case 'guest-nationality':
        return this.getGuestNationalityReport(filters.startDate, filters.endDate);
      case 'advance-bookings':
        return this.getAdvanceBookingsReport();
      default:
        return new Observable(observer => {
          observer.error({ message: 'Invalid report type' });
        });
    }
  }

  getBookingSourceReport(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/booking-source`, { params })
      .pipe(
        map(response => {
          console.log('Booking Source API response:', response);

          if (response && response.result) {
            const bookingSources = response.result.bookingSources || [];

            // Transform data to match table columns
            const data = bookingSources.map((source: any) => ({
              source: source.bookingSource,
              totalBookings: source.totalReservations,
              totalRevenue: source.totalRevenue,
              averageBookingValue: source.totalReservations > 0
                ? source.totalRevenue / source.totalReservations
                : 0,
              percentageOfTotal: source.percentage
            }));

            // Find top source (highest revenue)
            const topSource = bookingSources.length > 0
              ? bookingSources.reduce((prev: any, current: any) =>
                (prev.totalRevenue > current.totalRevenue) ? prev : current
              ).bookingSource
              : '-';

            return {
              data: data,
              summary: {
                startDate: response.result.startDate,
                endDate: response.result.endDate,
                totalBookings: response.result.totalReservations,
                totalRevenue: response.result.totalRevenue,
                averageBookingValue: response.result.totalReservations > 0
                  ? response.result.totalRevenue / response.result.totalReservations
                  : 0,
                topSource: topSource
              }
            };
          }

          return { data: [], summary: null };
        })
      );
  }

  getGuestNationalityReport(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/guest-nationality`, { params })
      .pipe(
        map(response => {
          console.log('Guest Nationality API response:', response);

          if (response && response.result) {
            const nationalities = response.result.nationalities || [];

            // Transform data to match table columns
            // Filter out empty country names and calculate revenue if available
            const data = nationalities
              .filter((nat: any) => nat.country && nat.country.trim() !== '')
              .map((nat: any) => ({
                nationality: nat.country,
                totalGuests: nat.totalGuests,
                totalBookings: nat.totalReservations,
                totalRevenue: nat.totalRevenue || 0, // If revenue is not in response
                percentageOfTotal: nat.percentage
              }));

            // Find top nationality (highest guest count)
            const topNationality = nationalities.length > 0
              ? nationalities
                .filter((nat: any) => nat.country && nat.country.trim() !== '')
                .reduce((prev: any, current: any) =>
                  (prev.totalGuests > current.totalGuests) ? prev : current
                ).country
              : '-';

            // Calculate total revenue (if not provided, set to 0)
            const totalRevenue = nationalities.reduce((sum: number, nat: any) =>
              sum + (nat.totalRevenue || 0), 0
            );

            return {
              data: data,
              summary: {
                startDate: response.result.startDate,
                endDate: response.result.endDate,
                totalBookings: nationalities.reduce((sum: number, nat: any) =>
                  sum + nat.totalReservations, 0
                ),
                totalRevenue: totalRevenue,
                averageBookingValue: data.length > 0 && totalRevenue > 0
                  ? totalRevenue / data.reduce((sum: number, d: any) => sum + d.totalBookings, 0)
                  : 0,
                topNationality: topNationality,
                totalGuests: response.result.totalGuests
              }
            };
          }

          return { data: [], summary: null };
        })
      );
  }

  getAdvanceBookingsReport(): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode);

    return this.http.get<any>(`${this.apiUrl}/advance-bookings`, { params })
      .pipe(
        map(response => {
          console.log('Advance Bookings API response:', response);

          if (response && response.result) {
            const advanceBookings = response.result.advanceBookings || [];

            // Calculate days in advance and group data
            const today = new Date(response.result.reportDate);
            const groupedData: any = {};

            advanceBookings.forEach((booking: any) => {
              const checkInDate = new Date(booking.checkInDate);
              const daysInAdvance = Math.floor((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              // Group by days in advance range
              let range = '';
              if (daysInAdvance < 0) {
                range = 'Past bookings';
              } else if (daysInAdvance <= 7) {
                range = '0-7 days';
              } else if (daysInAdvance <= 14) {
                range = '8-14 days';
              } else if (daysInAdvance <= 30) {
                range = '15-30 days';
              } else if (daysInAdvance <= 60) {
                range = '31-60 days';
              } else if (daysInAdvance <= 90) {
                range = '61-90 days';
              } else {
                range = '90+ days';
              }

              if (!groupedData[range]) {
                groupedData[range] = {
                  daysInAdvance: range,
                  bookingCount: 0,
                  totalRevenue: 0
                };
              }

              groupedData[range].bookingCount++;
              groupedData[range].totalRevenue += booking.totalAmount;
            });

            // Convert to array and add average booking value
            const data = Object.values(groupedData).map((item: any) => ({
              ...item,
              averageBookingValue: item.bookingCount > 0
                ? item.totalRevenue / item.bookingCount
                : 0
            }));

            // Calculate average days in advance
            const totalDaysInAdvance = advanceBookings.reduce((sum: number, booking: any) => {
              const checkInDate = new Date(booking.checkInDate);
              const daysInAdvance = Math.floor((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return sum + Math.max(0, daysInAdvance); // Only count future bookings
            }, 0);

            const averageDaysInAdvance = advanceBookings.length > 0
              ? totalDaysInAdvance / advanceBookings.length
              : 0;

            return {
              data: data,
              summary: {
                reportDate: response.result.reportDate,
                totalBookings: response.result.totalAdvanceBookings,
                totalRevenue: response.result.totalExpectedRevenue,
                averageBookingValue: response.result.totalAdvanceBookings > 0
                  ? response.result.totalExpectedRevenue / response.result.totalAdvanceBookings
                  : 0,
                averageDaysInAdvance: averageDaysInAdvance,
                lookAheadPeriod: response.result.lookAheadPeriod
              }
            };
          }

          return { data: [], summary: null };
        })
      );
  }

// ===============================Exception reports==============================

  getExceptionReport(reportType: string, filters: any): Observable<any> {
    switch (reportType) {
      case 'cancellations':
        return this.getCancellationReport(filters.startDate, filters.endDate);
      case 'no-shows':
        return this.getNoShowReport(filters.reportDate);
      default:
        return new Observable(observer => {
          observer.error({ message: 'Invalid report type' });
        });
    }
  }

  getCancellationReport(startDate: string, endDate: string): Observable<any> {

    const formattedStartDate = `${startDate}T00:00:00`;
    const formattedEndDate = `${endDate}T23:59:59`;

    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', formattedStartDate)
      .set('endDate', formattedEndDate);

    return this.http.get<any>(`${this.apiUrl}/cancellations`, { params })
      .pipe(
        map(response => {
          console.log('Cancellation API response:', response);

          if (response && response.result) {
            return {
              data: response.result.cancellations || [],
              summary: {
                startDate: response.result.startDate,
                endDate: response.result.endDate,
                totalCancellations: response.result.totalCancellations,
                totalRefundedAmount: response.result.totalRefundedAmount,
                totalLostRevenue: response.result.totalLostRevenue,
                cancellationsByGuest: response.result.cancellationsByGuest,
                cancellationsByHotel: response.result.cancellationsByHotel
              }
            };
          }

          return { data: [], summary: null };
        })
      );
  }

  getNoShowReport(reportDate: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('reportDate', reportDate);

    return this.http.get<any>(`${this.apiUrl}/no-shows`, { params })
      .pipe(
        map(response => {
          console.log('No-Show API response:', response);

          if (response && response.result) {
            return {
              data: response.result.noShows || [],
              summary: {
                reportDate: response.result.reportDate,
                totalNoShows: response.result.totalNoShows,
                totalLostRevenue: response.result.totalLostRevenue
              }
            };
          }

          return { data: [], summary: null };
        })
      );
  }


// ================================ Unified report======================================

  getUnifiedReport(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/unified`, filters)
      .pipe(
        map(response => {
          console.log('Unified Report API response:', response);
          return response;
        })
      );
  }

  setPropertyCode(code: string): void {
    this.propertyCode = code;
  }

}
