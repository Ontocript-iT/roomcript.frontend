import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
    private pdfService: PdfService
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

    this.reportService.getExceptionReport(this.selectedReport, this.filters)
      .subscribe({
        next: (response: any) => {
          console.log('Exception report response:', response);

          this.reportData = response.data || [];
          this.reportSummary = response.summary || null;

          if (this.reportData.length === 0 && !this.reportSummary) {
            this.error = 'No data found for the selected filters';
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

  resetFilters(): void {
    this.setDefaultDates();
    this.reportData = [];
    this.reportSummary = null;
    this.error = '';
  }

  exportReport(): void {
    if (this.reportData.length === 0) {
      alert('No data available to export');
      return;
    }

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();

    this.pdfService.generateReport(
      reportTitle,
      columns,
      this.reportData,
      this.filters
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
