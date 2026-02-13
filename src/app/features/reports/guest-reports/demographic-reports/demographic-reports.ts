import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfService } from '../../../../core/services/pdf.service';
import { GuestReportService } from '../../../../core/services/guest-report.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface DemographicFilters {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-demographic-reports',
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './demographic-reports.html',
  styleUrl: './demographic-reports.scss'
})
export class DemographicReports implements OnInit {
  selectedReport: string = 'guest-overview';
  reportData: any[] = [];
  singleRecordData: any = null;
  reportSummary: any = null;
  loading: boolean = false;
  error: string = '';
  guestId: number | null = null;

  pdfPreviewUrl: SafeResourceUrl | null = null;

  filters: DemographicFilters = {
    startDate: '',
    endDate: ''
  };

  reportOptions = [
    { value: 'guest-overview', label: 'Guest Overview' },
    { value: 'guest-demographics', label: 'Guest Demographics' },
    { value: 'guest-profile', label: 'Guest Profile' }
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
    this.singleRecordData = null;
    this.reportSummary = null;
    this.error = '';
    this.guestId = null;
    this.pdfPreviewUrl = null;
  }

  getReportTitle(): string {
    const report = this.reportOptions.find(r => r.value === this.selectedReport);
    return report ? report.label : '';
  }

  showDateRangeFilter(): boolean {
    return this.selectedReport === 'guest-overview' ||
      this.selectedReport === 'guest-demographics';
  }

  applyFilters(): void {
    if (!this.selectedReport) {
      this.error = 'Please select a report type';
      return;
    }

    if (this.selectedReport === 'guest-profile' && !this.guestId) {
      this.error = 'Please enter a Guest ID';
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
    this.pdfPreviewUrl = null;

    this.reportService.getDemographicReport(this.selectedReport, this.filters, this.guestId)
      .subscribe({
        next: (response: any) => {
          if (this.selectedReport === 'guest-demographics') {
            this.reportData = response.data || [];
            this.reportSummary = response.summary || null;
          } else {
            this.singleRecordData = response.data || response || null;
          }

          if ((!this.reportData.length && !this.singleRecordData)) {
            this.error = 'No data found for the selected filters';
          } else {
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
    this.guestId = null;
    this.reportData = [];
    this.singleRecordData = null;
    this.pdfPreviewUrl = null;
    this.error = '';
  }

  private preparePdfData(): { title: string, columns: string[], data: any[] } | null {
    if (!this.reportData.length && !this.singleRecordData) {
      return null;
    }

    const title = this.getReportTitle();
    let columns: string[] = [];
    let data: any[] = [];

    if (this.selectedReport === 'guest-demographics') {
      columns = this.getColumnsForReport();
      data = this.reportData;
    } else {
      if (this.selectedReport === 'guest-overview') {
        columns = ['Metric', 'Value'];
        data = this.getOverviewItems().map(item => ({
          metric: item.label,
          value: item.value
        }));
      } else {
        columns = ['Property', 'Value'];
        data = Object.keys(this.singleRecordData)
          .filter(k => k !== 'recentReservations')
          .map(k => ({
            property: this.formatLabel(k),
            value: this.singleRecordData[k]
          }));
      }
    }

    return { title, columns, data };
  }

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
      case 'guest-demographics':
        return ['Country', 'Guest Count', 'Reservation Count', 'Percentage', 'Total Revenue'];
      default:
        return [];
    }
  }

  getColumnValue(row: any, column: string): string {
    const key = column
      .toLowerCase()
      .replace(/\s(.)/g, (match, group1) => group1.toUpperCase());

    if (column === 'Total Revenue') return row.totalRevenue;
    return row[key] !== undefined ? row[key] : '-';
  }

  getProfileKeys(): string[] {
    if (!this.singleRecordData) return [];
    return Object.keys(this.singleRecordData).filter(k =>
      k !== 'recentReservations' && k !== 'guestId' && k !== 'roomType'
    );
  }

  formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  getOverviewItems(): any[] {
    if (!this.singleRecordData) return [];

    const mapping: any = {
      totalGuests: 'Total Guests',
      newGuestsThisPeriod: 'New Guests',
      returningGuests: 'Returning Guests',
      activeGuests: 'Active Guests',
      newGuestRate: 'New Guest Rate',
      returnGuestRate: 'Return Guest Rate',
      guestRetentionRate: 'Retention Rate',
      totalReservations: 'Total Reservations',
      averageReservationsPerGuest: 'Avg Res/Guest'
    };

    return Object.keys(this.singleRecordData)
      .filter(key => mapping[key])
      .map(key => ({
        label: mapping[key],
        value: typeof this.singleRecordData[key] === 'number' && key.includes('Rate')
          ? this.singleRecordData[key].toFixed(2) + '%'
          : this.singleRecordData[key]
      }));
  }
}
