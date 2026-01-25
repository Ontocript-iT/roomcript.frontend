import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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

  filters: UnifiedGuestFilters = {
    propertyCode: 'PROP0005',
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
    private reportService: GuestReportService
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
  }

  setDefaultDates(): void {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);

    this.filters.startDate = startOfYear.toISOString().split('T')[0];
    this.filters.endDate = endOfYear.toISOString().split('T')[0];
  }

  // Close dropdown when clicking outside
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

    this.reportService.getUnifiedGuestReport(this.filters)
      .subscribe({
        next: (response: any) => {
          console.log('Unified Data received:', response);
          this.reportData = response.data || null;

          if (!this.reportData) {
            this.error = 'No data found for the selected filters';
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
    this.error = '';
  }

  exportReport(): void {
    if (!this.reportData) {
      alert('No data available to export');
      return;
    }

    const reportTitle = 'Unified Guest Analytics Report';

    // 1. Prepare Export Filters (Header Data)
    const exportFilters: any = {
      'Start Date': this.filters.startDate,
      'End Date': this.filters.endDate,
      'Guest Tier': this.filters.guestTier || 'All'
    };

    // Inject Overview Data (Safe Access)
    if (this.reportData.overview) {
      exportFilters['Total Guests'] = this.reportData.overview.totalGuests || 0;
      exportFilters['New / Returning'] = `${this.reportData.overview.newGuests || 0} / ${this.reportData.overview.returningGuests || 0}`;
      exportFilters['Return Rate'] = `${this.reportData.overview.returnRate || 0}%`;
    }

    // Inject Revenue Data (Safe Access)
    if (this.reportData.revenueAnalysis) {
      // FIX: Check if value exists before calling toLocaleString()
      const totalRev = this.reportData.revenueAnalysis.totalRevenue || 0;
      const avgRev = this.reportData.revenueAnalysis.averageRevenuePerGuest || 0;

      exportFilters['Total Revenue'] = `$${totalRev.toLocaleString()}`;
      exportFilters['Avg Rev/Guest'] = `$${avgRev.toFixed(2)}`;
    }

    // Inject Behavior Data (Safe Access)
    if (this.reportData.behavior) {
      const leadTime = this.reportData.behavior.averageLeadTimeDays || 0;
      const stayLen = this.reportData.behavior.averageLengthOfStay || 0;

      exportFilters['Avg Lead Time'] = `${leadTime.toFixed(1)} days`;
      exportFilters['Avg Stay'] = `${stayLen.toFixed(1)} nights`;
    }

    // 2. Prepare Main Table Data
    const columns = ['Guest Name', 'Total Revenue', 'Nights', 'Stays'];

    // FIX: Ensure topGuests is an array and handle missing revenue properties inside the map
    const guests = Array.isArray(this.reportData.topGuests) ? this.reportData.topGuests : [];

    const dataToExport = guests.map((guest: any) => {
      const revenue = guest.totalRevenue || 0; // Fallback to 0 if undefined
      return {
        guestName: guest.guestName || 'Unknown',
        totalRevenue: `$${revenue.toLocaleString()}`, // Safe call
        nights: guest.totalNights || 0,
        stays: guest.totalReservations || 0
      };
    });

    this.pdfService.generateReport(reportTitle, columns, dataToExport, exportFilters);
  }
}

export class UnifiedGuestReports {
}
