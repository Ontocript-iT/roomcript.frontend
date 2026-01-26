import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdfService } from '../../../../core/services/pdf.service';
import { HousekeepingReportService } from '../../../../core/services/housekeeping-report.service';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
}

@Component({
  selector: 'app-realtime-overview',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './realtime-overview.html',
  styleUrls: ['./realtime-overview.scss']
})
export class RealtimeOverview implements OnInit {
  selectedReport: string = 'room-status';
  reportData: any[] = [];
  reportSummary: any = null;
  loading: boolean = false;
  error: string = '';

  filters: ReportFilters = {
    dateFrom: '',
    dateTo: ''
  };

  reportOptions = [
    { value: 'room-status', label: 'Current Room Status' },
    { value: 'lost-and-found', label: 'Lost & Found Report' }
  ];

  constructor(
    private pdfService: PdfService,
    private reportService: HousekeepingReportService
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
  }

  setDefaultDates(): void {
    const today = new Date();
    // Default to last 7 days for lost and found context
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    this.filters.dateFrom = lastWeek.toISOString().split('T')[0];
    this.filters.dateTo = today.toISOString().split('T')[0];
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
    return this.selectedReport === 'lost-and-found';
  }

  applyFilters(): void {
    if (!this.selectedReport) {
      this.error = 'Please select a report type';
      return;
    }

    // Validation for date range if it is visible
    if (this.showDateRangeFilter() && (!this.filters.dateFrom || !this.filters.dateTo)) {
      this.error = 'Please select a valid date range';
      return;
    }

    this.loading = true;
    this.error = '';

    console.log('Applying filters:', this.filters);

    this.reportService.getHousekeepingReport(this.selectedReport, this.filters)
      .subscribe({
        next: (response) => {
          console.log('Data received:', response);

          if (!response || (!response.data.length && !response.summary)) {
            this.error = 'No data found for the selected filters';
            this.reportData = [];
            this.reportSummary = null;
          } else {
            this.reportData = response.data;
            this.reportSummary = response.summary;
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
    this.reportData = [];
    this.reportSummary = null;
    this.error = '';
  }

  exportReport(): void {
    if (this.reportData.length === 0 && !this.reportSummary) {
      alert('No data available to export');
      return;
    }

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();

    this.pdfService.generateReport(
      reportTitle,
      columns,
      this.reportData,
      { ...this.filters, ...this.reportSummary }
    );
  }

  getColumnsForReport(): string[] {
    switch (this.selectedReport) {
      case 'room-status':
        return ['Room Number', 'Room Type', 'Current Status', 'Last Status Change'];
      case 'lost-and-found':
        return ['Category', 'Count', 'Claimed', 'Unclaimed'];
      default:
        return [];
    }
  }

  // Helper to get raw key for coloring logic
  getColumnKey(column: string): string {
    return column.toLowerCase().replace(/\s(.)/g, (match, group1) => group1.toUpperCase());
  }

  getColumnValue(row: any, column: string): string {
    const key = this.getColumnKey(column);

    if (column === 'Last Status Change' && row[key]) {
      return new Date(row[key]).toLocaleString();
    }

    return row[key] !== undefined && row[key] !== null ? row[key] : '-';
  }

  // Helper for UI badges in the table
  getStatusColor(status: string): string {
    if (!status) return 'bg-gray-100 text-gray-800';

    switch (status.toUpperCase()) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'OCCUPIED': return 'bg-blue-100 text-blue-800';
      case 'CLEANING': return 'bg-yellow-100 text-yellow-800';
      case 'MAINTENANCE':
      case 'OUT_OF_ORDER': return 'bg-red-100 text-red-800';
      case 'RESERVED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
