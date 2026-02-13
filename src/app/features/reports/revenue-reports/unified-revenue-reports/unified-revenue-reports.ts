import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfService, PdfTableSection } from '../../../../core/services/pdf.service';
import { RevenueReportService } from '../../../../core/services/revenue-report.service';
import { UnifiedFinancialRequest, FlashReportData, TaxReportData } from '../../../../core/models/report.models';

@Component({
  selector: 'app-unified-revenue-reports',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
  ],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './unified-revenue-reports.html',
  styleUrl: './unified-revenue-reports.scss'
})
export class UnifiedRevenueReports implements OnInit {

  flashReport: FlashReportData | null = null;
  revenueLedger: any[] = [];
  paymentSummary: any[] = [];
  taxReport: TaxReportData | null = null;

  loading: boolean = false;
  error: string = '';

  pdfPreviewUrl: SafeResourceUrl | null = null;

  filters: UnifiedFinancialRequest = {
    propertyCode: '',
    startDate: '',
    endDate: '',
    includeYearToDate: false,
    includeBudget: false,
    sections: ['MANAGERS_FLASH', 'REVENUE_LEDGER', 'PAYMENT_SUMMARY', 'TAX_REPORT']
  };

  sectionOptions = [
    { value: 'MANAGERS_FLASH', label: "Manager's Flash Report" },
    { value: 'REVENUE_LEDGER', label: 'Revenue Ledger' },
    { value: 'PAYMENT_SUMMARY', label: 'Payment Summary' },
    { value: 'TAX_REPORT', label: 'Tax Report' }
  ];

  showSectionsDropdown = false;

  constructor(
    private pdfService: PdfService,
    private revenueService: RevenueReportService,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe,
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
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filters.startDate = firstDay.toISOString().split('T')[0];
    this.filters.endDate = today.toISOString().split('T')[0];
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
      const s = this.sectionOptions.find(opt => opt.value === this.filters.sections[0]);
      return s ? s.label : '1 section selected';
    }
    return `${this.filters.sections.length} sections selected`;
  }

  applyFilters(): void {
    if (!this.filters.propertyCode) {
      this.error = 'Property Code missing.';
      return;
    }
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
    this.pdfPreviewUrl = null;

    // Reset Data
    this.flashReport = null;
    this.revenueLedger = [];
    this.paymentSummary = [];
    this.taxReport = null;

    this.revenueService.getUnifiedFinancialReport(this.filters)
      .subscribe({
        next: (response) => {
          if (response.status === 200 && response.data) {
            this.flashReport = response.data.flashReport || null;
            this.revenueLedger = response.data.revenueLedger || [];
            this.paymentSummary = response.data.paymentSummary || [];
            this.taxReport = response.data.taxReport || null;
          } else {
            this.error = 'No data returned from server.';
          }

          if (!this.hasData()) {
            this.error = 'No records found for the selected criteria.';
          } else {
            // Logic Update: Generate preview immediately
            this.generatePreview();
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load report data.';
          this.loading = false;
        }
      });
  }

  hasData(): boolean {
    return !!this.flashReport ||
      this.revenueLedger.length > 0 ||
      this.paymentSummary.length > 0 ||
      (!!this.taxReport && Object.keys(this.taxReport.breakdownByType || {}).length > 0);
  }

  resetFilters(): void {
    this.setDefaultDates();
    this.filters.includeYearToDate = false;
    this.filters.includeBudget = false;
    this.filters.sections = ['MANAGERS_FLASH', 'REVENUE_LEDGER', 'PAYMENT_SUMMARY', 'TAX_REPORT'];

    this.flashReport = null;
    this.revenueLedger = [];
    this.paymentSummary = [];
    this.taxReport = null;
    this.pdfPreviewUrl = null;
    this.error = '';
  }

  getTaxKeys(): string[] {
    return this.taxReport && this.taxReport.breakdownByType
      ? Object.keys(this.taxReport.breakdownByType)
      : [];
  }

  getFormattedSummary(): any {
    if (!this.flashReport) return null;

    const summary: any = {};

    const safeCurrency = (value: any) => {
      if (value === undefined || value === null) return '-';
      if (isNaN(Number(value))) return value;
      return this.currencyPipe.transform(value, 'USD') || '0';
    };

    summary['Total Revenue'] = safeCurrency(this.flashReport.totalRevenue);
    summary['Total Collections'] = safeCurrency(this.flashReport.totalCollections);
    summary['RevPAR'] = safeCurrency(this.flashReport.revPar);
    summary['Overall ARR'] = safeCurrency(this.flashReport.arr);

    return summary;
  }

  prepareMainTableData(): any[] {
    if (!this.revenueLedger || this.revenueLedger.length === 0) return [];

    return this.revenueLedger.map(row => ({
      department: row.department || '-',
      revenue: this.currencyPipe.transform(row.revenue, 'USD') || '0.00'
    }));
  }

  prepareExtraTables(): PdfTableSection[] {
    const extraTables: PdfTableSection[] = [];
    if (this.taxReport && this.getTaxKeys().length > 0) {
      const taxData = this.getTaxKeys().map(key => ({
        taxType: key,
        amount: this.currencyPipe.transform(this.taxReport!.breakdownByType[key], 'USD') || '0.00'
      }));

      taxData.push({
        taxType: 'TOTAL COLLECTED',
        amount: this.currencyPipe.transform(this.taxReport.totalTaxCollected, 'USD') || '0.00'
      });

      extraTables.push({
        title: 'Tax Report',
        columns: ['Tax Type', 'Amount'],
        data: taxData
      });
    }

    if (this.paymentSummary && this.paymentSummary.length > 0) {
      const paymentData = this.paymentSummary.map(row => ({
        method: row.method || '-',
        amount: this.currencyPipe.transform(row.amount, 'USD') || '0.00'
      }));

      extraTables.push({
        title: 'Payment Summary',
        columns: ['Method', 'Amount'],
        data: paymentData
      });
    }

    return extraTables;
  }

  getRelevantFilters(): any {
    return {
      'From': this.filters.startDate,
      'To': this.filters.endDate
    };
  }

  generatePreview(): void {
    if (!this.hasData()) return;

    const reportTitle = 'Unified Financial Report';
    const mainColumns = ['Department', 'Revenue'];
    const mainData = this.prepareMainTableData();

    const extraTables = this.prepareExtraTables();
    const summaryData = this.getFormattedSummary();
    const cleanFilters = this.getRelevantFilters();

    const url = this.pdfService.getReportPreviewUrl(
      reportTitle,
      mainColumns,
      mainData,
      cleanFilters,
      summaryData,
      extraTables
    );

    const viewerUrl = url + '#toolbar=0&navpanes=0&scrollbar=0';
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  exportReport(): void {
    if (!this.hasData()) {
      alert('No data available to export');
      return;
    }

    const reportTitle = 'Unified Financial Report';
    const mainColumns = ['Department', 'Revenue'];
    const mainData = this.prepareMainTableData();
    const extraTables = this.prepareExtraTables();
    const summaryData = this.getFormattedSummary();
    const cleanFilters = this.getRelevantFilters();

    this.pdfService.generateReport(
      reportTitle,
      mainColumns,
      mainData,
      cleanFilters,
      summaryData,
      extraTables
    );
  }
}
