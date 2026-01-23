import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerformanceAnalytics } from './performance-analytics';

describe('PerformanceAnalytics', () => {
  let component: PerformanceAnalytics;
  let fixture: ComponentFixture<PerformanceAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerformanceAnalytics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
