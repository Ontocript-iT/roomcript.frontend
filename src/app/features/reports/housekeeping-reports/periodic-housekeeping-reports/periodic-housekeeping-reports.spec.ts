import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodicHousekeepingReports } from './periodic-housekeeping-reports';

describe('PeriodicHousekeepingReports', () => {
  let component: PeriodicHousekeepingReports;
  let fixture: ComponentFixture<PeriodicHousekeepingReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodicHousekeepingReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeriodicHousekeepingReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
