import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationUpdates } from './reservation-updates';

describe('ReservationUpdates', () => {
  let component: ReservationUpdates;
  let fixture: ComponentFixture<ReservationUpdates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationUpdates]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationUpdates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
