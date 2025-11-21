import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StayView } from './stay-view';

describe('StayView', () => {
  let component: StayView;
  let fixture: ComponentFixture<StayView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StayView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StayView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
