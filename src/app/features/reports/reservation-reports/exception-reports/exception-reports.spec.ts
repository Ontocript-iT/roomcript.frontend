import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExceptionReports } from './exception-reports';

describe('ExceptionReports', () => {
  let component: ExceptionReports;
  let fixture: ComponentFixture<ExceptionReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExceptionReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExceptionReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
