import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueMain } from './revenue-main';

describe('RevenueMain', () => {
  let component: RevenueMain;
  let fixture: ComponentFixture<RevenueMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueMain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevenueMain);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
