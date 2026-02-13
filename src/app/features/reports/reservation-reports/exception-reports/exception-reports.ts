import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // Import 1: Sanitizer
import { ReservationReportService } from '../../../../core/services/reservation-report.service';
import { PdfService } from '../../../../core/services/pdf.service';

interface ExceptionFilters {
  startDate: string;
  endDate: string;
  reportDate: string;
}

@Component({
  selector: 'app-exception-reports',
  imports: [FormsModule, CommonModule],
  templateUrl: './exception-reports.html',
  styleUrl: './exception-reports.scss'
})
export class ExceptionReports implements OnInit {
  selectedReport: string = 'cancellations';
  reportData: any[] = [];
  reportSummary: any = null;
  loading: boolean = false;
  error: string = '';

  // Property 1: Store the safe URL for the iframe
  pdfPreviewUrl: SafeResourceUrl | null = null;

  filters: ExceptionFilters = {
    startDate: '',
    endDate: '',
    reportDate: ''
  };

  reportOptions = [
    { value: 'cancellations', label: 'Cancellation Report' },
    { value: 'no-shows', label: 'No-Show Report' }
  ];

  constructor(
    private reportService: ReservationReportService,
    private pdfService: PdfService,
    private sanitizer: DomSanitizer // Injection 1: Inject Sanitizer
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
    this.filters.reportDate = today.toISOString().split('T')[0];
  }

  onReportChange(): void {
    this.reportData = [];
    this.reportSummary = null;
    this.error = '';
    this.pdfPreviewUrl = null; // Clear preview
  }

  getReportTitle(): string {
    const report = this.reportOptions.find(r => r.value === this.selectedReport);
    return report ? report.label : '';
  }

  showDateRangeFilter(): boolean {
    return this.selectedReport === 'cancellations';
  }

  showReportDateFilter(): boolean {
    return this.selectedReport === 'no-shows';
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

    if (this.showReportDateFilter() && !this.filters.reportDate) {
      this.error = 'Please select report date';
      return;
    }

    this.loading = true;
    this.error = '';
    this.reportData = [];
    this.reportSummary = null;
    this.pdfPreviewUrl = null; // Clear previous preview

    this.reportService.getExceptionReport(this.selectedReport, this.filters)
      .subscribe({
        next: (response: any) => {
          console.log('Exception report response:', response);

          this.reportData = response.data || [];
          this.reportSummary = response.summary || null;

          if (this.reportData.length === 0 && !this.reportSummary) {
            this.error = 'No data found for the selected filters';
          } else if (this.reportData.length > 0) {
            // Logic Update: Generate preview immediately if we have data
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

  // Method 1: Helper to format summary for PDF
  getFormattedSummary(): any {
    if (!this.reportSummary) return null;

    const s = this.reportSummary;
    const formatted: any = {};

    if (this.selectedReport === 'cancellations') {
      if (s.totalCancellations !== undefined) formatted['Total Cancellations'] = s.totalCancellations;
      if (s.totalRefundedAmount !== undefined) formatted['Total Refunded'] = `$${s.totalRefundedAmount.toFixed(2)}`;
      if (s.totalLostRevenue !== undefined) formatted['Lost Revenue'] = `$${s.totalLostRevenue.toFixed(2)}`;

      // Optional: Add breakdown if available
      if (s.cancellationsByGuest !== undefined) formatted['Cancelled by Guest'] = s.cancellationsByGuest;
      if (s.cancellationsByHotel !== undefined) formatted['Cancelled by Hotel'] = s.cancellationsByHotel;
    }

    if (this.selectedReport === 'no-shows') {
      if (s.totalNoShows !== undefined) formatted['Total No-Shows'] = s.totalNoShows;
      if (s.totalLostRevenue !== undefined) formatted['Lost Revenue'] = `$${s.totalLostRevenue.toFixed(2)}`;
    }

    return formatted;
  }

  // Method 2: Generate Preview
  generatePreview(): void {
    if (this.reportData.length === 0) return;

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();
    const summaryData = this.getFormattedSummary(); // Get summary

    const url = this.pdfService.getReportPreviewUrl(
      reportTitle,
      columns,
      this.reportData,
      this.filters,
      summaryData // Pass summary
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
    const summaryData = this.getFormattedSummary(); // Get summary

    this.pdfService.generateReport(
      reportTitle,
      columns,
      this.reportData,
      this.filters,
      summaryData // Pass summary
    );
  }

  getColumnsForReport(): string[] {
    switch (this.selectedReport) {
      case 'cancellations':
        return [
          'Confirmation Number',
          'Guest Name',
          'Guest Phone',
          'Check In Date',
          'Check Out Date',
          'Room Types',
          'Total Amount',
          'Cancelled At',
          'Cancelled By',
          'Cancellation Reason'
        ];
      case 'no-shows':
        return [
          'Confirmation Number',
          'Guest Name',
          'Guest Phone',
          'Check In Date',
          'Room Types',
          'Total Amount',
          'Booking Source',
          'Status'
        ];
      default:
        return [];
    }
  }

  getColumnValue(row: any, column: string): string {
    const key = column
      .toLowerCase()
      .replace(/\s(.)/g, (match, group1) => group1.toUpperCase());

    const value = row[key];

    if (column.includes('Amount') || column.includes('Revenue')) {
      return value !== undefined && value !== null ? `$${parseFloat(value).toFixed(2)}` : '-';
    }

    if (column.includes('Date') && value) {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    if (column.includes('At') && value) {
      return new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return value !== undefined && value !== null ? value.toString() : '-';
  }
}
