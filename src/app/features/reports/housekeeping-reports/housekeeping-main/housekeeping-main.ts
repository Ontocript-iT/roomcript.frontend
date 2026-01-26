import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {PeriodicHousekeepingReports} from '../periodic-housekeeping-reports/periodic-housekeeping-reports';
import {RealtimeOverview} from '../realtime-overview/realtime-overview';
import {HousekeepingPerformanceAnalytics} from '../housekeeping-performance-analytics/housekeeping-performance-analytics';
import {UnifiedHousekeepingReports} from '../unified-housekeeping-reports/unified-housekeeping-reports';

@Component({
  selector: 'app-reservation-main',
  imports: [
    CommonModule,
    MatIcon,
    PeriodicHousekeepingReports,
    RealtimeOverview,
    HousekeepingPerformanceAnalytics,
    UnifiedHousekeepingReports
  ],
  templateUrl: './housekeeping-main.html',
  styleUrl: './housekeeping-main.scss'
})

export class HousekeepingMain implements OnInit {
  activeMainTab: string = 'periodic-housekeeping';

  ngOnInit(): void {}

  setActiveMainTab(tab: string): void {
    this.activeMainTab = tab;
  }

}
