import {Component, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {DemographicReports} from '../demographic-reports/demographic-reports';
import {PerformanceAnalytics} from '../performance-analytics/performance-analytics';
import {MarketingInsights} from '../marketing-insights/marketing-insights';
import {UnifiedGuestReport} from '../unified-guest-reports/unified-guest-reports';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-guest-main',
  imports: [
    CommonModule,
    MatIconModule,
    DemographicReports,
    PerformanceAnalytics,
    MarketingInsights,
    UnifiedGuestReport
  ],
  templateUrl: './guest-main.html',
  styleUrl: './guest-main.scss'
})

export class GuestMain implements OnInit {
  activeMainTab: string = 'demographic';

  ngOnInit(): void {}

  setActiveMainTab(tab: string): void {
    this.activeMainTab = tab;
  }

}
