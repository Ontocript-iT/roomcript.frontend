import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckinCheckout } from './checkin-checkout';

describe('CheckinCheckout', () => {
  let component: CheckinCheckout;
  let fixture: ComponentFixture<CheckinCheckout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckinCheckout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckinCheckout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
