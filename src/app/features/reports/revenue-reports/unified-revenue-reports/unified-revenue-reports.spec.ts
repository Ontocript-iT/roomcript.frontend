import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnifiedRevenueReports } from './unified-revenue-reports';

describe('UnifiedRevenueReports', () => {
  let component: UnifiedRevenueReports;
  let fixture: ComponentFixture<UnifiedRevenueReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnifiedRevenueReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnifiedRevenueReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
