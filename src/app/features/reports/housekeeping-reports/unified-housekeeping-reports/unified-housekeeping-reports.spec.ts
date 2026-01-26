import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnifiedHousekeepingReports } from './unified-housekeeping-reports';

describe('UnifiedHousekeepingReports', () => {
  let component: UnifiedHousekeepingReports;
  let fixture: ComponentFixture<UnifiedHousekeepingReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnifiedHousekeepingReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnifiedHousekeepingReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
