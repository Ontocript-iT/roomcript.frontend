import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // Import Sanitizer
import { PdfService, PdfTableSection } from '../../../../core/services/pdf.service'; // Import Interface
import { HousekeepingReportService } from '../../../../core/services/housekeeping-report.service';

interface UnifiedReportFilters {
  propertyCode: string;
  startDate: string;
  endDate: string;
  sections: string[];
  taskTypes: string[];
  assignedStaffId?: number | null;
}

@Component({
  selector: 'app-unified-housekeeping-reports',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './unified-housekeeping-reports.html',
  styleUrls: ['./unified-housekeeping-reports.scss']
})
export class UnifiedHousekeepingReports implements OnInit {

  // Data Containers
  taskSummary: any = null;
  staffPerformanceList: any[] = [];
  tasksList: any[] = [];

  loading: boolean = false;
  error: string = '';

  // Preview URL
  pdfPreviewUrl: SafeResourceUrl | null = null;

  filters: UnifiedReportFilters = {
    propertyCode: 'PROP0005',
    startDate: '',
    endDate: '',
    sections: ['TASK_SUMMARY', 'STAFF_PERFORMANCE', 'TASK_DETAILS'],
    taskTypes: ['CHECKOUT_CLEANING', 'STAYOVER_CLEANING']
  };

  sectionOptions = [
    { value: 'TASK_SUMMARY', label: 'Task Summary' },
    { value: 'STAFF_PERFORMANCE', label: 'Staff Performance' },
    { value: 'TASK_DETAILS', label: 'Task Details' },
  ];

  taskTypeOptions = [
    { value: 'CHECKOUT_CLEANING', label: 'Checkout Cleaning' },
    { value: 'STAYOVER_CLEANING', label: 'Stayover Cleaning' },
    { value: 'DEEP_CLEANING', label: 'Deep Cleaning' },
    { value: 'TURNDOWN_SERVICE', label: 'Turndown Service' },
    { value: 'MAINTENANCE_REQUEST', label: 'Maintenance Request' }
  ];

  showSectionsDropdown = false;
  showTaskTypesDropdown = false;

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
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filters.startDate = firstDay.toISOString().split('T')[0];
    this.filters.endDate = today.toISOString().split('T')[0];
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showSectionsDropdown = false;
      this.showTaskTypesDropdown = false;
    }
  }

  toggleSectionsDropdown(): void {
    this.showSectionsDropdown = !this.showSectionsDropdown;
    this.showTaskTypesDropdown = false;
  }

  toggleTaskTypesDropdown(): void {
    this.showTaskTypesDropdown = !this.showTaskTypesDropdown;
    this.showSectionsDropdown = false;
  }

  toggleSection(section: string): void {
    const index = this.filters.sections.indexOf(section);
    if (index > -1) {
      this.filters.sections.splice(index, 1);
    } else {
      this.filters.sections.push(section);
    }
  }

  toggleTaskType(type: string): void {
    const index = this.filters.taskTypes.indexOf(type);
    if (index > -1) {
      this.filters.taskTypes.splice(index, 1);
    } else {
      this.filters.taskTypes.push(type);
    }
  }

  getSelectedSectionsLabel(): string {
    if (this.filters.sections.length === 0) return 'Select sections...';
    return this.filters.sections.length === 1 ? '1 section selected' : `${this.filters.sections.length} sections selected`;
  }

  getSelectedTaskTypesLabel(): string {
    if (this.filters.taskTypes.length === 0) return 'Select task types...';
    return this.filters.taskTypes.length === 1 ? '1 type selected' : `${this.filters.taskTypes.length} types selected`;
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
    this.taskSummary = null;
    this.staffPerformanceList = [];
    this.tasksList = [];
    this.pdfPreviewUrl = null;

    this.reportService.getUnifiedReport(this.filters)
      .subscribe({
        next: (response: any) => {
          console.log('Unified Report Data:', response);
          if (response && response.data) {
            this.taskSummary = response.data.taskSummary || null;
            this.staffPerformanceList = response.data.staffPerformance || [];
            this.tasksList = response.data.tasks || [];
          }

          if (!this.hasData()) {
            this.error = 'No data found for the selected filters';
          } else {
            this.generatePreview();
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load report data: ' + (err.error?.message || err.message);
          this.loading = false;
        }
      });
  }

  hasData(): boolean {
    return !!this.taskSummary || this.staffPerformanceList.length > 0 || this.tasksList.length > 0;
  }

  resetFilters(): void {
    this.setDefaultDates();
    this.filters.sections = ['TASK_SUMMARY', 'STAFF_PERFORMANCE', 'TASK_DETAILS'];
    this.taskSummary = null;
    this.staffPerformanceList = [];
    this.tasksList = [];
    this.pdfPreviewUrl = null;
    this.error = '';
  }

  // --- Helpers for PDF Generation ---

  getFormattedSummary(): any {
    if (!this.taskSummary) return null;

    // Map API response summary to readable keys
    const s = this.taskSummary;
    const summary: any = {};

    if (s.totalTasks !== undefined) summary['Total Tasks'] = s.totalTasks;
    if (s.completionRate !== undefined) summary['Completion Rate'] = `${s.completionRate}%`;
    if (s.averageCompletionTimeMinutes !== undefined) summary['Avg Time'] = `${s.averageCompletionTimeMinutes} min`;
    if (s.statusBreakdown?.ASSIGNED !== undefined) summary['Assigned Tasks'] = s.statusBreakdown.ASSIGNED;

    return Object.keys(summary).length > 0 ? summary : null;
  }

  getRelevantFilters(): any {
    return {
      'From': this.filters.startDate,
      'To': this.filters.endDate,
      'Sections': this.filters.sections.join(', ')
    };
  }

  prepareMainTableData(): any[] {
    // Map Task List for the main table
    return this.tasksList.map(task => ({
      taskNumber: task.taskNumber || task.id,
      type: task.type || task.taskType?.replace(/_/g, ' ') || '-',
      room: task.room || task.roomNumber,
      assignedTo: task.assignedTo || task.staffName || 'Unassigned',
      status: task.status
    }));
  }

  prepareExtraTables(): PdfTableSection[] {
    const extraTables: PdfTableSection[] = [];

    // If "Staff Performance" is selected and has data, add it as a second table
    if (this.filters.sections.includes('STAFF_PERFORMANCE') && this.staffPerformanceList.length > 0) {
      extraTables.push({
        title: 'Staff Performance Breakdown',
        columns: ['Staff Name', 'Tasks Assigned', 'Tasks Completed', 'Completion Rate', 'Rating'],
        data: this.staffPerformanceList.map(s => ({
          staffName: s.staffName,
          tasksAssigned: s.tasksAssigned,
          tasksCompleted: s.tasksCompleted,
          completionRate: s.completionRate ? `${s.completionRate}%` : '-',
          rating: s.rating
        }))
      });
    }

    return extraTables;
  }

  // --- Actions ---

  generatePreview(): void {
    if (!this.hasData()) return;

    const reportTitle = 'Unified Housekeeping Report';

    // Main Table Config (Tasks)
    const mainColumns = ['Task Number', 'Type', 'Room', 'Assigned To', 'Status'];
    const mainData = this.prepareMainTableData();

    // Extra Tables
    const extraTables = this.prepareExtraTables();

    // Summary & Filters
    const summaryData = this.getFormattedSummary();
    const cleanFilters = this.getRelevantFilters();

    const url = this.pdfService.getReportPreviewUrl(
      reportTitle,
      mainColumns,
      mainData,
      cleanFilters,
      summaryData,
      extraTables // <--- Pass extra tables here
    );

    const viewerUrl = url + '#toolbar=0&navpanes=0&scrollbar=0';
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  exportReport(): void {
    if (!this.hasData()) {
      alert('No data available to export');
      return;
    }

    const reportTitle = 'Unified Housekeeping Report';
    const mainColumns = ['Task Number', 'Type', 'Room', 'Assigned To', 'Status'];
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
