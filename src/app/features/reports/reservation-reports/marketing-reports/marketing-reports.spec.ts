import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketingReports } from './marketing-reports';

describe('MarketingReports', () => {
  let component: MarketingReports;
  let fixture: ComponentFixture<MarketingReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketingReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketingReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
