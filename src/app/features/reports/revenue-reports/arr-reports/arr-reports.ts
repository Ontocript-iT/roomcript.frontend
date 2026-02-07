import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RevenueReportService} from '../../../../core/services/revenue-report.service';
import { ArrReportResult, DailyStat} from '../../../../core/models/report.models';
import { PdfService} from '../../../../core/services/pdf.service';
import {MatSnackBar} from '@angular/material/snack-bar';


interface ReportFilters {
  startDate: string;
  endDate: string;
  year: number;
  month: number;
}

@Component({
  selector: 'app-arr-reports',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './arr-reports.html',
  styleUrl: './arr-reports.scss'
})
export class ArrReports implements OnInit {
  propertyCode: string = ''; // Will be loaded from Local Storage
  selectedReport: string = 'last-30-days';

  reportData: ArrReportResult | null = null;
  tableData: DailyStat[] = [];
  columns: string[] = ['Date', 'Rooms Sold', 'Daily Revenue', 'ARR'];

  loading: boolean = false;
  error: string = '';

  filters: any = {
    startDate: '',
    endDate: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  };

  years: number[] = [];
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  reportOptions = [
    { value: 'last-30-days', label: "Last 30 Days" },
    { value: 'monthly-summary', label: "Monthly Report" },
    { value: 'specific-range', label: "Specific Date Range" }
  ];


  constructor(
    private revenueService: RevenueReportService,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe,
    private pdfService: PdfService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {

    const storedProp = localStorage.getItem('propertyCode');

    if (storedProp) {
      this.propertyCode = storedProp;
    } else {
      this.error = 'No Property Code found in session. Please re-login.';
    }

    this.generateYearList();

    if (this.propertyCode) {
      this.onReportChange();
    }
  }

  generateYearList() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
  }

  onReportChange(): void {
    this.reportData = null;
    this.tableData = [];
    this.error = '';

    const today = new Date();

    if (this.selectedReport === 'last-30-days') {
      const start = new Date();
      start.setDate(today.getDate() - 30);
      this.filters.startDate = start.toISOString().split('T')[0];
      this.filters.endDate = today.toISOString().split('T')[0];
    }
    else if (this.selectedReport === 'year-to-date') {
      this.filters.startDate = `${today.getFullYear()}-01-01`;
      this.filters.endDate = today.toISOString().split('T')[0];
    }
    else if (this.selectedReport === 'monthly-summary') {
      this.updateDatesFromMonthSelection();
    }
  }

  updateDatesFromMonthSelection() {
    const start = new Date(this.filters.year, this.filters.month - 1, 1);
    const end = new Date(this.filters.year, this.filters.month, 0);

    const format = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    this.filters.startDate = format(start);
    this.filters.endDate = format(end);
  }

  showDateRangeFilter(): boolean {
    return this.selectedReport === 'specific-range' ||
      this.selectedReport === 'last-30-days' ||
      this.selectedReport === 'year-to-date';
  }

  showMonthFilter(): boolean {
    return this.selectedReport === 'monthly-summary';
  }

  applyFilters(): void {
    if (this.selectedReport === 'monthly-summary') {
      this.updateDatesFromMonthSelection();
    }

    if (!this.propertyCode) {
      this.error = 'Property context is missing. Please refresh or login again.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.reportData = null;
    this.tableData = [];

    this.revenueService.getArrReport(
      this.propertyCode,
      this.filters.startDate,
      this.filters.endDate
    ).subscribe({
      next: (response) => {
        if (response.status === 200 && response.result) {
          this.reportData = response.result;
          this.tableData = response.result.dailyStats || [];
        } else {
          this.error = response.message || 'No data returned';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.error = 'Failed to load report data';
        this.loading = false;
      }
    });
  }

  resetFilters(): void {
    this.selectedReport = 'last-30-days';
    this.onReportChange();
    this.reportData = null;
    this.tableData = [];
    this.error = '';
  }

  getReportTitle(): string {
    const report = this.reportOptions.find(r => r.value === this.selectedReport);
    return report ? `Financial ARR Report - ${report.label}` : 'Financial ARR Report';
  }

  exportReport(): void {
    if (!this.reportData || !this.tableData || this.tableData.length === 0) {
      this.showError('No data available to export');
      return;
    }

    const reportTitle = this.getReportTitle();
    const formattedData = this.tableData.map(row => ({

      date: this.datePipe.transform(row.date, 'mediumDate') || '-',

      roomsSold: row.roomsSold.toString(),

      dailyRevenue: this.currencyPipe.transform(row.dailyRevenue, 'USD') || '$0.00',
      arr: this.currencyPipe.transform(row.arr, 'USD') || '$0.00'
    }));

    this.pdfService.generateReport(
      reportTitle,
      this.columns,
      formattedData,
      this.filters
    );
  }

  getColumnValue(row: DailyStat, column: string): string {
    switch (column) {
      case 'Date':
        return this.datePipe.transform(row.date, 'mediumDate') || '-';
      case 'Daily Revenue':
        return this.currencyPipe.transform(row.dailyRevenue, 'USD') || '$0.00';
      case 'Rooms Sold':
        return row.roomsSold.toString();
      case 'ARR':
        return this.currencyPipe.transform(row.arr, 'USD') || '$0.00';
      default:
        return '-';
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
