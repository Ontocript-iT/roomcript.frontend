import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { PdfService} from '../../../../core/services/pdf.service';
import { RevenueReportService} from '../../../../core/services/revenue-report.service';
import { UnifiedFinancialRequest, FlashReportData, TaxReportData} from '../../../../core/models/report.models';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


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
    private currencyPipe: CurrencyPipe
  ) {}

  ngOnInit(): void {
    // Load Property Code from LocalStorage
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
    // Default to first day of current month
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

    // Reset Data
    this.flashReport = null;
    this.revenueLedger = [];
    this.paymentSummary = [];
    this.taxReport = null;

    this.revenueService.getUnifiedFinancialReport(this.filters)
      .subscribe({
        next: (response) => {
          console.log('Unified Report Data:', response);
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
          }
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
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
    this.error = '';
  }

  getTaxKeys(): string[] {
    return this.taxReport && this.taxReport.breakdownByType
      ? Object.keys(this.taxReport.breakdownByType)
      : [];
  }

  isNumber(val: any): boolean {
    return typeof val === 'number';
  }

  exportReport(): void {
    if (!this.hasData()) {
      alert('No data available to export');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 15;

    // --- 1. Header ---
    doc.setFontSize(16);
    doc.text('Unified Financial Report', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    doc.setFontSize(10);
    doc.text(`Period: ${this.filters.startDate} to ${this.filters.endDate}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // --- 2. Manager's Flash Report (Table 1) ---
    if (this.flashReport) {
      doc.setFontSize(12);
      doc.text("Manager's Flash Report", 14, currentY);
      currentY += 2;

      const flashData = [
        ['Total Revenue', this.currencyPipe.transform(this.flashReport.totalRevenue, 'USD') || '0'],
        ['Total Collections', this.currencyPipe.transform(this.flashReport.totalCollections, 'USD') || '0'],
        ['RevPAR', this.flashReport.revPar.toString()],
        ['Overall ARR', this.currencyPipe.transform(this.flashReport.arr, 'USD') || '0']
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Metric', 'Value']],
        body: flashData,
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181] }, // Indigo color
        margin: { left: 14, right: 14 }
      });

      // Update Y position for next table
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- 3. Revenue Ledger (Table 2) ---
    if (this.revenueLedger && this.revenueLedger.length > 0) {
      // Check for page break space
      if (currentY > 250) { doc.addPage(); currentY = 20; }

      doc.setFontSize(12);
      doc.text("Revenue Ledger", 14, currentY);
      currentY += 2;

      const ledgerData = this.revenueLedger.map(row => [
        row.department || '-',
        this.currencyPipe.transform(row.revenue, 'USD') || '0.00'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Department', 'Revenue']],
        body: ledgerData,
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- 4. Payment Summary (Table 3) ---
    if (this.paymentSummary && this.paymentSummary.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }

      doc.setFontSize(12);
      doc.text("Payment Summary", 14, currentY);
      currentY += 2;

      const paymentData = this.paymentSummary.map(row => [
        row.method || '-',
        this.currencyPipe.transform(row.amount, 'USD') || '0.00'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Payment Method', 'Amount']],
        body: paymentData,
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- 5. Tax Report (Table 4) ---
    if (this.taxReport && this.taxReport.breakdownByType) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }

      doc.setFontSize(12);
      doc.text("Tax Report", 14, currentY);
      currentY += 2;

      const taxData = Object.keys(this.taxReport.breakdownByType).map(key => [
        key,
        this.currencyPipe.transform(this.taxReport!.breakdownByType[key], 'USD') || '0.00'
      ]);

      // Add Total Row
      taxData.push(['TOTAL COLLECTED', this.currencyPipe.transform(this.taxReport.totalTaxCollected, 'USD') || '0.00']);

      autoTable(doc, {
        startY: currentY,
        head: [['Tax Type', 'Amount Collected']],
        body: taxData,
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181] },
        margin: { left: 14, right: 14 }
      });
    }

    // Save
    doc.save(`Unified_Financial_Report_${this.filters.endDate}.pdf`);
  }
}
