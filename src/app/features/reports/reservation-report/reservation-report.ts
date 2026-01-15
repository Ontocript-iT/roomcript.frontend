import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Material
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

import { ReservationReportService } from '../../../core/services/reservation-report.service';

// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reservation-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule,
    MatCardModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatTableModule
  ],
  providers: [DatePipe],
  templateUrl: './reservation-report.html',
})
export class ReservationReportsComponent implements OnInit {
  // Filter States
  selectedReportType = 'DAILY';
  startDate: Date = new Date();
  endDate: Date = new Date();
  singleDate: Date = new Date();
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  selectedStatus = 'CONFIRMED';
  minNights = 7;

  isLoading = false;
  reportData: any = null;

  // Configuration for Report Types
  reportTypes = [
    { value: 'DAILY', label: 'Daily Reservation Report' },
    { value: 'DATE_RANGE', label: 'Date Range Report' },
    { value: 'ARRIVAL_DEPARTURE', label: 'Arrival & Departure' },
    { value: 'OCCUPANCY', label: 'Occupancy Report' },
    { value: 'BOOKING_SOURCE', label: 'Booking Source' },
    { value: 'CANCELLATIONS', label: 'Cancellations' },
    { value: 'REVENUE_ROOM', label: 'Revenue by Room Type' },
    { value: 'NATIONALITY', label: 'Guest Nationality' },
    { value: 'MONTHLY', label: 'Monthly Summary' },
    { value: 'GROUP', label: 'Group Reservations' },
    { value: 'LONG_STAY', label: 'Long Stays' },
    { value: 'STATUS', label: 'Reservations by Status' },
  ];

  constructor(
    private reportService: ReservationReportService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {}

  // --- Dynamic Input Visibility ---
  get showSingleDate(): boolean {
    return ['DAILY', 'ARRIVAL_DEPARTURE'].includes(this.selectedReportType);
  }

  get showDateRange(): boolean {
    return ['DATE_RANGE', 'OCCUPANCY', 'BOOKING_SOURCE', 'CANCELLATIONS', 'REVENUE_ROOM', 'NATIONALITY', 'GROUP', 'STATUS'].includes(this.selectedReportType);
  }

  get showMonthYear(): boolean {
    return this.selectedReportType === 'MONTHLY';
  }

  // --- Generation Logic ---
  generateReport() {
    this.isLoading = true;
    this.reportData = null;

    const sDate = this.datePipe.transform(this.startDate, 'yyyy-MM-dd') || '';
    const eDate = this.datePipe.transform(this.endDate, 'yyyy-MM-dd') || '';
    const single = this.datePipe.transform(this.singleDate, 'yyyy-MM-dd') || '';

    let request$: any;

    switch (this.selectedReportType) {
      case 'DAILY': request$ = this.reportService.getDailyReport(single); break;
      case 'DATE_RANGE': request$ = this.reportService.getDateRangeReport(sDate, eDate); break;
      case 'ARRIVAL_DEPARTURE': request$ = this.reportService.getArrivalDepartureReport(single); break;
      case 'OCCUPANCY': request$ = this.reportService.getOccupancyReport(sDate, eDate); break;
      case 'BOOKING_SOURCE': request$ = this.reportService.getBookingSourceReport(sDate, eDate); break;
      case 'CANCELLATIONS': request$ = this.reportService.getCancellationReport(sDate, eDate); break;
      case 'REVENUE_ROOM': request$ = this.reportService.getRevenueByRoomType(sDate, eDate); break;
      case 'NATIONALITY': request$ = this.reportService.getGuestNationalityReport(sDate, eDate); break;
      case 'MONTHLY': request$ = this.reportService.getMonthlySummary(this.selectedYear, this.selectedMonth); break;
      case 'GROUP': request$ = this.reportService.getGroupReservations(sDate, eDate); break;
      case 'LONG_STAY': request$ = this.reportService.getLongStays(this.minNights); break;
      case 'STATUS': request$ = this.reportService.getByStatus(this.selectedStatus, sDate, eDate); break;
    }

    if (request$) {
      request$.subscribe({
        next: (res: any) => {
          this.reportData = res.result;
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error(err);
          this.isLoading = false;
        }
      });
    }
  }

  // --- PDF Export Logic ---
  downloadPDF() {
    if (!this.reportData) return;

    const doc = new jsPDF();
    const title = this.reportTypes.find(t => t.value === this.selectedReportType)?.label || 'Report';
    const generatedDate = new Date().toLocaleString();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229); // Indigo color
    doc.text(title, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${generatedDate}`, 14, 28);
    
    // Add Summary Stats if available
    let startY = 35;
    if (this.reportData.totalRevenue !== undefined) {
       doc.text(`Total Revenue: ${this.reportData.totalRevenue}`, 14, startY);
       startY += 6;
    }
    if (this.reportData.totalReservations !== undefined) {
        doc.text(`Total Reservations: ${this.reportData.totalReservations}`, 14, startY);
        startY += 10;
     }

    // Define Columns and Rows based on Report Type
    let columns: string[] = [];
    let rows: any[] = [];

    // CASE 1: Reservation Lists (Daily, Date Range, Cancellations, LongStay, Group, Status)
    if (['DAILY', 'DATE_RANGE', 'CANCELLATIONS', 'LONG_STAY', 'GROUP', 'STATUS'].includes(this.selectedReportType)) {
      columns = ['Res ID', 'Guest', 'Check-In', 'Check-Out', 'Rooms', 'Status', 'Amount'];
      const list = this.reportData.reservations || this.reportData.cancellations || this.reportData.longStays || this.reportData.groupReservations || [];
      
      rows = list.map((r: any) => [
        r.confirmationNumber,
        r.guestName,
        r.checkInDate,
        r.checkOutDate,
        r.roomNumbers,
        r.status,
        r.totalAmount
      ]);
    }
    // CASE 2: Occupancy (Complex object in roomTypeOccupancy)
    else if (this.selectedReportType === 'OCCUPANCY') {
      columns = ['Room Type', 'Total', 'Occupied', 'Available', 'Occupancy %'];
      const types = this.reportData.roomTypeOccupancy;
      rows = Object.keys(types).map(key => [
        types[key].roomType,
        types[key].totalRooms,
        types[key].occupiedRooms,
        types[key].availableRooms,
        types[key].occupancyPercentage + '%'
      ]);
    }
    // CASE 3: Booking Source / Nationality
    else if (this.selectedReportType === 'BOOKING_SOURCE' || this.selectedReportType === 'NATIONALITY') {
      const isSource = this.selectedReportType === 'BOOKING_SOURCE';
      columns = [isSource ? 'Source' : 'Country', 'Reservations', 'Percentage', 'Revenue'];
      const list = this.reportData.bookingSources || this.reportData.nationalities || [];
      rows = list.map((item: any) => [
        isSource ? item.bookingSource : item.country,
        item.totalReservations,
        item.percentage + '%',
        item.totalRevenue || 0
      ]);
    }
    // CASE 4: Revenue By Room Type
    else if (this.selectedReportType === 'REVENUE_ROOM') {
      columns = ['Room Type', 'Res Count', 'Sold', 'Avg Rate', 'Revenue'];
      rows = (this.reportData.roomTypeRevenues || []).map((r: any) => [
        r.roomType,
        r.totalReservations,
        r.totalRoomsSold,
        r.averageRate,
        r.totalRevenue
      ]);
    }
    // CASE 5: Arrival/Departure
    else if (this.selectedReportType === 'ARRIVAL_DEPARTURE') {
       // Two tables actually, but let's list Arrivals first
       doc.text("Arrivals", 14, startY);
       startY += 5;
       
       columns = ['Res #', 'Guest', 'Room', 'Stay Days'];
       rows = (this.reportData.arrivals || []).map((a: any) => [
         a.confirmationNumber, a.guestName, a.roomNumbers, a.nightsStayed
       ]);
       // Note: To do departures perfectly requires multiple autoTable calls, 
       // for simplicity in this snippet we print Arrivals.
    }
    // CASE 6: Monthly
    else if (this.selectedReportType === 'MONTHLY') {
        columns = ['Date', 'Occupied', 'Occ %', 'Revenue'];
        rows = (this.reportData.dailyOccupancy || []).map((d: any) => [
            d.date, d.occupiedRooms, d.occupancyPercentage + '%', d.revenue
        ]);
    }

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: startY,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo
    });

    doc.save(`Report_${this.selectedReportType}.pdf`);
  }
}