import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PdfService } from '../../../../core/services/pdf.service';
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
    { value: 'INSPECTION_RESULTS', label: 'Inspection Results' },
    { value: 'MAINTENANCE_LOGS', label: 'Maintenance Logs' }
  ];

  // Task Type Options
  taskTypeOptions = [
    { value: 'CHECKOUT_CLEANING', label: 'Checkout Cleaning' },
    { value: 'STAYOVER_CLEANING', label: 'Stayover Cleaning' },
    { value: 'DEEP_CLEANING', label: 'Deep Cleaning' },
    { value: 'TURNDOWN_SERVICE', label: 'Turndown Service' },
    { value: 'MAINTENANCE_REQUEST', label: 'Maintenance Request' }
  ];

  // Dropdown States
  showSectionsDropdown = false;
  showTaskTypesDropdown = false;

  constructor(
    private pdfService: PdfService,
    private reportService: HousekeepingReportService
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
    if (this.filters.sections.length === 1) {
      const s = this.sectionOptions.find(opt => opt.value === this.filters.sections[0]);
      return s ? s.label : '1 section selected';
    }
    return `${this.filters.sections.length} sections selected`;
  }

  getSelectedTaskTypesLabel(): string {
    if (this.filters.taskTypes.length === 0) return 'Select task types...';
    if (this.filters.taskTypes.length === 1) {
      const t = this.taskTypeOptions.find(opt => opt.value === this.filters.taskTypes[0]);
      return t ? t.label : '1 type selected';
    }
    return `${this.filters.taskTypes.length} types selected`;
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

    // Reset data
    this.taskSummary = null;
    this.staffPerformanceList = [];
    this.tasksList = [];

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
    this.filters.taskTypes = ['CHECKOUT_CLEANING', 'STAYOVER_CLEANING'];
    this.taskSummary = null;
    this.staffPerformanceList = [];
    this.tasksList = [];
    this.error = '';
  }

  exportReport(): void {
    if (!this.hasData()) {
      alert('No data available to export');
      return;
    }

    const reportTitle = 'Unified Housekeeping Report';
    const columns = [
      'Task Number',
      'Type',
      'Room',
      'Assigned To',
      'Status'
    ];

    const exportPayload = {
      summary: this.taskSummary,
      staff: this.staffPerformanceList,
      tasks: this.tasksList
    };

    this.pdfService.generateReport(
      reportTitle,
      columns,
      this.tasksList,
      this.filters
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
