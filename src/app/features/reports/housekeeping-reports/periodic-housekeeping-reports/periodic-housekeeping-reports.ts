import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  providers: [DatePipe],
  templateUrl: './periodic-housekeeping-reports.html',
  styleUrls: ['./periodic-housekeeping-reports.scss']
})
export class PeriodicHousekeepingReports implements OnInit {
  selectedReport: string = 'daily-summary';

  reportResult: any = null;
  tableData: any[] = [];
  loading: boolean = false;
  error: string = '';
  pdfPreviewUrl: SafeResourceUrl | null = null;

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
    private datePipe: DatePipe,
    private sanitizer: DomSanitizer
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
    this.pdfPreviewUrl = null;

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

  applyFilters(): void {
    if (!this.selectedReport) {
      this.error = 'Please select a report type';
      return;
    }

    this.loading = true;
    this.error = '';
    this.reportResult = null;
    this.tableData = [];
    this.pdfPreviewUrl = null;

    this.reportService.getReport(this.selectedReport, this.filters)
      .subscribe({
        next: (data) => {
          this.reportResult = data;
          if (this.selectedReport === 'daily-summary') {
            this.tableData = data.roomStatusSummary?.roomDetails || data.roomDetails || [];
          } else {
            this.tableData = data.dailyBreakdown || data.breakdown || [];
          }
          this.generatePreview();
          this.loading = false;
        },
        error: (err) => {
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
    this.pdfPreviewUrl = null;
    this.error = '';
  }

  getFormattedSummary(): any {
    if (!this.reportResult) return null;
    const summary: any = {};
    const data = this.reportResult;

    if (this.selectedReport === 'daily-summary') {
      const s = data.roomStatusSummary || data;
      if (s.totalRooms !== undefined) summary['Total Rooms'] = s.totalRooms;
      if (s.cleanRooms !== undefined) summary['Clean'] = s.cleanRooms;
      if (s.dirtyRooms !== undefined) summary['Dirty'] = s.dirtyRooms;
      if (s.inspectedRooms !== undefined) summary['Inspected'] = s.inspectedRooms;
      if (s.maintenanceRooms !== undefined) summary['Maintenance'] = s.maintenanceRooms;
    } else {
      const s = data.periodSummary || data.summary || data;
      if (s.totalTasks !== undefined) summary['Total Tasks'] = s.totalTasks;
      if (s.totalRoomsCleaned !== undefined) summary['Rooms Cleaned'] = s.totalRoomsCleaned;
      if (s.averageCompletionTime !== undefined) summary['Avg Time (min)'] = s.averageCompletionTime;
    }
    return Object.keys(summary).length > 0 ? summary : null;
  }

  preparePdfData(): any[] {
    if (!this.tableData || this.tableData.length === 0) return [];
    return this.tableData.map(row => {
      if (this.selectedReport === 'daily-summary') {
        return {
          roomNumber: row.roomNumber,
          roomType: row.roomType,
          currentStatus: row.currentStatus,
          lastStatusChange: this.datePipe.transform(row.lastStatusChange, 'medium') || '-'
        };
      } else {
        return {
          date: this.datePipe.transform(row.date, 'mediumDate') || '-',
          tasksCompleted: row.tasksCompleted,
          roomsCleaned: row.roomsCleaned,
          maintenanceCompleted: row.maintenanceCompleted,
          lostItemsFound: row.lostItemsFound
        };
      }
    });
  }

  getRelevantFilters(): any {
    const cleanFilters: any = {};

    if (this.showReportDateFilter()) {
      cleanFilters['Report Date'] = this.filters.reportDate;
    }

    if (this.showDateRangeFilter()) {
      cleanFilters['Start Date'] = this.filters.startDate;
      cleanFilters['End Date'] = this.filters.endDate;
    }

    if (this.showMonthFilter()) {
      const monthName = this.months[this.filters.month - 1] || this.filters.month;
      cleanFilters['Month'] = `${monthName} ${this.filters.year}`;
    }

    return cleanFilters;
  }

  generatePreview(): void {
    if (!this.reportResult) return;

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();
    const pdfData = this.preparePdfData();
    const summaryData = this.getFormattedSummary();
    const cleanFilters = this.getRelevantFilters();

    const url = this.pdfService.getReportPreviewUrl(
      reportTitle,
      columns,
      pdfData,
      cleanFilters,
      summaryData
    );

    const viewerUrl = url + '#toolbar=0&navpanes=0&scrollbar=0';
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  exportReport(): void {
    if (!this.reportResult) {
      alert('No data available to export');
      return;
    }

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();
    const pdfData = this.preparePdfData();
    const summaryData = this.getFormattedSummary();
    const cleanFilters = this.getRelevantFilters();

    this.pdfService.generateReport(
      reportTitle,
      columns,
      pdfData,
      cleanFilters,
      summaryData
    );
  }

  getColumnsForReport(): string[] {
    if (this.selectedReport === 'daily-summary') {
      return ['Room Number', 'Room Type', 'Current Status', 'Last Status Change'];
    } else {
      return ['Date', 'Tasks Completed', 'Rooms Cleaned', 'Maintenance Completed', 'Lost Items Found'];
    }
  }

  getColumnValue(row: any, column: string): string {
    if (this.selectedReport === 'daily-summary') {
      switch (column) {
        case 'Room Number': return row.roomNumber;
        case 'Room Type': return row.roomType;
        case 'Current Status': return row.currentStatus;
        case 'Last Status Change': return this.datePipe.transform(row.lastStatusChange, 'medium') || '-';
        default: return '-';
      }
    } else {
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
