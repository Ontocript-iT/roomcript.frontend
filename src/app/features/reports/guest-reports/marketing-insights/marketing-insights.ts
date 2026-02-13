import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfService } from '../../../../core/services/pdf.service';
import { GuestReportService } from '../../../../core/services/guest-report.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface MarketingFilters {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-marketing-insights',
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './marketing-insights.html',
  styleUrl: './marketing-insights.scss'
})
export class MarketingInsights implements OnInit {
  selectedReport: string = 'top-guests';
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
    { value: 'top-guests', label: 'Top Guests by Revenue' },
    { value: 'revenue-analysis', label: 'Guest Revenue Analysis' },
    { value: 'acquisition-trends', label: 'Guest Acquisition Trends' }
  ];

  constructor(
    private pdfService: PdfService,
    private reportService: GuestReportService,
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

  applyFilters(): void {
    if (!this.selectedReport) {
      this.error = 'Please select a report type';
      return;
    }

    if (!this.filters.startDate || !this.filters.endDate) {
      this.error = 'Please select date range';
      return;
    }

    this.loading = true;
    this.error = '';
    this.reportSummary = null;
    this.reportData = [];
    this.pdfPreviewUrl = null;

    this.reportService.getMarketingInsights(this.selectedReport, this.filters)
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

  resetFilters(): void {
    this.setDefaultDates();
    this.reportData = [];
    this.reportSummary = null;
    this.pdfPreviewUrl = null;
    this.error = '';
  }

  getFormattedSummary(): any {
    if (!this.reportSummary) return null;

    const s = this.reportSummary;
    const formatted: any = {};

    if (this.selectedReport === 'revenue-analysis') {
      if (s.totalRevenue !== undefined) formatted['Total Revenue'] = `$${s.totalRevenue}`;
      if (s.averageRevenuePerGuest !== undefined) formatted['Avg Revenue/Guest'] = `$${s.averageRevenuePerGuest.toFixed(2)}`;
      if (s.highestSpendingGuestName) formatted['Highest Spender'] = `${s.highestSpendingGuestName} ($${s.highestSpendingGuestRevenue})`;
    }

    if (this.selectedReport === 'acquisition-trends') {
      if (s.totalNewGuests !== undefined) formatted['Total New Guests'] = s.totalNewGuests;
      if (s.acquisitionRate !== undefined) formatted['Acquisition Rate'] = `${s.acquisitionRate}%`;
    }

    return Object.keys(formatted).length > 0 ? formatted : null;
  }

  prepareTableData(): any[] {
    if (!this.reportData || this.reportData.length === 0) return [];

    if (this.selectedReport === 'top-guests') {
      return this.reportData.map(row => ({
        guestName: row.guestName,
        country: row.country || 'N/A',
        totalReservations: row.totalReservations,
        totalNights: row.totalNights,
        totalRevenue: row.totalRevenue,
        lastVisit: row.lastVisit
      }));
    }

    if (this.selectedReport === 'revenue-analysis') {
      return this.reportData.map(row => ({
        segment: row.segment,
        guestCount: row.guestCount,
        totalRevenue: row.totalRevenue,
        percentage: row.percentage + '%'
      }));
    }

    return this.reportData;
  }

  generatePreview(): void {
    if (this.reportData.length === 0) return;

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();
    const tableData = this.prepareTableData();
    const summaryData = this.getFormattedSummary();

    const url = this.pdfService.getReportPreviewUrl(
      reportTitle,
      columns,
      tableData,
      this.filters,
      summaryData
    );

    const viewerUrl = url + '#toolbar=0&navpanes=0&scrollbar=0';
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  exportReport(): void {
    if (this.reportData.length === 0) {
      alert('No data available to export');
      return;
    }

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();
    const tableData = this.prepareTableData();
    const summaryData = this.getFormattedSummary();

    this.pdfService.generateReport(
      reportTitle,
      columns,
      tableData,
      this.filters,
      summaryData
    );
  }

  getColumnsForReport(): string[] {
    switch (this.selectedReport) {
      case 'top-guests':
        return ['Guest Name', 'Country', 'Total Reservations', 'Total Nights', 'Total Revenue', 'Last Visit'];
      case 'revenue-analysis':
        return ['Segment', 'Guest Count', 'Total Revenue', 'Percentage'];
      case 'acquisition-trends':
        return ['Period', 'New Guests', 'Returning Guests', 'Total Guests', 'Acquisition Rate'];
      default:
        return [];
    }
  }

  getColumnValue(row: any, column: string): string {
    const key = column
      .toLowerCase()
      .replace(/\s(.)/g, (match, group1) => group1.toUpperCase());

    if (column === 'Percentage' || column === 'Acquisition Rate') {
      return row[key] ? row[key] + '%' : '0%';
    }
    return row[key] !== undefined && row[key] !== null ? row[key] : '-';
  }
}
