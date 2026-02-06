import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArrReportResponse, UnifiedFinancialRequest, UnifiedFinancialResponse} from '../models/report.models';

@Injectable({
  providedIn: 'root'
})
export class RevenueReportService {

  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  getArrReport(propertyCode: string, startDate: string, endDate: string): Observable<ArrReportResponse> {
    const params = new HttpParams()
      .set('propertyCode', propertyCode)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ArrReportResponse>(`${this.baseUrl}/reports/financial/arr`, { params });
  }

  getUnifiedFinancialReport(requestBody: UnifiedFinancialRequest): Observable<UnifiedFinancialResponse> {
    return this.http.post<UnifiedFinancialResponse>(
      `${this.baseUrl}/reports/financial/unified-financial`,
      requestBody
    );
  }
}
