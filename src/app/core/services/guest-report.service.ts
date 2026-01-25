import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GuestReportService {
  private apiUrl = `${environment.apiUrl}/guest-analytics`;
  private propertyCode = localStorage.getItem('propertyCode') || "";

  constructor(private http: HttpClient) {}

//=======================Guest demographic reports===========================

  getDemographicReport(reportType: string, filters: any, guestId?: number | null): Observable<any> {
    switch (reportType) {
      case 'guest-profile':
        if (!guestId) throw new Error('Guest ID is required for profile report');
        return this.getGuestProfile(guestId);

      case 'guest-overview':
        return this.getGuestOverview(filters.startDate, filters.endDate);

      case 'guest-demographics':
        return this.getGuestDemographics(filters.startDate, filters.endDate);

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  getGuestProfile(guestId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile/${guestId}`)
      .pipe(
        map(response => {
          console.log('Guest Profile API response:', response);

          if (response && response.result) {
            return {
              data: response.result,
              summary: null
            };
          }
          return { data: null, summary: null };
        })
      );
  }

  getGuestOverview(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/overview`, { params })
      .pipe(
        map(response => {
          console.log('Guest Overview API response:', response);

          if (response && response.result) {
            return {
              data: response.result,
              summary: {
                reportType: response.reportType,
                startDate: response.startDate,
                endDate: response.endDate
              }
            };
          }
          return { data: null, summary: null };
        })
      );
  }

  getGuestDemographics(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate);


    return this.http.get<any>(`${this.apiUrl}/demographics`, { params })
      .pipe(
        map(response => {
          console.log('Guest Demographics API response:', response);

          if (response && response.result) {
            return {
              data: response.result.countryDistribution || [],
              summary: {
                domesticGuests: response.result.domesticGuests,
                internationalGuests: response.result.internationalGuests,
                domesticGuestPercentage: response.result.domesticGuestPercentage,
                internationalGuestPercentage: response.result.internationalGuestPercentage
              }
            };
          }
          return { data: [], summary: null };
        })
      );
  }

// ===========================guest performance analytics====================
  getPerformanceAnalytics(reportType: string, filters: any): Observable<any> {
    switch (reportType) {
      case 'guest-behavior':
        return this.getGuestBehavior(filters.startDate, filters.endDate);
      case 'repeat-guest-analysis':
        return this.getRepeatGuestAnalysis(filters.startDate, filters.endDate);
      case 'guest-segmentation':
        return this.getGuestSegmentation();
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  getGuestBehavior(startDate: string, endDate: string): Observable<any> {
    // Assuming endpoint is /behavior based on ReportType: GUEST_BEHAVIOR
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/behavior`, { params })
      .pipe(
        map(response => {
          console.log('Guest Behavior API response:', response);
          if (response && response.result) {
            return {
              data: response.result, // Contains averageBookingLeadTime, etc.
              summary: null
            };
          }
          return { data: null, summary: null };
        })
      );
  }

  getRepeatGuestAnalysis(startDate: string, endDate: string): Observable<any> {
    // Endpoint: /repeat-guests based on provided URL
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/repeat-guests`, { params })
      .pipe(
        map(response => {
          console.log('Repeat Guest API response:', response);
          if (response && response.result) {
            return {
              data: response.result.topRepeatGuests || [],
              summary: {
                totalRepeatGuests: response.result.totalRepeatGuests,
                oneTimeGuests: response.result.oneTimeGuests,
                repeatGuestPercentage: response.result.repeatGuestPercentage,
                repeatGuestRevenue: response.result.repeatGuestRevenue
              }
            };
          }
          return { data: [], summary: null };
        })
      );
  }

  getGuestSegmentation(): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode);

    return this.http.get<any>(`${this.apiUrl}/segmentation`, { params })
      .pipe(
        map(response => {
          console.log('Segmentation API response:', response);
          if (response && response.result) {
            return {
              data: response.result, // Contains vipGuests, regularGuests objects
              summary: null
            };
          }
          return { data: null, summary: null };
        })
      );
  }

//=============================Guest marketing insights===========================

  getMarketingInsights(reportType: string, filters: any): Observable<any> {
    switch (reportType) {
      case 'top-guests':
        return this.getTopGuests(filters.startDate, filters.endDate);
      case 'revenue-analysis':
        return this.getRevenueAnalysis(filters.startDate, filters.endDate);
      case 'acquisition-trends':
        return this.getAcquisitionTrends(filters.startDate, filters.endDate);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  getTopGuests(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('limit', '20'); // Default limit

    return this.http.get<any>(`${this.apiUrl}/top-guests`, { params })
      .pipe(
        map(response => {
          console.log('Top Guests API response:', response);
          if (response && response.result) {
            return {
              data: response.result, // List of guests
              summary: null
            };
          }
          return { data: [], summary: null };
        })
      );
  }

  getRevenueAnalysis(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/revenue-analysis`, { params })
      .pipe(
        map(response => {
          console.log('Revenue Analysis API response:', response);
          if (response && response.result) {
            return {
              data: response.result.revenueSegments || [],
              summary: {
                totalRevenue: response.result.totalRevenue,
                averageRevenuePerGuest: response.result.averageRevenuePerGuest,
                highestSpendingGuestName: response.result.highestSpendingGuestName,
                highestSpendingGuestRevenue: response.result.highestSpendingGuestRevenue
              }
            };
          }
          return { data: [], summary: null };
        })
      );
  }

  getAcquisitionTrends(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('propertyCode', this.propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('interval', 'MONTHLY');

    return this.http.get<any>(`${this.apiUrl}/acquisition-trends`, { params })
      .pipe(
        map(response => {
          console.log('Acquisition Trends API response:', response);
          if (response && response.result) {
            return {
              data: response.result, // List of monthly trend objects
              summary: null
            };
          }
          return { data: [], summary: null };
        })
      );
  }

  getUnifiedGuestReport(filters: any): Observable<any> {
    const payload = {
      propertyCode: this.propertyCode,
      startDate: filters.startDate,
      endDate: filters.endDate,
      guestTier: filters.guestTier || null,
      sections: filters.sections,
      topGuestsLimit: filters.topGuestsLimit
    };

    return this.http.post<any>(`${this.apiUrl}/unified-report`, payload)
      .pipe(
        map(response => {
          return response;
        })
      );
  }
}
