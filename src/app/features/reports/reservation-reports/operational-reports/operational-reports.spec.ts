import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationalReports } from './operational-reports';

describe('OperationalReports', () => {
  let component: OperationalReports;
  let fixture: ComponentFixture<OperationalReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationalReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperationalReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
