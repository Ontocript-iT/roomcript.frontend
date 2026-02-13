import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface HotelInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private hotelInfo: HotelInfo = {
    name: 'Grand Hotel',
    address: '123 Main Street, Colombo, Sri Lanka',
    phone: '+94 11 234 5678',
    email: 'info@grandhotel.com'
  };

  constructor() {}

  // generateReport(
  //   reportTitle: string,
  //   columns: string[],
  //   data: any[],
  //   filters?: any
  // ): void {
  //   const doc = new jsPDF('p', 'mm', 'a4');
  //
  //   // Add header to first page only
  //   this.addHeader(doc, reportTitle);
  //
  //   // Add filter information
  //   let startY = 60;
  //   if (filters) {
  //     startY = this.addFilterInfo(doc, filters, startY);
  //   }
  //
  //   // Prepare table data
  //   const tableData = data.map(row => {
  //     return columns.map(col => {
  //       // Convert "Guest Name" to "guestName" (camelCase)
  //       const key = col
  //         .toLowerCase()
  //         .replace(/\s(.)/g, (match, group1) => group1.toUpperCase());
  //       return row[key] || '-';
  //     });
  //   });
  //
  //   // Add table with autoTable
  //   autoTable(doc, {
  //     head: [columns],
  //     body: tableData,
  //     startY: startY,
  //     theme: 'grid',
  //     styles: {
  //       fontSize: 9,
  //       cellPadding: 3
  //     },
  //     headStyles: {
  //       fillColor: [59, 130, 246],
  //       textColor: 255,
  //       fontStyle: 'bold',
  //       halign: 'left'
  //     },
  //     alternateRowStyles: {
  //       fillColor: [249, 250, 251]
  //     },
  //     margin: { top: 20, bottom: 30, left: 10, right: 10 },
  //     didDrawPage: (data) => {
  //       this.addFooter(doc, data.pageNumber, doc.getNumberOfPages());
  //     }
  //   });
  //
  //   // Save the PDF
  //   const fileName = `${reportTitle.replace(/\s/g, '_')}_${this.getFormattedDate()}.pdf`;
  //   doc.save(fileName);
  // }

  private addHeader(doc: jsPDF, reportTitle: string): void {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Hotel Name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(this.hotelInfo.name, pageWidth / 2, 15, { align: 'center' });

    // Hotel Address
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(this.hotelInfo.address, pageWidth / 2, 22, { align: 'center' });

    // Contact Info
    doc.text(
      `Tel: ${this.hotelInfo.phone} | Email: ${this.hotelInfo.email}`,
      pageWidth / 2,
      27,
      { align: 'center' }
    );

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(10, 30, pageWidth - 10, 30);

    // Report Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, pageWidth / 2, 38, { align: 'center' });

    // Report Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on: ${this.getFormattedDateTime()}`,
      pageWidth / 2,
      45,
      { align: 'center' }
    );

    // Line separator
    doc.setLineWidth(0.3);
    doc.line(10, 48, pageWidth - 10, 48);
  }

  private addFilterInfo(doc: jsPDF, filters: any, startY: number): number {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Summary & Filters:', 10, startY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let y = startY + 5;

    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value && value !== 'All') {
        const label = key.replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());

        doc.text(`${label}: ${value}`, 10, y);
        y += 5;
      }
    });

    return y + 5;
  }

  private addFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Line separator
    doc.setLineWidth(0.3);
    doc.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20);

    // Page number
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Footer text
    doc.text(
      '© 2026 Grand Hotel - Confidential Report',
      10,
      pageHeight - 10
    );
  }

  private getFormattedDate(): string {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }

  private getFormattedDateTime(): string {
    const date = new Date();
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private constructPdfDocument(reportTitle: string, columns: string[], data: any[], filters?: any, summary?: any): jsPDF {
    const doc = new jsPDF('p', 'mm', 'a4');

    this.addHeader(doc, reportTitle);

    let startY = 60;

    // Render Filters
    if (filters) {
      startY = this.addFilterInfo(doc, filters, startY);
    }

    // 2. NEW: Render Summary Section if it exists
    if (summary) {
      startY = this.addSummarySection(doc, summary, startY);
    }

    const tableData = data.map(row => {
      return columns.map(col => {
        const key = col.toLowerCase().replace(/\s(.)/g, (match, group1) => group1.toUpperCase());
        return row[key] || '-';
      });
    });

    autoTable(doc, {
      head: [columns],
      body: tableData,
      startY: startY, // Table starts after summary
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'left' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { top: 20, bottom: 30, left: 10, right: 10 },
      didDrawPage: (data) => {
        this.addFooter(doc, data.pageNumber, doc.getNumberOfPages());
      }
    });

    return doc;
  }

  private addSummarySection(doc: jsPDF, summary: any, startY: number): number {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Key Metrics:', 10, startY);
    startY += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    Object.entries(summary).forEach(([key, value]) => {
      const displayValue = value !== null && value !== undefined ? value.toString() : '-';
      doc.text(`${key}: ${displayValue}`, 10, startY);
      startY += 5;
    });

    return startY + 5;
  }

  getReportPreviewUrl(reportTitle: string, columns: string[], data: any[], filters?: any, summary?: any): string {
    const doc = this.constructPdfDocument(reportTitle, columns, data, filters, summary);
    return doc.output('bloburl').toString();
  }

  generateReport(reportTitle: string, columns: string[], data: any[], filters?: any, summary?: any): void {
    const doc = this.constructPdfDocument(reportTitle, columns, data, filters, summary);
    const dateStr = new Date().toISOString().split('T')[0];
    const cleanTitle = reportTitle.replace(/\s+/g, '_');
    const fileName = `${cleanTitle}_${dateStr}.pdf`;
    doc.save(fileName);
  }
}
