import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // Import 1: Sanitizer
import { PdfService } from '../../../../core/services/pdf.service';
import { ReservationReportService } from '../../../../core/services/reservation-report.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface PerformanceFilters {
  startDate: string;
  endDate: string;
  status: string;
  year: number;
  month: number;
}

@Component({
  selector: 'app-performance-reports',
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './performance-reports.html',
  styleUrl: './performance-reports.scss'
})

export class PerformanceReports implements OnInit {
  selectedReport: string = 'occupancy';
  reportData: any[] = [];
  reportSummary: any = null;
  loading: boolean = false;
  error: string = '';

  // Property 1: Store the safe URL for the iframe
  pdfPreviewUrl: SafeResourceUrl | null = null;

  filters: PerformanceFilters = {
    startDate: '',
    endDate: '',
    status: 'CONFIRMED',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  };

  reportOptions = [
    { value: 'occupancy', label: 'Occupancy Report' },
    { value: 'reservation-date-range', label: 'Reservation by Date Range' },
    { value: 'reservation-status', label: 'Reservations by Status' },
    { value: 'monthly-reservation', label: 'Monthly Reservation Summary' }
  ];

  statusOptions = [
    'CONFIRMED',
    'PENDING',
    'CHECKED_IN',
    'CHECKED_OUT',
    'CANCELLED',
    'NO_SHOW'
  ];

  monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  yearOptions: number[] = [];

  constructor(
    private pdfService: PdfService,
    private reportService: ReservationReportService,
    private sanitizer: DomSanitizer // Injection 1: Inject Sanitizer
  ) {
    // Generate year options (current year - 5 to current year + 2)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      this.yearOptions.push(i);
    }
  }

  ngOnInit(): void {
    this.setDefaultDates();
  }

  setDefaultDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filters.startDate = firstDay.toISOString().split('T')[0];
    this.filters.endDate = lastDay.toISOString().split('T')[0];
    this.filters.year = today.getFullYear();
    this.filters.month = today.getMonth() + 1;
  }

  onReportChange(): void {
    this.reportData = [];
    this.reportSummary = null;
    this.error = '';
    this.pdfPreviewUrl = null; // Clear preview on report change
  }

  getReportTitle(): string {
    const report = this.reportOptions.find(r => r.value === this.selectedReport);
    return report ? report.label : '';
  }

  showDateRangeFilter(): boolean {
    return this.selectedReport === 'occupancy' ||
      this.selectedReport === 'reservation-date-range' ||
      this.selectedReport === 'reservation-status';
  }

  showStatusFilter(): boolean {
    return this.selectedReport === 'reservation-status';
  }

  showMonthYearFilter(): boolean {
    return this.selectedReport === 'monthly-reservation';
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

    if (this.showMonthYearFilter() && (!this.filters.year || !this.filters.month)) {
      this.error = 'Please select year and month';
      return;
    }

    this.loading = true;
    this.error = '';
    this.reportSummary = null;
    this.reportData = [];
    this.pdfPreviewUrl = null; // Clear previous preview

    console.log('Applying filters:', this.filters);
    console.log('Selected report:', this.selectedReport);

    this.reportService.getPerformanceReport(this.selectedReport, this.filters)
      .subscribe({
        next: (response: any) => {
          console.log('Data received:', response);

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

  // Method 1: Generate the preview URL
  generatePreview(): void {
    if (this.reportData.length === 0) {
      return;
    }

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();

    // Get Blob URL from service
    const url = this.pdfService.getReportPreviewUrl(
      reportTitle,
      columns,
      this.reportData,
      this.filters
    );

    // Append config to hide toolbar, navpanes and scrollbars for cleaner look
    const viewerUrl = url + '#toolbar=0&navpanes=0&scrollbar=0';

    // Trust the URL so Angular allows it in iframe
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  resetFilters(): void {
    this.setDefaultDates();
    this.filters.status = 'CONFIRMED';
    this.reportData = [];
    this.reportSummary = null;
    this.pdfPreviewUrl = null; // Clear preview
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
      case 'occupancy':
        return ['Room Type', 'Total Rooms', 'Occupied Rooms', 'Available Rooms', 'Occupancy Percentage'];
      case 'reservation-date-range':
        return ['Confirmation Number', 'Guest Name', 'Guest Phone', 'Check In Date', 'Check Out Date', 'Room Numbers', 'Total Amount', 'Status'];
      case 'reservation-status':
        return ['Confirmation Number', 'Guest Name', 'Guest Phone', 'Check In Date', 'Check Out Date', 'Room Numbers', 'Total Amount', 'Payment Status'];
      case 'monthly-reservation':
        return ['Date', 'Occupied Rooms', 'Occupancy Percentage', 'Revenue'];
      default:
        return [];
    }
  }

  getColumnValue(row: any, column: string): string {
    const key = column
      .toLowerCase()
      .replace(/\s(.)/g, (match, group1) => group1.toUpperCase());
    return row[key] || '-';
  }
}
