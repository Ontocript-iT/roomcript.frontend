import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemographicReports } from './demographic-reports';

describe('DemographicReports', () => {
  let component: DemographicReports;
  let fixture: ComponentFixture<DemographicReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemographicReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemographicReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
