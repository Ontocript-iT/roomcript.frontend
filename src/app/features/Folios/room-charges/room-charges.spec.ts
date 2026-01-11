import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomCharges } from './room-charges';

describe('RoomCharges', () => {
  let component: RoomCharges;
  let fixture: ComponentFixture<RoomCharges>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomCharges]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomCharges);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
