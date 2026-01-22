import { Component, OnInit } from '@angular/core';
import { PdfService} from '../../../../core/services/pdf.service';
import { ReservationReportService} from '../../../../core/services/reservation-report.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';


interface ReportFilters {
  reportDate?: string;
  dateFrom: string;
  dateTo: string;
  minNights: number;
  status: string;
  roomType: string;
  source: string;
}

@Component({
  selector: 'app-operational-reports',
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './operational-reports.html',
  styleUrls: ['./operational-reports.scss']
})
export class OperationalReports implements OnInit {
  selectedReport: string = '';
  reportData: any[] = [];
  loading: boolean = false;
  error: string = '';

  filters: ReportFilters = {
    reportDate: '',
    dateFrom: '',
    dateTo: '',
    minNights: 7,
    status: 'All',
    roomType: 'All',
    source: 'All'
  };

  reportOptions = [
    { value: 'arrival-departure', label: 'Arrival/Departure Report' },
    { value: 'daily-reservation', label: 'Daily Reservation Report' },
    { value: 'group-reservation', label: 'Group Reservation Report' },
    { value: 'long-stay', label: 'Long Stay Report' }
  ];

  statusOptions = ['All', 'Confirmed', 'Pending', 'Checked-In', 'Checked-Out', 'Cancelled'];
  roomTypeOptions = ['All', 'Standard', 'Deluxe', 'Suite', 'Executive'];
  sourceOptions = ['All', 'Direct', 'Online', 'Travel Agent', 'Corporate'];

  constructor(
    private pdfService: PdfService,
    private reportService: ReservationReportService
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
  }

  setDefaultDates(): void {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    this.filters.reportDate = dateString;
    this.filters.dateFrom = dateString;

    // Set dateTo to 30 days from now for group reservations
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    this.filters.dateTo = futureDate.toISOString().split('T')[0];

    this.filters.minNights = 7;
  }

  onReportChange(): void {
    this.reportData = [];
    this.error = '';
  }

  getReportTitle(): string {
    const report = this.reportOptions.find(r => r.value === this.selectedReport);
    return report ? report.label : '';
  }

  showFilters(): boolean {
    return this.selectedReport !== '';
  }

  showReportDateFilter(): boolean {
    return this.selectedReport === 'arrival-departure' ||
      this.selectedReport === 'daily-reservation';
  }

  showDateRangeFilter(): boolean {
    return this.selectedReport === 'group-reservation';
  }

  showMinNightsFilter(): boolean {
    return this.selectedReport === 'long-stay';
  }

  applyFilters(): void {
    if (!this.selectedReport) {
      this.error = 'Please select a report type';
      return;
    }

    // Validate filters based on report type
    if (this.showReportDateFilter() && !this.filters.reportDate) {
      this.error = 'Please select a report date';
      return;
    }

    if (this.showDateRangeFilter() && (!this.filters.dateFrom || !this.filters.dateTo)) {
      this.error = 'Please select date range';
      return;
    }

    if (this.showMinNightsFilter() && (!this.filters.minNights || this.filters.minNights < 1)) {
      this.error = 'Please enter minimum nights (at least 1)';
      return;
    }

    this.loading = true;
    this.error = '';

    console.log('Applying filters:', this.filters);
    console.log('Selected report:', this.selectedReport);

    this.reportService.getOperationalReport(this.selectedReport, this.filters)
      .subscribe({
        next: (data) => {
          console.log('Data received:', data);

          if (!data || data.length === 0) {
            this.error = 'No data found for the selected filters';
            this.reportData = [];
          } else {
            this.reportData = data;
          }

          this.loading = false;
        },
        error: (err) => {
          console.error('API Error:', err);
          this.error = 'Failed to load report data: ' + (err.error?.message || err.message);
          this.loading = false;
        }
      });
  }

  resetFilters(): void {
    this.setDefaultDates();
    this.filters.status = 'All';
    this.filters.roomType = 'All';
    this.filters.source = 'All';
    this.filters.minNights = 7;
    this.reportData = [];
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
      case 'arrival-departure':
        return ['Guest Name', 'Guest Phone', 'Room Numbers', 'Room Types', 'Check In Date', 'Check Out Date', 'Status'];
      case 'daily-reservation':
        return ['Confirmation Number', 'Guest Name', 'Check In Date', 'Check Out Date', 'Room Numbers', 'Room Types', 'Status'];
      case 'group-reservation':
        return ['Confirmation Number', 'Guest Name', 'Room Numbers', 'Room Types', 'Check In Date', 'Check Out Date', 'Total Amount'];
      case 'long-stay':
        return ['Confirmation Number', 'Guest Name', 'Room Numbers', 'Room Types', 'Check In Date', 'Check Out Date', 'Total Amount'];
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
