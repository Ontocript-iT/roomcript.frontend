import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealtimeOverview } from './realtime-overview';

describe('RealtimeOverview', () => {
  let component: RealtimeOverview;
  let fixture: ComponentFixture<RealtimeOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealtimeOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RealtimeOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
