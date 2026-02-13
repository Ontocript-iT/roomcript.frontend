import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReservationReportService } from '../../../../core/services/reservation-report.service';
import { PdfService } from '../../../../core/services/pdf.service';

interface MarketingFilters {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-marketing-reports',
  imports: [
    FormsModule, CommonModule
  ],
  templateUrl: './marketing-reports.html',
  styleUrl: './marketing-reports.scss'
})
export class MarketingReports implements OnInit {
  selectedReport: string = 'booking-source';
  reportData: any[] = [];
  reportSummary: any = null;
  loading: boolean = false;
  error: string = '';

  pdfPreviewUrl: SafeResourceUrl | null = null;

  filters: MarketingFilters = {
    startDate: '',
    endDate: ''
  };

  reportOptions = [
    { value: 'booking-source', label: 'Booking Source Report' },
    { value: 'guest-nationality', label: 'Guest Nationality Report' },
    { value: 'advance-bookings', label: 'Advance Booking Report' }
  ];

  constructor(
    private reportService: ReservationReportService,
    private pdfService: PdfService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
  }

  setDefaultDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filters.startDate = firstDay.toISOString().split('T')[0];
    this.filters.endDate = lastDay.toISOString().split('T')[0];
  }

  onReportChange(): void {
    this.reportData = [];
    this.reportSummary = null;
    this.error = '';
    this.pdfPreviewUrl = null;
  }

  getReportTitle(): string {
    const report = this.reportOptions.find(r => r.value === this.selectedReport);
    return report ? report.label : '';
  }

  showDateRangeFilter(): boolean {
    return this.selectedReport === 'booking-source' ||
      this.selectedReport === 'guest-nationality';
  }

  applyFilters(): void {
    if (!this.selectedReport) {
      this.error = 'Please select a report type';
      return;
    }

    if (this.showDateRangeFilter() && (!this.filters.startDate || !this.filters.endDate)) {
      this.error = 'Please select date range';
      return;
    }

    this.loading = true;
    this.error = '';
    this.reportData = [];
    this.reportSummary = null;
    this.pdfPreviewUrl = null;

    this.reportService.getMarketingReport(this.selectedReport, this.filters)
      .subscribe({
        next: (response: any) => {

          this.reportData = response.data || [];
          this.reportSummary = response.summary || null;

          if (this.reportData.length === 0 && !this.reportSummary) {
            this.error = 'No data found for the selected filters';
          } else if (this.reportData.length > 0) {
            this.generatePreview();
          }

          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load report data: ' + (err.error?.message || err.message);
          this.loading = false;
          this.reportData = [];
          this.reportSummary = null;
        }
      });
  }

  getFormattedSummary(): any {
    if (!this.reportSummary) return null;

    const s = this.reportSummary;
    const formatted: any = {};

    if (s.totalBookings !== undefined) formatted['Total Bookings'] = s.totalBookings;

    if (s.totalRevenue !== undefined) {
      const label = this.selectedReport === 'advance-bookings' ? 'Expected Revenue' : 'Total Revenue';
      formatted[label] = `${s.totalRevenue.toFixed(2)}`;
    }

    if (s.averageBookingValue !== undefined) {
      formatted['Average Booking Value'] = `${s.averageBookingValue.toFixed(2)}`;
    }

    if (this.selectedReport === 'booking-source' && s.topSource) {
      formatted['Top Source'] = s.topSource;
    }

    if (this.selectedReport === 'guest-nationality') {
      if (s.topNationality) formatted['Top Nationality'] = s.topNationality;
      if (s.totalGuests !== undefined) formatted['Total Guests'] = s.totalGuests;
    }

    if (this.selectedReport === 'advance-bookings') {
      if (s.averageDaysInAdvance !== undefined) {
        formatted['Avg Days in Advance'] = s.averageDaysInAdvance.toFixed(1);
      }
      if (s.lookAheadPeriod) {
        formatted['Look Ahead Period'] = s.lookAheadPeriod;
      }
    }

    return formatted;
  }

  generatePreview(): void {
    if (this.reportData.length === 0) return;

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();
    const summaryData = this.getFormattedSummary();

    const url = this.pdfService.getReportPreviewUrl(
      reportTitle,
      columns,
      this.reportData,
      this.filters,
      summaryData
    );

    const viewerUrl = url + '#toolbar=0&navpanes=0&scrollbar=0';
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  resetFilters(): void {
    this.setDefaultDates();
    this.reportData = [];
    this.reportSummary = null;
    this.pdfPreviewUrl = null;
    this.error = '';
  }

  exportReport(): void {
    if (this.reportData.length === 0) {
      alert('No data available to export');
      return;
    }

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();
    const summaryData = this.getFormattedSummary();

    this.pdfService.generateReport(
      reportTitle,
      columns,
      this.reportData,
      this.filters,
      summaryData
    );
  }

  getColumnsForReport(): string[] {
    switch (this.selectedReport) {
      case 'booking-source':
        return ['Source', 'Total Bookings', 'Total Revenue', 'Average Booking Value', 'Percentage of Total'];
      case 'guest-nationality':
        return ['Nationality', 'Total Guests', 'Total Bookings', 'Total Revenue', 'Percentage of Total'];
      case 'advance-bookings':
        return ['Days in Advance', 'Booking Count', 'Total Revenue', 'Average Booking Value'];
      default:
        return [];
    }
  }

  getColumnValue(row: any, column: string): string {
    const key = column
      .toLowerCase()
      .replace(/\s(.)/g, (match, group1) => group1.toUpperCase());

    const value = row[key];

    if (column.includes('Revenue') || column.includes('Value') || column.includes('Amount')) {
      return value !== undefined && value !== null ? `${parseFloat(value).toFixed(2)}` : '-';
    }

    if (column.includes('Percentage')) {
      return value !== undefined && value !== null ? `${parseFloat(value).toFixed(2)}%` : '-';
    }

    return value !== undefined && value !== null ? value.toString() : '-';
  }

  get totalBookings(): number {
    if (!this.reportSummary) return 0;
    return this.reportSummary.totalBookings || 0;
  }

  get totalRevenue(): number {
    if (!this.reportSummary) return 0;
    return this.reportSummary.totalRevenue || 0;
  }

  get averageBookingValue(): number {
    if (!this.reportSummary) return 0;
    return this.reportSummary.averageBookingValue || 0;
  }

  get topSource(): string {
    if (!this.reportSummary || !this.reportSummary.topSource) return '-';
    return this.reportSummary.topSource;
  }

  get topNationality(): string {
    if (!this.reportSummary || !this.reportSummary.topNationality) return '-';
    return this.reportSummary.topNationality;
  }
}
