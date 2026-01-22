import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerformanceReports } from './performance-reports';

describe('PerformanceReports', () => {
  let component: PerformanceReports;
  let fixture: ComponentFixture<PerformanceReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerformanceReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
