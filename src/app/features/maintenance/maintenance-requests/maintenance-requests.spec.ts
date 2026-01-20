import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceRequests } from './maintenance-requests';

describe('MaintenanceRequests', () => {
  let component: MaintenanceRequests;
  let fixture: ComponentFixture<MaintenanceRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceRequests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceRequests);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
