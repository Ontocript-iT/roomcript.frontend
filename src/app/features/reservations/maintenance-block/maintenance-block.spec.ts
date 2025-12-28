import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceBlock } from './maintenance-block';

describe('MaintenanceBlock', () => {
  let component: MaintenanceBlock;
  let fixture: ComponentFixture<MaintenanceBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceBlock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceBlock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
