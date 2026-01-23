import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnifiedGuestReports } from './unified-guest-reports';

describe('UnifiedGuestReports', () => {
  let component: UnifiedGuestReports;
  let fixture: ComponentFixture<UnifiedGuestReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnifiedGuestReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnifiedGuestReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
