import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HousekeepingMain } from './housekeeping-main';

describe('HousekeepingMain', () => {
  let component: HousekeepingMain;
  let fixture: ComponentFixture<HousekeepingMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HousekeepingMain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HousekeepingMain);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
