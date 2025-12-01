import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewReservation } from './view-reservation';

describe('ViewReservation', () => {
  let component: ViewReservation;
  let fixture: ComponentFixture<ViewReservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewReservation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewReservation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
