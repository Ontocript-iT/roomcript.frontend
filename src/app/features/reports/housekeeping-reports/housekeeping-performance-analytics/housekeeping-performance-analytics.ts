import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdfService } from '../../../../core/services/pdf.service';
import { HousekeepingReportService } from '../../../../core/services/housekeeping-report.service';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
}

@Component({
  selector: 'app-housekeeping-performance-analytics',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './housekeeping-performance-analytics.html',
  styleUrls: ['./housekeeping-performance-analytics.scss']
})
export class HousekeepingPerformanceAnalytics implements OnInit {
  selectedReport: string = 'staff-performance';
  reportData: any[] = [];
  reportSummary: any = null;
  loading: boolean = false;
  error: string = '';

  filters: ReportFilters = {
    dateFrom: '',
    dateTo: ''
  };

  reportOptions = [
    { value: 'staff-performance', label: 'Staff Performance' },
    { value: 'task-completion', label: 'Task Completion Report' },
    { value: 'maintenance-analytics', label: 'Maintenance Analytics' }
  ];

  constructor(
    private pdfService: PdfService,
    private reportService: HousekeepingReportService
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
  }

  setDefaultDates(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    this.filters.dateFrom = lastWeek.toISOString().split('T')[0];
    this.filters.dateTo = today.toISOString().split('T')[0];
  }

  onReportChange(): void {
    this.reportData = [];
    this.reportSummary = null;
    this.error = '';
  }

  getReportTitle(): string {
    const report = this.reportOptions.find(r => r.value === this.selectedReport);
    return report ? report.label : '';
  }

  applyFilters(): void {
    if (!this.selectedReport) {
      this.error = 'Please select a report type';
      return;
    }

    if (!this.filters.dateFrom || !this.filters.dateTo) {
      this.error = 'Please select date range';
      return;
    }

    this.loading = true;
    this.error = '';

    console.log('Applying filters:', this.filters);

    // FIX: Call getPerformanceAnalyticsReport instead of getHousekeepingReport
    this.reportService.getPerformanceAnalyticsReport(this.selectedReport, this.filters)
      .subscribe({
        next: (response) => {
          console.log('Data received:', response);

          // Check if both data and summary are empty/null
          if (!response || (!response.data.length && !response.summary)) {
            this.error = 'No data found for the selected filters';
            this.reportData = [];
            this.reportSummary = null;
          } else {
            this.reportData = response.data;
            this.reportSummary = response.summary;
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
    this.reportData = [];
    this.reportSummary = null;
    this.error = '';
  }

  exportReport(): void {
    if (this.reportData.length === 0 && !this.reportSummary) {
      alert('No data available to export');
      return;
    }

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();

    this.pdfService.generateReport(
      reportTitle,
      columns,
      this.reportData,
      { ...this.filters, ...this.reportSummary }
    );
  }

  getColumnsForReport(): string[] {
    switch (this.selectedReport) {
      case 'staff-performance':
        return ['Staff Name', 'Role', 'Tasks Completed', 'Avg Time (min)', 'Rating'];
      case 'task-completion':
        return ['Date', 'Tasks Completed', 'Rooms Cleaned', 'Maintenance Completed', 'Lost Items Found', 'Avg Task Time'];
      case 'maintenance-analytics':
        return ['Issue Type', 'Count', 'Avg Resolution Time', 'Est. Cost', 'Actual Cost'];
      default:
        return [];
    }
  }

  getColumnKey(column: string): string {
    return column.toLowerCase().replace(/\s(.)/g, (match, group1) => group1.toUpperCase());
  }

  getColumnValue(row: any, column: string): string {
    // Map Staff Performance keys
    if (this.selectedReport === 'staff-performance') {
      if (column === 'Avg Time (min)') return row.averageTime || '-';
    }

    // Map Task Completion keys
    if (this.selectedReport === 'task-completion') {
      if (column === 'Avg Task Time') return row.averageTaskTime ? row.averageTaskTime.toFixed(1) : '0';
    }

    // Map Maintenance Analytics keys
    if (this.selectedReport === 'maintenance-analytics') {
      if (column === 'Issue Type') return row.type || row.category || '-';
      if (column === 'Avg Resolution Time') return row.averageResolutionTime || '-';
      if (column === 'Est. Cost') return row.estimatedCost ? `$${row.estimatedCost}` : '-';
      if (column === 'Actual Cost') return row.actualCost ? `$${row.actualCost}` : '-';
    }

    const key = this.getColumnKey(column);
    return row[key] !== undefined && row[key] !== null ? row[key] : '-';
  }
}
