import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HousekeepingPerformanceAnalytics } from './housekeeping-performance-analytics';

describe('HousekeepingPerformanceAnalytics', () => {
  let component: HousekeepingPerformanceAnalytics;
  let fixture: ComponentFixture<HousekeepingPerformanceAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HousekeepingPerformanceAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HousekeepingPerformanceAnalytics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
