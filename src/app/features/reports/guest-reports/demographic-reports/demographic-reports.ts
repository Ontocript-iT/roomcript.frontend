import {Component, OnInit} from '@angular/core';
import { PdfService } from '../../../../core/services/pdf.service';
import { GuestReportService } from '../../../../core/services/guest-report.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

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
    this.singleRecordData = null;
    this.reportSummary = null;
    this.error = '';
    this.guestId = null;
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

    console.log('Applying filters:', this.filters);
    console.log('Selected report:', this.selectedReport);

    this.reportService.getDemographicReport(this.selectedReport, this.filters, this.guestId)
      .subscribe({
        next: (response: any) => {
          console.log('Data received:', response);

          // Handle array vs object responses
          if (this.selectedReport === 'guest-demographics') {
            this.reportData = response.data || [];
            this.reportSummary = response.summary || null;
          } else {
            this.singleRecordData = response.data || null;
          }

          if ((!this.reportData.length && !this.singleRecordData)) {
            this.error = 'No data found for the selected filters';
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
    this.error = '';
  }

  exportReport(): void {
    if (!this.reportData.length && !this.singleRecordData) {
      alert('No data available to export');
      return;
    }

    const reportTitle = this.getReportTitle();

    if (this.selectedReport === 'guest-demographics') {
      const columns = this.getColumnsForReport();
      this.pdfService.generateReport(reportTitle, columns, this.reportData, this.filters);
    } else {
      // For Profile/Overview, format as a list of Key-Values for the PDF
      const dataToExport = this.selectedReport === 'guest-overview'
        ? this.getOverviewItems().map(item => ({ metric: item.label, value: item.value }))
        : Object.keys(this.singleRecordData)
          .filter(k => k !== 'recentReservations')
          .map(k => ({ property: this.formatLabel(k), value: this.singleRecordData[k] }));

      const columns = this.selectedReport === 'guest-overview'
        ? ['Metric', 'Value']
        : ['Property', 'Value'];

      this.pdfService.generateReport(reportTitle, columns, dataToExport, this.filters);
    }
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

    if (column === 'Total Revenue') return row.totalRevenue; // Handle specific key case
    return row[key] !== undefined ? row[key] : '-';
  }

  // Helper for Guest Profile
  getProfileKeys(): string[] {
    if (!this.singleRecordData) return [];
    return Object.keys(this.singleRecordData).filter(k =>
      k !== 'recentReservations' && k !== 'guestId' && k !== 'roomType'
    );
  }

  formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  // Helper for Guest Overview
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
