import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRoomDetails } from './view-room-details';

describe('ViewRoomDetails', () => {
  let component: ViewRoomDetails;
  let fixture: ComponentFixture<ViewRoomDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewRoomDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewRoomDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
