import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HousekeepingDashboard } from './housekeeping-dashboard';

describe('HousekeepingDashboard', () => {
  let component: HousekeepingDashboard;
  let fixture: ComponentFixture<HousekeepingDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HousekeepingDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HousekeepingDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
