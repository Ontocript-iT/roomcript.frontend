import {Component, OnInit} from '@angular/core';
import {ExceptionReports} from "../../reservation-reports/exception-reports/exception-reports";
import {MarketingReports} from "../../reservation-reports/marketing-reports/marketing-reports";
import {MatIcon, MatIconModule} from "@angular/material/icon";
import {CommonModule} from '@angular/common';
import {ArrReports} from '../arr-reports/arr-reports';
import {UnifiedRevenueReports} from '../unified-revenue-reports/unified-revenue-reports';

@Component({
  selector: 'app-revenue-main',
  imports: [
      CommonModule,
      MatIconModule,
      ArrReports,
      UnifiedRevenueReports
    ],
  templateUrl: './revenue-main.html',
  styleUrl: './revenue-main.scss'
})

export class RevenueMain implements OnInit {
  activeMainTab: string = 'arr';

  ngOnInit(): void {}

  setActiveMainTab(tab: string): void {
    this.activeMainTab = tab;
  }

}
