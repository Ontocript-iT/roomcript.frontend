import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // Import 1: Sanitizer
import { PdfService } from '../../../../core/services/pdf.service';
import { GuestReportService } from '../../../../core/services/guest-report.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface AnalyticsFilters {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-performance-analytics',
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './performance-analytics.html',
  styleUrl: './performance-analytics.scss'
})
export class PerformanceAnalytics implements OnInit {
  selectedReport: string = 'guest-behavior';
  reportData: any[] = [];
  singleRecordData: any = null;
  reportSummary: any = null;
  loading: boolean = false;
  error: string = '';

  // Property 1: Store the safe URL for the iframe
  pdfPreviewUrl: SafeResourceUrl | null = null;

  filters: AnalyticsFilters = {
    startDate: '',
    endDate: ''
  };

  reportOptions = [
    { value: 'guest-behavior', label: 'Guest Behavior Analysis' },
    { value: 'repeat-guest-analysis', label: 'Repeat Guest Analysis' },
    { value: 'guest-segmentation', label: 'Guest Segmentation' }
  ];

  constructor(
    private pdfService: PdfService,
    private reportService: GuestReportService,
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
  }

  onReportChange(): void {
    this.reportData = [];
    this.singleRecordData = null;
    this.reportSummary = null;
    this.error = '';
    this.pdfPreviewUrl = null; // Clear preview
  }

  getReportTitle(): string {
    const report = this.reportOptions.find(r => r.value === this.selectedReport);
    return report ? report.label : '';
  }

  showDateRangeFilter(): boolean {
    return this.selectedReport !== 'guest-segmentation';
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

    this.loading = true;
    this.error = '';
    this.reportSummary = null;
    this.reportData = [];
    this.singleRecordData = null;
    this.pdfPreviewUrl = null; // Clear previous preview

    console.log('Applying filters:', this.filters);

    this.reportService.getPerformanceAnalytics(this.selectedReport, this.filters)
      .subscribe({
        next: (response: any) => {
          console.log('Data received:', response);

          // Handle different structure per report
          if (this.selectedReport === 'repeat-guest-analysis') {
            this.reportData = response.data || [];
            this.reportSummary = response.summary || null;
          } else {
            this.singleRecordData = response.data || null;
          }

          if ((!this.reportData.length && !this.singleRecordData)) {
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
          this.singleRecordData = null;
        }
      });
  }

  resetFilters(): void {
    this.setDefaultDates();
    this.reportData = [];
    this.singleRecordData = null;
    this.pdfPreviewUrl = null;
    this.error = '';
  }

  // Helper: Standardize data for PDF (Preview & Export)
  private preparePdfData(): { title: string, columns: string[], data: any[] } | null {
    if (!this.reportData.length && !this.singleRecordData) {
      return null;
    }

    const title = this.getReportTitle();
    let columns: string[] = [];
    let data: any[] = [];

    if (this.selectedReport === 'repeat-guest-analysis') {
      columns = this.getColumnsForReport();
      data = this.reportData;

    } else if (this.selectedReport === 'guest-behavior') {
      columns = ['Metric', 'Value'];
      data = this.getBehaviorItems().map(item => ({
        metric: item.label,
        value: item.value
      }));

    } else if (this.selectedReport === 'guest-segmentation') {
      columns = ['Segment', 'Count', 'Revenue'];
      const s = this.singleRecordData;
      data = [
        {
          segment: 'VIP',
          count: s.vipGuests?.count || 0,
          revenue: s.vipGuests?.totalRevenue || 0
        },
        {
          segment: 'Regular',
          count: s.regularGuests?.count || 0,
          revenue: s.regularGuests?.totalRevenue || 0
        },
        {
          segment: 'Occasional',
          count: s.occasionalGuests?.count || 0,
          revenue: s.occasionalGuests?.totalRevenue || 0
        },
        {
          segment: 'Lapsed',
          count: s.lapsedGuests?.count || 0,
          revenue: '-' // Usually lapsed guests don't have current revenue
        }
      ];
    }

    return { title, columns, data };
  }

  // Method 1: Generate Preview
  generatePreview(): void {
    const pdfConfig = this.preparePdfData();
    if (!pdfConfig) return;

    const url = this.pdfService.getReportPreviewUrl(
      pdfConfig.title,
      pdfConfig.columns,
      pdfConfig.data,
      this.filters,
      this.reportSummary
    );

    const viewerUrl = url + '#toolbar=0&navpanes=0&scrollbar=0';
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  // Method 2: Export PDF
  exportReport(): void {
    const pdfConfig = this.preparePdfData();
    if (!pdfConfig) {
      alert('No data available to export');
      return;
    }

    this.pdfService.generateReport(
      pdfConfig.title,
      pdfConfig.columns,
      pdfConfig.data,
      this.filters,
      this.reportSummary
    );
  }

  getColumnsForReport(): string[] {
    switch (this.selectedReport) {
      case 'repeat-guest-analysis':
        return ['Guest Name', 'Visit Count', 'Total Revenue', 'Last Visit', 'Days Since Last Visit'];
      default:
        return [];
    }
  }

  getColumnValue(row: any, column: string): string {
    const key = column
      .toLowerCase()
      .replace(/\s(.)/g, (match, group1) => group1.toUpperCase());
    return row[key] !== undefined ? row[key] : '-';
  }

  getBehaviorItems(): any[] {
    if (!this.singleRecordData) return [];
    const d = this.singleRecordData;
    return [
      { label: 'Avg Booking Lead Time', value: d.averageBookingLeadTime + ' days' },
      { label: 'Avg Length of Stay', value: d.averageLengthOfStay + ' nights' },
      { label: 'Avg Booking Value', value: d.averageBookingValue },
      { label: 'Total Check-Ins', value: d.totalCheckIns },
      { label: 'Cancellation Rate', value: d.cancellationRate + '%' },
      { label: 'No Show Rate', value: d.noShowRate + '%' },
      { label: 'Total Cancellations', value: d.totalCancellations },
      { label: 'Total No-Shows', value: d.totalNoShows }
    ];
  }
}
