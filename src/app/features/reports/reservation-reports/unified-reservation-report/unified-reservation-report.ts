import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
  reportSummary: any = null;
  loading: boolean = false;
  error: string = '';

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
    private reportService: ReservationReportService
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

    this.reportService.getUnifiedReport(this.filters)
      .subscribe({
        next: (response: any) => {
          console.log('Data received:', response);

          this.reportData = response.data?.reservationDetails || [];
          this.reportSummary = response.data?.cancellations || null;

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
    this.filters.propertyCode = 'PROP0005';
    this.filters.sections = ['CANCELLATION', 'DETAILS'];
    this.filters.statuses = ['CANCELLED', 'NO_SHOW'];
    this.reportData = [];
    this.reportSummary = null;
    this.error = '';
  }

  exportReport(): void {
    if (this.reportData.length === 0) {
      alert('No data available to export');
      return;
    }

    const reportTitle = 'Unified Reservation Report';
    const columns = this.getColumnsForReport();

    this.pdfService.generateReport(
      reportTitle,
      columns,
      this.reportData,
      this.filters
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
