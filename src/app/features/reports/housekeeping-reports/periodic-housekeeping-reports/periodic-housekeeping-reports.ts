import { Component, OnInit } from '@angular/core';
import { PdfService } from '../../../../core/services/pdf.service';
import { HousekeepingReportService } from '../../../../core/services/housekeeping-report.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

interface ReportFilters {
  reportDate: string;
  startDate: string;
  endDate: string;
  year: number;
  month: number;
}

@Component({
  selector: 'app-periodic-housekeeping-reports',
  imports: [
    FormsModule,
    CommonModule
  ],
  providers: [DatePipe], // Used for formatting table dates
  templateUrl: './periodic-housekeeping-reports.html',
  styleUrls: ['./periodic-housekeeping-reports.scss']
})
export class PeriodicHousekeepingReports implements OnInit {
  selectedReport: string = 'daily-summary';

  // reportResult holds the full hierarchical JSON response (Summaries + Lists)
  reportResult: any = null;
  // tableData holds the specific array extracted from reportResult to show in the table
  tableData: any[] = [];

  loading: boolean = false;
  error: string = '';

  filters: ReportFilters = {
    reportDate: '',
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
    { value: 'daily-summary', label: "Today's Daily Summary" },
    { value: 'weekly-summary', label: "Weekly Summary" },
    { value: 'monthly-summary', label: "Monthly Summary" },
    { value: 'last-30-days', label: "Last 30 Days Report" },
    { value: 'year-to-date', label: "Year-to-Date Report" },
    { value: 'specific-week', label: "Specific Date Range" }
  ];

  constructor(
    private pdfService: PdfService,
    private reportService: HousekeepingReportService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.generateYearList();
    this.setDefaultDates();
  }

  generateYearList() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
  }

  setDefaultDates(): void {
    const today = new Date();
    this.filters.reportDate = today.toISOString().split('T')[0];

    // Default weekly range (Monday to Sunday)
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    const endOfWeek = new Date(today.setDate(diff + 6));

    this.filters.startDate = startOfWeek.toISOString().split('T')[0];
    this.filters.endDate = endOfWeek.toISOString().split('T')[0];
  }

  onReportChange(): void {
    this.reportResult = null;
    this.tableData = [];
    this.error = '';

    // Auto-adjust filters based on selection if needed
    if (this.selectedReport === 'last-30-days') {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      this.filters.startDate = start.toISOString().split('T')[0];
      this.filters.endDate = end.toISOString().split('T')[0];
    } else if (this.selectedReport === 'year-to-date') {
      const now = new Date();
      this.filters.startDate = `${now.getFullYear()}-01-01`;
      this.filters.endDate = now.toISOString().split('T')[0];
    }
  }

  getReportTitle(): string {
    const report = this.reportOptions.find(r => r.value === this.selectedReport);
    return report ? report.label : '';
  }

  // --- Filter Visibility Logic ---

  showReportDateFilter(): boolean {
    return this.selectedReport === 'daily-summary';
  }

  showDateRangeFilter(): boolean {
    return this.selectedReport === 'weekly-summary' ||
      this.selectedReport === 'specific-week' ||
      this.selectedReport === 'last-30-days' ||
      this.selectedReport === 'year-to-date';
  }

  showMonthFilter(): boolean {
    return this.selectedReport === 'monthly-summary';
  }

  // --- Actions ---

  applyFilters(): void {
    if (!this.selectedReport) {
      this.error = 'Please select a report type';
      return;
    }

    this.loading = true;
    this.error = '';
    this.reportResult = null;
    this.tableData = [];

    console.log('Applying filters:', this.filters);

    this.reportService.getReport(this.selectedReport, this.filters)
      .subscribe({
        next: (data) => {
          console.log('Data received:', data);
          this.reportResult = data;

          // Flatten logic: Extract the correct list for the table based on report type
          if (this.selectedReport === 'daily-summary') {
            this.tableData = data.roomStatusSummary?.roomDetails || [];
          } else {
            // For periodic reports (weekly, monthly, etc.), show daily breakdown
            this.tableData = data.dailyBreakdown || [];
          }

          if (!this.tableData || this.tableData.length === 0) {
            // We don't error here, just show empty table, because summary cards might still have data
          }

          this.loading = false;
        },
        error: (err) => {
          console.error('API Error:', err);
          this.error = 'Failed to load report data: ' + (err.error?.message || err.message);
          this.loading = false;
        }
      });
  }

  resetFilters(): void {
    this.setDefaultDates();
    this.filters.year = new Date().getFullYear();
    this.filters.month = new Date().getMonth() + 1;
    this.reportResult = null;
    this.tableData = [];
    this.error = '';
  }

  exportReport(): void {
    if (!this.reportResult) {
      alert('No data available to export');
      return;
    }

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();

    // Pass the flattened tableData to the PDF service
    this.pdfService.generateReport(
      reportTitle,
      columns,
      this.tableData,
      this.filters
    );
  }

  // --- Table Column Logic ---

  getColumnsForReport(): string[] {
    if (this.selectedReport === 'daily-summary') {
      return ['Room Number', 'Room Type', 'Current Status', 'Last Status Change'];
    } else {
      // Weekly, Monthly, Range reports show breakdown by Date
      return ['Date', 'Tasks Completed', 'Rooms Cleaned', 'Maintenance Completed', 'Lost Items Found'];
    }
  }

  getColumnValue(row: any, column: string): string {
    // Helper to map Column Header -> JSON Property safely

    // Daily Summary Mapping (Row = RoomDetails)
    if (this.selectedReport === 'daily-summary') {
      switch (column) {
        case 'Room Number': return row.roomNumber;
        case 'Room Type': return row.roomType;
        case 'Current Status': return row.currentStatus;
        case 'Last Status Change': return this.datePipe.transform(row.lastStatusChange, 'medium') || '-';
        default: return '-';
      }
    }
    // Periodic Summary Mapping (Row = DailyBreakdown)
    else {
      switch (column) {
        case 'Date': return this.datePipe.transform(row.date, 'mediumDate') || '-';
        case 'Tasks Completed': return row.tasksCompleted;
        case 'Rooms Cleaned': return row.roomsCleaned;
        case 'Maintenance Completed': return row.maintenanceCompleted;
        case 'Lost Items Found': return row.lostItemsFound;
        default: return '-';
      }
    }
  }
}
