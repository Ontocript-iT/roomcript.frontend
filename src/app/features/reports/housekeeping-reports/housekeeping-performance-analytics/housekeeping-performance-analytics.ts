import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  selectedReport: string = 'task-completion'; // Default to one with cards for demo
  reportData: any[] = [];
  reportSummary: any = null;
  loading: boolean = false;
  error: string = '';

  // Property to store the safe URL for the iframe
  pdfPreviewUrl: SafeResourceUrl | null = null;

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
    private reportService: HousekeepingReportService,
    private sanitizer: DomSanitizer
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
    this.pdfPreviewUrl = null;
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
    this.pdfPreviewUrl = null;

    console.log('Applying filters:', this.filters);

    this.reportService.getPerformanceAnalyticsReport(this.selectedReport, this.filters)
      .subscribe({
        next: (response) => {
          console.log('Data received:', response);

          if (!response || (!response.data?.length && !response.summary)) {
            this.error = 'No data found for the selected filters';
            this.reportData = [];
            this.reportSummary = null;
          } else {
            this.reportData = response.data || [];
            this.reportSummary = response.summary || null;

            // Generate preview immediately
            this.generatePreview();
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
    this.pdfPreviewUrl = null;
    this.error = '';
  }

  // --- UPDATED: Extract Summary Data Matching HTML ---
  getFormattedSummary(): any {
    if (!this.reportSummary) return null;

    const summary: any = {};
    const s = this.reportSummary;

    // 1. Task Completion Report (Matches HTML Cards)
    if (this.selectedReport === 'task-completion') {
      if (s.totalTasks !== undefined) summary['Total Tasks'] = s.totalTasks;

      if (s.completedTasks !== undefined) {
        summary['Completed'] = `${s.completedTasks} (Rate: ${s.taskCompletionRate || 0}%)`;
      }

      const pending = (s.pendingTasks || 0) + (s.inProgressTasks || 0);
      if (pending > 0) summary['Pending/In Progress'] = pending;

      if (s.averageCompletionTime !== undefined) summary['Avg Completion Time'] = `${s.averageCompletionTime}m`;
    }
    // 2. Maintenance Analytics (Matches HTML Cards)
    else if (this.selectedReport === 'maintenance-analytics') {
      if (s.totalRequests !== undefined) summary['Total Requests'] = s.totalRequests;

      const active = (s.inProgressRequests || 0) + (s.reportedRequests || 0);
      summary['Active Requests'] = `${active} (${s.criticalRequests || 0} Critical)`;

      if (s.roomsOutOfService !== undefined) summary['Rooms Out of Service'] = s.roomsOutOfService;
      if (s.totalActualCost !== undefined) summary['Total Actual Cost'] = `$${s.totalActualCost}`;
    }
    // 3. Staff Performance (Fallback/Standard)
    else if (this.selectedReport === 'staff-performance') {
      if (s.totalTasksCompleted !== undefined) summary['Total Tasks'] = s.totalTasksCompleted;
      if (s.averageRating !== undefined) summary['Avg Rating'] = `${s.averageRating}/5`;
      if (s.topPerformer) summary['Top Performer'] = s.topPerformer;
    }

    return Object.keys(summary).length > 0 ? summary : null;
  }

  preparePdfData(): any[] {
    if (!this.reportData || this.reportData.length === 0) return [];

    return this.reportData.map(row => {
      if (this.selectedReport === 'staff-performance') {
        return {
          staffName: row.staffName,
          role: row.role,
          tasksCompleted: row.tasksCompleted,
          avgTime: row.averageTime ? `${row.averageTime} min` : '-',
          rating: row.rating ? `${row.rating}/5` : '-'
        };
      }
      else if (this.selectedReport === 'task-completion') {
        return {
          date: new Date(row.date).toLocaleDateString(),
          tasksCompleted: row.tasksCompleted,
          roomsCleaned: row.roomsCleaned,
          maintenanceCompleted: row.maintenanceCompleted,
          lostItemsFound: row.lostItemsFound,
          avgTaskTime: row.averageTaskTime ? `${row.averageTaskTime.toFixed(1)} min` : '-'
        };
      }
      else if (this.selectedReport === 'maintenance-analytics') {
        return {
          maintenanceType: row.maintenanceType || '-',
          count: row.count,
          completed: row.completed ? `${row.completed}` : '-',
          averageCost: row.averageCost ? `$${row.averageCost}` : '-'
        };
      }
      return row;
    });
  }

  getRelevantFilters(): any {
    return {
      'From': this.filters.dateFrom,
      'To': this.filters.dateTo
    };
  }

  generatePreview(): void {
    if (this.reportData.length === 0 && !this.reportSummary) return;

    const reportTitle = this.getReportTitle();
    const columns = this.getColumnsForReport();
    const pdfData = this.preparePdfData();
    const summaryData = this.getFormattedSummary(); // <--- Correctly mapped summary
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
    if (this.reportData.length === 0 && !this.reportSummary) {
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
    switch (this.selectedReport) {
      case 'staff-performance':
        return ['Staff Name', 'Role', 'Tasks Completed', 'Avg Time (min)', 'Rating'];
      case 'task-completion':
        return ['Date', 'Tasks Completed', 'Rooms Cleaned', 'Maintenance Completed', 'Lost Items Found', 'Avg Task Time'];
      case 'maintenance-analytics':
        return ['Maintenance Type', 'Count', 'Completed', 'Average Cost'];
      default:
        return [];
    }
  }

  getColumnKey(column: string): string {
    return column.toLowerCase().replace(/\s(.)/g, (match, group1) => group1.toUpperCase());
  }

  getColumnValue(row: any, column: string): string {
    // HTML Table Display Logic
    if (this.selectedReport === 'staff-performance') {
      if (column === 'Avg Time (min)') return row.averageTime || '-';
    }

    if (this.selectedReport === 'task-completion') {
      if (column === 'Avg Task Time') return row.averageTaskTime ? row.averageTaskTime.toFixed(1) : '0';
    }

    if (this.selectedReport === 'maintenance-analytics') {
      if (column === 'Maintenance Type') return row.maintenanceType || '-';
      if (column === 'Completed') return row.completed || '-';
      if (column === 'Average Cost') return row.averageCost ? `$${row.averageCost}` : '-';
    }

    const key = this.getColumnKey(column);
    return row[key] !== undefined && row[key] !== null ? row[key] : '-';
  }
}
