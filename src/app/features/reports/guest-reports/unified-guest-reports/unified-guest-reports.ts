import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfService } from '../../../../core/services/pdf.service';
import { GuestReportService } from '../../../../core/services/guest-report.service';

interface UnifiedGuestFilters {
  propertyCode: string;
  startDate: string;
  endDate: string;
  guestTier: string;
  sections: string[];
  topGuestsLimit: number;
}

@Component({
  selector: 'app-unified-guest-report',
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './unified-guest-reports.html',
  styleUrl: './unified-guest-reports.scss'
})
export class UnifiedGuestReport implements OnInit {

  reportData: any = null;
  loading: boolean = false;
  error: string = '';

  pdfPreviewUrl: SafeResourceUrl | null = null;

  filters: UnifiedGuestFilters = {
    propertyCode: '',
    startDate: '',
    endDate: '',
    guestTier: '',
    sections: ['OVERVIEW', 'TOP_GUESTS', 'BEHAVIOR', 'REVENUE_ANALYSIS'],
    topGuestsLimit: 10
  };

  tierOptions = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'VIP'];

  sectionOptions = [
    { value: 'OVERVIEW', label: 'Overview' },
    { value: 'TOP_GUESTS', label: 'Top Guests' },
    { value: 'BEHAVIOR', label: 'Guest Behavior' },
    { value: 'REVENUE_ANALYSIS', label: 'Revenue Analysis' },
    { value: 'DEMOGRAPHICS', label: 'Demographics' },
    { value: 'ACQUISITION', label: 'Acquisition' }
  ];

  showSectionsDropdown = false;

  constructor(
    private pdfService: PdfService,
    private reportService: GuestReportService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const storedProp = localStorage.getItem('propertyCode');
    if (storedProp) {
      this.filters.propertyCode = storedProp;
    } else {
      this.error = 'No Property Code found. Please login again.';
    }

    this.setDefaultDates();
  }

  setDefaultDates(): void {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);

    this.filters.startDate = startOfYear.toISOString().split('T')[0];
    this.filters.endDate = endOfYear.toISOString().split('T')[0];
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showSectionsDropdown = false;
    }
  }

  toggleSectionsDropdown(): void {
    this.showSectionsDropdown = !this.showSectionsDropdown;
  }

  toggleSection(section: string): void {
    const index = this.filters.sections.indexOf(section);
    if (index > -1) {
      this.filters.sections.splice(index, 1);
    } else {
      this.filters.sections.push(section);
    }
  }

  getSelectedSectionsLabel(): string {
    if (this.filters.sections.length === 0) return 'Select sections...';
    if (this.filters.sections.length === 1) {
      const section = this.sectionOptions.find(s => s.value === this.filters.sections[0]);
      return section ? section.label : 'Select sections...';
    }
    return `${this.filters.sections.length} sections selected`;
  }

  applyFilters(): void {
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
    this.reportData = null;
    this.pdfPreviewUrl = null;

    this.reportService.getUnifiedGuestReport(this.filters)
      .subscribe({
        next: (response: any) => {
          this.reportData = response.data || null;

          if (!this.reportData) {
            this.error = 'No data found for the selected filters';
          } else {
            this.generatePreview();
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load report data: ' + (err.error?.message || err.message);
          this.loading = false;
          this.reportData = null;
        }
      });
  }

  resetFilters(): void {
    this.setDefaultDates();
    this.filters.guestTier = '';
    this.filters.sections = ['OVERVIEW', 'TOP_GUESTS', 'BEHAVIOR', 'REVENUE_ANALYSIS'];
    this.reportData = null;
    this.pdfPreviewUrl = null;
    this.error = '';
  }

  getFormattedSummary(): any {
    if (!this.reportData) return null;

    const summary: any = {};

    if (this.reportData.overview) {
      if (this.reportData.overview.totalGuests !== undefined) summary['Total Guests'] = this.reportData.overview.totalGuests;
      if (this.reportData.overview.newGuests !== undefined) summary['New Guests'] = this.reportData.overview.newGuests;
      if (this.reportData.overview.returningGuests !== undefined) summary['Returning Guests'] = this.reportData.overview.returningGuests;
      if (this.reportData.overview.returnRate !== undefined) summary['Return Rate'] = `${this.reportData.overview.returnRate}%`;
    }

    if (this.reportData.revenueAnalysis) {
      const r = this.reportData.revenueAnalysis;
      if (r.totalRevenue !== undefined) summary['Total Revenue'] = `$${r.totalRevenue.toLocaleString()}`;
      if (r.averageRevenuePerGuest !== undefined) summary['Avg Revenue/Guest'] = `$${r.averageRevenuePerGuest.toFixed(2)}`;
    }

    if (this.reportData.behavior) {
      const b = this.reportData.behavior;
      if (b.averageLeadTimeDays !== undefined) summary['Avg Lead Time'] = `${b.averageLeadTimeDays.toFixed(1)} days`;
      if (b.averageLengthOfStay !== undefined) summary['Avg Stay'] = `${b.averageLengthOfStay.toFixed(1)} nights`;
    }

    return Object.keys(summary).length > 0 ? summary : null;
  }

  prepareTableData(): any[] {
    if (!this.reportData || !Array.isArray(this.reportData.topGuests)) return [];

    return this.reportData.topGuests.map((guest: any) => ({
      guestName: guest.guestName || 'Unknown',
      totalRevenue: `$${(guest.totalRevenue || 0).toLocaleString()}`,
      nights: guest.totalNights || 0,
      stays: guest.totalReservations || 0
    }));
  }

  generatePreview(): void {
    if (!this.reportData) return;

    const reportTitle = 'Unified Guest Analytics Report';
    const columns = ['Guest Name', 'Total Revenue', 'Nights', 'Stays'];
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
    if (!this.reportData) {
      alert('No data available to export');
      return;
    }

    const reportTitle = 'Unified Guest Analytics Report';
    const columns = ['Guest Name', 'Total Revenue', 'Nights', 'Stays'];
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
}
