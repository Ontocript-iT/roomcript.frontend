import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationMain } from './reservation-main';

describe('ReservationMain', () => {
  let component: ReservationMain;
  let fixture: ComponentFixture<ReservationMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationMain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationMain);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
