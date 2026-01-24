import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnifiedReservationReport } from './unified-reservation-report';

describe('UnifiedReservationReport', () => {
  let component: UnifiedReservationReport;
  let fixture: ComponentFixture<UnifiedReservationReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnifiedReservationReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnifiedReservationReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
