import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketingInsights } from './marketing-insights';

describe('MarketingInsights', () => {
  let component: MarketingInsights;
  let fixture: ComponentFixture<MarketingInsights>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketingInsights]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketingInsights);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
