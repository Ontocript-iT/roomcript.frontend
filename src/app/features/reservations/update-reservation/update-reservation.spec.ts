import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateReservation } from './update-reservation';

describe('UpdateReservation', () => {
  let component: UpdateReservation;
  let fixture: ComponentFixture<UpdateReservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateReservation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateReservation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
