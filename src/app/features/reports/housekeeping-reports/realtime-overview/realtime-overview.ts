import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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

  pdfPreviewUrl: SafeResourceUrl | null = null;

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
    private reportService: HousekeepingReportService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
  }

  setDefaultDates(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    this.filters.dateFrom = lastWeek.toISOString().split('T')[0];
    this.filters.dateTo = today.toISOString().split('T')[0];
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
    return this.selectedReport === 'lost-and-found';
  }

  applyFilters(): void {
    if (!this.selectedReport) {
      this.error = 'Please select a report type';
      return;
    }

    if (this.showDateRangeFilter() && (!this.filters.dateFrom || !this.filters.dateTo)) {
      this.error = 'Please select a valid date range';
      return;
    }

    this.loading = true;
    this.error = '';
    this.pdfPreviewUrl = null;

    this.reportService.getHousekeepingReport(this.selectedReport, this.filters)
      .subscribe({
        next: (response) => {

          if (!response || (!response.data.length && !response.summary)) {
            this.error = 'No data found for the selected filters';
            this.reportData = [];
            this.reportSummary = null;
          } else {
            this.reportData = response.data || [];
            this.reportSummary = response.summary || null;

            this.generatePreview();
          }

          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load report data: ' + (err.error?.message || err.message);
          this.loading = false;
        }
      });
  }

  resetFilters(): void {
    this.setDefaultDates();
    this.reportData = [];
    this.reportSummary = null;
    this.pdfPreviewUrl = null;
    this.error = '';
  }

  getFormattedSummary(): any {
    if (!this.reportSummary) return null;

    const summary: any = {};
    const s = this.reportSummary;

    if (this.selectedReport === 'room-status') {
      if (s.totalRooms !== undefined) summary['Total Rooms'] = s.totalRooms;
      if (s.occupiedRooms !== undefined) summary['Occupied'] = s.occupiedRooms;
      if (s.availableRooms !== undefined) summary['Available'] = s.availableRooms;
      if (s.dirtyRooms !== undefined) summary['Dirty'] = s.dirtyRooms;
      if (s.outOfOrderRooms !== undefined) summary['Out of Order'] = s.outOfOrderRooms;
    }
    else if (this.selectedReport === 'lost-and-found') {
      if (s.totalItems !== undefined) summary['Total Items'] = s.totalItems;
      if (s.claimedItems !== undefined) summary['Claimed'] = s.claimedItems;
      if (s.unclaimedItems !== undefined) summary['Unclaimed'] = s.unclaimedItems;
    }

    return Object.keys(summary).length > 0 ? summary : null;
  }

  preparePdfData(): any[] {
    if (!this.reportData || this.reportData.length === 0) return [];

    return this.reportData.map(row => {
      if (this.selectedReport === 'room-status') {
        return {
          roomNumber: row.roomNumber,
          roomType: row.roomType,
          currentStatus: row.currentStatus,
          lastStatusChange: row.lastStatusChange ? new Date(row.lastStatusChange).toLocaleString() : '-'
        };
      }
      else if (this.selectedReport === 'lost-and-found') {
        return {
          category: row.category,
          count: row.count,
          claimed: row.claimed,
          unclaimed: row.unclaimed
        };
      }
      return row;
    });
  }

  getRelevantFilters(): any {
    if (this.selectedReport === 'room-status') {
      return null;
    }

    const cleanFilters: any = {};
    if (this.showDateRangeFilter()) {
      cleanFilters['From'] = this.filters.dateFrom;
      cleanFilters['To'] = this.filters.dateTo;
    }
    return cleanFilters;
  }

  generatePreview(): void {
    if (this.reportData.length === 0 && !this.reportSummary) return;

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();
    const pdfData = this.preparePdfData();
    const summaryData = this.getFormattedSummary();
    const cleanFilters = this.getRelevantFilters();

    const url = this.pdfService.getReportPreviewUrl(
      reportTitle,
      columns,
      pdfData,
      cleanFilters,
      summaryData
    );

    const viewerUrl = url + '#toolbar=0&navpanes=0&scrollbar=0';
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  exportReport(): void {
    if (this.reportData.length === 0 && !this.reportSummary) {
      alert('No data available to export');
      return;
    }

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();
    const pdfData = this.preparePdfData();
    const summaryData = this.getFormattedSummary();
    const cleanFilters = this.getRelevantFilters();

    this.pdfService.generateReport(
      reportTitle,
      columns,
      pdfData,
      cleanFilters,
      summaryData
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

}
