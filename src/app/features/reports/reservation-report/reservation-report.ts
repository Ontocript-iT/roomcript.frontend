import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
interface ReportFilter {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  roomType?: string;
  source?: string;
}

@Component({
  selector: 'app-reservation-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-report.html',
  styleUrls: ['./reservation-report.scss']
})
export class ReservationReportsComponent implements OnInit {
  activeTab: string = 'arrival';

  // Filter properties
  filters: ReportFilter = {
    dateFrom: '',
    dateTo: '',
    status: '',
    roomType: '',
    source: ''
  };

  // Dropdown options
  statusOptions = [
    'All',
    'Temporary',
    'Hold Till',
    'Confirmed',
    'Checked-In',
    'Checked-Out'
  ];

  roomTypeOptions = [
    'All',
    'Single',
    'Double',
    'Suite',
    'Deluxe'
  ];

  sourceOptions = [
    'All',
    'Walk-In',
    'Website',
    'OTA',
    'Travel Agent',
    'Corporate'
  ];

  // Report data - will be populated from API
  reportData: any[] = [];
  loading: boolean = false;
  error: string = '';

  ngOnInit(): void {
    this.loadReportData();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.resetFilters();
    this.loadReportData();
  }

  applyFilters(): void {
    this.loadReportData();
  }

  resetFilters(): void {
    this.filters = {
      dateFrom: '',
      dateTo: '',
      status: '',
      roomType: '',
      source: ''
    };
  }

  loadReportData(): void {
    this.loading = true;
    this.error = '';

    // Simulate API call - replace with actual service call
    setTimeout(() => {
      this.reportData = this.getMockData();
      this.loading = false;
    }, 500);
  }

  exportReport(): void {
    // Implement export functionality
    console.log('Exporting report:', this.activeTab);
  }

  printReport(): void {
    window.print();
  }

  // Mock data - replace with actual API service
  private getMockData(): any[] {
    switch(this.activeTab) {
      case 'arrival':
        return [
          { guestName: 'John Doe', roomNo: '101', roomType: 'Deluxe', arrivalTime: '2:00 PM', specialRequests: 'Extra towels' },
          { guestName: 'Jane Smith', roomNo: '205', roomType: 'Suite', arrivalTime: '3:30 PM', specialRequests: 'Late checkout' }
        ];
      case 'departure':
        return [
          { guestName: 'Mike Johnson', roomNo: '302', departureTime: '11:00 AM', mode: 'Car', balance: 0 }
        ];
      default:
        return [];
    }
  }

  // Show/hide specific filters based on active tab
  showDateRangeFilter(): boolean {
    return ['arrival', 'departure', 'daily', 'date-range', 'cancellation'].includes(this.activeTab);
  }

  showStatusFilter(): boolean {
    return ['daily', 'status'].includes(this.activeTab);
  }

  showRoomTypeFilter(): boolean {
    return ['arrival', 'departure', 'daily'].includes(this.activeTab);
  }

  showSourceFilter(): boolean {
    return ['source', 'daily'].includes(this.activeTab);
  }
}
