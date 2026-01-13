import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Material & UI
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

// Charts
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

// Services
import { ReservationReportService } from '../../../core/services/reservation-report.service';
import { ReportResult } from '../../../core/models/report.models'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reservation-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule,
    MatCardModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatTableModule, BaseChartDirective
  ],
  providers: [DatePipe, CurrencyPipe, provideCharts(withDefaultRegisterables())],
  templateUrl: './reservation-report.html',
})
export class ReservationReportsComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  selectedReportType = 'MONTHLY';
  startDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1); 
  endDate: Date = new Date();
  singleDate: Date = new Date();
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  isLoading = false;
  reportData: any = null;

  // Chart Data
  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public pieChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public lineChartData: ChartData<'line'> = { labels: [], datasets: [] };

  reportTypes = [
    { value: 'DAILY', label: 'Daily Operations' },
    { value: 'DATE_RANGE', label: 'Summary Period' },
    { value: 'OCCUPANCY', label: 'Occupancy Analysis' },
    { value: 'REVENUE_ROOM', label: 'Revenue by Room' },
    { value: 'BOOKING_SOURCE', label: 'Booking Sources' },
    { value: 'CANCELLATIONS', label: 'Cancellations' },
    { value: 'NATIONALITY', label: 'Nationalities' },
    { value: 'MONTHLY', label: 'Monthly Summary' },
    { value: 'GROUP', label: 'Group Bookings' },
    { value: 'LONG_STAY', label: 'Long Stays' }
  ];

  constructor(private reportService: ReservationReportService, private datePipe: DatePipe, private currencyPipe: CurrencyPipe) {}

  ngOnInit(): void { this.generateReport(); }

  generateReport() {
    this.isLoading = true;
    const s = this.datePipe.transform(this.startDate, 'yyyy-MM-dd') || '';
    const e = this.datePipe.transform(this.endDate, 'yyyy-MM-dd') || '';
    const d = this.datePipe.transform(this.singleDate, 'yyyy-MM-dd') || '';

    let req$;
    switch (this.selectedReportType) {
      case 'DAILY': req$ = this.reportService.getDailyReport(d); break;
      case 'MONTHLY': req$ = this.reportService.getMonthlySummary(this.selectedYear, this.selectedMonth); break;
      case 'OCCUPANCY': req$ = this.reportService.getOccupancyReport(s, e); break;
      case 'REVENUE_ROOM': req$ = this.reportService.getRevenueByRoomType(s, e); break;
      case 'BOOKING_SOURCE': req$ = this.reportService.getBookingSourceReport(s, e); break;
      case 'CANCELLATIONS': req$ = this.reportService.getCancellationReport(s, e); break;
      case 'NATIONALITY': req$ = this.reportService.getGuestNationalityReport(s, e); break;
      case 'GROUP': req$ = this.reportService.getGroupReservations(s, e); break;
      case 'LONG_STAY': req$ = this.reportService.getLongStays(7); break;
      default: req$ = this.reportService.getDateRangeReport(s, e);
    }

    req$.subscribe({
      next: (res: any) => {
        this.reportData = res.result;
        this.updateCharts();
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  // --- PDF GENERATION ENGINE ---
  downloadPDF() {
    if (!this.reportData) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    const title = this.reportTypes.find(t => t.value === this.selectedReportType)?.label || 'Report';
    
    // Header Setup
    doc.setFillColor(63, 81, 181); // Indigo
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(title.toUpperCase(), 14, 20);
    doc.setFontSize(10);
    doc.text(`Property: ${localStorage.getItem('propertyCode')} | Generated: ${new Date().toLocaleString()}`, 14, 30);

    let finalY = 50;

    // 1. KPI Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("EXECUTIVE SUMMARY", 14, finalY);
    const summaryRows = [
      ['Total Revenue', this.currencyPipe.transform(this.reportData.totalRevenue || 0, 'USD') || '$0'],
      ['Total Reservations', (this.reportData.totalReservations || 0).toString()],
      ['Occupancy Rate', (this.reportData.occupancyPercentage || 0).toFixed(2) + '%'],
      ['Avg. Daily Rate', this.currencyPipe.transform(this.reportData.averageRoomRate || 0, 'USD') || '$0']
    ];
    autoTable(doc, { startY: finalY + 5, body: summaryRows, theme: 'plain', styles: { fontSize: 10 } });
    finalY = (doc as any).lastAutoTable.finalY + 15;

    // 2. Dynamic Table Engine (Detects data lists in API response)
    let columns: string[] = [];
    let rows: any[] = [];

    // Check for Reservation Lists (Common across many APIs)
    const resList = this.reportData.reservations || this.reportData.cancellations || this.reportData.longStays || this.reportData.groupReservations;
    
    if (resList) {
      columns = ['Conf #', 'Guest Name', 'Check-In', 'Check-Out', 'Rooms', 'Status', 'Total'];
      rows = resList.map((r: any) => [
        r.confirmationNumber, r.guestName, r.checkInDate, r.checkOutDate, r.roomNumbers, r.status, this.currencyPipe.transform(r.totalAmount, 'USD')
      ]);
    } else if (this.reportData.roomTypeOccupancy) {
      columns = ['Room Type', 'Total Rooms', 'Occupied', 'Available', 'Occupancy %'];
      rows = Object.values(this.reportData.roomTypeOccupancy).map((v: any) => [
        v.roomType, v.totalRooms, v.occupiedRooms, v.availableRooms, v.occupancyPercentage + '%'
      ]);
    } else if (this.reportData.bookingSources || this.reportData.nationalities) {
      const list = this.reportData.bookingSources || this.reportData.nationalities;
      columns = ['Category', 'Reservations/Guests', 'Share %', 'Revenue'];
      rows = list.map((item: any) => [
        item.bookingSource || item.country, item.totalReservations || item.totalGuests, item.percentage + '%', this.currencyPipe.transform(item.totalRevenue || 0, 'USD')
      ]);
    } else if (this.reportData.dailyOccupancy) {
      columns = ['Date', 'Occupied Rooms', 'Occupancy %', 'Revenue'];
      rows = this.reportData.dailyOccupancy.map((d: any) => [
        d.date, d.occupiedRooms, d.occupancyPercentage + '%', this.currencyPipe.transform(d.revenue, 'USD')
      ]);
    }

    if (rows.length > 0) {
      autoTable(doc, {
        startY: finalY,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [63, 81, 181] },
        styles: { fontSize: 8 }
      });
    }

    doc.save(`${this.selectedReportType}_Report.pdf`);
  }

  // --- Visualization Update ---
  updateCharts() {
    if (!this.reportData) return;
    this.lineChartData = { labels: [], datasets: [] };
    this.pieChartData = { labels: [], datasets: [] };

    if (this.selectedReportType === 'MONTHLY' && this.reportData.dailyOccupancy) {
      const labels = this.reportData.dailyOccupancy.map((d: any) => d.date.split('-')[2]);
      this.lineChartData = {
        labels,
        datasets: [
          { data: this.reportData.dailyOccupancy.map((d: any) => d.revenue), label: 'Revenue', borderColor: '#4F46E5', fill: true },
          { data: this.reportData.dailyOccupancy.map((d: any) => d.occupancyPercentage), label: 'Occupancy %', borderColor: '#10B981' }
        ]
      };
    } else if (this.reportData.bookingSources) {
      this.pieChartData = {
        labels: this.reportData.bookingSources.map((s: any) => s.bookingSource),
        datasets: [{ data: this.reportData.bookingSources.map((s: any) => s.totalReservations) }]
      };
    }
  }
}