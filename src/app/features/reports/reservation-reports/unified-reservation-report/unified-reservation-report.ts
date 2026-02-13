import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // Import 1: Sanitizer
import { PdfService } from '../../../../core/services/pdf.service';
import { ReservationReportService } from '../../../../core/services/reservation-report.service';

interface UnifiedReportFilters {
  propertyCode: string;
  startDate: string;
  endDate: string;
  sections: string[];
  statuses: string[];
  bookingSource?: string | null;
  minNights?: number | null;
  roomType?: string | null;
}

@Component({
  selector: 'app-unified-reservation-report',
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './unified-reservation-report.html',
  styleUrl: './unified-reservation-report.scss'
})
export class UnifiedReservationReport implements OnInit {

  reportData: any[] = [];
  reportSummary: any = null; // This holds summary sections like Cancellations, Revenue, etc.
  loading: boolean = false;
  error: string = '';

  // Property 1: Store the safe URL for the iframe
  pdfPreviewUrl: SafeResourceUrl | null = null;

  filters: UnifiedReportFilters = {
    propertyCode: 'PROP0005',
    startDate: '',
    endDate: '',
    sections: ['CANCELLATION', 'DETAILS'],
    statuses: ['CANCELLED', 'NO_SHOW']
  };

  // Section Options
  sectionOptions = [
    { value: 'SUMMARY', label: 'Summary' },
    { value: 'ARRIVALS_DEPARTURES', label: 'Arrivals & Departures' },
    { value: 'DETAILS', label: 'Details' },
    { value: 'CANCELLATION', label: 'Cancellation' },
    { value: 'OCCUPANCY', label: 'Occupancy' },
    { value: 'REVENUE_BREAKDOWN', label: 'Revenue Breakdown' },
    { value: 'GUEST_NATIONALITY', label: 'Guest Nationality' },
    { value: 'BOOKING_SOURCE', label: 'Booking Source' }
  ];

  // Status Options
  statusOptions = [
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'NO_SHOW', label: 'No Show' },
    { value: 'CHECKED_IN', label: 'Checked In' },
    { value: 'CHECKED_OUT', label: 'Checked Out' },
    { value: 'PENDING', label: 'Pending' }
  ];

  // Dropdown States
  showSectionsDropdown = false;
  showStatusDropdown = false;

  constructor(
    private pdfService: PdfService,
    private reportService: ReservationReportService,
    private sanitizer: DomSanitizer // Injection 1: Inject Sanitizer
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
  }

  setDefaultDates(): void {
    const today = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(today.getMonth() - 2);

    this.filters.startDate = twoMonthsAgo.toISOString().split('T')[0];
    this.filters.endDate = today.toISOString().split('T')[0];
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showSectionsDropdown = false;
      this.showStatusDropdown = false;
    }
  }

  toggleSectionsDropdown(): void {
    this.showSectionsDropdown = !this.showSectionsDropdown;
    this.showStatusDropdown = false;
  }

  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
    this.showSectionsDropdown = false;
  }

  toggleSection(section: string): void {
    const index = this.filters.sections.indexOf(section);
    if (index > -1) {
      this.filters.sections.splice(index, 1);
    } else {
      this.filters.sections.push(section);
    }
  }

  toggleStatus(status: string): void {
    const index = this.filters.statuses.indexOf(status);
    if (index > -1) {
      this.filters.statuses.splice(index, 1);
    } else {
      this.filters.statuses.push(status);
    }
  }

  getSelectedSectionsLabel(): string {
    if (this.filters.sections.length === 0) {
      return 'Select sections...';
    }
    if (this.filters.sections.length === 1) {
      const section = this.sectionOptions.find(s => s.value === this.filters.sections[0]);
      return section ? section.label : 'Select sections...';
    }
    return `${this.filters.sections.length} sections selected`;
  }

  getSelectedStatusLabel(): string {
    if (this.filters.statuses.length === 0) {
      return 'All statuses';
    }
    if (this.filters.statuses.length === 1) {
      const status = this.statusOptions.find(s => s.value === this.filters.statuses[0]);
      return status ? status.label : 'All statuses';
    }
    return `${this.filters.statuses.length} statuses selected`;
  }

  applyFilters(): void {
    if (!this.filters.propertyCode) {
      this.error = 'Property code is required';
      return;
    }

    if (!this.filters.startDate || !this.filters.endDate) {
      this.error = 'Please select date range';
      return;
    }

    if (this.filters.sections.length === 0) {
      this.error = 'Please select at least one section';
      return;
    }

    this.loading = true;
    this.error = '';
    this.reportSummary = null;
    this.reportData = [];
    this.pdfPreviewUrl = null; // Clear previous preview

    this.reportService.getUnifiedReport(this.filters)
      .subscribe({
        next: (response: any) => {
          console.log('Data received:', response);

          // Map the details list for the table
          this.reportData = response.data?.reservationDetails || [];

          // Store other sections as summary data
          // We combine cancellations, occupancy, etc., into one object if they exist
          this.reportSummary = {
            cancellations: response.data?.cancellations,
            occupancy: response.data?.occupancy,
            revenue: response.data?.revenueBreakdown,
            general: response.data?.summary
          };

          if (this.reportData.length === 0 && !this.isSummaryAvailable()) {
            this.error = 'No data found for the selected filters';
          } else {
            // Logic Update: Generate preview immediately
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

  // Helper to check if any summary data exists
  private isSummaryAvailable(): boolean {
    if (!this.reportSummary) return false;
    return !!(this.reportSummary.cancellations || this.reportSummary.occupancy || this.reportSummary.revenue || this.reportSummary.general);
  }

  // Method 1: Helper to format summary for PDF
  getFormattedSummary(): any {
    if (!this.reportSummary) return null;

    const formatted: any = {};
    const s = this.reportSummary;

    // 1. General Summary
    if (s.general) {
      if (s.general.totalReservations !== undefined) formatted['Total Reservations'] = s.general.totalReservations;
      if (s.general.totalRevenue !== undefined) formatted['Total Revenue'] = `$${s.general.totalRevenue.toFixed(2)}`;
    }

    // 2. Cancellation Data
    if (s.cancellations) {
      if (s.cancellations.totalCancellations !== undefined) formatted['Total Cancellations'] = s.cancellations.totalCancellations;
      if (s.cancellations.totalLostRevenue !== undefined) formatted['Lost Revenue (Cancellations)'] = `$${s.cancellations.totalLostRevenue.toFixed(2)}`;
    }

    // 3. Occupancy Data
    if (s.occupancy) {
      if (s.occupancy.occupancyPercentage !== undefined) formatted['Occupancy Rate'] = `${s.occupancy.occupancyPercentage}%`;
      if (s.occupancy.averageDailyRate !== undefined) formatted['ADR'] = `$${s.occupancy.averageDailyRate.toFixed(2)}`;
      if (s.occupancy.revPAR !== undefined) formatted['RevPAR'] = `$${s.occupancy.revPAR.toFixed(2)}`;
    }

    // 4. Revenue Data
    if (s.revenue) {
      if (s.revenue.roomRevenue !== undefined) formatted['Room Revenue'] = `$${s.revenue.roomRevenue.toFixed(2)}`;
      if (s.revenue.serviceRevenue !== undefined) formatted['Service Revenue'] = `$${s.revenue.serviceRevenue.toFixed(2)}`;
    }

    return Object.keys(formatted).length > 0 ? formatted : null;
  }

  // Method 2: Generate Preview
  generatePreview(): void {
    // For unified reports, we might have summary data even if reportData (table rows) is empty
    if (this.reportData.length === 0 && !this.isSummaryAvailable()) return;

    const reportTitle = 'Unified Reservation Report';
    const columns = this.getColumnsForReport();
    const summaryData = this.getFormattedSummary();

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
    this.filters.propertyCode = 'PROP0005';
    this.filters.sections = ['CANCELLATION', 'DETAILS'];
    this.filters.statuses = ['CANCELLED', 'NO_SHOW'];
    this.reportData = [];
    this.reportSummary = null;
    this.pdfPreviewUrl = null;
    this.error = '';
  }

  exportReport(): void {
    if (this.reportData.length === 0 && !this.isSummaryAvailable()) {
      alert('No data available to export');
      return;
    }

    const reportTitle = 'Unified Reservation Report';
    const columns = this.getColumnsForReport();
    const summaryData = this.getFormattedSummary();

    this.pdfService.generateReport(
      reportTitle,
      columns,
      this.reportData,
      this.filters,
      summaryData // Pass summary
    );
  }

  getColumnsForReport(): string[] {
    return [
      'Confirmation Number',
      'Guest Name',
      'Guest Phone',
      'Check In Date',
      'Check Out Date',
      'Nights Stayed',
      'Room Type',
      'Total Amount',
      'Status',
      'Payment Status',
      'Cancelled Date'
    ];
  }

  getColumnValue(row: any, column: string): string {
    const key = column
      .toLowerCase()
      .replace(/\s(.)/g, (match, group1) => group1.toUpperCase());

    // Handle special cases for mapped fields
    if (key === 'roomType') return row['roomTypes'] || '-';
    if (key === 'cancelledDate') {
      return row['cancelledAt'] ? new Date(row['cancelledAt']).toLocaleDateString() : '-';
    }

    return row[key] || '-';
  }
}
