import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationReport } from './reservation-report';

describe('ReservationReport', () => {
  let component: ReservationReport;
  let fixture: ComponentFixture<ReservationReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
