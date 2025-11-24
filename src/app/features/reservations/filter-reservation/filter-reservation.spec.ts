import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterReservation } from './filter-reservation';

describe('FilterReservation', () => {
  let component: FilterReservation;
  let fixture: ComponentFixture<FilterReservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterReservation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterReservation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
