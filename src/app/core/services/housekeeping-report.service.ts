import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HousekeepingReportService {
  private apiUrl = `${environment.apiUrl}/housekeeping/reports`;
  private propertyCode = localStorage.getItem('propertyCode') || "";

  constructor(private http: HttpClient) {}

  // =========================== Periodic Reports ==========================

  getReport(reportType: string, filters: any): Observable<any> {
    switch (reportType) {
      case 'daily-summary':
        return this.getDailySummary(filters.reportDate);

      case 'weekly-summary':
      case 'specific-week':
      case 'last-30-days':
      case 'year-to-date':
        // These all utilize the weekly/range endpoint
        return this.getWeeklySummary(filters.startDate, filters.endDate);

      case 'monthly-summary':
        return this.getMonthlySummary(filters.year, filters.month);

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  getDailySummary(date: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('date', date ? `${date}T00:00:00` : new Date().toISOString());

    return this.http.get<any>(`${this.apiUrl}/daily-summary`, { params })
      .pipe(
        map(response => {
          console.log('Daily Summary API response:', response);
          if (response && response.result) {
            return response.result;
          }
          return null;
        })
      );
  }

  getWeeklySummary(startDate: string, endDate: string): Observable<any> {
    const formattedStart = startDate.includes('T') ? startDate : `${startDate}T00:00:00`;
    const formattedEnd = endDate.includes('T') ? endDate : `${endDate}T23:59:59`;

    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', formattedStart)
      .set('endDate', formattedEnd);

    return this.http.get<any>(`${this.apiUrl}/weekly-summary`, { params })
      .pipe(
        map(response => {
          console.log('Weekly/Range Summary API response:', response);
          if (response && response.result) {
            return response.result;
          }
          return null;
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
          console.log('Monthly Summary API response:', response);
          if (response && response.result) {
            return response.result;
          }
          return null;
        })
      );
  }

  // =========================== Real-time & Overview Reports ==========================

  getHousekeepingReport(reportType: string, filters: any): Observable<any> {
    switch (reportType) {
      case 'room-status':
        return this.getRoomStatusReport();

      case 'lost-and-found':
        return this.getLostAndFoundReport(filters.dateFrom, filters.dateTo);

      default:
        throw new Error(`Unknown realtime report type: ${reportType}`);
    }
  }

  getRoomStatusReport(): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode);

    return this.http.get<any>(`${this.apiUrl}/room-status`, { params })
      .pipe(
        map(response => {
          console.log('Room Status API response:', response);

          if (response && response.result) {
            return {
              data: response.result.roomDetails || [],
              summary: {
                totalRooms: response.result.totalRooms,
                availableRooms: response.result.availableRooms,
                occupiedRooms: response.result.occupiedRooms,
                cleaningRooms: response.result.cleaningRooms,
                maintenanceRooms: response.result.maintenanceRooms,
                outOfOrderRooms: response.result.outOfOrderRooms,
                reservedRooms: response.result.reservedRooms,
                availabilityRate: response.result.availabilityRate
              }
            };
          }

          return { data: [], summary: null };
        })
      );
  }

  getLostAndFoundReport(startDate: string, endDate: string): Observable<any> {
    // Append time to dates as per the API example provided
    const formattedStartDate = `${startDate}T00:00:00`;
    const formattedEndDate = `${endDate}T23:59:59`;

    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', formattedStartDate)
      .set('endDate', formattedEndDate);

    return this.http.get<any>(`${this.apiUrl}/lost-and-found`, { params })
      .pipe(
        map(response => {
          console.log('Lost and Found API response:', response);

          if (response && response.result) {
            return {
              // The API returns categoryBreakdown which acts as our table data
              data: response.result.categoryBreakdown || [],
              summary: {
                totalItems: response.result.totalItems,
                foundItems: response.result.foundItems,
                claimedItems: response.result.claimedItems,
                disposedItems: response.result.disposedItems,
                valuableItems: response.result.valuableItems,
                claimRate: response.result.claimRate
              }
            };
          }

          return { data: [], summary: null };
        })
      );
  }

  // =========================== Performance & Analytics Reports ==========================

  getPerformanceAnalyticsReport(reportType: string, filters: any): Observable<any> {
    switch (reportType) {
      case 'staff-performance':
        return this.getStaffPerformanceReport(filters.dateFrom, filters.dateTo);

      case 'task-completion':
        return this.getTaskCompletionReport(filters.dateFrom, filters.dateTo);

      case 'maintenance-analytics':
        return this.getMaintenanceAnalyticsReport(filters.dateFrom, filters.dateTo);

      default:
        throw new Error(`Unknown performance report type: ${reportType}`);
    }
  }

  getStaffPerformanceReport(startDate: string, endDate: string): Observable<any> {
    const formattedStartDate = `${startDate}T00:00:00`;
    const formattedEndDate = `${endDate}T23:59:59`;

    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', formattedStartDate)
      .set('endDate', formattedEndDate);

    return this.http.get<any>(`${this.apiUrl}/staff-performance`, { params })
      .pipe(
        map(response => {
          console.log('Staff Performance API response:', response);
          if (response && response.result) {
            return {
              data: response.result || [], // API returns an array in 'result'
              summary: null // No specific summary object for this report
            };
          }
          return { data: [], summary: null };
        })
      );
  }

  getTaskCompletionReport(startDate: string, endDate: string): Observable<any> {
    const formattedStartDate = `${startDate}T00:00:00`;
    const formattedEndDate = `${endDate}T23:59:59`;

    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', formattedStartDate)
      .set('endDate', formattedEndDate);

    return this.http.get<any>(`${this.apiUrl}/task-completion`, { params })
      .pipe(
        map(response => {
          console.log('Task Completion API response:', response);
          if (response) {
            return {
              data: response.dailyBreakdown || [], // Table data
              summary: response.taskSummary || null // Summary cards
            };
          }
          return { data: [], summary: null };
        })
      );
  }

  getMaintenanceAnalyticsReport(startDate: string, endDate: string): Observable<any> {
    const formattedStartDate = `${startDate}T00:00:00`;
    const formattedEndDate = `${endDate}T23:59:59`;

    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', formattedStartDate)
      .set('endDate', formattedEndDate);

    return this.http.get<any>(`${this.apiUrl}/maintenance-analytics`, { params })
      .pipe(
        map(response => {
          console.log('Maintenance Analytics API response:', response);
          if (response && response.result) {
            return {
              data: response.result.typeBreakdown || [], // Breakdown array for table
              summary: {
                // Flatten stats for summary cards
                totalRequests: response.result.totalRequests,
                reportedRequests: response.result.reportedRequests,
                assignedRequests: response.result.assignedRequests,
                inProgressRequests: response.result.inProgressRequests,
                completedRequests: response.result.completedRequests,
                criticalRequests: response.result.criticalRequests,
                roomsOutOfService: response.result.roomsOutOfService,
                averageResolutionTime: response.result.averageResolutionTime,
                totalEstimatedCost: response.result.totalEstimatedCost,
                totalActualCost: response.result.totalActualCost
              }
            };
          }
          return { data: [], summary: null };
        })
      );
  }

//==========================Unified Report=========================

  getUnifiedReport(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/unified`, filters)
      .pipe(
        map(response => {
          console.log('Unified Housekeeping Report API response:', response);
          return response;
        })
      );
  }

  setPropertyCode(code: string): void {
    this.propertyCode = code;
  }
}
