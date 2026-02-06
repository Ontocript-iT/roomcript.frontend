import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArrReports } from './arr-reports';

describe('ArrReports', () => {
  let component: ArrReports;
  let fixture: ComponentFixture<ArrReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArrReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArrReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
