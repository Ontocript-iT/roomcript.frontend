import {Component, OnInit} from '@angular/core';
import { PdfService } from '../../../../core/services/pdf.service';
import { GuestReportService } from '../../../../core/services/guest-report.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

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
    private reportService: GuestReportService
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

    console.log('Applying filters:', this.filters);

    this.reportService.getMarketingInsights(this.selectedReport, this.filters)
      .subscribe({
        next: (response: any) => {
          console.log('Data received:', response);

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

    // Map data based on specific report requirements
    let dataToExport = this.reportData;

    // Create a copy of filters so we can add summary info without affecting the UI
    let exportFilters: any = { ...this.filters };

    if (this.selectedReport === 'top-guests') {
      dataToExport = this.reportData.map(row => ({
        guestName: row.guestName,
        country: row.country || 'N/A',
        totalReservations: row.totalReservations,
        totalNights: row.totalNights,
        totalRevenue: row.totalRevenue,
        lastVisit: row.lastVisit
      }));
    } else if (this.selectedReport === 'revenue-analysis') {
      // 1. Prepare Table Data
      dataToExport = this.reportData.map(row => ({
        segment: row.segment,
        guestCount: row.guestCount,
        totalRevenue: row.totalRevenue,
        percentage: row.percentage + '%'
      }));

      // 2. INJECT SUMMARY DATA: Add the card details to the export filters
      // This forces them to print at the top of the PDF
      if (this.reportSummary) {
        exportFilters['Total Revenue'] = `$${this.reportSummary.totalRevenue}`;
        exportFilters['Avg Revenue/Guest'] = `$${this.reportSummary.averageRevenuePerGuest.toFixed(2)}`;
        exportFilters['Highest Spender'] = `${this.reportSummary.highestSpendingGuestName} ($${this.reportSummary.highestSpendingGuestRevenue})`;
      }
    }

    // Pass the modified filters including the summary details
    this.pdfService.generateReport(reportTitle, columns, dataToExport, exportFilters);
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

    // Handle special cases matching the logic in export
    if (column === 'Percentage' || column === 'Acquisition Rate') {
      return row[key] ? row[key] + '%' : '0%';
    }
    return row[key] !== undefined && row[key] !== null ? row[key] : '-';
  }
}
