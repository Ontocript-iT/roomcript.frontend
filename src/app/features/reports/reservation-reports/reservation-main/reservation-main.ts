import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import {OperationalReports} from '../operational-reports/operational-reports';
import {PerformanceReports} from '../performance-reports/performance-reports';
import {MarketingReports} from '../marketing-reports/marketing-reports';
import {ExceptionReports} from '../exception-reports/exception-reports';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-reservation-main',
  imports: [
    CommonModule,
    OperationalReports,
    PerformanceReports,
    MarketingReports,
    ExceptionReports,
    MatIcon,
  ],
  templateUrl: './reservation-main.html',
  styleUrl: './reservation-main.scss'
})

export class ReservationMain implements OnInit {
  activeMainTab: string = 'operational';

  ngOnInit(): void {}

  setActiveMainTab(tab: string): void {
    this.activeMainTab = tab;
  }

}
